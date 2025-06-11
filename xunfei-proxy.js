// Simple Node.js backend proxy for Xunfei TTS API
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Proxy for voice list
app.get('/api/xunfei/voice', async (req, res) => {
  const { authStr } = req.query;
  if (!authStr) return res.status(400).json({ error: 'Missing authStr' });
  try {
    const url = `https://tts-api.xfyun.cn/v2/voice?${authStr}`;
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (e) {
    // It's good practice to log the error on the server
    console.error('Error proxying /api/xunfei/voice:', e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});

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

  // Re-implement or import getAuthString logic here for the local proxy
  // For simplicity, copying the core logic. In a larger app, share it.
  const date = new Date().toGMTString();
  const host = 'tts-api.xfyun.cn';
  const origin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
  const signatureSha = CryptoJS.HmacSHA256(origin, apiSecret);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64'); // Node.js Buffer for btoa equivalent
  
  const authStr = `authorization=${authorization}&date=${date}&host=${host}`;
  const wsUrl = `wss://tts-api.xfyun.cn/v2/tts?${authStr}`;
  res.json({ wsUrl, appId });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Xunfei proxy running on port ${PORT}`));
