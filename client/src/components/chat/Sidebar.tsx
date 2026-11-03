import React, { useState } from 'react';
import { Search, Shield, ShieldCheck, Circle, User as UserIcon } from 'lucide-react';
import { ContactUser } from '../../types/chat';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  contacts: ContactUser[];
  selectedContact: ContactUser | null;
  onSelectContact: (contact: ContactUser) => void;
  onlineUserIds: string[];
  currentUsername: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  onlineUserIds,
  currentUsername,
}) => {
  const [search, setSearch] = useState('');

  const filteredContacts = contacts.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full sm:w-80 flex-col border-r border-white/10 bg-[#080910]/70 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Contacts</h1>
            <p className="text-[10px] text-slate-400 font-mono">
              {onlineUserIds.length} ONLINE PEERS
            </p>
          </div>
        </div>
        <Badge variant="cyan" size="sm">
          P-256
        </Badge>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search peer identity..."
            className="w-full rounded-xl border border-white/5 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#00f0ff] focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredContacts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {contacts.length === 0
              ? 'No other users registered yet. Open another tab in incognito to register user 2!'
              : 'No matching peers found.'}
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isOnline = onlineUserIds.includes(contact._id);
            const isSelected = selectedContact?._id === contact._id;

            return (
              <button
                key={contact._id}
                onClick={() => onSelectContact(contact)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/40 shadow-glow-cyan'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar with Status Pip */}
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono font-semibold text-xs">
                      {contact.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#080910] ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {contact.username}
                      </span>
                      {contact.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">ECDH</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Identity */}
      <div className="p-3 border-t border-white/10 bg-black/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="text-[11px] text-slate-300 font-mono font-medium">
            @{currentUsername}
          </span>
        </div>
        <span className="text-[9px] text-[#00f0ff] font-mono border border-[#00f0ff]/30 px-1.5 py-0.5 rounded">
          VAULT SECURE
        </span>
      </div>
    </div>
  );
};
