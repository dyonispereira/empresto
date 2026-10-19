CREATE TABLE `activity` (
	`user_id` text PRIMARY KEY NOT NULL,
	`last_seen` text NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL
);
