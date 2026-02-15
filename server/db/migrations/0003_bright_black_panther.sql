CREATE TABLE "tournament_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"round" integer NOT NULL,
	"position" integer NOT NULL,
	"phase" text NOT NULL,
	"group_index" integer,
	"player1_name" text,
	"player2_name" text,
	"winner_name" text,
	"loser_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"game_id" integer,
	"player1_legs_won" integer DEFAULT 0 NOT NULL,
	"player2_legs_won" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_matches_tournament_id_phase_round_position_unique" UNIQUE("tournament_id","phase","round","position")
);
--> statement-breakpoint
ALTER TABLE "tournament_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"seed" integer NOT NULL,
	"group_index" integer,
	CONSTRAINT "tournament_participants_tournament_id_player_name_unique" UNIQUE("tournament_id","player_name"),
	CONSTRAINT "tournament_participants_tournament_id_seed_unique" UNIQUE("tournament_id","seed")
);
--> statement-breakpoint
ALTER TABLE "tournament_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tournament_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"group_index" integer,
	"played" integer DEFAULT 0 NOT NULL,
	"won" integer DEFAULT 0 NOT NULL,
	"lost" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"legs_won" integer DEFAULT 0 NOT NULL,
	"legs_lost" integer DEFAULT 0 NOT NULL,
	"leg_difference" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tournament_standings_tournament_id_player_name_unique" UNIQUE("tournament_id","player_name")
);
--> statement-breakpoint
ALTER TABLE "tournament_standings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"game_mode" text DEFAULT '501' NOT NULL,
	"checkout" text DEFAULT 'double_out' NOT NULL,
	"legs_to_win" integer DEFAULT 1 NOT NULL,
	"sets_to_win" integer DEFAULT 1 NOT NULL,
	"group_count" integer,
	"advance_per_group" integer,
	"winner_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tournaments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "active_games" ADD COLUMN "tournament_match_id" integer;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_games" ADD CONSTRAINT "active_games_tournament_match_id_tournament_matches_id_fk" FOREIGN KEY ("tournament_match_id") REFERENCES "public"."tournament_matches"("id") ON DELETE no action ON UPDATE no action;