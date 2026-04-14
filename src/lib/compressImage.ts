import imageCompression from "browser-image-compression"

const PRESETS = {
  covers: { maxWidthOrHeight: 2400, initialQuality: 0.85 },
  stops:  { maxWidthOrHeight: 1800, initialQuality: 0.85 },
} as const

/**
 * Compress an image client-side before upload.
 * - Resizes to maxWidthOrHeight (never upscales)
 * - Converts to WebP at quality 0.85
 * - Handles EXIF rotation automatically
 * - Returns a File sized well under 4 MB for any reasonable input photo
 */
export async function compressImage(
  file: File,
  type: "covers" | "stops" = "stops"
): Promise<File> {
  const preset = PRESETS[type]
  const compressed = await imageCompression(file, {
    ...preset,
    maxSizeMB: 3.5,
    fileType: "image/webp",
    useWebWorker: true,
  })
  // Return as File with .webp extension
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp"
  return new File([compressed], name, { type: "image/webp" })
}
