export interface UserProfile {
  _id: string;
  username: string;
  publicKey: JsonWebKey;
  salt: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface SaltResponse {
  salt: string;
  exists: boolean;
}
