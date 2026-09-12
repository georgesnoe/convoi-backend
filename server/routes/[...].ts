import { defineHandler, HTTPError } from "nitro";

/**
 * Global fallback handler: catches any request that does not match a
 * registered route and returns a 404 JSON response.
 */
export default defineHandler((event) => {
  throw new HTTPError(`Route not found: ${event.url.pathname}`, {
    status: 404,
  });
});
