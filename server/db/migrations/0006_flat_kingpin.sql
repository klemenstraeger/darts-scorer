CREATE TABLE "broadcast_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"offer" jsonb,
	"answer" jsonb,
	"status" text DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "broadcast_sessions_tournament_id_unique" UNIQUE("tournament_id")
);
--> statement-breakpoint
ALTER TABLE "broadcast_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "broadcast_sessions" ADD CONSTRAINT "broadcast_sessions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_sessions" ADD CONSTRAINT "broadcast_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;