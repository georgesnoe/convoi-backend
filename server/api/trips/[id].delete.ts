import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam } from "nitro/h3";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { trips } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["trips"],
    summary: "Delete a trip",
    description:
      "Deletes one of the authenticated user's own trips. Only the conductor who created the trip can delete it.",
    responses: {
      200: { description: "Trip deleted" },
      401: { description: "Not authenticated" },
      403: { description: "Not the conductor of this trip" },
      404: { description: "Trip not found" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const id = getRouterParam(event, "id");

  const trip = await db.query.trips.findFirst({
    where: { id },
  });
  if (!trip) {
    throw new HTTPError({ message: "Trip not found", status: 404 });
  }
  if (trip.conductorId !== user.id) {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  await db.delete(trips).where(eq(trips.id, id as string));

  return { success: true };
});
