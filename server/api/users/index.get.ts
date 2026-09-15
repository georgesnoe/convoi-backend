import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { db } from "~/server/utils/db/config";

defineRouteMeta({
  openAPI: {
    tags: ["users"],
    summary: "List all users",
    description: "Returns all users. Admin only.",
    responses: {
      200: { description: "The list of users" },
      401: { description: "Not authenticated" },
      403: { description: "Not an admin" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }
  if (user.role !== "admin") {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  const users = await db.query.users.findMany({
    orderBy: (user, { asc }) => [asc(user.createdAt)],
  });

  return { users };
});
