/**
 * Client-side Image Preflight Validation Helpers
 * Strictly mirrors the constraints in demo_inference.py:
 * - Formats: JPEG, PNG, WebP
 * - Max file size: 12 MB
 * - Max pixels: 40 Megapixels
 * - Non-empty, valid dimensions (>= 1x1)
 */

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
export const MAX_IMAGE_PIXELS = 40_000_000; // 40 MP
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface ValidatedImageInfo {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: number;
  fileSizeBytes: number;
  formattedFileSize: string;
  format: string;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function calculateAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return 'N/A';
  // Common aspect ratios check
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.02) return '1:1 (Square)';
  if (Math.abs(ratio - 4 / 3) < 0.02) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.02) return '3:4';
  if (Math.abs(ratio - 16 / 9) < 0.02) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.02) return '9:16';
  if (Math.abs(ratio - 3 / 2) < 0.02) return '3:2';
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Validates file attributes and decodes image in memory.
 * Rejects oversized, invalid, corrupt, or unsupported images.
 */
export async function validateAndDecodeImage(file: File): Promise<ValidatedImageInfo> {
  // 1. Check file presence
  if (!file) {
    throw new ImageValidationError('No file was provided.');
  }

  // 2. Check empty file
  if (file.size === 0) {
    throw new ImageValidationError('The selected file is empty (0 bytes).');
  }

  // 3. Check file size limit (12 MB)
  if (file.size > MAX_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new ImageValidationError(
      `File size (${sizeMb} MB) exceeds the 12 MB maximum upload limit.`
    );
  }

  // 4. Check MIME type and extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

  if (!hasValidExtension && !hasValidMime) {
    throw new ImageValidationError(
      'Unsupported file format. Please select a JPEG (.jpg, .jpeg), PNG (.png), or WebP (.webp) image.'
    );
  }

  // Determine normalized format label
  let format = 'Unknown';
  if (file.type.includes('jpeg') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    format = 'JPEG';
  } else if (file.type.includes('png') || fileName.endsWith('.png')) {
    format = 'PNG';
  } else if (file.type.includes('webp') || fileName.endsWith('.webp')) {
    format = 'WebP';
  }

  // 5. Decode image in memory using object URL and Image constructor
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 6. Check dimensions are positive
      if (width < 1 || height < 1) {
        URL.revokeObjectURL(objectUrl);
        reject(new ImageValidationError('The image has invalid dimensions (0×0 pixels).'));
        return;
      }

      // 7. Check 40 Megapixel limit
      const totalPixels = width * height;
      if (totalPixels > MAX_IMAGE_PIXELS) {
        URL.revokeObjectURL(objectUrl);
        const mp = (totalPixels / 1_000_000).toFixed(1);
        reject(
          new ImageValidationError(
            `Image resolution (${width} × ${height} px = ${mp} MP) exceeds the 40 megapixel limit.`
          )
        );
        return;
      }

      // All preflight checks passed
      const megapixels = parseFloat((totalPixels / 1_000_000).toFixed(2));
      const aspectRatio = calculateAspectRatio(width, height);

      resolve({
        file,
        previewUrl: objectUrl,
        width,
        height,
        aspectRatio,
        megapixels,
        fileSizeBytes: file.size,
        formattedFileSize: formatFileSize(file.size),
        format,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new ImageValidationError(
          'Failed to decode image. The file may be corrupt, truncated, or not a recognized valid image.'
        )
      );
    };

    img.src = objectUrl;
  });
}
