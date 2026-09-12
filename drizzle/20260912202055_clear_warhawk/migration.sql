CREATE TABLE "message" (
	"id" text PRIMARY KEY,
	"senderId" text NOT NULL,
	"receiverId" text NOT NULL,
	"textContent" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "message_senderId_idx" ON "message" ("senderId");--> statement-breakpoint
CREATE INDEX "message_receiverId_idx" ON "message" ("receiverId");--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_user_id_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_receiverId_user_id_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE;