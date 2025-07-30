"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAdminAuth } from "../context/AdminAuthContext";

function ShippingModal({ open, onClose, value, onChange, onSave, saving }: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in overflow-y-auto max-h-[80vh]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">×</button>
        <h2 className="text-lg font-bold mb-4 text-blue-700">Edit Shipping, Returns & Payments</h2>
        <textarea
          className="w-full min-h-[200px] border rounded-lg p-4 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none text-base resize-vertical mb-4"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={saving}
          placeholder="Enter Shipping, Returns & Payments info..."
        />
        <button
          className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
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
    </div>
  );
}

// Add supported social types and icons
const SOCIAL_TYPES = [
  { type: 'facebook', label: 'Facebook' },
  { type: 'twitter', label: 'Twitter' },
  { type: 'instagram', label: 'Instagram' },
  { type: 'youtube', label: 'YouTube' },
  { type: 'tiktok', label: 'TikTok' },
];

export default function SiteContentAdminPage() {
  const { user, isAuthenticated } = useAdminAuth();
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [shipping, setShipping] = useState("");
  const [contact, setContact] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ terms: false, privacy: false, shipping: false, contact: false });
  const [msg, setMsg] = useState("");
  const [section, setSection] = useState<'terms' | 'privacy' | 'shipping' | 'contact' | 'messages' | 'promo'>("terms");
  const [contactObj, setContactObj] = useState({
    phones: [{ number: '', label: '' }],
    email: '',
    address: [''],
    hours: '',
    socials: [] as { type: string; url: string }[],
  });
  const [promoModal, setPromoModal] = useState({
    enabled: true,
    headline: 'UNLOCK',
    subheadline: '10% OFF',
    description: 'Get 10% OFF your next order when you sign up to receive email and text messages with discounts, offers and new product announcements. Some exclusions apply.',
    buttonText: 'CONTINUE',
    disclaimer: 'Unsubscribing is as easy as texting "STOP", but please give us a try. We promise not to send text messages too frequently, and only when we have truly valuable info for you.'
  });
  const [savingPromo, setSavingPromo] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      const termsRef = doc(db, "siteContent", "terms");
      const privacyRef = doc(db, "siteContent", "privacy");
      const shippingRef = doc(db, "siteContent", "shipping");
      const contactRef = doc(db, "siteContent", "contact");
      const promoRef = doc(db, "siteContent", "promoModal");
      const termsSnap = await getDoc(termsRef);
      const privacySnap = await getDoc(privacyRef);
      const shippingSnap = await getDoc(shippingRef);
      const contactSnap = await getDoc(contactRef);
      const promoSnap = await getDoc(promoRef);
      let termsText = termsSnap.exists() ? termsSnap.data().text || termsSnap.data().content || "" : "";
      let privacyText = privacySnap.exists() ? privacySnap.data().text || privacySnap.data().content || "" : "";
      let shippingText = shippingSnap.exists() ? shippingSnap.data().text || shippingSnap.data().content || "" : "";
      let contactText = contactSnap.exists() ? contactSnap.data().text || contactSnap.data().content || "" : "";
      let promoData = promoSnap.exists() ? promoSnap.data() : undefined;

      if (!termsSnap.exists()) {
        termsText = "Enter your Terms & Conditions here.";
        await setDoc(termsRef, { text: termsText });
      }
      if (!privacySnap.exists()) {
        privacyText = "Enter your Privacy Policy here.";
        await setDoc(privacyRef, { text: privacyText });
      }
      if (!shippingSnap.exists()) {
        shippingText = "Enter your Shipping, Returns & Payments info here.";
        await setDoc(shippingRef, { text: shippingText });
      }
      if (!contactSnap.exists()) {
        contactText = "Email: support@instakeysuply.com\nPhone: +1 (234) 567-890\nAddress: 1234 Key Lane, Suite 100, Key City, ST 12345, USA\nBusiness Hours: Mon-Fri 9:00am - 6:00pm";
        await setDoc(contactRef, { text: contactText });
      }
      if (!promoSnap.exists()) {
        promoData = promoModal;
        await setDoc(promoRef, promoData);
      }
      // Fix: ensure promoData is always defined
      promoData = promoData || {};
      setPromoModal({
        enabled: promoData.enabled ?? true,
        headline: promoData.headline ?? 'UNLOCK',
        subheadline: promoData.subheadline ?? '10% OFF',
        description: promoData.description ?? 'Get 10% OFF your next order when you sign up to receive email and text messages with discounts, offers and new product announcements. Some exclusions apply.',
        buttonText: promoData.buttonText ?? 'CONTINUE',
        disclaimer: promoData.disclaimer ?? 'Unsubscribing is as easy as texting "STOP", but please give us a try. We promise not to send text messages too frequently, and only when we have truly valuable info for you.'
      });

      let contactData: any = {
        phones: [{ number: '', label: '' }],
        email: '',
        address: [''],
        hours: '',
        socials: [],
      };
      if (contactSnap.exists()) {
        const data = contactSnap.data();
        if (typeof data.text === 'string') {
          // Legacy: parse text blob
          const lines = data.text.split(/\r?\n/);
          const phones: { number: string; label?: string }[] = [];
          lines.forEach(line => {
            if (/phone:/i.test(line)) phones.push({ number: line.split(':').slice(1).join(':').trim() });
            if (/email:/i.test(line)) contactData.email = line.split(':').slice(1).join(':').trim();
            if (/address:/i.test(line)) contactData.address = [line.split(':').slice(1).join(':').trim()];
            if (/hours?/i.test(line)) contactData.hours = line.split(':').slice(1).join(':').trim();
          });
          if (phones.length) contactData.phones = phones;
        } else {
          contactData = { ...contactData, ...data };
          if (typeof contactData.address === 'string') contactData.address = [contactData.address];
          if (!Array.isArray(contactData.phones)) contactData.phones = [{ number: '', label: '' }];
        }
      }
      setContactObj({
        phones: Array.isArray(contactData.phones) ? contactData.phones : [{ number: '', label: '' }],
        email: contactData.email || '',
        address: Array.isArray(contactData.address) ? contactData.address : [''],
        hours: contactData.hours || '',
        socials: Array.isArray(contactData.socials) ? contactData.socials : [],
      });
      setLoading(false);
    }
    fetchContent();
  }, []);

  useEffect(() => {
    if (section !== 'messages') return;
    setLoading(true);
    async function fetchMessages() {
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchMessages();
  }, [section]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactObj(obj => ({ ...obj, [e.target.name]: e.target.value }));
  };
  const handleSocialChange = (idx: number, field: 'type' | 'url', value: string) => {
    setContactObj(obj => ({
      ...obj,
      socials: obj.socials.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    }));
  };
  const handleAddSocial = () => {
    setContactObj(obj => ({ ...obj, socials: [...obj.socials, { type: '', url: '' }] }));
  };
  const handleRemoveSocial = (idx: number) => {
    setContactObj(obj => ({ ...obj, socials: obj.socials.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (type: "terms" | "privacy" | "shipping" | "contact") => {
    setSaving(s => ({ ...s, [type]: true }));
    try {
      if (type === "contact") {
        await setDoc(doc(db, "siteContent", "contact"), contactObj);
      } else if (type === "shipping") {
        await setDoc(doc(db, "siteContent", "shipping"), { text: shipping });
      } else if (type === "terms") {
        await setDoc(doc(db, "siteContent", "terms"), { text: terms });
      } else if (type === "privacy") {
        await setDoc(doc(db, "siteContent", "privacy"), { text: privacy });
      }
      setMsg(`${type === "terms" ? "Terms" : type === "privacy" ? "Privacy Policy" : type === "shipping" ? "Shipping, Returns & Payments" : "Contact Us"} saved!`);
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg("Error saving. Check permissions.");
      setTimeout(() => setMsg(""), 2000);
    }
    setSaving(s => ({ ...s, [type]: false }));
  };

  const handleSavePromo = async () => {
    setSavingPromo(true);
    try {
      await setDoc(doc(db, "siteContent", "promoModal"), promoModal);
      setMsg("Promo Modal settings saved!");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg("Error saving promo modal settings.");
      setTimeout(() => setMsg(""), 2000);
    }
    setSavingPromo(false);
  };

  if (!user || !isAuthenticated) {
    return <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded-xl shadow text-center text-lg text-red-600">Access denied. Admins only.</div>;
  }

  return (
    <div className="flex justify-center w-full">
      <div className="max-w-5xl w-full mt-12 flex gap-8 mx-auto">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-50 rounded-2xl shadow-xl border border-blue-100 p-6 flex flex-col gap-2 h-fit sticky top-8 ml-[-80px]">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Site Content</h2>
          <a
            href="/admin/orders"
            className="text-left px-4 py-2 rounded-lg font-medium transition-colors hover:bg-blue-100 text-blue-900 mb-2"
          >
            Orders
          </a>
          <button
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${section === 'terms' ? 'bg-blue-600 text-white shadow' : 'hover:bg-blue-100 text-blue-900'}`}
            onClick={() => setSection('terms')}
          >
            Terms & Conditions
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${section === 'privacy' ? 'bg-blue-600 text-white shadow' : 'hover:bg-blue-100 text-blue-900'}`}
            onClick={() => setSection('privacy')}
          >
            Privacy Policy
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${section === 'shipping' ? 'bg-blue-600 text-white shadow' : 'hover:bg-blue-100 text-blue-900'}`}
            onClick={() => setSection('shipping')}
          >
            Shipping, Returns & Payments
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${section === 'contact' ? 'bg-blue-600 text-white shadow' : 'hover:bg-blue-100 text-blue-900'}`}
            onClick={() => setSection('contact')}
          >
            Contact Us
          </button>
          <button
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${section === 'promo' ? 'bg-blue-600 text-white shadow' : 'hover:bg-blue-100 text-blue-900'}`}
            onClick={() => setSection('promo')}
          >
            Promo Popup
          </button>
        </aside>
        {/* Main Content */}
        <main className="flex-1 bg-white rounded-2xl shadow-xl border border-blue-100 p-8 min-h-[400px]">
          <h1 className="text-2xl font-bold mb-8 text-blue-900">
            {section === 'terms' ? 'Edit Terms & Conditions' :
              section === 'privacy' ? 'Edit Privacy Policy' :
              section === 'shipping' ? 'Edit Shipping, Returns & Payments' :
              section === 'contact' ? 'Edit Contact Us' :
              section === 'promo' ? 'Edit Promo Popup' :
              'Contact Messages'}
          </h1>
          {msg && <div className="mb-4 text-green-600 font-semibold text-center">{msg}</div>}
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : section === 'terms' ? (
            <div className="flex flex-col">
              <textarea
                id="terms"
                className="w-full min-h-[300px] border rounded-lg p-4 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none text-base resize-vertical mb-4"
                value={terms}
                onChange={e => setTerms(e.target.value)}
                disabled={saving.terms}
                placeholder="Enter Terms & Conditions..."
              />
              <button
                className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
                onClick={() => handleSave("terms")}
                disabled={saving.terms}
              >
                {saving.terms ? "Saving..." : "Save Terms"}
              </button>
            </div>
          ) : section === 'privacy' ? (
            <div className="flex flex-col">
              <textarea
                id="privacy"
                className="w-full min-h-[300px] border rounded-lg p-4 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none text-base resize-vertical mb-4"
                value={privacy}
                onChange={e => setPrivacy(e.target.value)}
                disabled={saving.privacy}
                placeholder="Enter Privacy Policy..."
              />
              <button
                className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
                onClick={() => handleSave("privacy")}
                disabled={saving.privacy}
              >
                {saving.privacy ? "Saving..." : "Save Privacy Policy"}
              </button>
            </div>
          ) : section === 'shipping' ? (
            <div className="flex flex-col">
              <textarea
                id="shipping"
                className="w-full min-h-[300px] border rounded-lg p-4 text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none text-base resize-vertical mb-4"
                value={shipping}
                onChange={e => setShipping(e.target.value)}
                disabled={saving.shipping}
                placeholder="Enter Shipping, Returns & Payments info..."
              />
              <button
                className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
                onClick={() => handleSave("shipping")}
                disabled={saving.shipping}
              >
                {saving.shipping ? "Saving..." : "Save Shipping Info"}
              </button>
            </div>
          ) : section === 'contact' ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={contactObj.email}
                    onChange={handleContactChange}
                    disabled={saving.contact}
                    placeholder="support@instakeysuply.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Business Hours</label>
                  <input
                    type="text"
                    name="hours"
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={contactObj.hours}
                    onChange={handleContactChange}
                    disabled={saving.contact}
                    placeholder="Mon-Fri 9:00am - 6:00pm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">Phone Numbers</label>
                <div className="flex flex-col gap-2">
                  {contactObj.phones.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        value={p.number}
                        onChange={e => setContactObj(obj => ({
                          ...obj,
                          phones: obj.phones.map((ph, i) => i === idx ? { ...ph, number: e.target.value } : ph)
                        }))}
                        disabled={saving.contact}
                        placeholder="+1 (234) 567-890"
                      />
                      <input
                        type="text"
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        value={p.label}
                        onChange={e => setContactObj(obj => ({
                          ...obj,
                          phones: obj.phones.map((ph, i) => i === idx ? { ...ph, label: e.target.value } : ph)
                        }))}
                        disabled={saving.contact}
                        placeholder="Home, Work, etc."
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                        onClick={() => setContactObj(obj => ({
                          ...obj,
                          phones: obj.phones.filter((_, i) => i !== idx)
                        }))}
                        disabled={saving.contact}
                      >×</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold w-fit"
                    onClick={() => setContactObj(obj => ({ ...obj, phones: [...obj.phones, { number: '', label: '' }] }))}
                    disabled={saving.contact}
                  >+ Add Phone Number</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">Address</label>
                <div className="flex flex-col gap-2">
                  {contactObj.address.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        value={line}
                        onChange={e => setContactObj(obj => ({
                          ...obj,
                          address: obj.address.map((addr, i) => i === idx ? e.target.value : addr)
                        }))}
                        disabled={saving.contact}
                        placeholder="1234 Key Lane, Suite 100"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                        onClick={() => setContactObj(obj => ({
                          ...obj,
                          address: obj.address.filter((_, i) => i !== idx)
                        }))}
                        disabled={saving.contact}
                      >×</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold w-fit"
                    onClick={() => setContactObj(obj => ({ ...obj, address: [...obj.address, ''] }))}
                    disabled={saving.contact}
                  >+ Add Address Line</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">Social Media Links</label>
                <div className="flex flex-col gap-2">
                  {contactObj.socials.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        value={s.type}
                        onChange={e => handleSocialChange(idx, 'type', e.target.value)}
                        disabled={saving.contact}
                      >
                        <option value="">Select</option>
                        {SOCIAL_TYPES.map(opt => (
                          <option key={opt.type} value={opt.type}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        type="url"
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        value={s.url}
                        onChange={e => handleSocialChange(idx, 'url', e.target.value)}
                        disabled={saving.contact}
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                        onClick={() => handleRemoveSocial(idx)}
                        disabled={saving.contact}
                      >×</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold w-fit"
                    onClick={handleAddSocial}
                    disabled={saving.contact}
                  >+ Add Social Link</button>
                </div>
              </div>
              <button
                className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
                onClick={() => handleSave("contact")}
                disabled={saving.contact}
              >
                {saving.contact ? "Saving..." : "Save Contact Info"}
              </button>
            </div>
          ) : section === 'promo' ? (
            <div className="flex flex-col gap-4 max-w-xl mx-auto">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                <input
                  type="checkbox"
                  id="enable-promo-popup"
                  checked={promoModal.enabled}
                  onChange={e => setPromoModal(p => ({ ...p, enabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="enable-promo-popup" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Enable Promo Popup
                </label>
                <span className="text-xs text-gray-500 ml-2">
                  {promoModal.enabled ? "Popup will show to visitors" : "Popup is disabled"}
                </span>
                {promoModal.enabled ? (
                  <button
                    onClick={() => setPromoModal(p => ({ ...p, enabled: false }))}
                    className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full transition-colors"
                  >
                    Disable Now
                  </button>
                ) : (
                  <button
                    onClick={() => setPromoModal(p => ({ ...p, enabled: true }))}
                    className="ml-auto px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors"
                  >
                    Enable Now
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Headline</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 text-base focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={promoModal.headline}
                  onChange={e => setPromoModal(p => ({ ...p, headline: e.target.value }))}
                  placeholder="UNLOCK"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Subheadline</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 text-base focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={promoModal.subheadline}
                  onChange={e => setPromoModal(p => ({ ...p, subheadline: e.target.value }))}
                  placeholder="10% OFF"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-base focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[80px]"
                  value={promoModal.description}
                  onChange={e => setPromoModal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Get 10% OFF your next order..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Button Text</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 text-base focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={promoModal.buttonText}
                  onChange={e => setPromoModal(p => ({ ...p, buttonText: e.target.value }))}
                  placeholder="CONTINUE"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Disclaimer</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[40px]"
                  value={promoModal.disclaimer}
                  onChange={e => setPromoModal(p => ({ ...p, disclaimer: e.target.value }))}
                  placeholder="Unsubscribing is as easy as texting..."
                />
              </div>
              <button
                className="self-end px-8 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
                onClick={handleSavePromo}
                disabled={savingPromo}
              >
                {savingPromo ? 'Saving...' : 'Save Promo Popup'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs md:text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 border">Name</th>
                    <th className="px-3 py-2 border">Email</th>
                    <th className="px-3 py-2 border">Message</th>
                    <th className="px-3 py-2 border">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-400">No messages found.</td></tr>
                  ) : messages.map(msg => (
                    <tr key={msg.id} className="border-t">
                      <td className="px-3 py-2 border font-medium text-gray-900">{msg.name}</td>
                      <td className="px-3 py-2 border"><a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline">{msg.email}</a></td>
                      <td className="px-3 py-2 border whitespace-pre-wrap break-words max-w-xs">{msg.message}</td>
                      <td className="px-3 py-2 border text-gray-500">{msg.createdAt && msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 