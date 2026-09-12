import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getRouterParam, readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { messages } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["messages"],
    summary: "Update a message",
    description:
      "Updates a message. Only the sender can edit `textContent`; only the receiver can mark `isRead`.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              textContent: { type: "string", minLength: 1, maxLength: 5000 },
              isRead: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The updated message" },
      400: { description: "Invalid request body or no fields provided" },
      401: { description: "Not authenticated" },
      403: { description: "Not the sender or receiver of this message" },
      404: { description: "Message not found" },
    },
  },
});

const updateMessageSchema = z
  .object({
    textContent: z.string().trim().min(1).max(5000).optional(),
    isRead: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const id = getRouterParam(event, "id");
  const body = await readValidatedBody(event, updateMessageSchema);

  const message = await db.query.messages.findFirst({
    where: { id },
  });
  if (!message) {
    throw new HTTPError({ message: "Message not found", status: 404 });
  }

  const isSender = message.senderId === user.id;
  const isReceiver = message.receiverId === user.id;

  if (!isSender && !isReceiver) {
    throw new HTTPError({ message: "Forbidden", status: 403 });
  }

  if (body.textContent !== undefined && !isSender) {
    throw new HTTPError({
      message: "Only the sender can update textContent",
      status: 403,
    });
  }
  if (body.isRead !== undefined && !isReceiver) {
    throw new HTTPError({
      message: "Only the receiver can update isRead",
      status: 403,
    });
  }

  const updated = (
    await db
      .update(messages)
      .set({
        ...(body.textContent !== undefined && {
          textContent: body.textContent,
        }),
        ...(body.isRead !== undefined && { isRead: body.isRead }),
      })
      .where(eq(messages.id, id as string))
      .returning()
  )[0];

  return { message: updated };
});
