import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/utils/db/config";
import { users } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["users"],
    summary: "Update current user",
    description:
      "Updates the profile of the authenticated user. Only `name`, `image` and `type` can be updated; all fields are optional. Pass `image: null` to remove the profile image.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1, maxLength: 100 },
              image: { type: "string", format: "uri", nullable: true },
              type: {
                type: "string",
                enum: ["conductor", "passenger"],
                description: "User type (conductor or passenger).",
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "The updated user's profile" },
      400: { description: "Invalid request body or no fields provided" },
      401: { description: "Not authenticated" },
    },
  },
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    image: z.url().nullable().optional(),
    type: z.enum(["conductor", "passenger"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export default defineHandler(async (event) => {
  const session = event.context.session;
  if (!session) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const body = await readValidatedBody(event, updateProfileSchema);

  const updated = (
    await db
      .update(users)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.type !== undefined && { type: body.type }),
      })
      .where(eq(users.id, session.user?.id as string))
      .returning()
  )[0];

  if (!updated) {
    throw new HTTPError({ message: "User not found", status: 404 });
  }

  return { user: updated };
});
