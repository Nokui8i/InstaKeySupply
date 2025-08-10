// Utility to crop an image using react-easy-crop and return a Blob
// Usage: getCroppedImg(imageSrc, croppedAreaPixels, quality?) => Promise<Blob>

export default async function getCroppedImg(imageSrc: string, crop: any, quality: number = 95): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  
  // Set canvas quality for high-resolution displays
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    // Use PNG format for maximum quality (lossless) if quality is 100
    // Otherwise use JPEG with specified quality for better compression
    if (quality === 100) {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      }, 'image/png', 1.0); // PNG with maximum quality
    } else {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg', quality / 100); // JPEG with specified quality
    }
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
} 