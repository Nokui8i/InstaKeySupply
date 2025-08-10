@echo off
echo 🔒 Deploying SSL Fixes for Mobile SSL Warnings
echo ================================================
echo.

echo ✅ Step 1: Building the project with SSL fixes...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please fix the errors first.
    pause
    exit /b 1
)

echo.
echo ✅ Step 2: SSL fixes applied in code:
echo    - Fixed hardcoded URLs in checkout success page
echo    - Fixed hardcoded URLs in Stripe webhooks
echo    - Fixed hardcoded URLs in Firebase config
echo    - Added SSL security headers in next.config.js
echo.

echo ✅ Step 3: Next steps for server configuration:
echo    1. Upload the updated files to your hosting provider
echo    2. Configure your hosting provider to use FULL SSL (not free SSL)
echo    3. Enable "Force HTTPS" in your hosting control panel
echo    4. Ensure complete SSL certificate chain is installed
echo.

echo 📋 Files that need to be uploaded:
echo    - .next/ (entire folder)
echo    - public/ (entire folder)
echo    - package.json
echo    - package-lock.json
echo    - next.config.js (updated with SSL headers)
echo    - tsconfig.json
echo    - postcss.config.mjs
echo    - tailwind.config.ts
echo.

echo 🔧 Server-side SSL configuration required:
echo    - Use full SSL certificate chain (not free SSL)
echo    - Enable HTTP to HTTPS redirect
echo    - Configure security headers
echo.

echo 📖 Check SSL-SETUP-GUIDE.md for detailed server configuration
echo.

echo 🧪 Test your SSL configuration:
echo    - Run: node scripts/test-ssl.js
echo    - Visit: https://www.ssllabs.com/ssltest/
echo    - Test on mobile devices
echo.

echo 🎯 Expected results after server configuration:
echo    ✅ Mobile browsers show secure HTTPS lock icon
echo    ✅ No "!" warnings on any device
echo    ✅ All resources load over HTTPS
echo    ✅ SSL Labs test shows "A" grade
echo.

pause
