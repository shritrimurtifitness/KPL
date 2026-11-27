export interface CompressionResult {
  file: File;
  originalSizeKb: number;
  compressedSizeKb: number;
  reductionPercent: number;
  previewUrl: string;
}

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Compresses an image client-side in the browser using HTML5 Canvas & WebP encoding.
 * Default maxDimension is 1200px and quality is 0.78, targeting ~50 KB - 80 KB
 * while preserving 100% legibility of fine text (such as 12-digit UTR numbers).
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const maxDimension = options.maxDimension || 1200;
  const quality = options.quality !== undefined ? options.quality : 0.78;

  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale while strictly preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to acquire canvas context.'));
        }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Image compression canvas export failed.'));
            }

            // Create new WebP file
            const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], newName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const originalSizeKb = Math.round(file.size / 1024);
            const compressedSizeKb = Math.round(compressedFile.size / 1024);
            const reduction = Math.max(
              0,
              Math.round(((file.size - compressedFile.size) / file.size) * 100)
            );

            const previewUrl = URL.createObjectURL(compressedFile);

            resolve({
              file: compressedFile,
              originalSizeKb,
              compressedSizeKb,
              reductionPercent: reduction,
              previewUrl,
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.readAsDataURL(file);
  });
};
