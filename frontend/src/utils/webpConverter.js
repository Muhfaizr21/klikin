/**
 * WebP Conversion & Image Optimization Utility
 * Automatically converts any uploaded avatar/image (PNG, JPG, HEIC, etc.) into high-efficiency WebP
 * using client-side HTML5 Canvas processing before storing or transmitting to backend.
 */

/**
 * Validates selected file before processing
 * @param {File} file 
 * @param {number} maxBytes (default 10MB)
 * @returns {string|null} error message or null if valid
 */
export function validateImageFile(file, maxBytes = 10 * 1024 * 1024) {
  if (!file) {
    return 'Silakan pilih file gambar.';
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|gif|bmp|svg)$/i)) {
    return 'Format file tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.';
  }

  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
    return `Ukuran file terlalu besar (maksimal ${maxMB} MB).`;
  }

  return null;
}

/**
 * Converts any image file to an optimized WebP DataURL and Blob
 * @param {File|Blob} file 
 * @param {Object} options { maxWidth, maxHeight, quality }
 * @returns {Promise<{ dataUrl: string, blob: Blob, originalSize: number, webpSize: number, savingsPercent: number, width: number, height: number }>}
 */
export function convertToWebP(file, { maxWidth = 512, maxHeight = 512, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const errorMsg = validateImageFile(file);
    if (errorMsg) {
      return reject(new Error(errorMsg));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar.'));
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('File gambar rusak atau tidak dapat dimuat.'));
      };

      img.onload = () => {
        try {
          // Calculate proportional dimensions
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Render onto off-screen canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Tidak dapat menginisialisasi canvas rendering context.'));
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Clear and draw image
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Test WebP export support
          let webpDataUrl = canvas.toDataURL('image/webp', quality);
          const isWebPSupported = webpDataUrl.startsWith('data:image/webp');

          // Fallback if browser doesn't support WebP canvas encoding
          if (!isWebPSupported) {
            webpDataUrl = canvas.toDataURL('image/png');
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Gagal mengompresi gambar ke WebP blob.'));
              }

              const originalSize = file.size;
              const webpSize = blob.size;
              const savingsPercent = originalSize > 0 
                ? Math.max(0, Math.round(((originalSize - webpSize) / originalSize) * 100))
                : 0;

              resolve({
                dataUrl: webpDataUrl,
                blob,
                format: isWebPSupported ? 'webp' : 'png',
                originalSize,
                webpSize,
                savingsPercent,
                width,
                height,
              });
            },
            isWebPSupported ? 'image/webp' : 'image/png',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to human readable format (KB, MB)
 * @param {number} bytes 
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
