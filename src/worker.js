import { handleXunfeiTtsRequest } from './worker-handlers/xunfei-tts';

export default {
  async fetch(request, env, ctx) {
    console.log("Worker received request. Available env keys:", Object.keys(env).join(', '));

    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname === '/api/xunfei/tts-ws-url' && request.method === 'GET') {
      return handleXunfeiTtsRequest(request, env);
    }

    // Use the correct binding for static assets, which appears to be __STATIC_CONTENT
    if (env.__STATIC_CONTENT) {
      console.log("Type of env.__STATIC_CONTENT:", typeof env.__STATIC_CONTENT);
      if (typeof env.__STATIC_CONTENT === 'object' && env.__STATIC_CONTENT !== null) {
        console.log("Keys of env.__STATIC_CONTENT:", Object.keys(env.__STATIC_CONTENT).join(', '));
      }
      try {
        // Assuming it should have a fetch method, though the error suggests otherwise.
        // This line will likely error again, but the logs above will be helpful.
        return await env.__STATIC_CONTENT.fetch(request);
      } catch (e) {
        // Log the error and return a generic error response
        console.error(`Error interacting with env.__STATIC_CONTENT: ${e}`);
        if (e instanceof TypeError && e.message.includes("is not a function")) {
            return new Response(`Static asset serving misconfigured: env.__STATIC_CONTENT does not have a fetch method. Type: ${typeof env.__STATIC_CONTENT}`, { status: 500 });
        }
        return new Response('Error serving static asset.', { status: 500 });
      }
    } else {
      // This block should ideally not be reached if __STATIC_CONTENT is the correct binding
      console.error("env.__STATIC_CONTENT binding is undefined. This is unexpected.");
      return new Response("Static asset serving is not configured correctly. env.__STATIC_CONTENT is undefined.", { status: 500 });
    }
  },
};
