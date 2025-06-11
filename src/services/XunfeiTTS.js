import CryptoJS from 'crypto-js'
import axios from 'axios'

// Instead of hardcoding, read config from environment variables or a global config object
const config = {
  appId: import.meta.env.VITE_XUNFEI_APP_ID || window.XUNFEI_APP_ID || '',
  ttsUrl: 'wss://tts-api.xfyun.cn/v2/tts',
}

// 生成鉴权签名
function getAuthString(method, path) {
  const date = new Date().toGMTString()
  const host = 'tts-api.xfyun.cn'
  const origin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`
  
  const signatureSha = CryptoJS.HmacSHA256(origin, config.apiSecret)
  const signature = CryptoJS.enc.Base64.stringify(signatureSha)
  
  const authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = btoa(authorizationOrigin)
  
  return `authorization=${authorization}&date=${date}&host=${host}`
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
      const proxyUrl = `/api/xunfei/tts-ws-url`; // Do NOT send client-generated authStr
      const response = await axios.get(proxyUrl);
      wsUrl = response.data.wsUrl;
      appId = response.data.appId; // Get the APP ID from the server response
    } else {
      // Construct WebSocket URL directly (for scenarios where proxy is not used/needed)
      // THIS PATH REMAINS A SECURITY RISK FOR API_SECRET if config.apiSecret is exposed client-side
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
            speed: params.speed || 50,
            volume: params.volume || 50,
            pitch: params.pitch || 50,
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