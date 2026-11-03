import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, CheckCheck, AlertTriangle } from 'lucide-react';
import { MessageItem } from '../../types/chat';

interface MessageBubbleProps {
  message: MessageItem;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={`flex w-full mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 backdrop-blur-md text-sm shadow-md transition-all ${
          isMine
            ? 'bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 border border-[#00f0ff]/30 text-white rounded-br-none'
            : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 text-slate-100 rounded-bl-none'
        }`}
      >
        {/* Decryption Failure Fallback */}
        {message.decryptionError ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono py-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Decryption failed: Key mismatch</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm font-sans">
            {message.decryptedText ?? 'Decrypting payload...'}
          </p>
        )}

        {/* Bubble Meta Footer */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
          <span className="inline-flex items-center gap-0.5 opacity-70">
            <Lock className="w-2.5 h-2.5 text-[#00f0ff]" />
            E2EE
          </span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>

          {isMine && (
            <span className="ml-0.5">
              {message.read ? (
                <CheckCheck className="w-3 h-3 text-[#00f0ff]" />
              ) : message.delivered ? (
                <CheckCheck className="w-3 h-3 text-slate-400" />
              ) : (
                <Check className="w-3 h-3 text-slate-500" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
