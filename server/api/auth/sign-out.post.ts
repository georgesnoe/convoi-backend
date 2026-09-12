import { defineHandler, defineRouteMeta } from "nitro";
import { deleteSession } from "~/server/utils/auth";

defineRouteMeta({
  openAPI: {
    tags: ["auth"],
    summary: "Sign out",
    description:
      "Sign out the current user by deleting the session and clearing the auth session cookie.",
    responses: {
      200: { description: "Signed out" },
    },
  },
});

export default defineHandler(async (event) => {
  await deleteSession(event);
  return { success: true };
});
