import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { db } from "~/server/utils/db/config";
import { trips } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["trips"],
    summary: "Create a trip",
    description:
      "Creates a trip for the authenticated conductor using one of their own vehicles. If `frequency` is `once`, `startDate` is required. If `frequency` is `weekly`, `weekDays` is required (bitmask, Monday = bit 6, e.g. 1001101 = Mon/Thu/Fri/Sun).",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "vehicleId",
              "startTime",
              "frequency",
              "distance",
              "startPoint",
              "destinationPoint",
            ],
            properties: {
              vehicleId: { type: "string" },
              startTime: { type: "string", format: "date-time" },
              frequency: { type: "string", enum: ["once", "weekly"] },
              startDate: { type: "string", format: "date" },
              weekDays: {
                type: "integer",
                minimum: 1,
                maximum: 127,
                description:
                  "Bitmask of week days (Monday = 64, Tuesday = 32, Wednesday = 16, Thursday = 8, Friday = 4, Saturday = 2, Sunday = 1).",
              },
              distance: {
                type: "integer",
                minimum: 1,
                description: "Distance in meters.",
              },
              startPoint: {
                type: "object",
                properties: {
                  lat: { type: "number" },
                  lng: { type: "number" },
                },
                required: ["lat", "lng"],
              },
              destinationPoint: {
                type: "object",
                properties: {
                  lat: { type: "number" },
                  lng: { type: "number" },
                },
                required: ["lat", "lng"],
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The created trip" },
      400: { description: "Invalid request body" },
      401: { description: "Not authenticated" },
      403: { description: "Not a conductor or vehicle not owned" },
      404: { description: "Vehicle not found" },
    },
  },
});

const tripBaseSchema = z.object({
  vehicleId: z.string().min(1),
  startTime: z.iso.datetime(),
  distance: z.number().int().positive(),
  startPoint: z.object({ lat: z.number(), lng: z.number() }),
  destinationPoint: z.object({ lat: z.number(), lng: z.number() }),
});

const onceTripSchema = tripBaseSchema.extend({
  frequency: z.literal("once"),
  startDate: z.iso.date(),
  weekDays: z.undefined(),
});

const weeklyTripSchema = tripBaseSchema.extend({
  frequency: z.literal("weekly"),
  startDate: z.undefined(),
  weekDays: z.number().int().min(1).max(127),
});

const createTripSchema = z.discriminatedUnion("frequency", [
  onceTripSchema,
  weeklyTripSchema,
]);

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const body = await readValidatedBody(event, createTripSchema);

  const vehicle = await db.query.vehicles.findFirst({
    where: { id: body.vehicleId },
  });
  if (!vehicle) {
    throw new HTTPError("Vehicle not found", { status: 404 });
  }
  if (vehicle.ownerId !== user.id) {
    throw new HTTPError("Vehicle does not belong to you", { status: 403 });
  }

  const trip = (
    await db
      .insert(trips)
      .values({
        conductorId: user.id,
        vehicleId: body.vehicleId,
        startTime: new Date(body.startTime),
        frequency: body.frequency,
        startDate: body.frequency === "once" ? new Date(body.startDate) : null,
        weekDays: body.frequency === "weekly" ? body.weekDays : null,
        distance: body.distance,
        startPoint: body.startPoint,
        destinationPoint: body.destinationPoint,
      })
      .returning()
  )[0];

  return { trip };
});
