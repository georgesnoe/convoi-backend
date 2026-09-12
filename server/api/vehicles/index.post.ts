import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { db } from "~/server/utils/db/config";
import { vehicles } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["vehicles"],
    summary: "Create a vehicle",
    description:
      "Creates a vehicle owned by the authenticated conductor. Requires a conductor user.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["type", "registration"],
            properties: {
              type: {
                type: "string",
                enum: ["motorcycle", "car", "bus", "bicycle"],
              },
              totalCapacity: { type: "integer", minimum: 1 },
              registration: { type: "string", minLength: 1, maxLength: 50 },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The created vehicle" },
      400: { description: "Invalid request body" },
      401: { description: "Not authenticated" },
      403: { description: "Not a conductor" },
    },
  },
});

const createVehicleSchema = z.object({
  type: z.enum(["motorcycle", "car", "bus", "bicycle"]),
  totalCapacity: z.number().int().positive().optional(),
  registration: z.string().trim().min(1).max(50),
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const body = await readValidatedBody(event, createVehicleSchema);

  const vehicle = (
    await db
      .insert(vehicles)
      .values({
        ownerId: user.id,
        type: body.type,
        totalCapacity: body.totalCapacity ?? null,
        registration: body.registration,
      })
      .returning()
  )[0];

  return { vehicle };
});
