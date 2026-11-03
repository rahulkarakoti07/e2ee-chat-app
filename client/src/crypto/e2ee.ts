/**
 * End-to-End Encryption Engine (ECDH P-256 + HKDF-SHA256 + AES-GCM-256)
 */

import {
  bufferToBase64,
  base64ToBuffer,
  stringToBuffer,
  bufferToString,
} from '../utils/encoding';
import { EncryptedPayload } from '../types/crypto';

// In-memory cache for derived shared keys: contactPublicKeyFingerprint -> AES-GCM CryptoKey
const sharedKeyCache = new Map<string, CryptoKey>();

/**
 * Generate a new ECDH P-256 Identity KeyPair
 */
export const generateIdentityKeyPair = async (): Promise<CryptoKeyPair> => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable for export and vault wrapping
    ['deriveKey', 'deriveBits']
  );
};

/**
 * Export Public Key to standard JWK
 */
export const exportPublicKeyJWK = async (key: CryptoKey): Promise<JsonWebKey> => {
  return await window.crypto.subtle.exportKey('jwk', key);
};

/**
 * Export Private Key to JWK
 */
export const exportPrivateKeyJWK = async (key: CryptoKey): Promise<JsonWebKey> => {
  return await window.crypto.subtle.exportKey('jwk', key);
};

/**
 * Import Public Key from JWK
 */
export const importPublicKeyJWK = async (jwk: JsonWebKey): Promise<CryptoKey> => {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
};

/**
 * Import Private Key from JWK
 */
export const importPrivateKeyJWK = async (jwk: JsonWebKey): Promise<CryptoKey> => {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false,
    ['deriveKey', 'deriveBits']
  );
};

/**
 * Derives a symmetric AES-GCM-256 session key using ECDH + HKDF
 */
export const deriveSharedKey = async (
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
  theirJWK?: JsonWebKey
): Promise<CryptoKey> => {
  const cacheKey = theirJWK ? `${theirJWK.x}_${theirJWK.y}` : null;
  if (cacheKey && sharedKeyCache.has(cacheKey)) {
    return sharedKeyCache.get(cacheKey)!;
  }

  // 1. Compute ECDH raw shared secret bits (256 bits)
  const rawSharedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: theirPublicKey,
    },
    myPrivateKey,
    256
  );

  // 2. Import raw bits as HKDF base key
  const hkdfKey = await window.crypto.subtle.importKey(
    'raw',
    rawSharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // 3. Derive AES-GCM-256 Key via HKDF
  const sharedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32) as any, // standard zero salt for deterministic symmetric pairing
      info: stringToBuffer('aegis-e2ee-aes-gcm-v1') as any,
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  if (cacheKey) {
    sharedKeyCache.set(cacheKey, sharedKey);
  }

  return sharedKey;
};

/**
 * Encrypts a message using the derived AES-GCM shared key
 * A fresh 12-byte random IV is generated for every single message.
 */
export const encryptMessage = async (
  sharedKey: CryptoKey,
  plaintext: string
): Promise<EncryptedPayload> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = stringToBuffer(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    sharedKey,
    encoded as any
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
};

/**
 * Decrypts an incoming message with AES-GCM
 */
export const decryptMessage = async (
  sharedKey: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string
): Promise<string> => {
  const iv = base64ToBuffer(ivBase64);
  const encrypted = base64ToBuffer(ciphertextBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    sharedKey,
    encrypted as any
  );

  return bufferToString(decrypted);
};

/**
 * Computes a Signal-style Safety Number (30 digits formatted in 6 blocks of 5)
 * for Man-in-the-Middle (MITM) verification.
 */
export const computeSafetyNumber = async (
  keyA: JsonWebKey,
  keyB: JsonWebKey
): Promise<string> => {
  const strA = `${keyA.x || ''}:${keyA.y || ''}`;
  const strB = `${keyB.x || ''}:${keyB.y || ''}`;

  // Lexicographical sort ensures both users arrive at the identical number
  const sorted = [strA, strB].sort().join('::');
  const digest = await window.crypto.subtle.digest('SHA-256', stringToBuffer(sorted) as any);
  const view = new DataView(digest);

  let digits = '';
  // Produce 6 chunks of 5 decimal digits
  for (let i = 0; i < 6; i++) {
    const chunkVal = view.getUint32(i * 4) % 100000;
    digits += chunkVal.toString().padStart(5, '0') + (i < 5 ? ' ' : '');
  }

  return digits;
};
