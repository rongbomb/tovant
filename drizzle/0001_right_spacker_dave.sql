CREATE TABLE "homepage_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" text NOT NULL,
	"image_path" text NOT NULL,
	"alt_text" text NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "homepage_images_slot_unique" UNIQUE("slot")
);
--> statement-breakpoint
ALTER TABLE "homepage_images" ADD CONSTRAINT "homepage_images_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;