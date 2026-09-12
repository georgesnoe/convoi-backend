import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { db } from "~/server/utils/db/config";
import { messages } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["messages"],
    summary: "Send a message",
    description:
      "Sends a message from the authenticated user to another user. `isRead` defaults to false.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["receiverId", "textContent"],
            properties: {
              receiverId: { type: "string" },
              textContent: { type: "string", minLength: 1, maxLength: 5000 },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The created message" },
      400: { description: "Invalid request body" },
      401: { description: "Not authenticated" },
      404: { description: "Receiver not found" },
    },
  },
});

const createMessageSchema = z.object({
  receiverId: z.string().min(1),
  textContent: z.string().trim().min(1).max(5000),
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const body = await readValidatedBody(event, createMessageSchema);

  const receiver = await db.query.users.findFirst({
    where: { id: body.receiverId },
  });
  if (!receiver) {
    throw new HTTPError({ message: "Receiver not found", status: 404 });
  }

  const message = (
    await db
      .insert(messages)
      .values({
        senderId: user.id,
        receiverId: body.receiverId,
        textContent: body.textContent,
        isRead: false,
      })
      .returning()
  )[0];

  return { message };
});
