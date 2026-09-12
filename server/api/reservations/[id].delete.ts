import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam } from "nitro/h3";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { reservations } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["reservations"],
    summary: "Delete a reservation",
    description:
      "Deletes one of the authenticated user's own reservations. Only the user who created the reservation can delete it.",
    responses: {
      200: { description: "Reservation deleted" },
      401: { description: "Not authenticated" },
      403: { description: "Not the creator of this reservation" },
      404: { description: "Reservation not found" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const id = getRouterParam(event, "id");

  const reservation = await db.query.reservations.findFirst({
    where: { id },
  });
  if (!reservation) {
    throw new HTTPError({ message: "Reservation not found", status: 404 });
  }
  if (reservation.userId !== user.id) {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  await db.delete(reservations).where(eq(reservations.id, id as string));

  return { success: true };
});
