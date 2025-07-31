# 📧 Firebase Email Configuration Guide

## 🔧 **Step 1: Configure Firebase Authentication Email Templates**

### **Go to Firebase Console:**
1. Visit: https://console.firebase.google.com
2. Select your project: `instakeysuply`
3. Navigate to: **Authentication** → **Templates**

### **Configure Password Reset Template:**
1. Click on **"Password reset"** template
2. **Sender name**: `InstaKeySupply` (or your business name)
3. **Sender email**: `noreply@instakeysuply.firebaseapp.com` (Firebase default)
4. **Subject**: `Reset your InstaKeySupply password`
5. **Message**: Customize the email content

### **Email Template Content:**
```
Subject: Reset your InstaKeySupply password

Hi there,

You requested a password reset for your InstaKeySupply account.

Click the link below to reset your password:
[Reset Password Link]

This link will expire in 1 hour.

If you don't see this email in your inbox, please check your spam/junk folder.

If you didn't request this password reset, please ignore this email.

Best regards,
The InstaKeySupply Team
```

---

## 🌐 **Step 2: Configure Authorized Domains**

### **In Firebase Console:**
1. Go to: **Authentication** → **Settings**
2. Scroll to **"Authorized domains"**
3. Add your domain: `yourdomain.com` (replace with your actual domain)
4. Add: `localhost` (for development)

---

## 📋 **Step 3: Email Provider Settings**

### **Check Email Provider Status:**
1. Go to: **Authentication** → **Sign-in method**
2. Ensure **"Email/Password"** is enabled
3. Check **"Email link (passwordless sign-in)"** if needed

---

## 🔍 **Step 4: DNS Configuration (For Custom Domains)**

### **If using a custom domain, add these DNS records:**

#### **SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

#### **DKIM Record:**
```
Type: TXT
Name: firebase._domainkey
Value: [Provided by Firebase]
```

#### **DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

---

## 📊 **Step 5: Monitor Email Delivery**

### **Check Firebase Analytics:**
1. Go to: **Analytics** → **Events**
2. Look for authentication events
3. Monitor email delivery rates

### **Test Email Delivery:**
1. Use the test page: `/test-reset`
2. Check different email providers (Gmail, Outlook, etc.)
3. Monitor spam folder placement

---

## 🛠️ **Step 6: Additional Best Practices**

### **Email Content Best Practices:**
- ✅ Use a clear, professional sender name
- ✅ Include your business name in subject line
- ✅ Keep content concise and professional
- ✅ Include clear call-to-action
- ✅ Add unsubscribe option (if applicable)

### **Technical Best Practices:**
- ✅ Use consistent sender email
- ✅ Implement proper authentication (SPF, DKIM, DMARC)
- ✅ Monitor email reputation
- ✅ Avoid spam trigger words

---

## 🚨 **Troubleshooting**

### **If emails still go to spam:**
1. **Check sender reputation**: Use tools like mail-tester.com
2. **Verify DNS records**: Ensure SPF, DKIM, DMARC are configured
3. **Monitor bounce rates**: High bounce rates affect deliverability
4. **Use email warm-up**: Gradually increase email volume
5. **Contact email providers**: Request whitelisting if needed

### **Alternative Solutions:**
1. **Use custom email service**: SendGrid, Mailgun, etc.
2. **Implement email verification**: Verify email before sending reset
3. **Add email preferences**: Let users choose email frequency 