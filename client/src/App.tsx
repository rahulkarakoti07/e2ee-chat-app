import React from 'react';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AuthForm } from './components/auth/AuthForm';
import { PassphraseModal } from './components/auth/PassphraseModal';
import { ChatLayout } from './components/chat/ChatLayout';
import { CyberBackground3D } from './components/three/CyberBackground3D';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isVaultUnlocked, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050508]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            INITIALIZING CRYPTOGRAPHIC ENGINE...
          </span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Zero-Knowledge Auth Screen
  if (!user) {
    return <AuthForm />;
  }

  // Logged in but session vault is locked in memory -> Prompt for passphrase
  if (!isVaultUnlocked) {
    return <PassphraseModal />;
  }

  // Authenticated & Vault Unlocked -> Enter Encrypted Realtime Space
  return (
    <SocketProvider>
      <ChatLayout />
    </SocketProvider>
  );
};

export const App: React.FC = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050508] font-sans text-slate-100">
      {/* Three.js Interactive 3D Cybernetic Background */}
      <CyberBackground3D particleCount={800} />

      {/* Main Application State View */}
      <AppContent />
    </div>
  );
};

export default App;
