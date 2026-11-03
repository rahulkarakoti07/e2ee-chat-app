import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Volume2, VolumeX, LogOut, Key, Trash2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface FloatingDockProps {
  onVerifyKeys?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onClearLocalCache: () => void;
  onLogout: () => void;
  username: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  onVerifyKeys,
  isMuted,
  onToggleMute,
  onClearLocalCache,
  onLogout,
  username,
}) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-[#0c0d16]/85 px-4 py-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5"
    >
      {/* Identity Indicator */}
      <div className="flex items-center gap-2 pr-3 border-r border-white/10">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-xs font-mono font-bold">
          {username.slice(0, 2).toUpperCase()}
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-semibold text-slate-200">@{username}</span>
          <span className="text-[10px] text-[#00f0ff] font-mono">E2EE VAULT ACTIVE</span>
        </div>
      </div>

      {/* Action Icons */}
      <Tooltip content="Key Verification & Safety Numbers">
        <button
          onClick={onVerifyKeys}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-[#9945ff]/20 hover:text-[#9945ff] hover:scale-110 active:scale-95"
        >
          <Key className="w-4 h-4" />
        </button>
      </Tooltip>

      <Tooltip content={isMuted ? 'Unmute Cyber Sounds' : 'Mute Cyber Sounds'}>
        <button
          onClick={onToggleMute}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-[#00f0ff]/20 hover:text-[#00f0ff] hover:scale-110 active:scale-95"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </Tooltip>

      <Tooltip content="Purge Local Cache">
        <button
          onClick={onClearLocalCache}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-amber-500/20 hover:text-amber-400 hover:scale-110 active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="h-5 w-px bg-white/10 mx-1" />

      <Tooltip content="Lock Vault & Sign Out">
        <button
          onClick={onLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-rose-500/20 hover:text-rose-400 hover:scale-110 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </Tooltip>
    </motion.div>
  );
};
