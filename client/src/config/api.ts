// In unified deployment (Render fullstack), VITE_API_URL is empty (''), so calls use relative paths (same-origin).
// In split deployment (Vercel frontend + Render backend), set VITE_API_URL to the backend URL (e.g., https://aegischat.onrender.com).
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
