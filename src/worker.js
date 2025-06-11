import { handleXunfeiTtsRequest } from './worker-handlers/xunfei-tts';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/xunfei/tts-ws-url' && request.method === 'GET') {
      return handleXunfeiTtsRequest(request, env);
    }

    // If no API routes matched, pass the request to the static asset handler.
    // This assumes `env.ASSETS.fetch` is the way to invoke it when [site] is configured.
    return env.ASSETS.fetch(request);
  },
};
