ALTER TABLE "service_offering_types" ADD COLUMN "category_id" text;--> statement-breakpoint
UPDATE "service_offering_types" SET "category_id" = 'mechanic' WHERE "id" IN (
	'oil_change', 'brakes', 'exhaust', 'diagnostics', 'engine_repair', 'transmission',
	'suspension_steering', 'tires_wheels', 'ac_heating', 'electrical', 'ev_service'
);--> statement-breakpoint
UPDATE "service_offering_types" SET "category_id" = 'detailer' WHERE "id" IN (
	'interior_detailing', 'exterior_detailing'
);--> statement-breakpoint
UPDATE "service_offering_types" SET "category_id" = 'upgrades_fabrication' WHERE "id" = 'custom_fabrication';--> statement-breakpoint
ALTER TABLE "service_offering_types" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_offering_types" ADD CONSTRAINT "service_offering_types_category_id_provider_category_types_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."provider_category_types"("id") ON DELETE no action ON UPDATE no action;
