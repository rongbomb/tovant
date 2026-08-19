CREATE TYPE "public"."gallery_photo_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."service_offering" AS ENUM('oil_change', 'brakes', 'exhaust', 'diagnostics', 'engine_repair', 'transmission', 'suspension_steering', 'tires_wheels', 'ac_heating', 'electrical', 'interior_detailing', 'exterior_detailing', 'custom_fabrication', 'ev_service');--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"nickname" text,
	"vin" text,
	"mileage" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_service_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"offering" "service_offering" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_service_offerings_provider_id_offering_unique" UNIQUE("provider_id","offering")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "provider_gallery_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"caption" text,
	"status" "gallery_photo_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by_admin_id" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_service_offerings" ADD CONSTRAINT "provider_service_offerings_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_user_id_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_gallery_photos" ADD CONSTRAINT "provider_gallery_photos_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_gallery_photos" ADD CONSTRAINT "provider_gallery_photos_reviewed_by_admin_id_user_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicles_owner_id_idx" ON "vehicles" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "reviews_provider_id_idx" ON "reviews" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "reviews_owner_id_idx" ON "reviews" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "gallery_photos_provider_status_idx" ON "provider_gallery_photos" USING btree ("provider_id","status");--> statement-breakpoint
CREATE INDEX "gallery_photos_status_created_at_idx" ON "provider_gallery_photos" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;