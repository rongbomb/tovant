CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"value_int" integer NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_category_types" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_specialty_types" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_offering_types" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "provider_category_types" ("id", "label", "sort_order") VALUES
	('mechanic', 'Mechanic', 0),
	('detailer', 'Detailer', 1);
--> statement-breakpoint
INSERT INTO "provider_specialty_types" ("id", "label", "sort_order") VALUES
	('ev', 'EV high-voltage certification', 0),
	('motorcycle_powersports', 'Motorcycle & powersports certification', 1),
	('commercial_fleet', 'Commercial fleet certification', 2);
--> statement-breakpoint
INSERT INTO "service_offering_types" ("id", "label", "sort_order") VALUES
	('oil_change', 'Oil changes', 0),
	('brakes', 'Brakes', 1),
	('exhaust', 'Exhaust', 2),
	('diagnostics', 'Diagnostics', 3),
	('engine_repair', 'Engine repair', 4),
	('transmission', 'Transmission', 5),
	('suspension_steering', 'Suspension & steering', 6),
	('tires_wheels', 'Tires & wheels', 7),
	('ac_heating', 'A/C & heating', 8),
	('electrical', 'Electrical', 9),
	('interior_detailing', 'Interior detailing', 10),
	('exterior_detailing', 'Exterior detailing', 11),
	('custom_fabrication', 'Custom fabrication', 12),
	('ev_service', 'EV service', 13);
--> statement-breakpoint
INSERT INTO "site_settings" ("id", "value_int") VALUES
	('escrow_auto_release_hours', 72),
	('default_cancellation_window_hours', 24);