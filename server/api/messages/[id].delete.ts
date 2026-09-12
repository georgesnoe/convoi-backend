import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam } from "nitro/h3";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { messages } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["messages"],
    summary: "Delete a message",
    description:
      "Deletes one of the authenticated user's own sent messages. Only the sender can delete it.",
    responses: {
      200: { description: "Message deleted" },
      401: { description: "Not authenticated" },
      403: { description: "Not the sender of this message" },
      404: { description: "Message not found" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const id = getRouterParam(event, "id");

  const message = await db.query.messages.findFirst({
    where: { id },
  });
  if (!message) {
    throw new HTTPError({ message: "Message not found", status: 404 });
  }
  if (message.senderId !== user.id) {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  await db.delete(messages).where(eq(messages.id, id as string));

  return { success: true };
});
