import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { db } from "~/server/utils/db/config";

defineRouteMeta({
  openAPI: {
    tags: ["vehicles"],
    summary: "List own vehicles",
    description: "Returns all vehicles registered by the authenticated user.",
    responses: {
      200: { description: "The list of the user's vehicles" },
      401: { description: "Not authenticated" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const vehicles = await db.query.vehicles.findMany({
    where: { ownerId: user.id },
    orderBy: (vehicle, { desc }) => [desc(vehicle.createdAt)],
  });

  return { vehicles };
});
