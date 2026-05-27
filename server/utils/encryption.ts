import crypto from "crypto";
import { logger } from "./logger";

// AES configuration
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

// Dynamically fetch key from environment or use a secure default for setup convenience
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_SECRET 
  ? crypto.scryptSync(process.env.TOKEN_ENCRYPTION_SECRET, "harnexis-salt", 32)
  : crypto.scryptSync("harnexis-master-fallback-secret-key-2026", "harnexis-salt", 32);

/**
 * Encrypt a sensitive token using AES-256-CBC
 */
export function encryptToken(token: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Package initialization vector alongside ciphertext
    const payload = {
      iv: iv.toString("hex"),
      data: encrypted
    };
    
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  } catch (err: any) {
    logger.error(`Crypto encrypt token error: ${err.message}`);
    throw new Error("Failed to secure credentials payload.");
  }
}

/**
 * Decrypt a secured token string
 */
export function decryptToken(encryptedPayload: string | null): string {
  if (!encryptedPayload) return "";
  try {
    const payload = JSON.parse(Buffer.from(encryptedPayload, "base64").toString("utf8"));
    if (!payload.iv || !payload.data) {
      throw new Error("Malformed credentials packet.");
    }
    
    const iv = Buffer.from(payload.iv, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(payload.data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err: any) {
    logger.error(`Crypto decrypt token error: ${err.message}`);
    // Non-interruptive fallback if not yet encrypted or mismatched
    return encryptedPayload;
  }
}
