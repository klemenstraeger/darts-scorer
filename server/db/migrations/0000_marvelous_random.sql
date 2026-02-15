CREATE TABLE "throws" (
	"id" serial PRIMARY KEY NOT NULL,
	"turn_id" integer NOT NULL,
	"throw_number" integer NOT NULL,
	"segment" integer NOT NULL,
	"multiplier" integer NOT NULL,
	"points" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"position" integer NOT NULL,
	"final_score" integer NOT NULL,
	CONSTRAINT "game_players_game_id_position_unique" UNIQUE("game_id","position")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"winner_name" text,
	"total_turns" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"turn_number" integer NOT NULL,
	"player_name" text NOT NULL,
	"total_points" integer NOT NULL,
	"busted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "throws" ADD CONSTRAINT "throws_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;