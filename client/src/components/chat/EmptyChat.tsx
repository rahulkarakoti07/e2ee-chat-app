import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Cpu, Key } from 'lucide-react';
import { HoloShield3D } from '../three/HoloShield3D';
import { Badge } from '../ui/Badge';

export const EmptyChat: React.FC = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center max-w-md"
      >
        <div className="mb-4">
          <HoloShield3D size={180} glowColor="cyan" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Encrypted Comms Ready
          </h2>
          <Badge variant="cyan" pulse>
            ACTIVE
          </Badge>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Select an active peer from the sidebar to initialize an ECDH P-256 session key exchange. Plaintext never leaves your browser.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3 w-full text-left">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-md">
            <Lock className="w-4 h-4 text-[#00f0ff] mb-1.5" />
            <div className="text-xs font-semibold text-slate-200">AES-GCM-256</div>
            <div className="text-[10px] text-slate-400">Authenticated wire encryption with random IVs</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-md">
            <Cpu className="w-4 h-4 text-[#9945ff] mb-1.5" />
            <div className="text-xs font-semibold text-slate-200">Local Vault</div>
            <div className="text-[10px] text-slate-400">PBKDF2 encrypted database in IndexedDB</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
