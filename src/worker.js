import { handleXunfeiTtsRequest } from './worker-handlers/xunfei-tts';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/xunfei/tts-ws-url' && request.method === 'GET') {
      return handleXunfeiTtsRequest(request, env);
    }

    // Check if env.ASSETS is available before attempting to use it
    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        // Log the error and return a generic error response
        console.error(`Error fetching from env.ASSETS: ${e}`);
        return new Response('Error serving static asset.', { status: 500 });
      }
    } else {
      // Log an error or return a specific response if ASSETS binding is missing
      console.error("env.ASSETS binding is undefined. Check [site] configuration in wrangler.toml and deployment process.");
      return new Response("Static asset serving is not configured correctly. env.ASSETS is undefined.", { status: 500 });
    }
  },
};
