import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { db } from "~/server/utils/db/config";

defineRouteMeta({
  openAPI: {
    tags: ["vehicles"],
    summary: "List vehicles",
    description:
      "Returns all vehicles. Regular users get their own vehicles; admins get all vehicles.",
    responses: {
      200: { description: "The list of vehicles" },
      401: { description: "Not authenticated" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const vehicles =
    user.role === "admin"
      ? await db.query.vehicles.findMany({
          orderBy: (vehicle, { desc }) => [desc(vehicle.createdAt)],
        })
      : await db.query.vehicles.findMany({
          where: { ownerId: user.id },
          orderBy: (vehicle, { desc }) => [desc(vehicle.createdAt)],
        });

  return { vehicles };
});
