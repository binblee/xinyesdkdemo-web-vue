import { handleXunfeiTtsRequest } from './worker-handlers/xunfei-tts';
import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    console.log("Worker received request. URL:", request.url, "Available env keys:", Object.keys(env).join(', '));

    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/xunfei/tts-ws-url' && request.method === 'GET') {
      return handleXunfeiTtsRequest(request, env);
    }

    // Handle static assets
    try {
      // Add a custom mapRequestToAsset function to default to index.html for SPA routing
      const customMapRequestToAsset = (request) => {
        const defaultAsset = mapRequestToAsset(request);
        const url = new URL(defaultAsset.url);
        // If the path has no extension, or is the root, serve index.html
        if (!url.pathname.split('/').pop().includes('.') || url.pathname === '/') {
          return new Request(`${url.origin}/index.html`, request);
        }
        return defaultAsset;
      };
      
      const options = {
        mapRequestToAsset: customMapRequestToAsset, // Use the custom mapper
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST), // Ensure this is passed as a string from wrangler/env
      };

      const asset = await getAssetFromKV(
        {
          request,
          waitUntil: (promise) => ctx.waitUntil(promise),
        },
        options
      );
      return asset;
    } catch (e) {
      // If getAssetFromKV throws an error, it means the asset was not found.
      // For SPA, try to serve index.html for paths not found.
      console.error(`Error getting asset from KV: ${e.message}`);
      if (e.constructor.name === 'NotFoundError' || e.constructor.name === 'MethodNotAllowedError') {
        try {
          const spaFallbackRequest = new Request(`${new URL(request.url).origin}/index.html`, request);
          const options = {
            mapRequestToAsset: (req) => mapRequestToAsset(req), // Use default for direct index.html fetch
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
          };
          const spaAsset = await getAssetFromKV(
            {
              request: spaFallbackRequest,
              waitUntil: (promise) => ctx.waitUntil(promise),
            },
            options
          );
          return new Response(spaAsset.body, { ...spaAsset, status: 200 }); // Ensure 200 status for SPA fallback
        } catch (spaError) {
          console.error(`Error serving SPA fallback (index.html): ${spaError.message}`);
          return new Response('Asset not found and SPA fallback failed.', { status: 404 });
        }
      }
      return new Response('An unexpected error occurred while serving static assets.', { status: 500 });
    }
  },
};
