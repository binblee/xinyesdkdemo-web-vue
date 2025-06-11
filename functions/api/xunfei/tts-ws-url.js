// filepath: functions/api/xunfei/tts-ws-url.js
import CryptoJS from 'crypto-js';

// Helper function to generate Xunfei Auth String
// This should be identical to the one in your src/services/XunfeiTTS.js,
// but here it uses apiKey and apiSecret passed as arguments.
function getAuthStringFromServer(method, path, apiKey, apiSecret) {
  const date = new Date().toGMTString();
  const host = 'tts-api.xfyun.cn'; // Or the relevant host for the API endpoint
  const origin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`;
  const signatureSha = CryptoJS.HmacSHA256(origin, apiSecret);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationOrigin); // btoa is available in Cloudflare Workers/Functions
  return `authorization=${authorization}&date=${date}&host=${host}`;
}

export async function onRequestGet(context) {
  // Access your secrets stored in Cloudflare Pages environment variables
  // Ensure these names (VITE_XUNFEI_API_KEY, VITE_XUNFEI_API_SECRET) 
  // match what you set in your Cloudflare Pages project settings.
  const apiKey = context.env.VITE_XUNFEI_API_KEY;
  const apiSecret = context.env.VITE_XUNFEI_API_SECRET;
  // const appId = context.env.VITE_XUNFEI_APP_ID; // AppId is used in the WebSocket frame by the client, not directly in this auth string

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: 'API credentials not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate authStr on the server-side
  const authStr = getAuthStringFromServer('GET', '/v2/tts', apiKey, apiSecret);
  const wsUrl = `wss://tts-api.xfyun.cn/v2/tts?${authStr}`;

  return new Response(JSON.stringify({ wsUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
