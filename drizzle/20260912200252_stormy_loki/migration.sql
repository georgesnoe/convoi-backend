CREATE TABLE "reservation" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"tripId" text NOT NULL,
	"startTime" timestamp(6) with time zone NOT NULL,
	"frequency" "trip_frequency" NOT NULL,
	"startDate" timestamp(6) with time zone,
	"weekDays" integer,
	"distance" integer NOT NULL,
	"startPoint" jsonb NOT NULL,
	"destinationPoint" jsonb NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reservation_userId_idx" ON "reservation" ("userId");--> statement-breakpoint
CREATE INDEX "reservation_tripId_idx" ON "reservation" ("tripId");--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_tripId_trip_id_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE;