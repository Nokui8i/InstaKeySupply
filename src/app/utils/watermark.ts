// Utility function to add watermark to image - can be used for existing products
export const addWatermarkToImage = (imageSrc: string, watermarkText: string, position: string = 'top-left'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Try to load with CORS support, but handle failures gracefully
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set high DPI canvas for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = img.width * devicePixelRatio;
      canvas.height = img.height * devicePixelRatio;
      canvas.style.width = img.width + 'px';
      canvas.style.height = img.height + 'px';
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Scale context for high DPI
      ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Set watermark properties
      const fontSize = Math.max(36, img.width * 0.08); // Responsive font size - increased for better visibility
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate position based on selected position
      let x, y;
      const padding = 40; // Increased padding for larger watermark
      
      switch (position) {
        case 'top-left':
          x = padding + (ctx.measureText(watermarkText).width / 2);
          y = padding + fontSize / 2;
          break;
        case 'top-right':
          x = img.width - padding - (ctx.measureText(watermarkText).width / 2);
          y = padding + fontSize / 2;
          break;
        case 'bottom-left':
          x = padding + (ctx.measureText(watermarkText).width / 2);
          y = img.height - padding - fontSize / 2;
          break;
        case 'bottom-right':
          x = img.width - padding - (ctx.measureText(watermarkText).width / 2);
          y = img.height - padding - fontSize / 2;
          break;
        default:
          x = padding + (ctx.measureText(watermarkText).width / 2);
          y = padding + fontSize / 2;
      }
      
      // Draw premium background with solid color for better quality
      const textWidth = ctx.measureText(watermarkText).width;
      const textHeight = fontSize;
      const rectPadding = 20; // Increased padding for larger text
      const rectX = x - textWidth / 2 - rectPadding;
      const rectY = y - textHeight / 2 - rectPadding;
      const rectWidth = textWidth + rectPadding * 2;
      const rectHeight = textHeight + rectPadding * 2;
      
      // Create gradient background like Buy Now button
      const gradient = ctx.createLinearGradient(rectX, rectY, rectX + rectWidth, rectY + rectHeight);
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.9)'); // Purple-600
      gradient.addColorStop(1, 'rgba(219, 39, 119, 0.9)'); // Pink-600
      
      // Draw gradient background
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Use roundRect if available, otherwise use arcTo for rounded corners
      if (ctx.roundRect) {
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8);
      } else {
        // Fallback for browsers without roundRect support
        const radius = 8;
        ctx.moveTo(rectX + radius, rectY);
        ctx.lineTo(rectX + rectWidth - radius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
        ctx.lineTo(rectX + radius, rectY + rectHeight);
        ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
        ctx.lineTo(rectX, rectY + radius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
        ctx.closePath();
      }
      ctx.fill();
      
      // Draw subtle border for definition
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Reset shadow and draw crisp white text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(watermarkText, x, y);
      
      // Convert to data URL with high quality
      const watermarkedImage = canvas.toDataURL('image/jpeg', 0.95);
      resolve(watermarkedImage);
    };
    
    img.onerror = (error) => {
      console.error('Watermark: Failed to load image:', imageSrc, error);
      // Try without CORS if CORS fails
      if (img.crossOrigin === 'anonymous') {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          // Retry with same logic but without CORS
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          const devicePixelRatio = window.devicePixelRatio || 1;
          canvas.width = fallbackImg.width * devicePixelRatio;
          canvas.height = fallbackImg.height * devicePixelRatio;
          canvas.style.width = fallbackImg.width + 'px';
          canvas.style.height = fallbackImg.height + 'px';
          ctx.scale(devicePixelRatio, devicePixelRatio);
          ctx.drawImage(fallbackImg, 0, 0);
          
          // Apply watermark (same logic as above)
          const fontSize = Math.max(36, fallbackImg.width * 0.08);
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let x, y;
          const padding = 40;
          
          switch (position) {
            case 'top-left':
              x = padding + (ctx.measureText(watermarkText).width / 2);
              y = padding + fontSize / 2;
              break;
            case 'top-right':
              x = fallbackImg.width - padding - (ctx.measureText(watermarkText).width / 2);
              y = padding + fontSize / 2;
              break;
            case 'bottom-left':
              x = padding + (ctx.measureText(watermarkText).width / 2);
              y = fallbackImg.height - padding - fontSize / 2;
              break;
            case 'bottom-right':
              x = fallbackImg.width - padding - (ctx.measureText(watermarkText).width / 2);
              y = fallbackImg.height - padding - fontSize / 2;
              break;
            default:
              x = padding + (ctx.measureText(watermarkText).width / 2);
              y = padding + fontSize / 2;
          }
          
          const textWidth = ctx.measureText(watermarkText).width;
          const textHeight = fontSize;
          const rectPadding = 20;
          const rectX = x - textWidth / 2 - rectPadding;
          const rectY = y - textHeight / 2 - rectPadding;
          const rectWidth = textWidth + rectPadding * 2;
          const rectHeight = textHeight + rectPadding * 2;
          
          const gradient = ctx.createLinearGradient(rectX, rectY, rectX + rectWidth, rectY + rectHeight);
          gradient.addColorStop(0, 'rgba(147, 51, 234, 0.9)');
          gradient.addColorStop(1, 'rgba(219, 39, 119, 0.9)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8);
          } else {
            const radius = 8;
            ctx.moveTo(rectX + radius, rectY);
            ctx.lineTo(rectX + rectWidth - radius, rectY);
            ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
            ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
            ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
            ctx.lineTo(rectX + radius, rectY + rectHeight);
            ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
            ctx.lineTo(rectX, rectY + radius);
            ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
            ctx.closePath();
          }
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(watermarkText, x, y);
          
          const watermarkedImage = canvas.toDataURL('image/jpeg', 0.95);
          resolve(watermarkedImage);
        };
        fallbackImg.onerror = () => {
          reject(new Error('Could not load image even without CORS'));
        };
        fallbackImg.src = imageSrc;
      } else {
        reject(new Error('Could not load image'));
      }
    };
    
    img.src = imageSrc;
  });
};

