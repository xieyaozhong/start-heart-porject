CREATE TABLE `inference_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`generated_system_id` text,
	`notes` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
CREATE TABLE `naming_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_twd` integer NOT NULL,
	`description` text NOT NULL,
	`features_json` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planets` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`code` text NOT NULL,
	`display_name` text,
	`type` text NOT NULL,
	`mass_earth` real NOT NULL,
	`radius_earth` real NOT NULL,
	`period_days` real NOT NULL,
	`semi_major_au` real NOT NULL,
	`eccentricity` real NOT NULL,
	`equilibrium_temp` integer NOT NULL,
	`epoch_angle_deg` real NOT NULL,
	`orbit_color` text NOT NULL,
	`composition_json` text NOT NULL,
	`atmosphere` text NOT NULL,
	`state` text NOT NULL,
	`bio_score` integer NOT NULL,
	`bio_prediction` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `star_systems` (
	`id` text PRIMARY KEY NOT NULL,
	`designation` text NOT NULL,
	`display_name` text,
	`classification` text NOT NULL,
	`ra_hours` real NOT NULL,
	`dec_deg` real NOT NULL,
	`distance_pc` real NOT NULL,
	`star_mass` real NOT NULL,
	`star_radius` real NOT NULL,
	`temperature_k` integer NOT NULL,
	`luminosity` real NOT NULL,
	`age_byr` real NOT NULL,
	`metallicity` real NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`confidence` integer NOT NULL,
	`summary` text NOT NULL,
	`epoch_at` text NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_naming_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`candidate_id` text NOT NULL,
	`system_id` text,
	`planet_id` text,
	`desired_name` text NOT NULL,
	`owner_name` text,
	`dedication` text,
	`email` text NOT NULL,
	`package_name` text NOT NULL,
	`amount_twd` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`registry_code` text,
	`animation_theme` text DEFAULT 'amber',
	`confirmed_at` text
);
--> statement-breakpoint
INSERT INTO `__new_naming_orders`("id", "created_at", "candidate_id", "system_id", "planet_id", "desired_name", "owner_name", "dedication", "email", "package_name", "amount_twd", "status", "registry_code", "animation_theme", "confirmed_at") SELECT "id", "created_at", "candidate_id", NULL, NULL, "desired_name", NULL, NULL, "email", "package_name", "amount_twd", "status", NULL, 'amber', NULL FROM `naming_orders`;--> statement-breakpoint
DROP TABLE `naming_orders`;--> statement-breakpoint
ALTER TABLE `__new_naming_orders` RENAME TO `naming_orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
