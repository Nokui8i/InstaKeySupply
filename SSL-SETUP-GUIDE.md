# 🔒 SSL/HTTPS Setup Guide - Fix Mobile SSL Warnings

## 🚨 **Problem Description**
Your website shows a "!" warning on mobile devices indicating the connection is not fully secure, while desktop browsers show no warning.

## 🔍 **Root Causes**
1. **Incomplete SSL Certificate Chain** - Missing intermediate certificates
2. **Mixed Content** - Some resources loading over HTTP instead of HTTPS
3. **Domain Coverage Issues** - SSL certificate doesn't cover all subdomains
4. **Server Configuration** - Not using full certificate chain

## 🛠️ **Solution Steps**

### **Step 1: Fix Hardcoded URLs (COMPLETED)**
✅ **Fixed in code:**
- `src/app/checkout/success/page.tsx` - Dynamic URLs instead of hardcoded `https://instakeysupply.com`
- `src/app/api/webhooks/stripe/route.ts` - Dynamic base URL construction
- `src/firebase.ts` - Environment-based domain configuration
- `next.config.js` - Added SSL security headers and HTTPS enforcement

### **Step 2: Server SSL Configuration**

#### **For Hostinger (Recommended Setup):**

1. **Access Hostinger Control Panel**
   - Log into your Hostinger account
   - Go to "Websites" → Select your domain

2. **SSL Certificate Setup**
   - Go to "SSL" section
   - **IMPORTANT**: Use "Full SSL" or "Full SSL (strict)" option
   - **DO NOT** use "Free SSL" as it may have incomplete chains

3. **Force HTTPS Redirect**
   - Enable "Force HTTPS" option
   - This ensures all HTTP traffic is redirected to HTTPS

4. **SSL Chain Configuration**
   - Download your SSL certificate files
   - Ensure you have:
     - `certificate.crt` (your domain certificate)
     - `private.key` (your private key)
     - `ca_bundle.crt` (intermediate certificates)

### **Step 3: Nginx Configuration (If using Nginx)**

Create or update your Nginx configuration:

```nginx
server {
    listen 80;
    server_name instakeysupply.com www.instakeysupply.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name instakeysupply.com www.instakeysupply.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS Header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Root directory
    root /home/username/public_html;
    index index.html index.htm;
    
    # Handle Next.js routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Step 4: Apache Configuration (If using Apache)**

Update your Apache configuration:

```apache
<VirtualHost *:80>
    ServerName instakeysupply.com
    ServerAlias www.instakeysupply.com
    Redirect permanent / https://instakeysupply.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName instakeysupply.com
    ServerAlias www.instakeysupply.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cert.pem
    SSLCertificateKeyFile /etc/ssl/private/privkey.pem
    SSLCertificateChainFile /etc/ssl/certs/chain.pem
    
    # SSL Security Settings
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384
    SSLHonorCipherOrder on
    SSLCompression off
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    
    # Document Root
    DocumentRoot /home/username/public_html
    
    <Directory /home/username/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### **Step 5: Environment Variables**

Update your `.env.local` file on the server:

```bash
# Base URL - Use your actual domain
NEXT_PUBLIC_BASE_URL=https://instakeysupply.com

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=instakeysupply.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Force HTTPS
FORCE_HTTPS=true
```

### **Step 6: Test SSL Configuration**

1. **SSL Labs Test**
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter your domain: `instakeysupply.com`
   - Check for any certificate chain issues

2. **Mobile Browser Test**
   - Test on different mobile devices
   - Check for the "!" warning
   - Verify HTTPS lock icon appears

3. **Mixed Content Check**
   - Open browser Developer Tools
   - Check Console for any HTTP resource warnings
   - Ensure all resources load over HTTPS

### **Step 7: Common Issues & Solutions**

#### **Issue: "Your connection is not private" on mobile**
**Solution:** Install the complete certificate chain including intermediate certificates

#### **Issue: Mixed content warnings**
**Solution:** All resources must be served over HTTPS

#### **Issue: SSL certificate expired**
**Solution:** Renew your SSL certificate before expiration

#### **Issue: Domain mismatch**
**Solution:** Ensure SSL certificate covers all subdomains (www, m, etc.)

## 🎯 **Expected Results**

After implementing these fixes:
- ✅ Mobile browsers show secure HTTPS lock icon
- ✅ No "!" warnings on any device
- ✅ All resources load over HTTPS
- ✅ SSL Labs test shows "A" grade
- ✅ HSTS headers properly configured

## 🔧 **Verification Commands**

Test your SSL configuration:

```bash
# Check SSL certificate chain
openssl s_client -connect instakeysupply.com:443 -servername instakeysupply.com

# Check HTTP to HTTPS redirect
curl -I http://instakeysupply.com

# Check HTTPS response headers
curl -I https://instakeysupply.com
```

## 📞 **Support**

If issues persist:
1. Check Hostinger SSL logs
2. Verify certificate chain completeness
3. Test with SSL Labs
4. Ensure all subdomains are covered
5. Check for mixed content in browser console

---

**Remember**: SSL configuration is server-side. The code changes we made ensure no hardcoded HTTP URLs, but the server must properly serve the SSL certificate chain for mobile devices to recognize the connection as secure.
