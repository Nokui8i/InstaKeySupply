'use client';
import React, { useState } from 'react';
import AdminLayout from '../layout';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminProvider from '../AdminProvider';

function EmailCampaignsContent() {
  const { isAuthenticated } = useAdminAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    campaignName: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Starting form submission...');
    setLoading(true);
    setResult(null);

    try {
      console.log('📝 Preparing form data...');
      const formDataToSend = new FormData();
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('campaignName', formData.campaignName);
      
      if (logoFile) {
        console.log('📎 Adding logo file...');
        formDataToSend.append('logo', logoFile);
      }
      if (bannerFile) {
        console.log('📎 Adding banner file...');
        formDataToSend.append('banner', bannerFile);
      }

      console.log('📤 Sending request to /api/send-promo-email...');
      const response = await fetch('/api/send-promo-email', {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('📥 Response received:', response.status, response.statusText);
      const data = await response.json();
      console.log('📊 Response data:', data);
      setResult(data);

      if (response.ok) {
        console.log('✅ Campaign sent successfully!');
        // Reset form on success
        setFormData({
          subject: '',
          message: '',
          campaignName: ''
        });
        setLogoFile(null);
        setBannerFile(null);
        setLogoPreview('');
        setBannerPreview('');
      } else {
        console.log('❌ Campaign failed:', data.error);
      }
    } catch (error) {
      console.error('💥 Error during submission:', error);
      setResult({ error: 'Failed to send campaign' });
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {isAuthenticated ? (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-4 mb-24">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">Send Email Campaign</h2>
            <p className="text-gray-600 mt-2">Send promotional emails to all your email subscribers (from promo popup, registration, and Google sign-in)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.campaignName}
                onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Summer Sale 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Write your email message here... You can write normal text like any email."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Write your message normally. You can use basic formatting like bold, italics, and links if needed.
              </p>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {bannerPreview ? (
                  <div>
                    <img src={bannerPreview} alt="Banner preview" className="mx-auto max-h-32 mb-2" />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Banner
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-2">Click to upload a banner image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Upload Banner
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 600x200 pixels. This will appear at the top of your email.
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {logoPreview ? (
                  <div>
                    <img src={logoPreview} alt="Logo preview" className="mx-auto max-h-16 mb-2" />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Logo
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-2">Click to upload your logo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Upload Logo
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 200x80 pixels. This will appear at the bottom of your email.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Sending Campaign...' : 'Send Email Campaign'}
            </button>
          </form>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.error 
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              <h3 className="font-medium mb-2">
                {result.error ? 'Error' : 'Campaign Sent Successfully!'}
              </h3>
              {result.error ? (
                <p>{result.error}</p>
              ) : (
                <div>
                  <p>Campaign sent successfully!</p>
                  <ul className="mt-2 text-sm">
                    <li>Total sent: {result.totalSent}</li>
                    <li>Successful: {result.successful}</li>
                    <li>Failed: {result.failed}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div></div>
      )}
    </AdminLayout>
  );
}

export default function EmailCampaigns() {
  return (
    <AdminProvider>
      <EmailCampaignsContent />
    </AdminProvider>
  );
} 