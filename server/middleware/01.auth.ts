import { defineMiddleware, HTTPError } from "nitro";
import { getSession } from "~/server/utils/auth";
import type { sessions, users } from "~/server/utils/db/schema";

declare module "h3" {
  interface H3EventContext {
    session?: typeof sessions.$inferSelect & {
      user: typeof users.$inferSelect | null;
    };
  }
}

/**
 * Auth middleware: resolves the session from the auth cookie and enforces
 * authentication on protected routes.
 *
 * For protected routes, the session is validated (and expired sessions are
 * cleaned up) via `getSession`. If there is no valid session, a 401 is thrown.
 * Otherwise the resolved session and user are attached to `event.context` so
 * route handlers can access them.
 */

export default defineMiddleware(async (event) => {
  if (/^\/api\/(oauth|auth)\//.test(event.url.pathname)) return;

  const session = await getSession(event);
  if (!session) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  event.context.session = session;
});
