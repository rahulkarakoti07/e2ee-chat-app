import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthResponse, SaltResponse } from '../types/auth';
import {
  deriveKeysFromPassphrase,
  generateSaltHex,
  encryptWithVaultKey,
  decryptWithVaultKey,
  setSessionVaultKey,
  clearSessionVaultKey,
} from '../crypto/vault';
import {
  generateIdentityKeyPair,
  exportPublicKeyJWK,
  exportPrivateKeyJWK,
  importPrivateKeyJWK,
} from '../crypto/e2ee';
import { db } from '../crypto/db';
import { sound } from '../utils/sound';
import { triggerCyberPulse } from '../components/three/CyberBackground3D';
import { API_URL } from '../config/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isVaultUnlocked: boolean;
  myPrivateKey: CryptoKey | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, pass: string) => Promise<void>;
  unlockVaultWithPass: (pass: string) => Promise<boolean>;
  logout: () => void;
  clearLocalDatabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('aegis_token'));
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('aegis_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('aegis_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session check network error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Register with Zero-Knowledge PBKDF2 & ECDH Keypair
  const register = async (username: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const cleanUsername = username.toLowerCase().trim();
      const saltHex = generateSaltHex();

      // 1. Derive Auth Hash & Vault Key
      const { authHash, vaultKey } = await deriveKeysFromPassphrase(pass, saltHex);

      // 2. Generate ECDH P-256 Keypair
      const keyPair = await generateIdentityKeyPair();
      const pubJWK = await exportPublicKeyJWK(keyPair.publicKey);
      const privJWK = await exportPrivateKeyJWK(keyPair.privateKey);

      // 3. Encrypt Private Key with Vault Key
      const encryptedPriv = await encryptWithVaultKey(vaultKey, privJWK);

      // 4. Register to Server
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          authHash,
          salt: saltHex,
          publicKey: pubJWK,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      const authData = data as AuthResponse;

      // 5. Store Encrypted Private Key locally in Dexie
      await db.identity.put({
        id: authData.user._id,
        username: cleanUsername,
        publicKeyJWK: pubJWK,
        encryptedPrivateKey: encryptedPriv.ciphertext,
        privateKeyIv: encryptedPriv.iv,
        salt: saltHex,
      });

      localStorage.setItem('aegis_token', authData.token);
      setToken(authData.token);
      setUser(authData.user);
      setMyPrivateKey(keyPair.privateKey);
      setIsVaultUnlocked(true);

      sound.playVaultUnlock();
      triggerCyberPulse('purple');
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (username: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const cleanUsername = username.toLowerCase().trim();

      // 1. Get Salt from Server
      const saltRes = await fetch(`${API_URL}/api/auth/salt/${cleanUsername}`);
      if (!saltRes.ok) throw new Error('User not found or network error');
      const { salt } = (await saltRes.json()) as SaltResponse;

      // 2. Derive Auth Hash and Local Vault Key
      const { authHash, vaultKey } = await deriveKeysFromPassphrase(pass, salt);

      // 3. Authenticate with Server
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, authHash }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      const authData = data as AuthResponse;
      localStorage.setItem('aegis_token', authData.token);
      setToken(authData.token);
      setUser(authData.user);

      // 4. Recover Private Key from local Dexie
      const localIdentity = await db.identity.get(authData.user._id);

      if (localIdentity) {
        const decryptedPrivJWK = await decryptWithVaultKey<JsonWebKey>(
          vaultKey,
          localIdentity.encryptedPrivateKey,
          localIdentity.privateKeyIv
        );
        const privKey = await importPrivateKeyJWK(decryptedPrivJWK);
        setMyPrivateKey(privKey);
      } else {
        // If logging in on a new device/incognito: generate identity keypair & update public key
        const newKeyPair = await generateIdentityKeyPair();
        const newPubJWK = await exportPublicKeyJWK(newKeyPair.publicKey);
        const newPrivJWK = await exportPrivateKeyJWK(newKeyPair.privateKey);
        const encryptedPriv = await encryptWithVaultKey(vaultKey, newPrivJWK);

        await db.identity.put({
          id: authData.user._id,
          username: cleanUsername,
          publicKeyJWK: newPubJWK,
          encryptedPrivateKey: encryptedPriv.ciphertext,
          privateKeyIv: encryptedPriv.iv,
          salt: authData.user.salt,
        });

        setMyPrivateKey(newKeyPair.privateKey);
      }

      setIsVaultUnlocked(true);
      sound.playVaultUnlock();
      triggerCyberPulse('cyan');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-unlock vault if page was refreshed
  const unlockVaultWithPass = async (pass: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { vaultKey } = await deriveKeysFromPassphrase(pass, user.salt);
      const localIdentity = await db.identity.get(user._id);
      if (!localIdentity) return false;

      const privJWK = await decryptWithVaultKey<JsonWebKey>(
        vaultKey,
        localIdentity.encryptedPrivateKey,
        localIdentity.privateKeyIv
      );
      const privKey = await importPrivateKeyJWK(privJWK);
      setMyPrivateKey(privKey);
      setIsVaultUnlocked(true);
      sound.playVaultUnlock();
      return true;
    } catch {
      return false;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('aegis_token');
    setToken(null);
    setUser(null);
    setIsVaultUnlocked(false);
    setMyPrivateKey(null);
    clearSessionVaultKey();
  };

  const clearLocalDatabase = async (): Promise<void> => {
    await db.messages.clear();
    await db.verifications.clear();
    triggerCyberPulse('emerald');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isVaultUnlocked,
        myPrivateKey,
        isLoading,
        login,
        register,
        unlockVaultWithPass,
        logout,
        clearLocalDatabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
