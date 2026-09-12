import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readValidatedBody } from "nitro/h3";
import { z } from "zod";
import { db } from "~/server/utils/db/config";
import { createSession, verifyPassword } from "~/server/utils/auth";

defineRouteMeta({
  openAPI: {
    tags: ["auth"],
    summary: "Sign in",
    description:
      "Sign in with email and password. Verifies the credential account and sets the auth session cookie.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Signed in" },
      400: { description: "Invalid request body" },
      401: { description: "Invalid email or password" },
    },
  },
});

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export default defineHandler(async (event) => {
  const body = await readValidatedBody(event, signInSchema);

  const user = await db.query.users.findFirst({
    where: { email: body.email },
  });
  if (!user) {
    throw new HTTPError({ message: "Invalid email or password", status: 401 });
  }

  const credential = await db.query.accounts.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (
    !credential?.password ||
    !verifyPassword(body.password, credential.password)
  ) {
    throw new HTTPError({ message: "Invalid email or password", status: 401 });
  }

  const session = await createSession(event, user.id);

  return {
    user,
    session,
  };
});
