import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e2ee-chat';

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`\x1b[32m✔ MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}\x1b[0m`);
  } catch (err: any) {
    console.error(`\x1b[33m⚠ MongoDB Connection Notice: Could not connect to ${mongoUri}\x1b[0m`);
    console.error(`\x1b[33m  Reason: ${err.message}\x1b[0m`);
    console.log(`\x1b[36mℹ TIP: Ensure local MongoDB is running ('mongod') or set MONGODB_URI in your .env file with MongoDB Atlas URI.\x1b[0m`);
    
    // Auto-retry connection every 8 seconds in the background without crashing the server
    setTimeout(() => {
      console.log(`\x1b[34mℹ Attempting MongoDB reconnection...\x1b[0m`);
      connectDB().catch(() => {});
    }, 8000);
  }
};
