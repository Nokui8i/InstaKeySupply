const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256, 512];
const inputPath = path.join(__dirname, '../public/Untitled design.png');
const outputDir = path.join(__dirname, '../public/favicons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateFavicons() {
  try {
    console.log('Starting favicon generation...');
    
    // Generate PNG favicons in multiple sizes
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size} PNG favicon`);
    }
    
    // Create a larger, more visible favicon for the main site
    const mainFaviconPath = path.join(__dirname, '../public/favicon-main.png');
    await sharp(inputPath)
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(mainFaviconPath);
    
    console.log('✅ Generated main 64x64 favicon');
    
    // Copy the 64x64 version as favicon.ico for better visibility
    fs.copyFileSync(mainFaviconPath, path.join(__dirname, '../public/favicon.ico'));
    console.log('✅ Copied 64x64 favicon as favicon.ico');
    
    // Also copy the 64x64 version to the root for immediate use
    fs.copyFileSync(mainFaviconPath, path.join(__dirname, '../public/favicon.png'));
    console.log('✅ Created favicon.png for immediate use');
    
    console.log('\n🎉 Favicon generation complete!');
    console.log('📁 Check the public/favicons/ directory for all sizes');
    console.log('🌐 The main favicon.ico is now 64x64 pixels for better visibility');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
  }
}

generateFavicons();
