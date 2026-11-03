# AegisChat // Zero-Knowledge End-to-End Encrypted Real-Time Chat

A modern, production-grade, End-to-End Encrypted (E2EE) and Local-Encrypted Real-Time Chat Application built with **Node.js, Express, MongoDB, Socket.io, React (Vite), TypeScript, Tailwind CSS, Three.js, and the Web Crypto API**.

---

## ⚡ Quickstart (Zero-Setup, 2-Minute Launch)

### 1. Environment Setup
The `.env` file in the project root is already pre-configured for local development.

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/e2ee-chat
JWT_SECRET=e2ee_hyper_secret_jwt_key_9945ff_00f0ff_2026
CLIENT_URL=http://localhost:5173
```
> If using MongoDB Atlas, simply update `MONGODB_URI` with your connection string.

### 2. Run the Application
From the project root:

```bash
npm run dev
```

This concurrently starts:
- **Backend Server**: `http://localhost:5000` (Socket.io & REST API)
- **Frontend App**: `http://localhost:5173` (Vite Hot-Reloading React App)

---

## 🧪 Testing with 2 Tabs (Incognito & Normal)

1. Open **Tab 1** (`http://localhost:5173`):
   - Click **Create Identity**.
   - Register user: `alice` with passphrase `password123`.
2. Open **Tab 2** (Incognito window at `http://localhost:5173`):
   - Click **Create Identity**.
   - Register user: `bob` with passphrase `password123`.
3. Select each other from the contacts sidebar:
   - Notice the green online status indicator.
   - Start typing to see the real-time typing indicator.
   - Send messages back and forth in real-time.
   - Click **Verify Safety Key** to compare the 30-digit cryptographic fingerprints.
   - Watch the Three.js dynamic shockwave ripple across the 3D particle background whenever a message is encrypted and dispatched!

---

## 🔒 Cryptographic Architecture & Invariants

### 1. Zero-Knowledge Key Management
- The server **never** sees passwords, private keys, symmetric session keys, or plaintext messages.
- **PBKDF2 Derivation (100,000 iterations, SHA-256)**:
  - User passphrase + salt -> **Auth Token Key** (hashed with SHA-256 then bcrypt-hashed on server).
  - User passphrase + salt -> **Local Vault Key** (AES-GCM-256, kept only in browser RAM).
- **Asymmetric Key Exchange**:
  - Each user generates an **ECDH P-256 (`secp256r1`)** identity key pair via native Web Crypto API.
  - Public keys are published to MongoDB in standard JWK format.
  - Private keys are encrypted under the user's Local Vault Key and stored exclusively in browser IndexedDB (Dexie.js).
- **Direct Messaging (AES-GCM-256)**:
  - Client computes ECDH shared bits with recipient's public key.
  - Derives an AES-GCM-256 symmetric session key via **HKDF-SHA256**.
  - Plaintext is encrypted with a fresh 12-byte cryptographically random IV per message.
  - Only ciphertext and IV are transmitted across Socket.io and stored in MongoDB.
- **Safety Numbers**:
  - SHA-256 fingerprint of sorted public keys formatted into 6 blocks of 5 digits for MITM verification.

---

## 🎨 Design System & Three.js 3D Visuals
- **Interactive Three.js 3D Constellation**: Living particle network responsive to mouse parallax and real-time shockwave pulses.
- **3D HoloShield**: Interactive draggable wireframe icosahedron and orbital rings.
- **Vengeance UI Aesthetic**: Obsidian dark theme (`#050508`), glassmorphic panels, displacement spotlight cards, and spring-magnified floating dock.
