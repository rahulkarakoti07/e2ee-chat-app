/**
 * Dexie.js IndexedDB Schema for Encrypted Local Storage
 * Stores wrapped identity keys, encrypted conversations, and safety verification data.
 */

import Dexie, { type EntityTable } from 'dexie';
import { UserIdentityLocal } from '../types/crypto';

export interface LocalEncryptedMessage {
  _id: string;
  conversationWith: string; // userId of contact
  sender: string;
  recipient: string;
  ciphertext: string; // Wire ciphertext
  iv: string; // Wire IV
  vaultEncryptedPlaintext?: string; // Plaintext encrypted under user's Local Vault Key
  vaultIv?: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
}

export interface LocalContactVerification {
  contactId: string;
  safetyNumber: string;
  verifiedAt: string;
}

class AegisChatDB extends Dexie {
  identity!: EntityTable<UserIdentityLocal, 'id'>;
  messages!: EntityTable<LocalEncryptedMessage, '_id'>;
  verifications!: EntityTable<LocalContactVerification, 'contactId'>;

  constructor() {
    super('AegisChatDB');
    this.version(1).stores({
      identity: 'id, username',
      messages: '_id, conversationWith, timestamp, [conversationWith+timestamp]',
      verifications: 'contactId',
    });
  }
}

export const db = new AegisChatDB();
