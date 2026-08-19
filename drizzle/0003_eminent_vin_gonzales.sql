CREATE TABLE "provider_unavailable_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_unavailable_dates_provider_id_date_unique" UNIQUE("provider_id","date")
);
--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "accepting_leads" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "hourly_rate_cents" integer;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "profile_view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "payment_mode" "payment_mode";--> statement-breakpoint
ALTER TABLE "provider_unavailable_dates" ADD CONSTRAINT "provider_unavailable_dates_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;