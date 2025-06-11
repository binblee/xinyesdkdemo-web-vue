import CryptoJS from 'crypto-js';

// Helper function to generate Xunfei Auth String
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

export async function handleXunfeiTtsRequest(request, env) {
  // Access your secrets stored in Cloudflare Worker environment variables
  const apiKey = env.VITE_XUNFEI_API_KEY;
  const apiSecret = env.VITE_XUNFEI_API_SECRET;

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
