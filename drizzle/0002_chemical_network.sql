ALTER TABLE `naming_orders` ADD `payment_provider` text DEFAULT 'ecpay';--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `payment_trade_no` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `payment_trade_id` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `payment_type` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `payment_message` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `payment_token` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `payment_updated_at` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `paid_at` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `simulated_payment` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `naming_orders_payment_trade_no_unique` ON `naming_orders` (`payment_trade_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `naming_orders_payment_token_unique` ON `naming_orders` (`payment_token`);