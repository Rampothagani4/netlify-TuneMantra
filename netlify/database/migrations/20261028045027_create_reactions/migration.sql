CREATE TABLE "reactions" (
	"listener" text,
	"track_id" text,
	"reaction" text NOT NULL,
	"source" text NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"artwork" text DEFAULT '' NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"video_id" text,
	"stream_url" text,
	"download_url" text,
	"license" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_pkey" PRIMARY KEY("listener","track_id")
);
--> statement-breakpoint
CREATE INDEX "reactions_listener_idx" ON "reactions" ("listener","updated_at");