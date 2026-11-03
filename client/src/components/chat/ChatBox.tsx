import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, ShieldCheck, Key, AlertCircle } from 'lucide-react';
import { ContactUser, MessageItem } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { KeyVerificationModal } from './KeyVerificationModal';
import { Badge } from '../ui/Badge';
import { AnimatedButton } from '../ui/AnimatedButton';

interface ChatBoxProps {
  contact: ContactUser;
  messages: MessageItem[];
  currentUserId: string;
  isOnline: boolean;
  isTyping: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onTyping: (typing: boolean) => void;
  onVerifiedChange: (isVerified: boolean) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  contact,
  messages,
  currentUserId,
  isOnline,
  isTyping,
  onSendMessage,
  onTyping,
  onVerifiedChange,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Typing signal logic
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText('');
    onTyping(false);

    try {
      await onSendMessage(trimmed);
    } catch (err) {
      console.error('Failed to encrypt and send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-[#07080d]/60 backdrop-blur-xl">
      {/* Conversation Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3.5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 text-white font-mono font-bold text-sm">
            {contact.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                @{contact.username}
              </h2>
              {contact.isVerified ? (
                <Badge variant="emerald" size="sm">
                  VERIFIED
                </Badge>
              ) : (
                <Badge variant="purple" size="sm">
                  E2EE SECURE
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
              <span>{isOnline ? 'Active on wire' : 'Offline'}</span>
            </p>
          </div>
        </div>

        {/* Safety Number Modal Trigger */}
        <AnimatedButton
          variant="ghost"
          size="sm"
          onClick={() => setIsVerifyModalOpen(true)}
          leftIcon={<Key className="w-3.5 h-3.5 text-[#00f0ff]" />}
          className="border-[#00f0ff]/20 hover:border-[#00f0ff]/50"
        >
          Verify Safety Key
        </AnimatedButton>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {/* Security Notice Pill */}
        <div className="my-3 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[11px] text-slate-400 font-mono backdrop-blur-sm">
            <Lock className="w-3 h-3 text-[#00f0ff]" />
            <span>End-to-End Encrypted via ECDH P-256 + AES-GCM-256</span>
          </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id || msg.clientTempId}
            message={msg}
            isMine={msg.sender === currentUserId}
          />
        ))}

        {/* Typing Bubble */}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono py-2 pl-2">
            <span className="text-[11px]">@{contact.username} is encrypting</span>
            <span className="inline-flex gap-1 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] animate-bounce" />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Form */}
      <div className="border-t border-white/10 p-4 bg-black/40 backdrop-blur-xl">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Write encrypted message to @${contact.username}...`}
              className="w-full rounded-2xl border border-white/10 bg-[#0d0e17]/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] transition-all font-sans"
            />
          </div>

          <AnimatedButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSending}
            disabled={!inputText.trim()}
            className="rounded-2xl px-5 h-[46px]"
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send
          </AnimatedButton>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
          <span>🔒 Client-side ciphertext only</span>
          <span>Zero-Knowledge Server</span>
        </div>
      </div>

      {/* Key Verification Modal */}
      <KeyVerificationModal
        contact={contact}
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerifiedChange={onVerifiedChange}
      />
    </div>
  );
};
