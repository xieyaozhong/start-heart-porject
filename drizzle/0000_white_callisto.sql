CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`ra_hours` real NOT NULL,
	`dec_deg` real NOT NULL,
	`predicted_ra` real NOT NULL,
	`predicted_dec` real NOT NULL,
	`distance_pc` real NOT NULL,
	`period_days` real NOT NULL,
	`minimum_mass_jupiter` real NOT NULL,
	`radius_earth` real NOT NULL,
	`semi_major_au` real NOT NULL,
	`angular_separation_mas` real NOT NULL,
	`equilibrium_temp` real NOT NULL,
	`type` text NOT NULL,
	`confidence` integer NOT NULL,
	`probabilities_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `naming_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`candidate_id` text NOT NULL,
	`desired_name` text NOT NULL,
	`email` text NOT NULL,
	`package_name` text NOT NULL,
	`amount_twd` integer NOT NULL,
	`status` text DEFAULT 'test_order' NOT NULL
);
