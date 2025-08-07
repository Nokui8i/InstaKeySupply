"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import AdminLayout from "../layout";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Dialog } from '@headlessui/react';

function ContactMessagesContent() {
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-red-600">Access denied. Admins only.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-medium sm:font-semibold text-gray-900">Contact Messages</h1>
          <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2">
            View and manage customer contact messages and inquiries
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Mobile Messages List */}
          <div className="lg:hidden">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No messages found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 cursor-pointer transition ${!msg.read ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => openModal(msg)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`inline-block w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!msg.read ? 'bg-blue-500' : 'bg-transparent'}`}></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm ${!msg.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {msg.name}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500 truncate">{msg.email}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {msg.message?.slice(0, 80)}{msg.message?.length > 80 ? '…' : ''}
                        </p>
                        <div className="text-xs text-gray-400">
                          {msg.createdAt && msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Messages List */}
          <div className="hidden lg:block">
            <ul className="divide-y divide-gray-100">
              {loading ? (
                <li className="text-center py-6 text-gray-400">Loading...</li>
              ) : messages.length === 0 ? (
                <li className="text-center py-6 text-gray-400">No messages found.</li>
              ) : messages.map(msg => (
                <li
                  key={msg.id}
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition hover:bg-gray-50 ${!msg.read ? 'font-semibold bg-blue-50/60' : 'font-normal bg-white'}`}
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
        </div>
      </div>
      {/* Modal for full message */}
      <Dialog open={modalOpen} onClose={closeModal} className="fixed z-[9999] inset-0 flex items-center justify-center p-3 sm:p-0">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" onClick={closeModal} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 animate-scale-in overflow-y-auto max-h-[90vh]">
          <button onClick={closeModal} className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">×</button>
          {selectedMsg && (
            <>
              <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">Message from {selectedMsg.name}</h2>
              <div className="mb-3 text-xs text-gray-500">{selectedMsg.email} • {selectedMsg.createdAt && selectedMsg.createdAt.toDate ? selectedMsg.createdAt.toDate().toLocaleString() : ''}</div>
              <div className="mb-4 whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 p-3 rounded border">{selectedMsg.message}</div>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                {!selectedMsg.read && (
                  <button
                    className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors"
                    disabled={actionLoading === selectedMsg.id}
                    onClick={async () => { await handleMarkRead(selectedMsg.id, true); setSelectedMsg({ ...selectedMsg, read: true }); }}
                  >
                    {actionLoading === selectedMsg.id ? 'Marking...' : 'Mark Read'}
                  </button>
                )}
                {selectedMsg.read && (
                  <button
                    className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded text-sm font-medium hover:bg-yellow-200 transition-colors"
                    disabled={actionLoading === selectedMsg.id}
                    onClick={async () => { await handleMarkRead(selectedMsg.id, false); setSelectedMsg({ ...selectedMsg, read: false }); }}
                  >
                    {actionLoading === selectedMsg.id ? 'Marking...' : 'Mark Unread'}
                  </button>
                )}
                <button
                  className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                  disabled={actionLoading === selectedMsg.id}
                  onClick={() => handleDelete(selectedMsg.id)}
                >
                  {actionLoading === selectedMsg.id ? 'Deleting...' : 'Delete'}
                </button>
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
    </div>
  );
}

export default function ContactMessagesPage() {
  return (
    <AdminLayout>
      <ContactMessagesContent />
    </AdminLayout>
  );
} 