import { del } from "@vercel/blob";

/**
 * Deletes an old image from Vercel Blob storage if it exists and is different from the new URL.
 * 
 * @param oldUrl The current image URL stored in the database.
 * @param newUrl The new image URL being saved.
 */
export async function deleteOldImage(oldUrl: string | null | undefined, newUrl?: string | null | undefined) {
  console.log("[STORAGE_DEBUG] Attempting to cleanup:", { oldUrl, newUrl });
  
  if (!oldUrl) {
    console.log("[STORAGE_DEBUG] No oldUrl provided, skipping.");
    return;
  }
  
  // Normalize URLs to compare correctly (remove query strings like ?v=...)
  const cleanOldUrl = oldUrl.split("?")[0];
  const cleanNewUrl = newUrl?.split("?")[0];

  if (cleanNewUrl && cleanOldUrl === cleanNewUrl) {
    console.log("[STORAGE_DEBUG] cleanNewUrl is same as cleanOldUrl, skipping.");
    return;
  }

  try {
    if (cleanOldUrl.includes("blob.vercel-storage.com")) {
      console.log("[STORAGE_DEBUG] Calling Vercel Blob del for:", cleanOldUrl);
      await del(cleanOldUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log("[STORAGE_DEBUG] Vercel Blob del executed successfully.");
    } else {
      console.log("[STORAGE_DEBUG] URL does not look like a Vercel Blob URL:", cleanOldUrl);
    }
  } catch (error) {
    console.error("[STORAGE_DELETE_ERROR] Failed to delete old image:", cleanOldUrl, error);
  }
}
