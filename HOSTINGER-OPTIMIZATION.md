# 🌐 Hostinger-Specific Performance Optimizations

## **Server Configuration (.htaccess)**

### **Enable GZIP Compression**
```apache
# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### **Browser Caching**
```apache
# Browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>
```

### **Security Headers**
```apache
# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

## **Next.js Production Optimizations**

### **next.config.js Optimizations**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize bundle
  experimental: {
    optimizeCss: true,
  },
  
  // Enable static optimization
  trailingSlash: true,
  
  // Disable unused features
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
```

### **Environment Variables for Production**
```bash
# .env.production
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## **CDN Configuration**

### **Cloudflare Setup (Recommended)**
1. **Add your domain to Cloudflare**
2. **Set DNS records to point to Hostinger**
3. **Enable Auto Minify for JS, CSS, HTML**
4. **Enable Brotli compression**
5. **Set cache level to "Standard"**

### **Hostinger CDN (Alternative)**
1. **Enable Hostinger CDN in control panel**
2. **Configure cache rules for static assets**
3. **Set appropriate TTL values**

## **Database Optimization**

### **Firestore Indexing**
```javascript
// Create composite indexes for common queries
// Example: brand + model + yearRange
db.collection('products')
  .where('selectedCompatibility.brand', '==', 'Audi')
  .where('selectedCompatibility.model', '==', 'A4')
  .orderBy('title')
```

### **Query Optimization**
```javascript
// Use pagination
const limit = 20;
const productsQuery = query(
  collection(db, "products"),
  orderBy("title"),
  limit(limit)
);

// Use cursor-based pagination for better performance
const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
const nextQuery = query(
  collection(db, "products"),
  orderBy("title"),
  startAfter(lastDoc),
  limit(limit)
);
```

## **Performance Monitoring**

### **Core Web Vitals Targets**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### **Tools for Monitoring**
- **Google PageSpeed Insights**
- **Lighthouse CI**
- **WebPageTest**
- **GTmetrix**

## **Deployment Checklist**

- [ ] **Build optimization enabled**
- [ ] **Images converted to Next.js Image**
- [ ] **GZIP compression enabled**
- [ ] **Browser caching configured**
- [ ] **CDN enabled and configured**
- [ ] **Database indexes created**
- [ ] **Performance monitoring set up**
- [ ] **Mobile optimization completed**
