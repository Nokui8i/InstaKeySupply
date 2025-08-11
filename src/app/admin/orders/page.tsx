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
  const [collapsedOrders, setCollapsedOrders] = useState<{ [orderId: string]: boolean }>({});

  // Toggle order card collapse state
  const toggleOrderCollapse = (orderId: string) => {
    setCollapsedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Debounce search input
  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Initial load of orders
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadInitialOrders = async () => {
      setLoading(true);
      let q = query(
        collection(db, "orders"),
        ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE + 1)
      );
      const snap = await getDocs(q);
      const docs = snap.docs;
      setOrders(docs.slice(0, PAGE_SIZE).map(doc => ({ id: doc.id, ...doc.data() })));
      setFirstDoc(docs[0]);
      setLastDoc(docs[PAGE_SIZE - 1] || docs[docs.length - 1]);
      setHasPrevPage(false);
      setHasNextPage(docs.length > PAGE_SIZE);
      // Get total count for pagination display
      const countSnap = await getCountFromServer(
        query(collection(db, "orders"), ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []))
      );
      setTotalOrders(countSnap.data().count);
      setLoading(false);
    };
    
    loadInitialOrders();
  }, [isAuthenticated, statusFilter]);

  // Memoize filtered orders to prevent unnecessary re-calculations
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch) return orders;
    
    return orders.filter(order => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.email?.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    });
  }, [orders, debouncedSearch]);

  // Initialize all orders as collapsed by default
  useEffect(() => {
    if (filteredOrders.length > 0) {
      const newCollapsedState: { [orderId: string]: boolean } = {};
      filteredOrders.forEach(order => {
        if (!(order.id in collapsedOrders)) {
          newCollapsedState[order.id] = true; // Start collapsed
        }
      });
      if (Object.keys(newCollapsedState).length > 0) {
        setCollapsedOrders(prev => ({ ...prev, ...newCollapsedState }));
      }
    }
  }, [filteredOrders, collapsedOrders]);

  // Toggle all orders collapse state
  const toggleAllOrders = (collapse: boolean) => {
    const newState: { [orderId: string]: boolean } = {};
    filteredOrders.forEach(order => {
      newState[order.id] = collapse;
    });
    setCollapsedOrders(newState);
  };

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
  }, [statusFilter, PAGE_SIZE]);

  // Reset pagination when status filter changes
  useEffect(() => {
    if (!isAuthenticated) return;
    setPage(1);
    setLastDoc(null);
    setFirstDoc(null);
    setHasNextPage(false);
    setHasPrevPage(false);
    // Call fetchOrders directly without including it in dependencies
    const loadOrders = async () => {
      setLoading(true);
      let q = query(
        collection(db, "orders"),
        ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE + 1)
      );
      const snap = await getDocs(q);
      const docs = snap.docs;
      setOrders(docs.slice(0, PAGE_SIZE).map(doc => ({ id: doc.id, ...doc.data() })));
      setFirstDoc(docs[0]);
      setLastDoc(docs[PAGE_SIZE - 1] || docs[docs.length - 1]);
      setHasPrevPage(false);
      setHasNextPage(docs.length > PAGE_SIZE);
      // Get total count for pagination display
      const countSnap = await getCountFromServer(
        query(collection(db, "orders"), ...(statusFilter ? [where("orderStatus", "==", statusFilter)] : []))
      );
      setTotalOrders(countSnap.data().count);
      setLoading(false);
    };
    loadOrders();
  }, [isAuthenticated, statusFilter]);

  if (isLoading) {
    return <AdminLayout><div className="text-center py-12 text-gray-500">Loading...</div></AdminLayout>;
  }
  if (!isAuthenticated) {
    return <AdminLayout><div className="text-center py-12 text-red-600">Access denied. Admins only.</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage and track customer orders</p>
          </div>
          
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.filter(s => s.value !== '').map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Search Orders */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            {/* Results and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {totalOrders} orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAllOrders(false)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => toggleAllOrders(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Loading orders...</span>
            </div>
          )}

          {/* Orders Table */}
          {!loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                          <div className="text-sm text-gray-500">{order.customer?.email}</div>
                          <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ORDER_STATUSES.find(s => s.value === order.orderStatus)?.color || 'bg-gray-100 text-gray-800'}`}>
                              {ORDER_STATUSES.find(s => s.value === order.orderStatus)?.label || order.orderStatus || 'Unknown'}
                            </span>
                            <select
                              className="border rounded px-2 py-1 text-xs w-24"
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
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Delete
                            </button>
                            {order.orderStatus === 'shipped' && (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="text"
                                  className="border rounded px-2 py-1 text-xs w-32"
                                  placeholder="Tracking #"
                                  value={trackingNumbers[order.id] || ''}
                                  onChange={e => setTrackingNumbers(tn => ({ ...tn, [order.id]: e.target.value }))}
                                  disabled={order.shippedEmailSent}
                                />
                                <button
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
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

              {/* Tablet Table */}
              <div className="hidden md:block lg:hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-4">
                          <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                          <div className="text-sm text-gray-500">{order.customer?.email}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="px-3 py-4">
                          <select
                            className="border rounded px-2 py-1 text-xs w-24"
                            value={order.orderStatus || 'new'}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            disabled={statusUpdating === order.id}
                          >
                            {ORDER_STATUSES.filter(s => s.value !== '').map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Delete
                            </button>
                            {order.orderStatus === 'shipped' && (
                              <button
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
                                onClick={() => handleSendShippedEmail(order)}
                                disabled={order.shippedEmailSent || shippedEmailLoading === order.id}
                              >
                                {order.shippedEmailSent ? 'Email Sent ✓' : shippedEmailLoading === order.id ? 'Sending...' : 'Send Email'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Order Cards */}
              <div className="md:hidden p-4 space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No orders found</div>
                ) : filteredOrders.map(order => {
                  const isCollapsed = collapsedOrders[order.id] !== false; // Default to collapsed
                  return (
                    <div key={order.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      {/* Collapsed View - Always Visible */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleOrderCollapse(order.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{order.customer?.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ORDER_STATUSES.find(s => s.value === order.orderStatus)?.color || 'bg-gray-100 text-gray-800'}`}>
                                {ORDER_STATUSES.find(s => s.value === order.orderStatus)?.label || order.orderStatus || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs font-medium text-green-700">${order.total?.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderCollapse(order.id);
                              }}
                              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                              aria-label={isCollapsed ? "Expand order details" : "Collapse order details"}
                            >
                              <svg 
                                className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded View - Conditionally Visible */}
                      {!isCollapsed && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 bg-white">
                          {/* Customer Details */}
                          <div className="grid grid-cols-1 gap-3 text-sm pt-3">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Email:</span>
                              <div className="text-gray-900 text-sm">{order.customer?.email}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Phone:</span>
                              <div className="text-gray-900 text-sm">{order.customer?.phone}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Date:</span>
                              <div className="text-gray-900 text-sm">
                                {order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}
                              </div>
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="space-y-2">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Update Status:</span>
                            <select
                              className="w-full border rounded px-3 py-2 text-sm"
                              value={order.orderStatus || 'new'}
                              onChange={e => handleStatusChange(order.id, e.target.value)}
                              disabled={statusUpdating === order.id}
                            >
                              {ORDER_STATUSES.filter(s => s.value !== '').map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Shipped Order Actions */}
                          {order.orderStatus === 'shipped' && (
                            <div className="space-y-2">
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Tracking Number:</span>
                              <input
                                type="text"
                                className="w-full border rounded px-3 py-2 text-sm"
                                placeholder="Enter tracking number"
                                value={trackingNumbers[order.id] || ''}
                                onChange={e => setTrackingNumbers(tn => ({ ...tn, [order.id]: e.target.value }))}
                                disabled={order.shippedEmailSent}
                              />
                              <button
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50"
                                onClick={() => handleSendShippedEmail(order)}
                                disabled={order.shippedEmailSent || shippedEmailLoading === order.id}
                              >
                                {order.shippedEmailSent ? 'Email Sent ✓' : shippedEmailLoading === order.id ? 'Sending...' : 'Send Shipped Email'}
                              </button>
                            </div>
                          )}

                          {/* Delete Button */}
                          <div className="pt-2">
                            <button
                              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Delete Order
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(totalOrders / PAGE_SIZE) || 1} ({totalOrders} total orders)
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    onClick={() => { setPage(p => Math.max(1, p - 1)); fetchOrders('prev', page - 1); }}
                    disabled={!hasPrevPage}
                  >
                    Previous
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    onClick={() => { setPage(p => p + 1); fetchOrders('next', page + 1); }}
                    disabled={!hasNextPage}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification */}
          {notification && (
            <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{notification}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 