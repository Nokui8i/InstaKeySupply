"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, updateDoc, doc, where, limit, startAfter, getCountFromServer, deleteDoc } from "firebase/firestore";

import { useAdminAuth } from "../context/AdminAuthContext";
import AdminLayout from "../layout";

export default function AdminOrdersPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [shippedEmailSent, setShippedEmailSent] = useState<{ [orderId: string]: boolean }>({});
  const [shippedEmailLoading, setShippedEmailLoading] = useState<string | null>(null);
  const [trackingNumbers, setTrackingNumbers] = useState<{ [orderId: string]: string }>({});
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Memoize filtered orders to prevent unnecessary re-calculations
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch) return orders;
    const s = debouncedSearch.toLowerCase();
    return orders.filter(order => (
      (order.customer?.name || '').toLowerCase().includes(s) ||
      (order.customer?.email || '').toLowerCase().includes(s) ||
      (order.customer?.phone || '').toLowerCase().includes(s)
    ));
  }, [orders, debouncedSearch]);

  const ORDER_STATUSES = [
    { value: '', label: 'All', color: '' },
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'processing', label: 'Processing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setStatusUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: newStatus });
      setOrders(orders => orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      setNotification('Order status updated!');
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setNotification('Failed to update order status.');
      setTimeout(() => setNotification(null), 2000);
    }
    setStatusUpdating(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(orders => orders.filter(o => o.id !== orderId));
      setNotification('Order deleted.');
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setNotification('Failed to delete order.');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleSendShippedEmail = async (order: any) => {
    setShippedEmailLoading(order.id);
    try {
      const res = await fetch('/api/send-shipped-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: order.customer,
          address: order.address,
          items: order.items,
          total: order.total,
          trackingNumber: trackingNumbers[order.id] || '',
        }),
      });
      if (res.ok) {
        // Persist shipped email sent status in Firestore
        await updateDoc(doc(db, 'orders', order.id), { shippedEmailSent: true });
        setOrders(orders => orders.map(o => o.id === order.id ? { ...o, shippedEmailSent: true } : o));
        setNotification('Shipped email sent to customer!');
      } else {
        setNotification('Failed to send shipped email.');
      }
    } catch {
      setNotification('Failed to send shipped email.');
    }
    setTimeout(() => setNotification(null), 2000);
    setShippedEmailLoading(null);
  };

  const fetchOrders = useCallback(async (direction: 'next' | 'prev' | 'init' = 'init', customPage?: number) => {
    setLoading(true);
    let q = query(
      collection(db, "orders"),
      ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE + 1)
    );
    if (direction === 'next' && lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    if (direction === 'prev' && firstDoc) {
      // For prev, we need to fetch previous page (not natively supported, so we reload from start)
      // For simplicity, reload from start and page forward
      let prevQ = query(
        collection(db, "orders"),
        ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE * ((customPage || page) - 1) + 1)
      );
      const prevSnap = await getDocs(prevQ);
      const prevDocs = prevSnap.docs;
      const startIdx = Math.max(0, prevDocs.length - PAGE_SIZE);
      setOrders(prevDocs.slice(startIdx, startIdx + PAGE_SIZE).map(doc => ({ id: doc.id, ...doc.data() })));
      setFirstDoc(prevDocs[startIdx]);
      setLastDoc(prevDocs[prevDocs.length - 1]);
      setHasPrevPage((customPage || page) > 2);
      setHasNextPage(prevDocs.length > PAGE_SIZE * (customPage || page));
      setLoading(false);
      return;
    }
    const snap = await getDocs(q);
    const docs = snap.docs;
    setOrders(docs.slice(0, PAGE_SIZE).map(doc => ({ id: doc.id, ...doc.data() })));
    setFirstDoc(docs[0]);
    setLastDoc(docs[PAGE_SIZE - 1] || docs[docs.length - 1]);
    setHasPrevPage((customPage || page) > 1);
    setHasNextPage(docs.length > PAGE_SIZE);
    // Get total count for pagination display
    const countSnap = await getCountFromServer(
      query(collection(db, "orders"), ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []))
    );
    setTotalOrders(countSnap.data().count);
    setLoading(false);
  }, [statusFilter, lastDoc, firstDoc, page, PAGE_SIZE]);

  // Reset pagination when status filter changes
  useEffect(() => {
    if (!isAuthenticated) return;
    setPage(1);
    setLastDoc(null);
    setFirstDoc(null);
    setHasNextPage(false);
    setHasPrevPage(false);
    fetchOrders('init', 1);
  }, [isAuthenticated, statusFilter, fetchOrders]);

  if (isLoading) {
    return <AdminLayout><div className="text-center py-12 text-gray-500">Loading...</div></AdminLayout>;
  }
  if (!isAuthenticated) {
    return <AdminLayout><div className="text-center py-12 text-red-600">Access denied. Admins only.</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-content">
          <div className="admin-form">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
                <p className="text-gray-600 mt-1">Manage and track customer orders</p>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="admin-input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="admin-input px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="admin-loading flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading orders...</span>
              </div>
            )}

            {/* Orders Table */}
            {!loading && (
              <div className="admin-table bg-white rounded-lg shadow overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      ) : filteredOrders.map(order => (
                        <tr key={order.id} className="admin-table-row border-t">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                            <div className="text-sm text-gray-500">{order.customer?.email}</div>
                            <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                            ${order.total?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ORDER_STATUSES.find(s => s.value === order.orderStatus)?.color || 'bg-gray-100 text-gray-800'}`}>
                                {ORDER_STATUSES.find(s => s.value === order.orderStatus)?.label || order.orderStatus || 'Unknown'}
                              </span>
                              <select
                                className="border rounded px-2 py-1 text-xs"
                                value={order.orderStatus || 'new'}
                                onChange={e => handleStatusChange(order.id, e.target.value)}
                                disabled={statusUpdating === order.id}
                              >
                                {ORDER_STATUSES.filter(s => s.value !== '').map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              <button
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                Delete
                              </button>
                              {order.orderStatus === 'shipped' && (
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="text"
                                    className="border rounded px-2 py-1 text-xs"
                                    placeholder="Tracking number"
                                    value={trackingNumbers[order.id] || ''}
                                    onChange={e => setTrackingNumbers(tn => ({ ...tn, [order.id]: e.target.value }))}
                                    disabled={order.shippedEmailSent}
                                  />
                                  <button
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
                                    onClick={() => handleSendShippedEmail(order)}
                                    disabled={order.shippedEmailSent || shippedEmailLoading === order.id}
                                  >
                                    {order.shippedEmailSent ? 'Email Sent ✓' : shippedEmailLoading === order.id ? 'Sending...' : 'Send Email'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Order Cards */}
                <div className="md:hidden space-y-3 p-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No orders found</div>
                  ) : filteredOrders.map(order => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{order.customer?.name}</div>
                          <div className="text-sm text-gray-600">{order.customer?.email}</div>
                          <div className="text-sm text-gray-600">{order.customer?.phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-700">${order.total?.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ORDER_STATUSES.find(s => s.value === order.orderStatus)?.color || 'bg-gray-100 text-gray-800'}`}>
                          {ORDER_STATUSES.find(s => s.value === order.orderStatus)?.label || order.orderStatus || 'Unknown'}
                        </span>
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={order.orderStatus || 'new'}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          disabled={statusUpdating === order.id}
                        >
                          {ORDER_STATUSES.filter(s => s.value !== '').map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Delete
                        </button>
                        {order.orderStatus === 'shipped' && (
                          <button
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
                            onClick={() => handleSendShippedEmail(order)}
                            disabled={order.shippedEmailSent || shippedEmailLoading === order.id}
                          >
                            {order.shippedEmailSent ? 'Email Sent ✓' : shippedEmailLoading === order.id ? 'Sending...' : 'Send Email'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {!loading && (
              <div className="admin-transition mt-6 flex items-center justify-between">
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { setPage(p => Math.max(1, p - 1)); fetchOrders('prev', page - 1); }}
                  disabled={!hasPrevPage}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(totalOrders / PAGE_SIZE) || 1}
                </span>
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { setPage(p => p + 1); fetchOrders('next', page + 1); }}
                  disabled={!hasNextPage}
                >
                  Next
                </button>
              </div>
            )}

            {/* Notification */}
            {notification && (
              <div className="admin-transition mt-4 text-center text-sm font-semibold text-blue-700 bg-blue-50 p-3 rounded">
                {notification}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 