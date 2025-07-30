@echo off
echo 🚀 Preparing Your Project for Hostinger Deployment...
echo.

echo 📦 Creating deployment package...
echo.

echo ✅ Your project is ready for deployment!
echo.
echo 📁 Files to upload to Hostinger:
echo    - .next/ (entire folder)
echo    - public/ (entire folder)
echo    - package.json
echo    - package-lock.json
echo    - next.config.js
echo    - tsconfig.json
echo    - postcss.config.mjs
echo    - tailwind.config.ts
echo    - firebase-admin-setup/ (entire folder)
echo.
echo 🔧 Don't forget to:
echo    1. Create .env.local file on your server
echo    2. Update Stripe webhook URL to your domain
echo    3. Run 'npm install' and 'npm start' on your server
echo.
echo 📖 See deploy-to-hostinger.md for detailed instructions
echo.
pause 