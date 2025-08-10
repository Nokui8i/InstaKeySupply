"use client";
import React, { useState } from "react";
import { useCart } from "../components/CartContext";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
// @ts-ignore: No types for react-places-autocomplete
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
// If you see a type error for 'react-places-autocomplete', run:
// npm i --save-dev @types/react-places-autocomplete
// or add a custom .d.ts file with: declare module 'react-places-autocomplete';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, query, where, getDocs, Query, QueryConstraint } from 'firebase/firestore';
import { FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

// US states and demo cities
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' }, { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' }, { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' }, { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' }, { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' }, { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' }, { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' }, { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' }, { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }, { abbr: 'DC', name: 'District of Columbia' }
];
import { US_CITIES } from '../../data/usCities';

export default function CheckoutPage() {
  const { cart, clearCart, shippingInfo, calculateShipping } = useCart();
  const router = useRouter();
  // Step state
  const [step, setStep] = useState(1); // 1: Info, 2: Review, 3: Success
  // Customer info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [zip, setZip] = useState("");
  const [country] = useState("United States");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingInfo?.cost || 0;
  const total = subtotal + shippingCost;
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoType, setPromoType] = useState<"percent" | "fixed" | null>(null);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Update city dropdown when state changes
  useEffect(() => {
    if (state && US_CITIES[state]) {
      setCityOptions(US_CITIES[state]);
      setCity(US_CITIES[state][0] || "");
    } else {
      setCityOptions([]);
      setCity("");
    }
  }, [state]);

  // Calculate shipping when state changes
  useEffect(() => {
    if (state && cart.length > 0) {
      calculateShipping(state);
    }
  }, [state, cart, calculateShipping]);

  // Google Places Autocomplete setup
  useEffect(() => {
    // @ts-ignore
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setGoogleLoaded(true);
      document.body.appendChild(script);
    } else if (typeof window !== 'undefined' && (window as any).google) {
      setGoogleLoaded(true);
    }
  }, []);

  // Validation
  const validateInfo = () => {
    if (!name || !email || !phone || !street || !city || !state || !zip) {
      setError("Please fill in all fields.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!/^\+?\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      setError("Please enter a valid phone number.");
      return false;
    }
    // Only allow US state abbreviations (optional, for stricter validation)
    // const usStates = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    // if (!usStates.includes(state.toUpperCase())) {
    //   setError("Please enter a valid US state abbreviation.");
    //   return false;
    // }
    setError(null);
    return true;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInfo()) setStep(2);
  };

  // Validate promo code (only once per email)
  const handleApplyPromo = async () => {
    setPromoLoading(true);
    setPromoError("");
    setPromoDiscount(0);
    setPromoType(null);
    setPromoApplied(false);
    if (!promoCode || !email) {
      setPromoError("Enter your email and a promo code.");
      setPromoLoading(false);
      return;
    }
    // Check if code exists and is active
    const q = query(collection(db, "promoCodes"), where("code", "==", promoCode.toUpperCase()), where("active", "==", true));
    const snap = await getDocs(q);
    if (snap.empty) {
      setPromoError("Invalid or inactive promo code.");
      setPromoLoading(false);
      return;
    }
    const codeDoc = snap.docs[0].data();
    // Check if this email has already used this code
    const usedQ = query(collection(db, "orders"), where("customer.email", "==", email), where("promoCode", "==", promoCode.toUpperCase()));
    const usedSnap = await getDocs(usedQ);
    if (!usedSnap.empty) {
      setPromoError("You have already used this promo code.");
      setPromoLoading(false);
      return;
    }
    // Check expiration and usage limit
    if (codeDoc.expiresAt && codeDoc.expiresAt.seconds * 1000 < Date.now()) {
      setPromoError("This promo code has expired.");
      setPromoLoading(false);
      return;
    }
    if (codeDoc.usageLimit && codeDoc.usedCount >= codeDoc.usageLimit) {
      setPromoError("This promo code has reached its usage limit.");
      setPromoLoading(false);
      return;
    }
    if (codeDoc.allowedEmail && codeDoc.allowedEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setPromoError("This promo code is only valid for a specific email.");
      setPromoLoading(false);
      return;
    }
    setPromoDiscount(codeDoc.value);
    setPromoType(codeDoc.type);
    setPromoApplied(true);
    setPromoLoading(false);
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoDiscount(0);
    setPromoType(null);
    setPromoApplied(false);
    setPromoError("");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setPlacingOrder(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerInfo: {
            name,
            email,
            phone,
            address: { street, city, state, zip, country }
          },
          promoDiscount: promoApplied ? promoDiscount : 0,
          shippingCost: shippingCost,
        }),
      });

      const { sessionId, url, error } = await response.json();

      if (error) {
        setError(error);
        setPlacingOrder(false);
        return;
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        setError('Failed to create checkout session');
        setPlacingOrder(false);
      }
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      setPlacingOrder(false);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
      <div className={`h-1 w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
      <div className={`h-1 w-8 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
    </div>
  );

  if (success || step === 3) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 mt-8 mb-24 text-center">
        <StepIndicator />
        <h1 className="text-2xl font-bold mb-4 text-green-700">Order Placed!</h1>
        <p className="mb-6">Thank you for your purchase. You will receive a confirmation email soon.</p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold" onClick={() => router.push("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white/90 rounded-xl shadow-xl border border-blue-100 mt-4 mb-12">
      <StepIndicator />
      <h1 className="text-xl font-bold mb-4 text-blue-900">Checkout</h1>
      {cart.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Your cart is empty.<br />
          <button className="mt-2 px-3 py-2 bg-blue-600 text-white rounded font-semibold text-sm" onClick={() => router.push("/")}>Continue Shopping</button>
        </div>
      ) : step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Phone</label>
            <input type="tel" className="w-full border rounded px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Street Address</label>
            {googleLoaded ? (
              <PlacesAutocomplete
                value={street}
                onChange={setStreet}
                onSelect={async (address: string) => {
                  setStreet(address);
                  try {
                    const results = await geocodeByAddress(address);
                    const addressComponents = results[0].address_components;
                    let city = '', state = '', zip = '';
                    for (const comp of addressComponents) {
                      if (comp.types.includes('locality')) city = comp.long_name;
                      if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
                      if (comp.types.includes('postal_code')) zip = comp.long_name;
                    }
                    if (city) setCity(city);
                    if (state) setState(state);
                    if (zip) setZip(zip);
                  } catch {}
                }}
                searchOptions={{ componentRestrictions: { country: ['us'] } }}
              >
                {({ getInputProps, suggestions, getSuggestionItemProps, loading }: any) => (
                  <div className="relative">
                    <input
                      {...getInputProps({
                        placeholder: 'Start typing your address...',
                        className: 'w-full border rounded px-3 py-2',
                        autoComplete: 'address-line1',
                        required: true,
                      })}
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 bg-white border rounded shadow mt-1 max-h-48 overflow-y-auto">
                        {loading && <div className="px-3 py-2 text-gray-400">Loading...</div>}
                        {suggestions.map((suggestion: any) => (
                          <div
                            {...getSuggestionItemProps(suggestion, {
                              className: `px-3 py-2 cursor-pointer hover:bg-blue-100 ${suggestion.active ? 'bg-blue-50' : ''}`
                            })}
                            key={suggestion.placeId}
                          >
                            {suggestion.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </PlacesAutocomplete>
            ) : (
              <input
                type="text"
                className="w-full border rounded px-3 py-2 bg-gray-100"
                value={street}
                onChange={e => setStreet(e.target.value)}
                required
                autoComplete="address-line1"
                placeholder="Loading address autocomplete..."
                disabled
              />
            )}
          </div>
          <div className="flex gap-1">
            <div className="flex-1">
              <label className="block font-semibold mb-1">State</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={state}
                onChange={e => setState(e.target.value)}
                required
                autoComplete="address-level1"
              >
                <option value="">Select state</option>
                {US_STATES.map(s => (
                  <option key={s.abbr} value={s.abbr}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">City</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                autoComplete="address-level2"
                disabled={!cityOptions.length}
              >
                <option value="">{state ? (cityOptions.length ? 'Select city' : 'No cities available') : 'Select state first'}</option>
                {cityOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="flex-1">
              <label className="block font-semibold mb-1">Zip</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={zip} onChange={e => setZip(e.target.value)} required autoComplete="postal-code" />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">Country</label>
              <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={country} disabled autoComplete="country" />
              <div className="text-xs text-gray-500 mt-1">We currently only ship to the United States.</div>
            </div>
          </div>
          {error && <div className="text-red-600 font-semibold">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-2 px-3 rounded-full shadow-md transition-all duration-200 text-base active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Next: Review Order
          </button>
        </form>
      ) : (
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div className="mb-4">
            <label className="block font-semibold mb-1">Promo Code</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                className="border rounded px-3 py-2 flex-1"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                disabled={promoApplied}
                aria-label="Promo code"
              />
              {!promoApplied ? (
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition disabled:opacity-50 flex items-center gap-2"
                  onClick={handleApplyPromo}
                  disabled={promoApplied || !promoCode || promoLoading}
                  aria-label="Apply promo code"
                >
                  {promoLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  Apply
                </button>
              ) : (
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded transition flex items-center gap-2"
                  onClick={handleRemovePromo}
                  aria-label="Remove promo code"
                >
                  <FaTimesCircle /> Remove
                </button>
              )}
            </div>
            {promoError && (
              <div className="text-red-600 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle /> {promoError}</div>
            )}
            {promoApplied && promoType && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                  <FaCheckCircle className="mr-1" />
                  Promo code applied: {promoType === 'percent' ? `${promoDiscount}% off` : `$${promoDiscount} off`}
                </span>
              </div>
            )}
          </div>
          <div className="border-t pt-4">
            <h2 className="font-bold mb-2">Order Summary</h2>
            <ul className="mb-2">
              {cart.map(item => (
                <li key={item.id} className="flex justify-between text-sm mb-1">
                  <span>{item.title} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm mb-1">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {shippingInfo && (
              <div className="flex justify-between text-sm mb-1">
                <span>Shipping ({shippingInfo.name}):</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
            )}
            {promoApplied && promoType && (
              <div className="flex justify-between text-green-700 font-bold text-base items-center">
                <span className="flex items-center gap-1"><FaCheckCircle /> Promo Discount:</span>
                <span>-{promoType === 'percent' ? `${promoDiscount}%` : `$${promoDiscount}`}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${(promoApplied && promoType === 'percent') ? (total * (1 - promoDiscount / 100)).toFixed(2) : (promoApplied && promoType === 'fixed') ? Math.max(0, total - promoDiscount).toFixed(2) : total.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t pt-4">
            <h2 className="font-bold mb-2">Shipping To</h2>
            <div className="text-sm text-gray-700">
              <div>{name}</div>
              <div>{email} | {phone}</div>
              <div>{street}</div>
              <div>{city}, {state} {zip}, {country}</div>
            </div>
          </div>
          {error && <div className="text-red-600 font-semibold">{error}</div>}
          <div className="flex gap-1">
            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-full shadow-md transition-all duration-200 text-base active:scale-95"
              onClick={() => setStep(1)}
              disabled={placingOrder}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-2 px-3 rounded-full shadow-md transition-all duration-200 text-base active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-300"
              disabled={placingOrder}
            >
              {placingOrder ? "Processing Payment..." : `Pay $${(promoApplied && promoType === 'percent') ? (total * (1 - promoDiscount / 100)).toFixed(2) : (promoApplied && promoType === 'fixed') ? Math.max(0, total - promoDiscount).toFixed(2) : total.toFixed(2)}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 