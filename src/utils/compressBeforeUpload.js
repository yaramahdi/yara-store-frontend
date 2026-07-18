import imageCompression from 'browser-image-compression';

export async function compressBeforeUpload(file) {
  if (!file || !file.type?.startsWith('image/')) return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
    });

    if (compressed instanceof File) return compressed;

    return new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    // Fallback: keep upload flow working by using original file if compression fails.
    console.warn('Image compression failed, uploading original file instead.', error);
    return file;
  }
}