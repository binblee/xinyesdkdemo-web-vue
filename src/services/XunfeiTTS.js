import CryptoJS from 'crypto-js'
import axios from 'axios'

// Xunfei TTS API constants
export const XUNFEI_TTS_HOST = 'tts-api.xfyun.cn';
export const XUNFEI_TTS_PATH = '/v2/tts';
export const XUNFEI_TTS_WS_URL = `wss://${XUNFEI_TTS_HOST}${XUNFEI_TTS_PATH}`;
export const XUNFEI_TTS_API_ENDPOINT = '/api/xunfei/tts-ws-url';

// Shared authentication function for Xunfei TTS API
// Works in Node.js, Browser, and Cloudflare Workers environments
export function generateXunfeiAuth(apiKey, apiSecret, method = 'GET', path = XUNFEI_TTS_PATH) {
  const date = new Date().toGMTString();
  const host = XUNFEI_TTS_HOST;
  const origin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`;
  
  const signatureSha = CryptoJS.HmacSHA256(origin, apiSecret);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  
  // Universal base64 encoding (works in Node.js, Browser, and Workers)
  const authorization = typeof Buffer !== 'undefined' 
    ? Buffer.from(authorizationOrigin).toString('base64')  // Node.js
    : btoa(authorizationOrigin);                           // Browser/Workers
  
  return `authorization=${authorization}&date=${date}&host=${host}`;
}

// Helper function to build complete WebSocket URL with authentication
export function buildXunfeiTtsUrl(apiKey, apiSecret) {
  const authStr = generateXunfeiAuth(apiKey, apiSecret);
  return `${XUNFEI_TTS_WS_URL}?${authStr}`;
}

// Instead of hardcoding, read config from environment variables or a global config object
// Use a function to avoid import.meta.env access issues in Node.js environments
function getConfig() {
  // Check if we're in a Vite environment (browser/build) vs Node.js
  const isViteEnvironment = typeof import.meta !== 'undefined' && import.meta.env;
  
  return {
    appId: isViteEnvironment 
      ? (import.meta.env.VITE_XUNFEI_APP_ID || window.XUNFEI_APP_ID || '') 
      : (process.env.VITE_XUNFEI_APP_ID || ''),
    apiKey: isViteEnvironment 
      ? (import.meta.env.VITE_XUNFEI_API_KEY || window.XUNFEI_API_KEY || '') 
      : (process.env.VITE_XUNFEI_API_KEY || ''),
    apiSecret: isViteEnvironment 
      ? (import.meta.env.VITE_XUNFEI_API_SECRET || window.XUNFEI_API_SECRET || '') 
      : (process.env.VITE_XUNFEI_API_SECRET || ''),
    ttsUrl: XUNFEI_TTS_WS_URL,
  };
}

// 生成鉴权签名，直联方式使用 (DEPRECATED - INSECURE)
// 该函数在客户端生成鉴权字符串，会暴露 apiSecret，
// 仅在不使用代理的情况下使用，建议在服务端生成 authStr
function getAuthString(method, path) {
  // Use the shared authentication function with new parameter order
  const config = getConfig();
  return generateXunfeiAuth(config.apiKey, config.apiSecret, method, path);
}

// 获取发音人列表
export function getVoiceList() {
  // Return a predefined list of voices
  // This structure matches what the component expects: { value: string, label: string }
  return [
    { value: 'xiaoyan', label: '讯飞小燕 (女) - 中文' },
    { value: 'xiaoyu', label: '讯飞小宇 (男) - 中文' },
    { value: 'vixy', label: '讯飞小妍 (女) - 中文' },
    { value: 'vixq', label: '讯飞许久 (男) - 中文' },
    { value: 'vixf', label: '讯飞小芳 (女) - 中文' },
    { value: 'catherine', label: 'Catherine (女) - 英文' },
  ];
}

// 文本转语音
export async function textToSpeech(text, params = {}, useProxy = true) {
  try {
    let wsUrl;
    let appId;

    if (useProxy) {
      // Fetch the WebSocket URL from the backend proxy.
      // The proxy (local or Cloudflare Function) is responsible for generating authStr.
      const proxyUrl = XUNFEI_TTS_API_ENDPOINT; // Use shared constant
      const response = await axios.get(proxyUrl);
      wsUrl = response.data.wsUrl;
      appId = response.data.appId; // Get the APP ID from the server response
    } else {
      // Construct WebSocket URL directly (for scenarios where proxy is not used/needed)
      // THIS PATH REMAINS A SECURITY RISK FOR API_SECRET if config.apiSecret is exposed client-side
      const config = getConfig();
      const authStr = getAuthString('GET', '/v2/tts'); // Client generates authStr
      wsUrl = `${config.ttsUrl}?${authStr}`;
      appId = config.appId; // Use the client-side config
    }

    if (!wsUrl) {
      throw new Error('Failed to get WebSocket URL');
    }

    if (!appId) {
      throw new Error('APP ID is required but not provided by server');
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let audioChunks = []; // To accumulate audio chunks

      ws.onopen = () => {
        const frame = {
          common: { app_id: appId }, // Use the APP ID from server response
          business: {
            aue: 'lame', // audio encoding
            sfl: 1,      // stream flag
            vcn: params.voiceName || 'xiaoyan', // voice name
            speed: parseInt(params.speed) || 50,    // Ensure integer type
            volume: parseInt(params.volume) || 50,  // Ensure integer type
            pitch: parseInt(params.pitch) || 50,    // Ensure integer type
            bgs: 0, // background sound
            tte: 'UTF8'  // text encoding
          },
          data: {
            text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)),
            status: 2 // 2: indicates this is the final (and only) frame of text data
          }
        };
        ws.send(JSON.stringify(frame));
      };

      ws.onmessage = (e) => {
        const res = JSON.parse(e.data);
        if (res.code !== 0) {
          console.error('TTS WebSocket message error:', res);
          reject(new Error(res.message || `TTS Error Code: ${res.code}`));
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
          return;
        }

        if (res.data && res.data.audio) {
          audioChunks.push(res.data.audio);
        }

        // Check for final audio frame from server
        if (res.data && res.data.status === 2) {
          const fullAudioBase64 = audioChunks.join('');
          const audioSrc = `data:audio/mp3;base64,${fullAudioBase64}`;
          resolve(audioSrc);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      };

      ws.onerror = (e) => {
        console.error('TTS WebSocket error:', e);
        reject(e);
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
      };

      ws.onclose = (e) => {
        console.log('TTS WebSocket closed:', e.code, e.reason);
        // If the promise is still pending at this point, it means it wasn't resolved by a final audio frame
        // nor rejected by an error. This could happen if the connection closes prematurely.
        // You might want to add logic here to reject if audioChunks is empty and no error occurred.
        // For now, relying on explicit resolve/reject in onmessage/onerror.
      };
    });
  } catch (error) {
    console.error('Failed to initiate textToSpeech:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}