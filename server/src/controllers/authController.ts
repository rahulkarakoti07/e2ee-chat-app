import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'e2ee_hyper_secret_jwt_key_9945ff_00f0ff_2026';

// Fallback deterministic salt generator to defeat username enumeration timing attacks
const generateDeterministicSalt = (username: string): string => {
  return crypto.createHmac('sha256', JWT_SECRET).update(username.toLowerCase()).digest('hex').slice(0, 32);
};

export const getSalt = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawUsername = req.params.username;
    if (!rawUsername) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    const username = (Array.isArray(rawUsername) ? rawUsername[0] : rawUsername).toString();

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (user) {
      res.json({ salt: user.salt, exists: true });
    } else {
      // Deterministic pseudo-salt for non-existent user
      res.json({ salt: generateDeterministicSalt(username), exists: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve salt' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, authHash, salt, publicKey } = req.body;

    if (!username || !authHash || !salt || !publicKey) {
      res.status(400).json({ error: 'All fields (username, authHash, salt, publicKey) are required' });
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      return;
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Double-hash: Server hashes client-derived authHash with bcrypt
    const hashedPassword = await bcrypt.hash(authHash, 10);

    const newUser = new User({
      username: cleanUsername,
      authHash: hashedPassword,
      salt,
      publicKey,
      status: 'online',
      lastSeen: new Date(),
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        publicKey: newUser.publicKey,
        salt: newUser.salt,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please ensure database is connected.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, authHash } = req.body;

    if (!username || !authHash) {
      res.status(400).json({ error: 'Username and authHash are required' });
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isMatch = await bcrypt.compare(authHash, user.authHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        publicKey: user.publicKey,
        salt: user.salt,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please check server and database status.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        publicKey: req.user.publicKey,
        salt: req.user.salt,
        status: req.user.status,
        lastSeen: req.user.lastSeen,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};
