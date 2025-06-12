import { buildXunfeiTtsUrl } from '../services/XunfeiTTS.js';

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

// Main handler for Xunfei TTS WebSocket URL requests
// - Handles GET requests to /api/xunfei/tts-ws-url
// - Validates presence of API credentials in environment variables
// - Generates auth string using shared generateXunfeiAuth function
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

  // Generate WebSocket URL with authentication using shared helper
  const wsUrl = buildXunfeiTtsUrl(apiKey, apiSecret);

  return new Response(JSON.stringify({ wsUrl, appId }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
