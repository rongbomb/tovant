ALTER TABLE "provider_category_types" ADD COLUMN "coming_soon" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "provider_category_types" SET "coming_soon" = true WHERE "id" = 'detailer';
--> statement-breakpoint
INSERT INTO "provider_category_types" ("id", "label", "sort_order", "coming_soon") VALUES
	('upgrades_fabrication', 'Upgrades & Fabrication', 2, true)
ON CONFLICT ("id") DO NOTHING;