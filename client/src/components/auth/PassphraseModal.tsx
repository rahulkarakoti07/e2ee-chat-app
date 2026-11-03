import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlowCard } from '../ui/GlowCard';
import { AnimatedButton } from '../ui/AnimatedButton';
import { HoloShield3D } from '../three/HoloShield3D';

export const PassphraseModal: React.FC = () => {
  const { user, unlockVaultWithPass, logout } = useAuth();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;

    setIsUnlocking(true);
    setError(null);
    try {
      const ok = await unlockVaultWithPass(passphrase);
      if (!ok) {
        setError('Incorrect passphrase for this identity vault.');
      }
    } catch {
      setError('Decryption failed.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="relative z-50 flex min-h-screen items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <GlowCard glowColor="purple" className="p-8 shadow-glass border-white/10">
          <div className="flex flex-col items-center text-center mb-6">
            <HoloShield3D size={110} glowColor="purple" />
            <h2 className="text-xl font-bold text-white mt-2">
              Unlock Cryptographic Vault
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active identity: <span className="text-[#9945ff] font-mono">@{user?.username}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter master passphrase..."
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#9945ff] focus:outline-none focus:ring-1 focus:ring-[#9945ff] transition-all font-mono"
              />
            </div>

            <AnimatedButton
              type="submit"
              variant="purple"
              size="lg"
              isLoading={isUnlocking}
              className="w-full font-semibold"
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Decrypt Private Key & Enter
            </AnimatedButton>

            <button
              type="button"
              onClick={logout}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2"
            >
              Switch Account or Sign Out
            </button>
          </form>
        </GlowCard>
      </motion.div>
    </div>
  );
};
