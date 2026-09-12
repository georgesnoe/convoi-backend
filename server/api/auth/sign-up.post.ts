import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { createSession, hashPassword } from "~/server/utils/auth";
import { db } from "~/server/utils/db/config";
import { accounts, users } from "~/server/utils/db/schema";

defineRouteMeta({
  openAPI: {
    tags: ["auth"],
    summary: "Sign up",
    description:
      "Register a new user with name, email and password. Optionally specify the user `type` (conductor or passenger, defaults to passenger). Creates a credential account, signs the user in and sets the auth session cookie.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string", minLength: 1, maxLength: 100 },
              email: { type: "string", format: "email" },
              password: {
                type: "string",
                format: "password",
                minLength: 8,
                maxLength: 100,
              },
              type: {
                type: "string",
                enum: ["conductor", "passenger"],
                default: "passenger",
                description: "User type, only relevant when role is `user`.",
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "User created and signed in" },
      400: { description: "Invalid request body" },
      409: { description: "A user with this email already exists" },
    },
  },
});

const signUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(100),
  type: z.enum(["conductor", "passenger"]).default("passenger"),
});

export default defineHandler(async (event) => {
  const body = await readValidatedBody(event, signUpSchema);

  const existing = await db.query.users.findFirst({
    where: {
      email: body.email,
    },
  });
  if (existing) {
    throw new HTTPError({
      message: "A user with this email already exists",
      status: 409,
    });
  }

  const user = (
    await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        type: body.type,
      })
      .returning()
  )[0];

  const userId = user.id;

  await db.insert(accounts).values({
    userId: userId,
    accountId: userId,
    providerId: "credential",
    password: hashPassword(body.password),
  });

  const session = await createSession(event, userId);

  return {
    user,
    session,
  };
});
