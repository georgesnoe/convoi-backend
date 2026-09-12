import { defineMiddleware, HTTPError } from "nitro";

/**
 * Route prefixes that require a conductor user (`type === "conductor"`).
 * Only creation (POST) requests are restricted here; reads and updates are
 * handled by the route handlers themselves (ownership checks).
 */
const CONDUCTOR_ONLY_PREFIXES = ["/api/vehicles", "/api/trips"];

/**
 * Conductor middleware: only users with `type === "conductor"` may create
 * vehicles and trips. Runs after the auth middleware (`01.auth.ts`), which
 * guarantees `event.context.user` is set for these routes.
 */
export default defineMiddleware((event) => {
  const isConductorOnly =
    event.req.method === "POST" &&
    CONDUCTOR_ONLY_PREFIXES.some((prefix) =>
      event.url.pathname.startsWith(prefix),
    );

  if (!isConductorOnly) return;

  const user = event.context.session?.user;
  if (!user || user.type !== "conductor") {
    throw new HTTPError("Forbidden", { status: 403 });
  }
});
