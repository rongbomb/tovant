CREATE TABLE "lead_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_user_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'charged' NOT NULL,
	"stripe_charge_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lead_charges_quote_id_unique" UNIQUE("quote_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_provider_user_id_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_charges_provider_id_idx" ON "lead_charges" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications" USING btree ("user_id","read_at");