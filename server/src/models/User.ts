import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  authHash: string;
  salt: string;
  publicKey: {
    kty: string;
    crv: string;
    x: string;
    y: string;
    ext?: boolean;
    key_ops?: string[];
  };
  status: 'online' | 'offline';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    authHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    publicKey: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
