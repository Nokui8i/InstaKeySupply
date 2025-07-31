"use client";
import React, { useEffect, useState } from "react";
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

  const fetchOrders = async (direction: 'next' | 'prev' | 'init' = 'init', customPage?: number) => {
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
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setPage(1);
    fetchOrders('init', 1);
  }, [isAuthenticated, statusFilter]);

  if (isLoading) {
    return <AdminLayout><div className="text-center py-12 text-gray-500">Loading...</div></AdminLayout>;
  }
  if (!isAuthenticated) {
    return <AdminLayout><div className="text-center py-12 text-red-600">Access denied. Admins only.</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8 text-blue-900">Orders</h1>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <label className="font-semibold text-sm">Filter by status:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {ORDER_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="bg-white rounded-xl shadow border border-blue-100 overflow-x-auto">
        <table className="min-w-full border text-xs md:text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Customer</th>
              <th className="px-3 py-2 border">Address</th>
              <th className="px-3 py-2 border">Items</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Total</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">No orders found.</td></tr>
            ) : orders
                .filter(order => {
                  if (!search) return true;
                  const s = search.toLowerCase();
                  return (
                    (order.customer?.name || '').toLowerCase().includes(s) ||
                    (order.customer?.email || '').toLowerCase().includes(s) ||
                    (order.customer?.phone || '').toLowerCase().includes(s)
                  );
                })
                .map(order => (
              <tr key={order.id} className="border-t">
                <td className="px-3 py-2 border text-gray-500">{order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : ''}</td>
                <td className="px-3 py-2 border">
                  <div className="font-semibold">{order.customer?.name}</div>
                  <div className="text-xs text-gray-600">{order.customer?.email}</div>
                  <div className="text-xs text-gray-600">{order.customer?.phone}</div>
                </td>
                <td className="px-3 py-2 border">
                  <div>{order.address?.street}</div>
                  <div>{order.address?.city}, {order.address?.state} {order.address?.zip}</div>
                  <div>{order.address?.country}</div>
                </td>
                <td className="px-3 py-2 border">
                  <ul className="list-disc pl-4">
                    {order.items?.map((item: any, idx: number) => (
                      <li key={idx}>{item.title} x {item.quantity} <span className="text-gray-400">(${item.price * item.quantity})</span></li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-2 border align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ORDER_STATUSES.find(s => s.value === order.orderStatus)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUSES.find(s => s.value === order.orderStatus)?.label || order.orderStatus || 'Unknown'}
                      </span>
                      <select
                        className="ml-2 border rounded px-2 py-1 text-xs"
                        value={order.orderStatus || 'new'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        disabled={statusUpdating === order.id}
                      >
                        {ORDER_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    {order.orderStatus === 'shipped' && (
                      <div className="flex flex-col gap-1 mt-1">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 text-xs"
                          placeholder="Tracking number (optional)"
                          value={trackingNumbers[order.id] || ''}
                          onChange={e => setTrackingNumbers(tn => ({ ...tn, [order.id]: e.target.value }))}
                          disabled={order.shippedEmailSent}
                        />
                        <button
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition disabled:opacity-50"
                          onClick={() => handleSendShippedEmail(order)}
                          disabled={order.shippedEmailSent || shippedEmailLoading === order.id}
                        >
                          {order.shippedEmailSent ? 'Email Sent' : shippedEmailLoading === order.id ? 'Sending...' : 'Send Shipped Email'}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 border font-bold text-green-700">${order.total?.toFixed(2)}</td>
                <td className="px-3 py-2 border">
                  <button
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => { setPage(p => Math.max(1, p - 1)); fetchOrders('prev', page - 1); }}
          disabled={!hasPrevPage}
        >
          Previous
        </button>
        <span className="text-sm">Page {page} of {Math.ceil(totalOrders / PAGE_SIZE) || 1}</span>
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => { setPage(p => p + 1); fetchOrders('next', page + 1); }}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </div>
      {notification && <div className="mt-4 text-center text-sm font-semibold text-blue-700">{notification}</div>}
    </AdminLayout>
  );
} 