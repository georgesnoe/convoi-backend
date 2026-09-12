CREATE TYPE "user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "user_type" AS ENUM('conductor', 'passenger');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user'::"user_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "type" "user_type" DEFAULT 'passenger'::"user_type" NOT NULL;