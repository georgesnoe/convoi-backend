import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam, readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { vehicles } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["vehicles"],
    summary: "Update a vehicle",
    description:
      "Updates one of the authenticated user's own vehicles. All fields are optional; only provided fields are updated. Pass `totalCapacity: null` to clear it.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["motorcycle", "car", "bus", "bicycle"],
              },
              totalCapacity: { type: "integer", minimum: 1, nullable: true },
              registration: { type: "string", minLength: 1, maxLength: 50 },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The updated vehicle" },
      400: { description: "Invalid request body or no fields provided" },
      401: { description: "Not authenticated" },
      403: { description: "Not the owner of this vehicle" },
      404: { description: "Vehicle not found" },
    },
  },
});

const updateVehicleSchema = z
  .object({
    type: z.enum(["motorcycle", "car", "bus", "bicycle"]).optional(),
    totalCapacity: z.number().int().positive().nullable().optional(),
    registration: z.string().trim().min(1).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const id = getRouterParam(event, "id");
  const body = await readValidatedBody(event, updateVehicleSchema);

  const vehicle = await db.query.vehicles.findFirst({
    where: { id },
  });
  if (!vehicle) {
    throw new HTTPError("Vehicle not found", { status: 404 });
  }
  if (vehicle.ownerId !== user.id) {
    throw new HTTPError("Forbidden", { status: 403 });
  }

  const updated = (
    await db
      .update(vehicles)
      .set({
        ...(body.type !== undefined && { type: body.type }),
        ...(body.totalCapacity !== undefined && {
          totalCapacity: body.totalCapacity,
        }),
        ...(body.registration !== undefined && {
          registration: body.registration,
        }),
      })
      .where(eq(vehicles.id, id as string))
      .returning()
  )[0];

  return { vehicle: updated };
});
