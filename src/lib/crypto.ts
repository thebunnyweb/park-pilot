import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Symmetric encryption for secrets stored in the database (currently the
 * per-user Anthropic API key). AES-256-GCM with a key derived from AUTH_SECRET.
 *
 * Format of the stored string: base64(salt).base64(iv).base64(authTag).base64(ciphertext)
 *
 * If AUTH_SECRET changes, previously stored secrets can no longer be decrypted —
 * callers treat a decryption failure as "no key set".
 */

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars) to store secrets");
  }
  return s;
}

export function encryptSecret(plaintext: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(secret(), salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [salt, iv, tag, ct].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string | null {
  try {
    const [saltB64, ivB64, tagB64, ctB64] = stored.split(".");
    if (!saltB64 || !ivB64 || !tagB64 || !ctB64) return null;
    const salt = Buffer.from(saltB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    const key = scryptSync(secret(), salt, 32);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}
