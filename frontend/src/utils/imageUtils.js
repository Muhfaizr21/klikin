/**
 * Universal Image Optimization & WebP Conversion Utility
 * Converts any uploaded image (PNG, JPEG, HEIC, AVIF, GIF, etc.) into high-efficiency WebP format.
 */

/**
 * Convert any File or Blob to a compressed WebP Data URL & File
 * @param {File|Blob} file 
 * @param {Object} options 
 * @param {number} options.maxWidth 
 * @param {number} options.maxHeight 
 * @param {number} options.quality (0 to 1, default 0.88)
 * @returns {Promise<{ dataUrl: string, blob: Blob, file: File, width: number, height: number, originalSize: number, webpSize: number }>}
 */
export async function fileToWebP(file, { maxWidth = 1400, maxHeight = 1400, quality = 0.88 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Input must be a valid File or Blob'));
    }

    const originalSize = file.size;
    const originalName = file.name || 'image.png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const webpFileName = `${baseName}.webp`;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      // Calculate aspect ratio preserving resize
      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to WebP Data URL
      const webpDataUrl = canvas.toDataURL('image/webp', quality);

      // Convert to WebP Blob & File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback if toBlob fails
            return resolve({
              dataUrl: webpDataUrl,
              blob: file,
              file: file,
              width: targetWidth,
              height: targetHeight,
              originalSize,
              webpSize: Math.round((webpDataUrl.length * 3) / 4),
            });
          }

          const webpFile = new File([blob], webpFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve({
            dataUrl: webpDataUrl,
            blob,
            file: webpFile,
            width: targetWidth,
            height: targetHeight,
            originalSize,
            webpSize: blob.size,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses file gambar: ' + (err?.message || 'Format tidak didukung')));
    };

    img.src = objectUrl;
  });
}

/**
 * Crop an image (from File, DataURL, or Image URL) into a square 1:1 WebP
 * accounting for zoom level and centering.
 * @param {string|File|Blob} imageSource
 * @param {Object} options
 * @param {number} options.zoom (default 1.0)
 * @param {number} options.outputSize (default 400px)
 * @param {number} options.quality (default 0.90)
 * @returns {Promise<{ dataUrl: string, blob: Blob, file: File }>}
 */
export async function cropToSquareWebP(
  imageSource,
  { zoom = 1, outputSize = 400, quality = 0.90 } = {}
) {
  return new Promise((resolve, reject) => {
    let objectUrl = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      cleanup();

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      // Base square size is the shorter dimension
      const baseDim = Math.min(naturalW, naturalH);
      // Applying zoom: larger zoom means smaller crop window in source image
      const safeZoom = Math.max(1, zoom);
      const cropDim = baseDim / safeZoom;

      const sourceX = (naturalW - cropDim) / 2;
      const sourceY = (naturalH - cropDim) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw center-cropped square
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        cropDim,
        cropDim,
        0,
        0,
        outputSize,
        outputSize
      );

      const webpDataUrl = canvas.toDataURL('image/webp', quality);

      canvas.toBlob(
        (blob) => {
          const webpFile = new File(
            [blob || new Blob([webpDataUrl], { type: 'image/webp' })],
            'avatar.webp',
            { type: 'image/webp', lastModified: Date.now() }
          );

          resolve({
            dataUrl: webpDataUrl,
            blob: blob || webpFile,
            file: webpFile,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      cleanup();
      // If cross-origin prevented drawing, return original string if available
      if (typeof imageSource === 'string') {
        return resolve({ dataUrl: imageSource, blob: null, file: null });
      }
      reject(new Error('Gagal memuat gambar untuk di-crop'));
    };

    if (imageSource instanceof Blob) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      reject(new Error('Sumber gambar tidak valid'));
    }
  });
}
