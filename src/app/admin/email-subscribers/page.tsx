'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import AdminLayout from '../layout';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminProvider from '../AdminProvider';

interface EmailSubscriber {
  id: string;
  email: string;
  phone?: string;
  source: string;
  subscribed: boolean;
  createdAt: any;
  emailMarketing: boolean;
  smsMarketing: boolean;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function EmailSubscribersContent() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, email, sms, unsubscribed
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [subscriberToUnsubscribe, setSubscriberToUnsubscribe] = useState<EmailSubscriber | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribersPerPage] = useState(20);

  async function fetchSubscribers() {
    setLoading(true);
    try {
      console.log('Fetching email subscribers...');
      const q = query(collection(db, 'emailSubscribers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetchedSubscribers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmailSubscriber));
      console.log('Fetched subscribers:', fetchedSubscribers.length);
      setSubscribers(fetchedSubscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscribers();
    }
  }, [isAuthenticated]);

  const confirmUnsubscribe = (subscriber: EmailSubscriber) => {
    setSubscriberToUnsubscribe(subscriber);
    setShowUnsubscribeModal(true);
  };

  const executeUnsubscribe = async () => {
    if (!subscriberToUnsubscribe) return;
    
    try {
      await deleteDoc(doc(db, 'emailSubscribers', subscriberToUnsubscribe.id));
      setSubscribers(subscribers.filter(sub => sub.id !== subscriberToUnsubscribe.id));
      setShowUnsubscribeModal(false);
      setSubscriberToUnsubscribe(null);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const cancelUnsubscribe = () => {
    setShowUnsubscribeModal(false);
    setSubscriberToUnsubscribe(null);
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    // Only show subscribed users
    if (!subscriber.subscribed) return false;
    
    const matchesFilter = filter === 'all' || 
      (filter === 'email' && subscriber.emailMarketing) ||
      (filter === 'sms' && subscriber.smsMarketing);
    
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (subscriber.phone && subscriber.phone.includes(searchTerm));
    
    return matchesFilter && matchesSearch;
  });

  // Pagination logic
  const indexOfLastSubscriber = currentPage * subscribersPerPage;
  const indexOfFirstSubscriber = indexOfLastSubscriber - subscribersPerPage;
  const currentSubscribers = filteredSubscribers.slice(indexOfFirstSubscriber, indexOfLastSubscriber);
  const totalPages = Math.ceil(filteredSubscribers.length / subscribersPerPage);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const exportEmails = () => {
    const emailList = filteredSubscribers
      .filter(sub => sub.emailMarketing && sub.subscribed)
      .map(sub => sub.email)
      .join('\n');
    
    const blob = new Blob([emailList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-subscribers-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPhones = () => {
    const phoneList = filteredSubscribers
      .filter(sub => sub.smsMarketing && sub.phone && sub.subscribed)
      .map(sub => sub.phone)
      .join('\n');
    
    const blob = new Blob([phoneList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phone-subscribers-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      {isAuthenticated ? (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-4 mb-24">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">Email Subscribers</h2>
              <p className="text-gray-600 mt-1">Total: {filteredSubscribers.length} active subscribers</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchSubscribers}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={exportEmails}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Export Emails
              </button>
              <button
                onClick={exportPhones}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Export Phones
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Subscribers</option>
              <option value="email">Email Marketing</option>
              <option value="sms">SMS Marketing</option>
            </select>
          </div>

          {/* Subscribers Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Phone</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Source</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Campaign</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Subscribed</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-200 px-4 py-8 text-center">
                      Loading subscribers...
                    </td>
                  </tr>
                ) : filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  currentSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">{subscriber.email}</td>
                      <td className="border border-gray-200 px-4 py-2">{subscriber.phone || '-'}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          subscriber.source === 'promo_modal' ? 'bg-blue-100 text-blue-800' :
                          subscriber.source === 'user_registration' ? 'bg-green-100 text-green-800' :
                          subscriber.source === 'google_signin' ? 'bg-purple-100 text-purple-800' :
                          subscriber.source === 'newsletter' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {subscriber.source === 'user_registration' ? 'Registration' :
                           subscriber.source === 'google_signin' ? 'Google Sign-in' :
                           subscriber.source === 'promo_modal' ? 'Promo Popup' :
                           subscriber.source}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">{subscriber.campaign || '-'}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          subscriber.subscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.subscribed ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {subscriber.createdAt?.toDate ? 
                          subscriber.createdAt.toDate().toLocaleDateString() : 
                          'Unknown'
                        }
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <button
                          onClick={() => confirmUnsubscribe(subscriber)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Unsubscribe
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstSubscriber + 1} to {Math.min(indexOfLastSubscriber, filteredSubscribers.length)} of {filteredSubscribers.length} subscribers
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {/* Unsubscribe Confirmation Modal */}
      {showUnsubscribeModal && subscriberToUnsubscribe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Unsubscribe</h3>
              <button
                onClick={cancelUnsubscribe}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to unsubscribe this email address?
              </p>
              <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                {subscriberToUnsubscribe.email}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelUnsubscribe}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeUnsubscribe}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Yes, Unsubscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function EmailSubscribers() {
  return (
    <AdminProvider>
      <EmailSubscribersContent />
    </AdminProvider>
  );
} 