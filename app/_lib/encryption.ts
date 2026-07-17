import crypto from "crypto";
import "server-only";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, "hex").length !== 32) {
  throw new Error("ENCRYPTION_KEY is missing or invalid. It must be a 32-byte hex string.");
}

const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts a string value using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns The encrypted string, containing iv, auth tag, and ciphertext.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!, "hex"), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string value previously encrypted with AES-256-GCM.
 * @param text The encrypted string format (iv:authTag:ciphertext).
 * @returns The decrypted plaintext string.
 */
export function decrypt(text: string): string {
  const parts = text.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY!, "hex"),
    Buffer.from(ivHex, "hex")
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
