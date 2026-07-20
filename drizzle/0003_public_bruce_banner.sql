CREATE TABLE `research_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`observing_note` text NOT NULL,
	`symbolic_meaning` text NOT NULL,
	`published_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `purchaser_name` text;--> statement-breakpoint
ALTER TABLE `naming_orders` ADD `recipient_email` text;