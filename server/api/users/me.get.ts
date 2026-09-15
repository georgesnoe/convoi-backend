import { defineHandler, defineRouteMeta, HTTPError } from "nitro";

defineRouteMeta({
  openAPI: {
    tags: ["users"],
    summary: "Get current user",
    description:
      "Returns the profile of the authenticated user. Requires a valid session cookie.",
    responses: {
      200: { description: "The authenticated user's profile" },
      401: { description: "Not authenticated" },
    },
  },
});

export default defineHandler((event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }
  return { user };
});
