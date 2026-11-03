export interface DerivedKeys {
  authHash: string;
  vaultKey: CryptoKey;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64 (12 bytes)
}

export interface SerializedKeyPair {
  publicKeyJWK: JsonWebKey;
  encryptedPrivateKey: string; // Base64
  privateKeyIv: string; // Base64
}

export interface UserIdentityLocal {
  id: string;
  username: string;
  publicKeyJWK: JsonWebKey;
  encryptedPrivateKey: string;
  privateKeyIv: string;
  salt: string;
}
