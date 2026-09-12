import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam } from "nitro/h3";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { vehicles } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["vehicles"],
    summary: "Delete a vehicle",
    description:
      "Deletes one of the authenticated user's own vehicles. Only the owner of the vehicle can delete it.",
    responses: {
      200: { description: "Vehicle deleted" },
      401: { description: "Not authenticated" },
      403: { description: "Not the owner of this vehicle" },
      404: { description: "Vehicle not found" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError("Unauthorized", { status: 401 });
  }

  const id = getRouterParam(event, "id");

  const vehicle = await db.query.vehicles.findFirst({
    where: { id },
  });
  if (!vehicle) {
    throw new HTTPError({ message: "Vehicle not found", status: 404 });
  }
  if (vehicle.ownerId !== user.id) {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  await db.delete(vehicles).where(eq(vehicles.id, id as string));

  return { success: true };
});
