// Advanced Protection: Salted SHA-256 PIN Lock + Web Crypto AES-256-GCM Storage Encryption

const VAULT_KEY_STORAGE = (uid: string) => `easynote_vk_${uid}`;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}::${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64(new Uint8Array(digest));
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  if (!salt || !expectedHash) return false;
  const computed = await hashPin(pin, salt);
  return computed === expectedHash;
}

async function getOrCreateAesKey(uid: string): Promise<CryptoKey> {
  let rawKeyB64 = window.localStorage.getItem(VAULT_KEY_STORAGE(uid));
  if (!rawKeyB64) {
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    rawKeyB64 = toBase64(keyBytes);
    window.localStorage.setItem(VAULT_KEY_STORAGE(uid), rawKeyB64);
  }
  const rawBytes = fromBase64(rawKeyB64);
  const keyBuffer = rawBytes.buffer.slice(
    rawBytes.byteOffset,
    rawBytes.byteOffset + rawBytes.byteLength
  ) as ArrayBuffer;
  return crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptPayload(uid: string, plaintext: string): Promise<string> {
  if (!window.crypto?.subtle) {
    return plaintext;
  }
  const key = await getOrCreateAesKey(uid);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return JSON.stringify({
    v: 'aes-gcm-1',
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(cipherBuffer)),
  });
}

export async function decryptPayload(uid: string, stored: string): Promise<string> {
  try {
    const parsed = JSON.parse(stored);
    if (parsed && parsed.v === 'aes-gcm-1' && parsed.iv && parsed.ct && window.crypto?.subtle) {
      const key = await getOrCreateAesKey(uid);
      const ivBytes = fromBase64(parsed.iv);
      const ctBytes = fromBase64(parsed.ct);
      const ivBuf = ivBytes.buffer.slice(
        ivBytes.byteOffset,
        ivBytes.byteOffset + ivBytes.byteLength
      ) as ArrayBuffer;
      const ctBuf = ctBytes.buffer.slice(
        ctBytes.byteOffset,
        ctBytes.byteOffset + ctBytes.byteLength
      ) as ArrayBuffer;
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuf },
        key,
        ctBuf
      );
      return new TextDecoder().decode(plainBuffer);
    }
  } catch {
    // Fallback to raw string if legacy plaintext
  }
  return stored;
}
