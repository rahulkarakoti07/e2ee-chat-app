/**
 * Vault Key Management (PBKDF2 & AES-GCM-256)
 * Zero-Knowledge architecture: Server never sees the passphrase or the vault key.
 */

import { bufferToBase64, base64ToBuffer, bufferToHex, hexToBuffer, stringToBuffer, bufferToString } from '../utils/encoding';
import { DerivedKeys, EncryptedPayload } from '../types/crypto';

// In-memory storage of the active session vault key (never written to disk or sent over wire)
let inMemoryVaultKey: CryptoKey | null = null;

export const setSessionVaultKey = (key: CryptoKey): void => {
  inMemoryVaultKey = key;
};

export const getSessionVaultKey = (): CryptoKey | null => {
  return inMemoryVaultKey;
};

export const clearSessionVaultKey = (): void => {
  inMemoryVaultKey = null;
};

/**
 * Generate a cryptographically secure 16-byte random salt in hex
 */
export const generateSaltHex = (): string => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToHex(salt);
};

/**
 * Derives both Auth Hash (for server authentication) and Local Vault Key (AES-GCM-256)
 * from the user passphrase and salt via PBKDF2 (100,000 iterations, SHA-256).
 */
export const deriveKeysFromPassphrase = async (
  passphrase: string,
  saltHex: string
): Promise<DerivedKeys> => {
  const enc = new TextEncoder();
  const saltBuffer = hexToBuffer(saltHex);
  const passBuffer = enc.encode(passphrase);

  // Import passphrase as PBKDF2 base key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passBuffer as any,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive 512 bits: first 256 bits for Auth Token, remaining 256 bits for Local Vault Key
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    512
  );

  const authBits = derivedBits.slice(0, 32);
  const vaultBits = derivedBits.slice(32, 64);

  // 1. Auth Hash: compute SHA-256 digest of authBits before sending to server
  const authDigest = await window.crypto.subtle.digest('SHA-256', authBits as any);
  const authHash = bufferToHex(authDigest);

  // 2. Local Vault Key: Import vaultBits as an AES-GCM-256 CryptoKey
  const vaultKey = await window.crypto.subtle.importKey(
    'raw',
    vaultBits as any,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable from RAM
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );

  // Save to memory
  setSessionVaultKey(vaultKey);

  return { authHash, vaultKey };
};

/**
 * Encrypt arbitrary string or object with AES-GCM using the Vault Key
 */
export const encryptWithVaultKey = async (
  vaultKey: CryptoKey,
  plainData: string | object
): Promise<EncryptedPayload> => {
  const serialized = typeof plainData === 'string' ? plainData : JSON.stringify(plainData);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = stringToBuffer(serialized);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    vaultKey,
    encoded as any
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
};

/**
 * Decrypt ciphertext with AES-GCM using the Vault Key
 */
export const decryptWithVaultKey = async <T = any>(
  vaultKey: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string
): Promise<T> => {
  const iv = base64ToBuffer(ivBase64);
  const encrypted = base64ToBuffer(ciphertextBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    vaultKey,
    encrypted as any
  );

  const decoded = bufferToString(decrypted);
  try {
    return JSON.parse(decoded) as T;
  } catch {
    return decoded as unknown as T;
  }
};
