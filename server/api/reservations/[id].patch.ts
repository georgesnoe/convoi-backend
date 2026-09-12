import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam, readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { reservations } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["reservations"],
    summary: "Update a reservation",
    description:
      "Updates a reservation. Only the passenger who created it or the owner of the trip's vehicle can update it. Only the vehicle owner can update `confirmed`.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              confirmed: { type: "boolean" },
              amount: { type: "integer", minimum: 0 },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The updated reservation" },
      400: { description: "Invalid request body or no fields provided" },
      401: { description: "Not authenticated" },
      403: { description: "Not the passenger or vehicle owner" },
      404: { description: "Reservation not found" },
    },
  },
});

const updateReservationSchema = z
  .object({
    confirmed: z.boolean().optional(),
    amount: z.number().int().min(0).optional(),
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
  const body = await readValidatedBody(event, updateReservationSchema);

  const reservation = await db.query.reservations.findFirst({
    where: { id },
    with: {
      trip: {
        with: {
          vehicle: true,
        },
      },
    },
  });
  if (!reservation) {
    throw new HTTPError("Reservation not found", { status: 404 });
  }

  const isPassenger = reservation.userId === user.id;
  const isOwner = reservation.trip?.vehicle?.ownerId === user.id;

  if (!isPassenger && !isOwner) {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  if (body.confirmed !== undefined && !isOwner) {
    throw new HTTPError({
      message: "Only the vehicle owner can update confirmed",
      status: 403,
    });
  }

  const updated = (
    await db
      .update(reservations)
      .set({
        ...(body.confirmed !== undefined && { confirmed: body.confirmed }),
        ...(body.amount !== undefined && { amount: body.amount }),
      })
      .where(eq(reservations.id, id as string))
      .returning()
  )[0];

  return { reservation: updated };
});
