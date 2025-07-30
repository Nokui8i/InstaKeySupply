# 🚀 Deploy Your Next.js Project to Hostinger

## 📋 **Prerequisites**
- Hostinger hosting account with Node.js support
- Your domain connected to Hostinger
- FTP/SFTP access or Hostinger File Manager

## 🔧 **Step 1: Prepare Your Project**

Your project is already built successfully. The build files are in the `.next` folder.

## 📁 **Step 2: Files to Upload**

Upload these files and folders to your Hostinger hosting:

### **Essential Files:**
- `.next/` (entire folder - contains your built application)
- `public/` (entire folder - contains static assets)
- `package.json`
- `package-lock.json`
- `next.config.js`
- `tsconfig.json`
- `postcss.config.mjs`
- `tailwind.config.ts`

### **Environment Variables:**
Create a `.env.local` file on your server with:
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

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## 🌐 **Step 3: Hostinger Setup**

### **Option A: Using Hostinger File Manager**
1. Log into your Hostinger control panel
2. Go to "File Manager"
3. Navigate to your domain's root directory (usually `public_html`)
4. Upload all the files mentioned above
5. Create the `.env.local` file with your environment variables

### **Option B: Using FTP/SFTP**
1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect to your Hostinger server
3. Upload all files to the root directory
4. Create the `.env.local` file

## ⚙️ **Step 4: Server Configuration**

### **Create a `package.json` for Production:**
Make sure your `package.json` has these scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### **Install Dependencies on Server:**
After uploading, run these commands in your Hostinger terminal:
```bash
npm install --production
npm run build
```

## 🔄 **Step 5: Start Your Application**

### **Using Hostinger Terminal:**
```bash
npm start
```

### **Using PM2 (Recommended for Production):**
```bash
npm install -g pm2
pm2 start npm --name "instakeysuply" -- start
pm2 save
pm2 startup
```

## 🌍 **Step 6: Domain Configuration**

### **Update Your Domain:**
1. In Hostinger control panel, go to "Domains"
2. Point your domain to the correct directory
3. Make sure SSL certificate is enabled

### **Update Stripe Webhook URL:**
1. Go to your Stripe Dashboard
2. Update the webhook endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`

## 🧪 **Step 7: Test Your Deployment**

1. Visit your domain: `https://yourdomain.com`
2. Test the admin panel: `https://yourdomain.com/admin`
3. Test product browsing and cart functionality
4. Test Stripe payment flow (use test cards)

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **500 Error**: Check your `.env.local` file and environment variables
2. **Build Errors**: Make sure all dependencies are installed
3. **API Errors**: Verify Firebase and Stripe configurations
4. **Static Assets Not Loading**: Check if `public/` folder is uploaded correctly

### **Logs:**
Check your application logs in Hostinger's error log section or terminal output.

## 📞 **Support**

If you encounter issues:
1. Check Hostinger's error logs
2. Verify all environment variables are set correctly
3. Ensure all files are uploaded to the correct location
4. Test locally first to ensure everything works

## 🎉 **Success!**

Once deployed, your e-commerce site will be live at your domain with:
- ✅ Product catalog with vehicle compatibility
- ✅ Shopping cart and checkout
- ✅ Stripe payment processing
- ✅ Admin panel for inventory management
- ✅ Email notifications
- ✅ Responsive design

Your WordPress site will be replaced with your custom Next.js e-commerce platform! 