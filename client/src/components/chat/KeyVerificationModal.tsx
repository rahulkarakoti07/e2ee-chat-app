import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Copy, Check, Lock, QrCode } from 'lucide-react';
import { ContactUser } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { computeSafetyNumber } from '../../crypto/e2ee';
import { db } from '../../crypto/db';
import { HoloShield3D } from '../three/HoloShield3D';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Badge } from '../ui/Badge';

interface KeyVerificationModalProps {
  contact: ContactUser | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifiedChange: (isVerified: boolean) => void;
}

export const KeyVerificationModal: React.FC<KeyVerificationModalProps> = ({
  contact,
  isOpen,
  onClose,
  onVerifiedChange,
}) => {
  const { user } = useAuth();
  const [safetyNumber, setSafetyNumber] = useState<string>('Computing...');
  const [copied, setCopied] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !contact || !user?.publicKey) return;

    const calc = async () => {
      try {
        const num = await computeSafetyNumber(user.publicKey, contact.publicKey);
        setSafetyNumber(num);

        const record = await db.verifications.get(contact._id);
        setIsVerified(!!record);
      } catch (err) {
        console.error('Safety number error:', err);
      }
    };

    calc();
  }, [isOpen, contact, user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(safetyNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVerified = async () => {
    if (!contact) return;
    const nextState = !isVerified;
    setIsVerified(nextState);

    if (nextState) {
      await db.verifications.put({
        contactId: contact._id,
        safetyNumber,
        verifiedAt: new Date().toISOString(),
      });
    } else {
      await db.verifications.delete(contact._id);
    }

    onVerifiedChange(nextState);
  };

  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0e18]/95 p-6 shadow-2xl backdrop-blur-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <HoloShield3D size={110} glowColor={isVerified ? 'emerald' : 'cyan'} />
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-2">
              <span>Safety Number Verification</span>
              <Badge variant={isVerified ? 'emerald' : 'purple'}>
                {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Compare this 30-digit cryptographic fingerprint with @{contact.username} to guarantee no interception (MITM).
            </p>
          </div>

          {/* 30-digit number */}
          <div className="rounded-2xl border border-[#00f0ff]/20 bg-black/60 p-4 mb-5 text-center">
            <div className="text-[10px] text-[#00f0ff] font-mono mb-2 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>ECDH P-256 IDENTIFIER FINGERPRINT</span>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-100 select-all">
              {safetyNumber}
            </div>
            <button
              onClick={handleCopy}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00f0ff] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Fingerprint' : 'Copy Digits'}</span>
            </button>
          </div>

          {/* Verification Status Action */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] mb-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-emerald-400' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-semibold text-white">Mark as Verified Contact</div>
                <div className="text-[11px] text-slate-400">Save key fingerprint status locally in IndexedDB</div>
              </div>
            </div>
            <button
              onClick={handleToggleVerified}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isVerified ? 'bg-[#10b981]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isVerified ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <AnimatedButton variant="ghost" size="sm" onClick={onClose}>
              Dismiss
            </AnimatedButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
