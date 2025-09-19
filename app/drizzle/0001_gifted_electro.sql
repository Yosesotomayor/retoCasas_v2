CREATE TABLE "house_predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"price" text NOT NULL,
	"properties" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "house_predictions" ADD CONSTRAINT "house_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;