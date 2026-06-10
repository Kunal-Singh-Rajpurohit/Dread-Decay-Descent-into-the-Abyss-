CREATE TABLE IF NOT EXISTS "death_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"username" text NOT NULL,
	"character_class" text NOT NULL,
	"floor_reached" integer NOT NULL,
	"steps_walked" integer NOT NULL,
	"xp_earned" integer NOT NULL,
	"cause_of_death" text NOT NULL,
	"killed_by" text,
	"died_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"username" text NOT NULL,
	"character_class" text NOT NULL,
	"floor_reached" integer NOT NULL,
	"xp_earned" integer NOT NULL,
	"won_game" boolean DEFAULT false NOT NULL,
	"achieved_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_index" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'alive' NOT NULL,
	"character_class" text NOT NULL,
	"character_name" text NOT NULL,
	"floor_reached" integer DEFAULT 1 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"playtime_seconds" integer DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

DO $$ BEGIN
 ALTER TABLE "death_logs" ADD CONSTRAINT "death_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "leaderboard_floor_idx" ON "leaderboard" ("floor_reached");
CREATE UNIQUE INDEX IF NOT EXISTS "saves_user_slot_idx" ON "saves" ("user_id","slot_index");
CREATE INDEX IF NOT EXISTS "saves_user_idx" ON "saves" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
