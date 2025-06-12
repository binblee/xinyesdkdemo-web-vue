import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import { buildXunfeiTtsUrl, XUNFEI_TTS_API_ENDPOINT } from './services/XunfeiTTS.js';

// Main handler for Xunfei TTS WebSocket URL requests
// - Handles GET requests to /api/xunfei/tts-ws-url
// - Validates presence of API credentials in environment variables
// - Generates auth string using shared buildXunfeiTtsUrl function
// - Constructs WebSocket URL for Xunfei TTS API
async function handleXunfeiTtsRequest(request, env) {
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === XUNFEI_TTS_API_ENDPOINT && request.method === 'GET') {
      return handleXunfeiTtsRequest(request, env);
    }

    // Handle static assets
    try {
      const options = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: manifestJSON,
      };

      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );
    } catch (e) {
      // If getAssetFromKV throws an error, it means the asset was not found.
      // For SPA, try to serve index.html for paths not found.
      console.error(`Error getting asset from KV: ${e.message}`);
      
      // Try to serve index.html for SPA fallback
      try {
        const url = new URL(request.url);
        const indexRequest = new Request(`${url.origin}/index.html`, {
          method: request.method,
          headers: request.headers,
        });
        
        const options = {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: manifestJSON,
        };
        
        return await getAssetFromKV(
          {
            request: indexRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          options
        );
      } catch (spaError) {
        console.error(`Error serving SPA fallback (index.html): ${spaError.message}`);
        return new Response('Page not found', { status: 404 });
      }
    }
  },
};
