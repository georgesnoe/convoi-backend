import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { db } from "~/server/utils/db/config";

defineRouteMeta({
  openAPI: {
    tags: ["reservations"],
    summary: "List reservations",
    description:
      "Returns the reservations visible to the authenticated user: the reservations they created, plus the reservations made on trips whose vehicle they own. Admins get all reservations.",
    responses: {
      200: { description: "The list of visible reservations" },
      401: { description: "Not authenticated" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const all = await db.query.reservations.findMany({
    with: {
      trip: {
        with: {
          vehicle: true,
        },
      },
    },
    orderBy: (reservation, { desc }) => [desc(reservation.createdAt)],
  });

  const reservations =
    user.role === "admin"
      ? all
      : all.filter(
          (reservation) =>
            reservation.userId === user.id ||
            reservation.trip?.vehicle?.ownerId === user.id,
        );

  return { reservations };
});
