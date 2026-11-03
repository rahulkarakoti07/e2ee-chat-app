import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Message } from '../models/Message';

const JWT_SECRET = process.env.JWT_SECRET || 'e2ee_hyper_secret_jwt_key_9945ff_00f0ff_2026';

// Tracks online user sockets: userId -> Set of socket.id
const onlineUsers = new Map<string, Set<string>>();

export const setupChatSocket = (io: Server): void => {
  // Socket.io JWT Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
      socket.data.user = decoded;
      next();
    } catch (err: any) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    if (!user || !user.id) {
      socket.disconnect();
      return;
    }

    const userId = user.id.toString();
    socket.join(userId);

    // Track active connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Update database & broadcast status if first active connection
    if (onlineUsers.get(userId)!.size === 1) {
      try {
        await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
        socket.broadcast.emit('user_status_change', {
          userId,
          status: 'online',
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Failed to update online status:', err);
      }
    }

    // Send currently online user IDs to the connected client
    const currentOnlineIds = Array.from(onlineUsers.keys());
    socket.emit('online_users_list', currentOnlineIds);

    // Handle incoming E2EE message
    socket.on('send_message', async (data: { recipientId: string; ciphertext: string; iv: string; clientTempId?: string }) => {
      try {
        const { recipientId, ciphertext, iv, clientTempId } = data;

        if (!recipientId || !ciphertext || !iv) {
          socket.emit('error_message', { message: 'Missing required message parameters' });
          return;
        }

        const isRecipientOnline = onlineUsers.has(recipientId) && onlineUsers.get(recipientId)!.size > 0;

        const newMsg = new Message({
          sender: userId,
          recipient: recipientId,
          ciphertext,
          iv,
          timestamp: new Date(),
          delivered: isRecipientOnline,
          read: false,
        });

        await newMsg.save();

        const messagePayload = {
          _id: newMsg._id.toString(),
          sender: userId,
          recipient: recipientId,
          ciphertext,
          iv,
          timestamp: newMsg.timestamp,
          delivered: newMsg.delivered,
          read: newMsg.read,
          clientTempId,
        };

        // Emit to recipient's room
        io.to(recipientId).emit('receive_message', messagePayload);

        // Acknowledge back to sender
        socket.emit('message_sent_confirm', messagePayload);
      } catch (err: any) {
        console.error('Error handling send_message:', err);
        socket.emit('error_message', { message: 'Failed to process message' });
      }
    });

    // Handle typing signals
    socket.on('typing_start', (data: { recipientId: string }) => {
      if (data?.recipientId) {
        io.to(data.recipientId).emit('user_typing', { userId });
      }
    });

    socket.on('typing_stop', (data: { recipientId: string }) => {
      if (data?.recipientId) {
        io.to(data.recipientId).emit('user_stop_typing', { userId });
      }
    });

    // Handle mark read
    socket.on('mark_read', async (data: { senderId: string }) => {
      try {
        if (!data?.senderId) return;

        await Message.updateMany(
          { sender: data.senderId, recipient: userId, read: false },
          { $set: { read: true } }
        );

        io.to(data.senderId).emit('messages_read_receipt', { readBy: userId });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          try {
            await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen });
            io.emit('user_status_change', {
              userId,
              status: 'offline',
              lastSeen,
            });
          } catch (err) {
            console.error('Failed to update offline status:', err);
          }
        }
      }
    });
  });
};
