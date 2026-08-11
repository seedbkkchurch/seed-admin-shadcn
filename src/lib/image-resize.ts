/**
 * Client-side avatar resizing: crops the source image to a centered square
 * and downscales it to `size`x`size`, returning a JPEG Blob.
 */
export async function cropAndResizeImage(
  file: File | Blob,
  size = 256,
  quality = 0.9,
): Promise<Blob> {
  const bitmap = await loadImageBitmap(file);

  const sourceSize = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - sourceSize) / 2;
  const sy = (bitmap.height - sourceSize) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sourceSize, sourceSize, 0, 0, size, size);

  if ("close" in bitmap) bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode image."));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Client-side resize for article/content images (e.g. เฝ้าเดี่ยว inline
 * images): downscales so the longer side is at most `maxDimension`,
 * preserving aspect ratio (no cropping, unlike cropAndResizeImage).
 * Per docs/devotion-db-design.md's storage-size estimate, which assumes
 * ~150-250KB/image after this resize — skipping it lets raw phone
 * photos (3-8MB) balloon Storage usage ~20x.
 */
export async function resizeForArticle(
  file: File | Blob,
  maxDimension = 1600,
  quality = 0.8,
): Promise<Blob> {
  const bitmap = await loadImageBitmap(file);

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  if ("close" in bitmap) bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode image."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function loadImageBitmap(file: File | Blob): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }
  // Fallback for environments without createImageBitmap.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
