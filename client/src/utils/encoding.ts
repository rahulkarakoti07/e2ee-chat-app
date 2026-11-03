/**
 * Cryptographic Encoding & Serialization Utilities
 */

// Convert Uint8Array to Hex string
export const bufferToHex = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Convert Hex string to Uint8Array
export const hexToBuffer = (hex: string): Uint8Array => {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
};

// Convert ArrayBuffer / Uint8Array to Base64
export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 to Uint8Array
export const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// String <-> UTF8 ArrayBuffer
export const stringToBuffer = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

export const bufferToString = (buffer: ArrayBuffer | Uint8Array): string => {
  return new TextDecoder().decode(buffer);
};
