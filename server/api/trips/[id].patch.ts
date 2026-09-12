import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam, readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { trips } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["trips"],
    summary: "Update a trip",
    description:
      "Updates one of the authenticated user's own trips. All fields are optional. When changing `frequency` to `once`, `startDate` is required; to `weekly`, `weekDays` is required.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              vehicleId: { type: "string" },
              startTime: { type: "string", format: "date-time" },
              frequency: { type: "string", enum: ["once", "weekly"] },
              startDate: { type: "string", format: "date", nullable: true },
              weekDays: {
                type: "integer",
                minimum: 1,
                maximum: 127,
                nullable: true,
              },
              distance: { type: "integer", minimum: 1 },
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
      200: { description: "The updated trip" },
      400: { description: "Invalid request body or inconsistent frequency" },
      401: { description: "Not authenticated" },
      403: { description: "Not the owner of this trip" },
      404: { description: "Trip or vehicle not found" },
    },
  },
});

const updateTripSchema = z
  .object({
    vehicleId: z.string().min(1).optional(),
    startTime: z.iso.datetime().optional(),
    distance: z.number().int().positive().optional(),
    startPoint: z.object({ lat: z.number(), lng: z.number() }).optional(),
    destinationPoint: z.object({ lat: z.number(), lng: z.number() }).optional(),
    frequency: z.enum(["once", "weekly"]).optional(),
    startDate: z.iso.date().nullable().optional(),
    weekDays: z.number().int().min(1).max(127).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === "once" && data.startDate === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "startDate is required when frequency is once",
        path: ["startDate"],
      });
    }
    if (data.frequency === "weekly" && data.weekDays === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "weekDays is required when frequency is weekly",
        path: ["weekDays"],
      });
    }
  });

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const id = getRouterParam(event, "id");
  const body = await readValidatedBody(event, updateTripSchema);

  const trip = await db.query.trips.findFirst({
    where: { id },
  });
  if (!trip) {
    throw new HTTPError("Trip not found", { status: 404 });
  }
  if (trip.conductorId !== user.id) {
    throw new HTTPError("Forbidden", { status: 403 });
  }

  if (body.vehicleId && body.vehicleId !== trip.vehicleId) {
    const vehicle = await db.query.vehicles.findFirst({
      where: { id: body.vehicleId },
    });
    if (!vehicle) {
      throw new HTTPError("Vehicle not found", { status: 404 });
    }
    if (vehicle.ownerId !== user.id) {
      throw new HTTPError("Forbidden", { status: 403 });
    }
  }

  const finalFrequency = body.frequency ?? trip.frequency;
  const finalStartDate =
    body.startDate !== undefined
      ? body.startDate === null
        ? null
        : new Date(body.startDate)
      : trip.startDate;
  const finalWeekDays =
    body.weekDays !== undefined ? body.weekDays : trip.weekDays;

  if (finalFrequency === "once" && !finalStartDate) {
    throw new HTTPError("startDate is required when frequency is once", {
      status: 400,
    });
  }
  if (finalFrequency === "weekly" && !finalWeekDays) {
    throw new HTTPError("weekDays is required when frequency is weekly", {
      status: 400,
    });
  }

  const updated = (
    await db
      .update(trips)
      .set({
        ...(body.vehicleId !== undefined && { vehicleId: body.vehicleId }),
        ...(body.startTime !== undefined && {
          startTime: new Date(body.startTime),
        }),
        ...(body.distance !== undefined && { distance: body.distance }),
        ...(body.startPoint !== undefined && { startPoint: body.startPoint }),
        ...(body.destinationPoint !== undefined && {
          destinationPoint: body.destinationPoint,
        }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate === null ? null : new Date(body.startDate),
        }),
        ...(body.weekDays !== undefined && { weekDays: body.weekDays }),
      })
      .where(eq(trips.id, id as string))
      .returning()
  )[0];

  return { trip: updated };
});
