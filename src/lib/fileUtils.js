import imageCompression from 'browser-image-compression';

/**
 * Process a file for upload.
 * Compresses images to max 1MB.
 * Validates other files against a 10MB limit.
 * 
 * @param {File} file 
 * @returns {Promise<{file?: File, error?: string}>}
 */
export async function processUploadFile(file) {
  if (!file) return { error: 'No file provided.' };

  const isImage = file.type.startsWith('image/');

  if (isImage) {
    try {
      const options = {
        maxSizeMB: 1, // Target size 1MB
        maxWidthOrHeight: 1920, // Max dimensions 1920px (Full HD)
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      return { file: compressedFile };
    } catch (error) {
      console.error('Image compression error:', error);
      return { error: `Failed to compress image "${file.name}".` };
    }
  } else {
    // For non-images (like PDFs) check if they exceed 10MB limit
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSizeInBytes) {
      return { error: `File "${file.name}" exceeds the 10MB limit. Please choose a smaller file.` };
    }
    
    return { file };
  }
}
