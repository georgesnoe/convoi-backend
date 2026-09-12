import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { db } from "~/server/utils/db/config";

defineRouteMeta({
  openAPI: {
    tags: ["messages"],
    summary: "List messages",
    description:
      "Returns all messages related to the authenticated user, either as sender or receiver, with the sender and receiver included. Ordered oldest first.",
    responses: {
      200: { description: "The list of messages" },
      401: { description: "Not authenticated" },
    },
  },
});

export default defineHandler(async (event) => {
  const user = event.context.session?.user;
  if (!user) {
    throw new HTTPError({ message: "Unauthorized", status: 401 });
  }

  const [sent, received] = await Promise.all([
    db.query.messages.findMany({
      where: { senderId: user.id },
      with: {
        sender: true,
        receiver: true,
      },
    }),
    db.query.messages.findMany({
      where: { receiverId: user.id },
      with: {
        sender: true,
        receiver: true,
      },
    }),
  ]);

  const messageList = [...sent, ...received].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  return { messages: messageList };
});
