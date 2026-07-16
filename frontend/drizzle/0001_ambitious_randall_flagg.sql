ALTER TABLE "order_lines" ALTER COLUMN "unit_price_usd_snapshot" SET DATA TYPE numeric(18, 6);--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "line_total_usd" SET DATA TYPE numeric(18, 6);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_usd" SET DATA TYPE numeric(18, 6);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price_usd" SET DATA TYPE numeric(18, 6);