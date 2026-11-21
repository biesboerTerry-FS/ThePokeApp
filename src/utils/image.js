// Reads a File into a base64 data URL. Used as the local fallback when
// Cloudinary is not configured (or an upload fails), so the demo keeps working.
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}
