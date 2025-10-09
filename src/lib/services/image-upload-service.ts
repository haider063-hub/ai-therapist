/**
 * Image Upload Service
 * Handles image validation, processing, and base64 encoding for chat messages
 */

export const IMAGE_UPLOAD_CONFIG = {
  maxSizeBytes: 20 * 1024 * 1024, // 20MB (OpenAI limit)
  maxDimension: 2048, // Max width/height in pixels
  allowedFormats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  monthlyLimit: 50, // 50 images per month for both chat_only and premium
};

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ProcessedImage {
  base64: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file size
  if (file.size > IMAGE_UPLOAD_CONFIG.maxSizeBytes) {
    return {
      valid: false,
      error: `Image size must be less than ${IMAGE_UPLOAD_CONFIG.maxSizeBytes / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!IMAGE_UPLOAD_CONFIG.allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Only ${IMAGE_UPLOAD_CONFIG.allowedExtensions.join(", ")} formats are supported`,
    };
  }

  return { valid: true };
}

/**
 * Convert image file to base64 data URL
 */
export function convertImageToBase64(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        base64: result,
        mimeType: file.type,
        originalName: file.name,
        sizeBytes: file.size,
      });
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Resize image if it exceeds maximum dimensions
 */
export function resizeImageIfNeeded(
  file: File,
  maxDimension: number = IMAGE_UPLOAD_CONFIG.maxDimension,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Check if resize is needed
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file);
        return;
      }

      // Calculate new dimensions
      if (width > height) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to resize image"));
            return;
          }

          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        file.type,
        0.9, // Quality (0.9 = 90%)
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process image file: validate, resize if needed, convert to base64
 */
export async function processImageForUpload(
  file: File,
): Promise<ProcessedImage> {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Resize if needed
  const resizedFile = await resizeImageIfNeeded(file);

  // Convert to base64
  const processedImage = await convertImageToBase64(resizedFile);

  return processedImage;
}

/**
 * Get image upload permission for user subscription
 */
export function canUploadImage(subscriptionType: string): boolean {
  return subscriptionType === "chat_only" || subscriptionType === "premium";
}

/**
 * Check if user has reached monthly image limit
 */
export function hasReachedImageLimit(imagesUsedThisMonth: number): boolean {
  return imagesUsedThisMonth >= IMAGE_UPLOAD_CONFIG.monthlyLimit;
}

/**
 * Get remaining images for the month
 */
export function getRemainingImages(imagesUsedThisMonth: number): number {
  return Math.max(0, IMAGE_UPLOAD_CONFIG.monthlyLimit - imagesUsedThisMonth);
}
