import { handleXunfeiTtsRequest } from './worker-handlers/xunfei-tts';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/xunfei/tts-ws-url' && request.method === 'GET') {
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
