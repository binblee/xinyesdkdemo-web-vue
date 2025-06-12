import CryptoJS from 'crypto-js';

//
// The server-side handler that runs in Cloudflare Worker
//

// Vue Component → XunfeiTTS.js → Worker API → xunfei-tts.js → Xunfei API
//      ↓              ↓              ↓            ↓             ↓
// 1. User clicks   2. Calls       3. HTTP GET   4. Generate   5. WebSocket
//    "Synthesize"     textToSpeech()  request      auth string    connection
//      ↓              ↓              ↓            ↓             ↓
// 6. Receives      7. Creates      8. Returns    9. Server-side 10. Audio
//    audio data       WebSocket       wsUrl +      security       synthesis
//                     connection      appId

// Helper function to generate Xunfei Auth String
// - Secure server-side authentication generation
// - Uses API key and secret from environment variables
// - Creates HMAC-SHA256 signature for Xunfei API authentication
// - Returns properly formatted authorization string
function getAuthStringFromServer(method, path, apiKey, apiSecret) {
  const date = new Date().toGMTString();
  const host = 'tts-api.xfyun.cn';
  const origin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`;
  const signatureSha = CryptoJS.HmacSHA256(origin, apiSecret);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationOrigin); // btoa is available in Cloudflare Workers
  return `authorization=${authorization}&date=${date}&host=${host}`;
}

// Main handler for Xunfei TTS WebSocket URL requests
// - Handles GET requests to /api/xunfei/tts-ws-url
// - Validates presence of API credentials in environment variables
// - Generates auth string using getAuthStringFromServer
// - Constructs WebSocket URL for Xunfei TTS API
export async function handleXunfeiTtsRequest(request, env) {
  // Access your secrets stored in Cloudflare Worker environment variables
  const apiKey = env.VITE_XUNFEI_API_KEY;
  const apiSecret = env.VITE_XUNFEI_API_SECRET;
  const appId = env.VITE_XUNFEI_APP_ID;

  if (!apiKey || !apiSecret || !appId) {
    return new Response(JSON.stringify({ 
      error: 'API credentials not configured on server.',
      missing: {
        apiKey: !apiKey,
        apiSecret: !apiSecret,
        appId: !appId
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate authStr on the server-side
  const authStr = getAuthStringFromServer('GET', '/v2/tts', apiKey, apiSecret);
  const wsUrl = `wss://tts-api.xfyun.cn/v2/tts?${authStr}`;

  return new Response(JSON.stringify({ wsUrl, appId }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
