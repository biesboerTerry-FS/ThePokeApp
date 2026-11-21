import { readFileAsDataUrl } from '../utils/image';

// Cloudinary storage is optional. Configure these two EXPO_PUBLIC_* variables
// (the upload preset MUST be "unsigned") to store images in the cloud:
//
//   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
//   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
//
// See CLOUD_STORAGE_SETUP.md for the full setup notes. When either value is
// missing, or an upload fails, we transparently fall back to a local data URL
// stored in the app's AsyncStorage state so the demo still works.

const CLOUD_NAME = String(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
const UPLOAD_PRESET = String(process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '').trim();

export function isCloudConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export function getCloudinaryConfig() {
  return { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET, configured: isCloudConfigured() };
}

/**
 * Uploads an image File to Cloudinary using an unsigned upload preset and
 * returns { uri, source }. If cloud storage is not configured or the upload
 * fails, returns { uri: <data URL>, source: 'local' } instead.
 */
export async function uploadImage(file) {
  if (!file) {
    return null;
  }

  if (isCloudConfigured()) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'thepokeapp');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed (${response.status})`);
      }

      const data = await response.json();
      if (!data?.secure_url) {
        throw new Error('Cloudinary response did not include a secure URL');
      }

      return { uri: data.secure_url, source: 'cloudinary' };
    } catch (error) {
      // Fall through to the local data URL fallback.
    }
  }

  const uri = await readFileAsDataUrl(file);
  return { uri, source: 'local' };
}
