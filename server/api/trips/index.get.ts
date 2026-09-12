import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { db } from "~/server/utils/db/config";

defineRouteMeta({
  openAPI: {
    tags: ["trips"],
    summary: "List trips",
    description:
      "Returns all trips with their conductor and vehicle. Available to any authenticated user.",
    responses: {
      200: { description: "The list of trips" },
      401: { description: "Not authenticated" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const trips = await db.query.trips.findMany({
    with: {
      conductor: true,
      vehicle: true,
    },
    orderBy: (trip, { asc }) => [asc(trip.startTime)],
  });

  return { trips };
});
