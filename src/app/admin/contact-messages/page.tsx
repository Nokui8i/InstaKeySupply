"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import AdminLayout from "../layout";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Dialog } from '@headlessui/react';

export default function ContactMessagesPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // message id
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    async function fetchMessages() {
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchMessages();
  }, [isAuthenticated]);

  const handleMarkRead = async (id: string, read: boolean) => {
    setActionLoading(id);
    await updateDoc(doc(db, 'contactMessages', id), { read });
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, read } : m));
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    await deleteDoc(doc(db, 'contactMessages', id));
    setMessages(msgs => msgs.filter(m => m.id !== id));
    setActionLoading(null);
    setModalOpen(false);
  };

  const openModal = async (msg: any) => {
    setSelectedMsg(msg);
    setModalOpen(true);
    if (!msg.read) {
      await handleMarkRead(msg.id, true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMsg(null);
  };

  if (isLoading) {
    return <AdminLayout><div className="text-center py-12 text-gray-500">Loading...</div></AdminLayout>;
  }
  if (!isAuthenticated) {
    return <AdminLayout><div className="text-center py-12 text-red-600">Access denied. Admins only.</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8 text-blue-900">Contact Messages</h1>
      <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
        <ul className="divide-y divide-blue-50">
          {loading ? (
            <li className="text-center py-6 text-gray-400">Loading...</li>
          ) : messages.length === 0 ? (
            <li className="text-center py-6 text-gray-400">No messages found.</li>
          ) : messages.map(msg => (
            <li
              key={msg.id}
              className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition hover:bg-blue-50 ${!msg.read ? 'font-bold bg-blue-50/60' : 'font-normal bg-white'}`}
              onClick={() => openModal(msg)}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${!msg.read ? 'bg-blue-500' : 'bg-transparent'}`}></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm truncate">{msg.name} &lt;{msg.email}&gt;</span>
                <span className="block text-xs text-gray-500 truncate">{msg.message?.slice(0, 50)}{msg.message?.length > 50 ? '…' : ''}</span>
              </span>
              <span className="text-xs text-gray-400 min-w-[120px] text-right">{msg.createdAt && msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleString() : ''}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Modal for full message */}
      <Dialog open={modalOpen} onClose={closeModal} className="fixed z-[9999] inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" onClick={closeModal} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in overflow-y-auto max-h-[90vh]">
          <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">×</button>
          {selectedMsg && (
            <>
              <h2 className="text-lg font-bold mb-2 text-blue-700">Message from {selectedMsg.name}</h2>
              <div className="mb-2 text-xs text-gray-500">{selectedMsg.email} • {selectedMsg.createdAt && selectedMsg.createdAt.toDate ? selectedMsg.createdAt.toDate().toLocaleString() : ''}</div>
              <div className="mb-4 whitespace-pre-wrap text-sm text-gray-900">{selectedMsg.message}</div>
              <div className="flex gap-2 justify-end">
                {!selectedMsg.read && (
                  <button
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold"
                    disabled={actionLoading === selectedMsg.id}
                    onClick={async () => { await handleMarkRead(selectedMsg.id, true); setSelectedMsg({ ...selectedMsg, read: true }); }}
                  >Mark Read</button>
                )}
                {selectedMsg.read && (
                  <button
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-semibold"
                    disabled={actionLoading === selectedMsg.id}
                    onClick={async () => { await handleMarkRead(selectedMsg.id, false); setSelectedMsg({ ...selectedMsg, read: false }); }}
                  >Mark Unread</button>
                )}
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold"
                  disabled={actionLoading === selectedMsg.id}
                  onClick={() => handleDelete(selectedMsg.id)}
                >Delete</button>
              </div>
            </>
          )}
        </div>
        <style jsx global>{`
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scale-in {
            animation: scale-in 0.2s cubic-bezier(0.4,0,0.2,1);
          }
        `}</style>
      </Dialog>
    </AdminLayout>
  );
} 