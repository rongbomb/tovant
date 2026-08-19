ALTER TABLE "provider_categories" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "provider_service_offerings" ALTER COLUMN "offering" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "provider_specialties" ALTER COLUMN "specialty" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "verification_records" ALTER COLUMN "specialty" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_category_provider_category_types_id_fk" FOREIGN KEY ("category") REFERENCES "public"."provider_category_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_service_offerings" ADD CONSTRAINT "provider_service_offerings_offering_service_offering_types_id_fk" FOREIGN KEY ("offering") REFERENCES "public"."service_offering_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_specialties" ADD CONSTRAINT "provider_specialties_specialty_provider_specialty_types_id_fk" FOREIGN KEY ("specialty") REFERENCES "public"."provider_specialty_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_specialty_provider_specialty_types_id_fk" FOREIGN KEY ("specialty") REFERENCES "public"."provider_specialty_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_category_provider_category_types_id_fk" FOREIGN KEY ("category") REFERENCES "public"."provider_category_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."provider_category";--> statement-breakpoint
DROP TYPE "public"."provider_specialty";--> statement-breakpoint
DROP TYPE "public"."service_offering";