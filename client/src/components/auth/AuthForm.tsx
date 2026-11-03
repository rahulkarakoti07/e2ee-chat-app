import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlowCard } from '../ui/GlowCard';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Badge } from '../ui/Badge';
import { HoloShield3D } from '../three/HoloShield3D';

export const AuthForm: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !passphrase) {
      setError('Please provide both username and passphrase');
      return;
    }

    if (passphrase.length < 6) {
      setError('Passphrase must be at least 6 characters long');
      return;
    }

    try {
      if (isRegister) {
        await register(username, passphrase);
      } else {
        await login(username, passphrase);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <GlowCard glowColor="cyan" className="p-8 shadow-glass border-white/10">
          {/* Header with 3D Holographic Core */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-2">
              <HoloShield3D size={110} glowColor={isRegister ? 'purple' : 'cyan'} />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Aegis<span className="text-[#00f0ff]">Chat</span>
              </h1>
              <Badge variant="cyan" pulse>
                E2EE
              </Badge>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Zero-Knowledge End-to-End Encrypted & Local-Encrypted Realtime Communications
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-[#9945ff]/20 text-[#9945ff] shadow-glow-purple'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Identity
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[10px] text-slate-500 font-mono">PUBLIC IDENTIFIER</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alice"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Master Passphrase</span>
                <span className="text-[10px] text-[#00f0ff] font-mono">NEVER LEAVES BROWSER</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Zero-Knowledge Invariant Callout */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Zero-Knowledge Proof</span>
              </div>
              Keys are derived client-side using PBKDF2 (100,000 iterations). Your raw passphrase and ECDH private key never touch the server.
            </div>

            <AnimatedButton
              type="submit"
              variant={isRegister ? 'purple' : 'primary'}
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-semibold"
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              {isRegister ? 'Generate Asymmetric Keys & Join' : 'Unlock Vault & Connect'}
            </AnimatedButton>
          </form>
        </GlowCard>
      </motion.div>
    </div>
  );
};
