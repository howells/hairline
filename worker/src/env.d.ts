// The bindings wrangler.jsonc gives the Worker.
declare global {
  namespace Cloudflare {
    interface Env {
      AI: Ai;
    }
  }
}
export {};
