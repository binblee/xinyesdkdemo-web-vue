// Simple Node.js backend proxy for Xunfei TTS API
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildXunfeiTtsUrl } from './src/services/XunfeiTTS.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Proxy for TTS WebSocket signature (optional, for frontend to get wsUrl)
app.get('/api/xunfei/tts-ws-url', (req, res) => {
  // Generate authStr on the server-side using environment variables
  const apiKey = process.env.VITE_XUNFEI_API_KEY;
  const apiSecret = process.env.VITE_XUNFEI_API_SECRET;
  const appId = process.env.VITE_XUNFEI_APP_ID;

  if (!apiKey || !apiSecret || !appId) {
    console.error('Missing API credentials in .env for local proxy');
    return res.status(500).json({ 
      error: 'API credentials not configured on server.',
      missing: {
        apiKey: !apiKey,
        apiSecret: !apiSecret,
        appId: !appId
      }
    });
  }

  // Generate WebSocket URL with authentication using shared helper
  const wsUrl = buildXunfeiTtsUrl(apiKey, apiSecret);
  res.json({ wsUrl, appId });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Xunfei proxy running on port ${PORT}`));
