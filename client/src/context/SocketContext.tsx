import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { MessageItem } from '../types/chat';
import { sound } from '../utils/sound';
import { triggerCyberPulse } from '../components/three/CyberBackground3D';
import { API_URL } from '../config/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: string[];
  typingUserIds: string[];
  sendMessage: (recipientId: string, ciphertext: string, iv: string, clientTempId?: string) => void;
  sendTyping: (recipientId: string, isTyping: boolean) => void;
  markMessagesRead: (senderId: string) => void;
  onNewMessage: (cb: (msg: MessageItem) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const messageListenersRef = useRef<((msg: MessageItem) => void)[]>([]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to backend (same-origin in unified hosting or remote if VITE_API_URL is set)
    const newSocket = io(API_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('online_users_list', (ids: string[]) => {
      setOnlineUserIds(ids);
    });

    newSocket.on('user_status_change', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUserIds((prev) => {
        if (data.status === 'online') {
          return Array.from(new Set([...prev, data.userId]));
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    newSocket.on('user_typing', (data: { userId: string }) => {
      setTypingUserIds((prev) => Array.from(new Set([...prev, data.userId])));
    });

    newSocket.on('user_stop_typing', (data: { userId: string }) => {
      setTypingUserIds((prev) => prev.filter((id) => id !== data.userId));
    });

    newSocket.on('receive_message', (msg: MessageItem) => {
      sound.playReceived();
      triggerCyberPulse('cyan');
      messageListenersRef.current.forEach((cb) => cb(msg));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?._id]);

  const sendMessage = (
    recipientId: string,
    ciphertext: string,
    iv: string,
    clientTempId?: string
  ) => {
    if (socket && isConnected) {
      socket.emit('send_message', { recipientId, ciphertext, iv, clientTempId });
      sound.playSent();
      triggerCyberPulse('purple');
    }
  };

  const sendTyping = (recipientId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { recipientId });
    }
  };

  const markMessagesRead = (senderId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_read', { senderId });
    }
  };

  const onNewMessage = (cb: (msg: MessageItem) => void) => {
    messageListenersRef.current.push(cb);
    return () => {
      messageListenersRef.current = messageListenersRef.current.filter((item) => item !== cb);
    };
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        typingUserIds,
        sendMessage,
        sendTyping,
        markMessagesRead,
        onNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
