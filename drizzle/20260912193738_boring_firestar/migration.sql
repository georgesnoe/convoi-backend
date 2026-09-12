CREATE TYPE "trip_frequency" AS ENUM('once', 'weekly');--> statement-breakpoint
CREATE TYPE "vehicle_type" AS ENUM('motorcycle', 'car', 'bus', 'bicycle');--> statement-breakpoint
CREATE TABLE "trip" (
	"id" text PRIMARY KEY,
	"conductorId" text NOT NULL,
	"vehicleId" text NOT NULL,
	"startTime" timestamp(6) with time zone NOT NULL,
	"frequency" "trip_frequency" NOT NULL,
	"startDate" timestamp(6) with time zone,
	"weekDays" integer,
	"distance" integer NOT NULL,
	"startPoint" jsonb NOT NULL,
	"destinationPoint" jsonb NOT NULL,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle" (
	"id" text PRIMARY KEY,
	"ownerId" text NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"totalCapacity" integer,
	"registration" text NOT NULL,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "trip_conductorId_idx" ON "trip" ("conductorId");--> statement-breakpoint
CREATE INDEX "vehicle_ownerId_idx" ON "vehicle" ("ownerId");--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_conductorId_user_id_fkey" FOREIGN KEY ("conductorId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trip" ADD CONSTRAINT "trip_vehicleId_vehicle_id_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_ownerId_user_id_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE;