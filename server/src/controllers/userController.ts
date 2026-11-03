import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Message } from '../models/Message';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('_id username publicKey status lastSeen updatedAt')
      .sort({ status: -1, lastSeen: -1 });

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
};

export const getUserPublicKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('username publicKey status lastSeen');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      userId: user._id,
      username: user.username,
      publicKey: user.publicKey,
      status: user.status,
      lastSeen: user.lastSeen,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve public key' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    const { contactId } = req.params;

    if (!currentUserId || !contactId) {
      res.status(400).json({ error: 'User IDs are required' });
      return;
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: contactId },
        { sender: contactId, recipient: currentUserId },
      ],
    })
      .sort({ timestamp: 1 })
      .limit(200);

    // Mark messages sent to current user as read
    await Message.updateMany(
      { sender: contactId, recipient: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
};
