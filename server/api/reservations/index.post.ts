import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { db } from "~/server/utils/db/config";
import { reservations } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["reservations"],
    summary: "Create a reservation",
    description:
      "Creates a reservation for a trip on behalf of the authenticated user. The trip details (start time, frequency, points, distance) are snapshotted into the reservation. `confirmed` defaults to false and `amount` to 0.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["tripId"],
            properties: {
              tripId: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The created reservation" },
      400: { description: "Invalid request body" },
      401: { description: "Not authenticated" },
      404: { description: "Trip not found" },
    },
  },
});

const createReservationSchema = z.object({
  tripId: z.string().min(1),
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const body = await readValidatedBody(event, createReservationSchema);

  const trip = await db.query.trips.findFirst({
    where: { id: body.tripId },
  });
  if (!trip) {
    throw new HTTPError({ message: "Trip not found", status: 404 });
  }

  const reservation = (
    await db
      .insert(reservations)
      .values({
        userId: user.id,
        tripId: trip.id,
        startTime: trip.startTime,
        frequency: trip.frequency,
        startDate: trip.startDate,
        weekDays: trip.weekDays,
        distance: trip.distance,
        startPoint: trip.startPoint,
        destinationPoint: trip.destinationPoint,
        confirmed: false,
        amount: 0,
      })
      .returning()
  )[0];

  return { reservation };
});
