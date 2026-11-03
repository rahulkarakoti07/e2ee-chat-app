import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ContactUser, MessageItem } from '../../types/chat';
import {
  importPublicKeyJWK,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from '../../crypto/e2ee';
import { db } from '../../crypto/db';
import { Sidebar } from './Sidebar';
import { ChatBox } from './ChatBox';
import { EmptyChat } from './EmptyChat';
import { FloatingDock } from '../ui/FloatingDock';
import { sound } from '../../utils/sound';
import { KeyVerificationModal } from './KeyVerificationModal';
import { API_URL } from '../../config/api';

export const ChatLayout: React.FC = () => {
  const { user, token, myPrivateKey, logout, clearLocalDatabase } = useAuth();
  const {
    onlineUserIds,
    typingUserIds,
    sendMessage,
    sendTyping,
    markMessagesRead,
    onNewMessage,
  } = useSocket();

  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactUser | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);

  // Derived symmetric shared key cache: contactId -> CryptoKey
  const sharedKeysRef = useRef<Map<string, CryptoKey>>(new Map());

  // 1. Fetch Contact List
  useEffect(() => {
    if (!token) return;

    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Check local verification records
          const verifiedRecords = await db.verifications.toArray();
          const verifiedSet = new Set(verifiedRecords.map((r) => r.contactId));

          const userList: ContactUser[] = data.users.map((u: any) => ({
            ...u,
            isVerified: verifiedSet.has(u._id),
          }));

          setContacts(userList);
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      }
    };

    fetchContacts();
    const interval = setInterval(fetchContacts, 12000);
    return () => clearInterval(interval);
  }, [token]);

  // Helper to obtain AES-GCM shared key for a contact
  const getOrDeriveSharedKey = async (contact: ContactUser): Promise<CryptoKey | null> => {
    if (!myPrivateKey) return null;

    if (sharedKeysRef.current.has(contact._id)) {
      return sharedKeysRef.current.get(contact._id)!;
    }

    try {
      const contactCryptoKey = await importPublicKeyJWK(contact.publicKey);
      const derivedKey = await deriveSharedKey(
        myPrivateKey,
        contactCryptoKey,
        contact.publicKey
      );
      sharedKeysRef.current.set(contact._id, derivedKey);
      return derivedKey;
    } catch (err) {
      console.error('Key derivation error with contact:', err);
      return null;
    }
  };

  // 2. Fetch & Decrypt Message History when contact selected
  useEffect(() => {
    if (!selectedContact || !token || !myPrivateKey) return;

    const loadHistory = async () => {
      try {
        markMessagesRead(selectedContact._id);

        const res = await fetch(`${API_URL}/api/messages/${selectedContact._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;
        const data = await res.json();
        const wireMessages: MessageItem[] = data.messages;

        const sharedKey = await getOrDeriveSharedKey(selectedContact);

        const decryptedMessages: MessageItem[] = await Promise.all(
          wireMessages.map(async (msg) => {
            if (!sharedKey) {
              return { ...msg, decryptionError: true };
            }
            try {
              const plain = await decryptMessage(sharedKey, msg.ciphertext, msg.iv);
              return { ...msg, decryptedText: plain, isDecrypted: true };
            } catch (err) {
              return { ...msg, decryptionError: true };
            }
          })
        );

        setMessages(decryptedMessages);
      } catch (err) {
        console.error('Error loading history:', err);
      }
    };

    loadHistory();
  }, [selectedContact?._id, myPrivateKey, token]);

  // 3. Listen for Incoming Real-Time Messages
  useEffect(() => {
    const unsubscribe = onNewMessage(async (newMsg) => {
      // If message belongs to active conversation
      if (
        selectedContact &&
        (newMsg.sender === selectedContact._id || newMsg.recipient === selectedContact._id)
      ) {
        const sharedKey = await getOrDeriveSharedKey(selectedContact);
        let plain = '';
        let error = false;

        if (sharedKey) {
          try {
            plain = await decryptMessage(sharedKey, newMsg.ciphertext, newMsg.iv);
          } catch {
            error = true;
          }
        } else {
          error = true;
        }

        const enriched: MessageItem = {
          ...newMsg,
          decryptedText: plain,
          isDecrypted: !error,
          decryptionError: error,
        };

        setMessages((prev) => {
          // Avoid duplicate insertion
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, enriched];
        });

        markMessagesRead(selectedContact._id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedContact, myPrivateKey]);

  // 4. Send Message Handler
  const handleSendMessage = async (text: string) => {
    if (!selectedContact || !myPrivateKey || !user) return;

    const sharedKey = await getOrDeriveSharedKey(selectedContact);
    if (!sharedKey) {
      throw new Error('Shared key derivation failed');
    }

    const { ciphertext, iv } = await encryptMessage(sharedKey, text);
    const tempId = 'temp-' + Date.now();

    // Optimistic local bubble
    const optimisticMessage: MessageItem = {
      _id: tempId,
      clientTempId: tempId,
      sender: user._id,
      recipient: selectedContact._id,
      ciphertext,
      iv,
      decryptedText: text,
      isDecrypted: true,
      timestamp: new Date().toISOString(),
      delivered: false,
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send through Socket.io
    sendMessage(selectedContact._id, ciphertext, iv, tempId);

    // Save to local IndexedDB
    try {
      await db.messages.put({
        _id: tempId,
        conversationWith: selectedContact._id,
        sender: user._id,
        recipient: selectedContact._id,
        ciphertext,
        iv,
        timestamp: optimisticMessage.timestamp,
        delivered: false,
        read: false,
      });
    } catch (err) {
      console.warn('Local DB write notice:', err);
    }
  };

  const handleVerifiedChange = (isVerified: boolean) => {
    if (!selectedContact) return;
    setContacts((prev) =>
      prev.map((c) => (c._id === selectedContact._id ? { ...c, isVerified } : c))
    );
    setSelectedContact((prev) => (prev ? { ...prev, isVerified } : null));
  };

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="relative z-10 flex h-screen w-screen overflow-hidden p-2 sm:p-5">
      {/* Main Glass Shell */}
      <div className="relative flex h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[#06070d]/80 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
        {/* Sidebar */}
        <Sidebar
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          onlineUserIds={onlineUserIds}
          currentUsername={user?.username || ''}
        />

        {/* Conversation Area or Zero State */}
        {selectedContact ? (
          <ChatBox
            contact={selectedContact}
            messages={messages}
            currentUserId={user?._id || ''}
            isOnline={onlineUserIds.includes(selectedContact._id)}
            isTyping={typingUserIds.includes(selectedContact._id)}
            onSendMessage={handleSendMessage}
            onTyping={(isTyping) => sendTyping(selectedContact._id, isTyping)}
            onVerifiedChange={handleVerifiedChange}
          />
        ) : (
          <div className="flex-1">
            <EmptyChat />
          </div>
        )}
      </div>

      {/* Floating Control Dock */}
      <FloatingDock
        username={user?.username || ''}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onVerifyKeys={() => selectedContact && setIsVerifyModalOpen(true)}
        onClearLocalCache={clearLocalDatabase}
        onLogout={logout}
      />

      {/* Verification Modal for active contact */}
      {selectedContact && (
        <KeyVerificationModal
          contact={selectedContact}
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          onVerifiedChange={handleVerifiedChange}
        />
      )}
    </div>
  );
};
