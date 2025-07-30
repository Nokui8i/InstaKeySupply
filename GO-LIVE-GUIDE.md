# 🚀 GO LIVE GUIDE - Step by Step Instructions

## 📦 **STEP 1: Your Deployment Package is Ready**

✅ **File Created**: `instakeysuply-deployment.zip` (328MB)
✅ **Location**: `C:\Users\iaaoa\instakeysuply\instakeysuply-deployment.zip`

This zip file contains everything needed to deploy your website.

---

## 🌐 **STEP 2: Access Your Hostinger Control Panel**

1. **Go to**: https://hpanel.hostinger.com
2. **Login** with your Hostinger credentials
3. **Select your domain** from the dashboard

---

## 📁 **STEP 3: Upload Your Files**

### **Option A: Using Hostinger File Manager (Recommended)**

1. **Click "File Manager"** in your Hostinger control panel
2. **Navigate to your domain's root directory** (usually `public_html`)
3. **Delete or backup your current WordPress files** (optional - you can rename the folder)
4. **Click "Upload"** and select `instakeysuply-deployment.zip`
5. **Extract the zip file** in the root directory
6. **Delete the zip file** after extraction

### **Option B: Using FTP (Alternative)**

1. **Get your FTP credentials** from Hostinger control panel
2. **Use FileZilla or WinSCP** to connect
3. **Upload the zip file** to `public_html`
4. **Extract it** on the server

---

## ⚙️ **STEP 4: Create Environment File**

1. **In File Manager**, create a new file called `.env.local`
2. **Copy and paste this content** (replace with your actual values):

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RqD0vRtWNv42dU4sfJKLqTyhBznGiSmfGTpBKl6atFU8n4qfF6zWjnTXoN1ZY8KrBBsrprm9P3Jx8Q19UuUhFc7005vF6CLjW
STRIPE_SECRET_KEY=sk_test_51RqD0vRtWNv42dU4OOQD01MznncZj3vxpk3AEStfYto9vG6ZDNYQpuq85m0Fwwsqp0GUODilR1dBeSeyjmbnO37U0094yg9rsa
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration
OWNER_EMAIL=paylocksmith@gmail.com
OWNER_EMAIL_PASS=siqc xtot tdtd ffbr

# Base URL (Replace with your actual domain)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

**⚠️ IMPORTANT**: Replace `yourdomain.com` with your actual domain name!

---

## 🔧 **STEP 5: Install Dependencies**

1. **Open Hostinger Terminal** (in control panel)
2. **Navigate to your domain directory**:
   ```bash
   cd public_html
   ```
3. **Install dependencies**:
   ```bash
   npm install --production
   ```
4. **Build the application**:
   ```bash
   npm run build
   ```

---

## 🚀 **STEP 6: Start Your Application**

### **Option A: Simple Start**
```bash
npm start
```

### **Option B: Using PM2 (Recommended for Production)**
```bash
npm install -g pm2
pm2 start npm --name "instakeysuply" -- start
pm2 save
pm2 startup
```

---

## 🌍 **STEP 7: Configure Your Domain**

1. **In Hostinger control panel**, go to "Domains"
2. **Make sure your domain points to the correct directory**
3. **Enable SSL certificate** (if not already enabled)
4. **Test your domain**: Visit `https://yourdomain.com`

---

## 💳 **STEP 8: Update Stripe Webhook**

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Find your existing webhook** or create a new one
3. **Update the endpoint URL** to: `https://yourdomain.com/api/webhooks/stripe`
4. **Copy the webhook secret** and update it in your `.env.local` file

---

## 🧪 **STEP 9: Test Your Website**

1. **Visit your homepage**: `https://yourdomain.com`
2. **Test admin panel**: `https://yourdomain.com/admin`
3. **Test product browsing** and cart functionality
4. **Test Stripe payment** (use test card: 4242 4242 4242 4242)

---

## 🔍 **STEP 10: Troubleshooting**

### **If you see a 500 error:**
- Check your `.env.local` file
- Verify all environment variables are set
- Check Hostinger error logs

### **If static assets don't load:**
- Make sure `public/` folder is uploaded correctly
- Check file permissions

### **If API calls fail:**
- Verify Firebase configuration
- Check Stripe keys
- Ensure SSL is enabled

---

## 📞 **STEP 11: Get Help**

### **Hostinger Support:**
- Live chat in control panel
- Knowledge base: https://www.hostinger.com/help

### **Common Issues:**
1. **Node.js not available**: Upgrade to a plan with Node.js support
2. **Memory limits**: Contact Hostinger support
3. **Build errors**: Check your environment variables

---

## 🎉 **STEP 12: You're Live!**

Once everything is working:
- ✅ Your e-commerce site is live
- ✅ WordPress site is replaced
- ✅ Stripe payments are working
- ✅ Admin panel is accessible
- ✅ Email notifications are active

**Your website is now live and ready for customers!**

---

## 📋 **Quick Checklist**

- [ ] Uploaded deployment package
- [ ] Created `.env.local` file
- [ ] Installed dependencies (`npm install`)
- [ ] Built application (`npm run build`)
- [ ] Started application (`npm start` or PM2)
- [ ] Updated Stripe webhook URL
- [ ] Tested homepage
- [ ] Tested admin panel
- [ ] Tested payment flow
- [ ] SSL certificate enabled

**All done! Your website is live! 🚀** 