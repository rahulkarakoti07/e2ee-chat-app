export interface MessageItem {
  _id: string;
  sender: string;
  recipient: string;
  ciphertext: string;
  iv: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
  clientTempId?: string;
  decryptedText?: string;
  isDecrypted?: boolean;
  decryptionError?: boolean;
}

export interface ContactUser {
  _id: string;
  username: string;
  publicKey: JsonWebKey;
  status: 'online' | 'offline';
  lastSeen?: string;
  isVerified?: boolean;
  unreadCount?: number;
  lastMessageSnippet?: string;
}

export interface VerificationData {
  contactId: string;
  safetyNumber: string;
  verifiedAt: string;
}
