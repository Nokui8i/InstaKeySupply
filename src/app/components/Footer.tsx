'use client';
import React, { useState } from 'react';
import { FaPhone, FaMapMarkerAlt, FaEnvelope, FaShieldAlt, FaTruck, FaHeadset, FaAward, FaGlobe } from 'react-icons/fa';
import Image from 'next/image';
import { useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

function linkifyContactText(text: string) {
  // Split by lines, linkify email and phone, preserve other lines
  return text.split(/\r?\n/).map((line, i) => {
    // Email
    const emailMatch = line.match(/([\w.-]+@[\w.-]+\.[A-Za-z]{2,})/);
    if (emailMatch) {
      const email = emailMatch[1];
      return <p key={i}>Email: <a href={`mailto:${email}`} className="text-blue-400 hover:text-white transition-colors duration-200">{email}</a></p>;
    }
    // Phone
    const phoneMatch = line.match(/([+]?\d[\d\s().-]{7,}\d)/);
    if (phoneMatch) {
      const phone = phoneMatch[1];
      return <p key={i}>Phone: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="text-blue-400 hover:text-white transition-colors duration-200">{phone}</a></p>;
    }
    // Address
    if (/address:/i.test(line)) {
      return <p key={i}>{line}</p>;
    }
    // Hours
    if (/business hours:/i.test(line)) {
      return <p key={i}>{line}</p>;
    }
    // Fallback
    return <p key={i}>{line}</p>;
  });
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSent(false);
    setForm({ name: '', email: '', message: '' });
    setFormError(null);
    getDoc(doc(db, 'siteContent', 'contact'))
      .then(snap => {
        if (snap.exists()) {
          setContent(snap.data().text || snap.data().content || '');
        } else {
          setContent('No Contact Us info found.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load Contact Us info.');
        setLoading(false);
      });
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'contactMessages'), {
        name: form.name,
        email: form.email,
        message: form.message,
        createdAt: serverTimestamp(),
      });
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setFormError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">×</button>
        <h2 className="text-lg font-bold mb-4 text-blue-700">Contact Us</h2>
        <div className="text-xs text-black space-y-3 max-h-[30vh] overflow-y-auto pr-2 mb-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : content ? (
            linkifyContactText(content)
          ) : null}
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black placeholder:text-gray-400"
            value={form.name}
            onChange={handleChange}
            disabled={sending || sent}
            autoComplete="name"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black placeholder:text-gray-400"
            value={form.email}
            onChange={handleChange}
            disabled={sending || sent}
            autoComplete="email"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[80px] text-black placeholder:text-gray-400"
            value={form.message}
            onChange={handleChange}
            disabled={sending || sent}
          />
          {formError && <div className="text-red-500 text-xs text-center">{formError}</div>}
          {sent ? (
            <div className="text-green-600 text-center font-semibold py-2">Thank you! Your message has been sent.</div>
          ) : (
            <button
              type="submit"
              className="w-full bg-slate-600 text-white rounded-lg py-2 font-bold shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all duration-300 disabled:opacity-60"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          )}
        </form>
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

function ShippingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getDoc(doc(db, 'siteContent', 'shipping'))
      .then(snap => {
        if (snap.exists()) {
          setContent(snap.data().text || snap.data().content || '');
        } else {
          setContent('No Shipping, Returns & Payments info found.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load Shipping, Returns & Payments info.');
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in overflow-y-auto max-h-[80vh]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">×</button>
        <h2 className="text-lg font-bold mb-4 text-blue-700">Shipping, Returns & Payments</h2>
        <div className="text-xs text-gray-700 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-sans text-xs">{content}</pre>
          )}
        </div>
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

const SOCIAL_ICON_PATHS: Record<string, string> = {
  facebook: '/social/facebook.svg.png',
  twitter: '/social/twitter.svg.png',
  instagram: '/social/instagram.svg.png',
  youtube: '/social/youtube.svg.png',
  tiktok: '/social/tiktok.svg.png',
};

function FooterContactBlock() {
  const [contact, setContact] = useState<{
    phones?: { number: string; label?: string }[];
    email?: string;
    address?: string[];
    hours?: string;
    socials?: { type: string; url: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContact() {
      setLoading(true);
      const snap = await getDoc(doc(db, 'siteContent', 'contact'));
      if (snap.exists()) {
        setContact(snap.data());
      }
      setLoading(false);
    }
    fetchContact();
  }, []);

  if (loading) return <div className="text-center text-sm text-gray-400 py-4">Loading contact info...</div>;
  if (!contact) return null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center md:items-start gap-6 md:gap-16 py-4 border-t border-slate-700/50">
      {/* Contact Column */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-slate-600 rounded-lg">
            <FaPhone className="text-white text-sm" />
          </div>
          <span className="font-bold text-gray-200 uppercase tracking-wide text-xs">Contact</span>
        </div>
        {Array.isArray(contact.phones) && contact.phones.map((p, i) => (
          <div key={i} className="text-sm text-gray-300 flex flex-col items-center md:items-start">
            <span className="font-mono text-center md:text-left">{p.number}</span>
            {p.label && <span className="text-xs text-gray-400 text-center md:text-left">{p.label}</span>}
          </div>
        ))}
        {contact.email && (
          <div className="flex items-center gap-2 mt-1">
            <FaEnvelope className="text-gray-400 text-sm" />
            <a href={`mailto:${contact.email}`} className="text-gray-300 hover:text-white transition-colors duration-200 text-sm text-center md:text-left">{contact.email}</a>
          </div>
        )}
      </div>

      {/* Address Column */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-slate-600 rounded-lg">
            <FaMapMarkerAlt className="text-white text-sm" />
          </div>
          <span className="font-bold text-gray-200 uppercase tracking-wide text-xs">Address</span>
        </div>
        {Array.isArray(contact.address) && contact.address.map((line, i) => (
          <div key={i} className="text-sm text-gray-300 font-mono text-center md:text-left">{line}</div>
        ))}
        {contact.hours && (
          <div className="mt-2 text-center md:text-left">
            <span className="font-bold text-gray-200 text-xs">Hours:</span> 
            <span className="text-gray-300 text-xs ml-2">{contact.hours}</span>
          </div>
        )}
      </div>

      {/* Socials Column */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="font-bold text-gray-200 uppercase tracking-wide text-xs mb-2 text-center md:text-left">Follow us on the Social Platforms!</div>
        <div className="flex gap-3 mt-1">
          {Array.isArray(contact.socials) && contact.socials.filter((s: { type: string; url: string }) => s.type && s.url).map((s: { type: string; url: string }, i: number) => {
            const iconPath = SOCIAL_ICON_PATHS[s.type];
            if (!iconPath) return null;
            return (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.type} className="rounded-full border-2 border-slate-500 text-slate-400 hover:bg-slate-500 hover:text-white transition-colors flex items-center justify-center w-8 h-8">
                <Image src={iconPath} alt={s.type + ' icon'} width={16} height={16} style={{ objectFit: 'contain' }} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Footer({ onShowTerms, onShowPrivacy }: { onShowTerms: () => void; onShowPrivacy: () => void }) {
  const [showContact, setShowContact] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  
  useEffect(() => {
    const handler = () => setShowContact(true);
    window.addEventListener('show-contact', handler);
    return () => window.removeEventListener('show-contact', handler);
  }, []);

  return (
    <footer className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Mission Statement */}
        <div className="text-center text-sm sm:text-base text-gray-400 mb-6 px-2 max-w-2xl mx-auto">
          Welcome to <span className="text-gray-200 font-semibold">InstaKey Supply™</span> — your trusted source for automotive keys, remotes, and locksmith solutions. We&apos;re dedicated to providing reliable products, expert support, and fast shipping to help you get the job done right.
        </div>

        {/* Columns */}
        <div className="w-full flex flex-col items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6 w-full max-w-3xl justify-items-center">
            {/* Information */}
            <div className="flex flex-col items-center">
              <h3 className="text-gray-200 font-bold mb-3 text-xs uppercase tracking-wider text-center flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Information
              </h3>
              <ul className="space-y-2 text-sm text-center">
                <li>
                  <button 
                    onClick={() => setShowContact(true)} 
                    className="hover:text-gray-200 transition-colors duration-200 bg-transparent border-none p-0 text-gray-400"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <a href="/about" className="hover:text-gray-200 transition-colors duration-200 text-gray-400">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" onClick={e => { e.preventDefault(); onShowTerms(); }} className="hover:text-gray-200 transition-colors duration-200 cursor-pointer text-gray-400">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" onClick={e => { e.preventDefault(); onShowPrivacy(); }} className="hover:text-gray-200 transition-colors duration-200 cursor-pointer text-gray-400">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Why Buy From Us */}
            <div className="flex flex-col items-center">
              <h3 className="text-gray-200 font-bold mb-3 text-xs uppercase tracking-wider text-center flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Why Buy From Us
              </h3>
              <ul className="space-y-2 text-sm text-center">
                <li>
                  <a href="#" onClick={e => { e.preventDefault(); setShowShipping(true); }} className="hover:text-gray-200 transition-colors duration-200 cursor-pointer text-gray-400">
                    Shipping, Returns & Payments
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact & Address - always centered below columns */}
          <FooterContactBlock />

          {/* Copyright */}
          <div className="border-t border-slate-700/50 pt-4 text-xs text-center text-gray-500 w-full">
            &copy; {new Date().getFullYear()} <span className="text-gray-300 font-semibold">InstaKey Supply™</span>. All rights reserved.
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactModal open={showContact} onClose={() => setShowContact(false)} />
      <ShippingModal open={showShipping} onClose={() => setShowShipping(false)} />
    </footer>
  );
} 