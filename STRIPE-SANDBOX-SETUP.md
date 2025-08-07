# 💳 Stripe Sandbox Setup Guide

## 🎯 **Goal: Test Actual Payments with Stripe Sandbox**

Your Stripe integration is already implemented! Now we need to complete the setup to test real payments using Stripe's sandbox environment.

---

## 📋 **Step 1: Update Environment Variables**

### **On Your Hostinger VPS:**

1. **Navigate to your project directory:**
   ```bash
   cd public_html
   ```

2. **Edit the .env.local file:**
   ```bash
   nano .env.local
   ```

3. **Replace the content with:**
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDiPg91GBfcbVqkvty-wU9WwgEpaK5rsqY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=instakeysuply.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=instakeysuply
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=instakeysuply.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=560696702143
   NEXT_PUBLIC_FIREBASE_APP_ID=1:560696702143:web:f345e7b0ba4453eda3020a
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1CDJTHTVXB

   # Stripe Configuration (SANDBOX - TEST MODE)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RqD0vRtWNv42dU4sfJKLqTyhBznGiSmfGTpBKl6atFU8n4qfF6zWjnTXoN1ZY8KrBBsrprm9P3Jx8Q19UuUhFc7005vF6CLjW
   STRIPE_SECRET_KEY=sk_test_51RqD0vRtWNv42dU4OOQD01MznncZj3vxpk3AEStfYto9vG6ZDNYQpuq85m0Fwwsqp0GUODilR1dBeSeyjmbnO37U0094yg9rsa
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # Email Configuration
   OWNER_EMAIL=paylocksmith@gmail.com
   OWNER_EMAIL_PASS=siqc xtot tdtd ffbr

   # Base URL (REPLACE WITH YOUR ACTUAL DOMAIN)
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

4. **Save and exit:**
   - Press `Ctrl + X`
   - Press `Y` to confirm
   - Press `Enter`

---

## 🔗 **Step 2: Set Up Stripe Webhook**

### **In Stripe Dashboard:**

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Set endpoint URL to:** `https://yourdomain.com/api/webhooks/stripe`
   - Replace `yourdomain.com` with your actual domain
4. **Select these events:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_`)

### **Update Webhook Secret:**

1. **Edit .env.local again:**
   ```bash
   nano .env.local
   ```

2. **Replace `whsec_your_webhook_secret_here` with the actual secret you copied**

3. **Save and exit**

---

## 🔄 **Step 3: Restart Your Application**

```bash
# Stop the current process
pm2 stop all

# Start it again
pm2 start npm --name "instakeysuply" -- start

# Save the configuration
pm2 save
```

---

## 🧪 **Step 4: Test the Payment Flow**

### **Test Card Numbers (Sandbox):**

| Card Number | Result | Description |
|-------------|--------|-------------|
| `4242 4242 4242 4242` | ✅ Success | Standard successful payment |
| `4000 0000 0000 0002` | ❌ Decline | Generic decline |
| `4000 0000 0000 9995` | ❌ Decline | Insufficient funds |
| `4000 0000 0000 9987` | ❌ Decline | Lost card |
| `4000 0000 0000 9979` | ❌ Decline | Stolen card |

### **Test Data:**
- **Expiry Date:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP Code:** Any 5 digits (e.g., 12345)

---

## 🎯 **Step 5: Complete Test Flow**

1. **Add items to cart** on your website
2. **Go to checkout**
3. **Fill in customer information**
4. **Click "Pay"** - this will redirect to Stripe Checkout
5. **Use test card:** `4242 4242 4242 4242`
6. **Complete payment** - you'll be redirected back to success page
7. **Check admin panel** - order should appear in Orders section
8. **Check email** - order confirmation should be sent

---

## 🔍 **Step 6: Verify Everything Works**

### **Check These Points:**

1. **✅ Stripe Checkout loads** when clicking "Pay"
2. **✅ Payment processes** with test card
3. **✅ Redirects to success page** after payment
4. **✅ Order appears in admin panel**
5. **✅ Order confirmation email sent**
6. **✅ Cart clears** after successful payment

---

## 🚨 **Troubleshooting**

### **If Stripe Checkout doesn't load:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is correct
- Make sure your domain is accessible via HTTPS

### **If webhook doesn't work:**
- Check Stripe dashboard webhook logs
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure your domain is accessible from Stripe's servers

### **If orders don't appear in admin:**
- Check Firebase console for errors
- Verify Firebase configuration
- Check server logs for webhook errors

---

## 🎉 **Success!**

Once you complete these steps, you'll have a fully functional payment system that:
- ✅ Processes real payments (in sandbox mode)
- ✅ Creates orders in your database
- ✅ Sends confirmation emails
- ✅ Handles payment failures
- ✅ Manages order status

**Ready to test!** 🚀
