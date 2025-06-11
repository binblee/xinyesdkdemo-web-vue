// Simple Node.js backend proxy for Xunfei TTS API
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

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
  const { authStr } = req.query;
  if (!authStr) return res.status(400).json({ error: 'Missing authStr' });
  const wsUrl = `wss://tts-api.xfyun.cn/v2/tts?${authStr}`;
  res.json({ wsUrl });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Xunfei proxy running on port ${PORT}`));
