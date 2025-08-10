# InstaKeySupply Favicon Setup

This document explains the favicon configuration for the InstaKeySupply website.

## Overview

The website now uses your logo (`Untitled design.png`) as the favicon across all devices and browsers. The favicon will appear in:
- Browser tabs
- Bookmarks
- Mobile home screens
- Social media shares
- Search results

## Files Created/Modified

### New Files
- `public/site.webmanifest` - Web app manifest for PWA support
- `public/browserconfig.xml` - Microsoft browser configuration
- `public/favicon-test.html` - Test page to verify favicon setup
- `src/app/components/FaviconHead.tsx` - Custom favicon component
- `scripts/generate-favicons.js` - Script to generate multiple favicon sizes

### Modified Files
- `src/app/layout.tsx` - Updated metadata and added FaviconHead component
- `package.json` - Added favicon generation script

## How It Works

1. **Primary Logo**: Uses `Untitled design.png` as the main favicon
2. **Multiple Sizes**: Automatically serves appropriate sizes for different devices
3. **Cross-Platform**: Works on Windows, macOS, iOS, and Android
4. **Browser Compatibility**: Supports Chrome, Firefox, Safari, and Edge

## Testing the Favicon

1. **Browser Tab**: Look at your browser tab - you should see the logo
2. **Test Page**: Visit `/favicon-test.html` for a comprehensive test
3. **Bookmarks**: Bookmark the page - the logo should appear
4. **Mobile**: On mobile, add to home screen for app icon

## Troubleshooting

If the favicon doesn't appear:

1. **Hard Refresh**: Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear Cache**: Clear browser cache and cookies
3. **Check Console**: Look for errors in browser developer tools
4. **File Access**: Verify `/Untitled design.png` is accessible

## Customization

To change the favicon:

1. Replace `public/Untitled design.png` with your new logo
2. Update the title and description in `src/app/layout.tsx`
3. Run `npm run generate-favicons` to create new favicon files
4. Test on different devices and browsers

## Technical Details

- **Format**: PNG for best quality and transparency support
- **Sizes**: Automatically serves 16x16 to 512x512 pixels
- **Meta Tags**: Includes Open Graph and Twitter Card support
- **PWA Ready**: Includes web app manifest for mobile app-like experience

## Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Internet Explorer 11+

## Performance

- Favicon is preloaded for faster display
- Multiple sizes prevent unnecessary scaling
- Optimized for both desktop and mobile devices
