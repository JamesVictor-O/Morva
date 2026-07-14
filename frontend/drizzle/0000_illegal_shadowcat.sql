CREATE TABLE "auth_nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name_snapshot" text NOT NULL,
	"unit_price_usd_snapshot" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_usd" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"stall_id" uuid NOT NULL,
	"buyer_address" text NOT NULL,
	"buyer_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_usd" numeric(12, 2) NOT NULL,
	"settlement_tx_id" text,
	"explorer_url" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stall_id" uuid NOT NULL,
	"name" text NOT NULL,
	"meta" text NOT NULL,
	"price_usd" numeric(12, 2) NOT NULL,
	"photo_url" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"initial" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"accent" text NOT NULL,
	"category" text NOT NULL,
	"established_year" integer NOT NULL,
	"location" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"trending" boolean DEFAULT false NOT NULL,
	"illustration" text NOT NULL,
	"photo_url" text,
	"payout_address" text NOT NULL,
	"payout_token" text DEFAULT 'USDC' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stalls_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "stalls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_stall_id_stalls_id_fk" FOREIGN KEY ("stall_id") REFERENCES "public"."stalls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stall_id_stalls_id_fk" FOREIGN KEY ("stall_id") REFERENCES "public"."stalls"("id") ON DELETE cascade ON UPDATE no action;