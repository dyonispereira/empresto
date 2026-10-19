CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`key` text NOT NULL,
	`created_at` text NOT NULL,
	`action` text NOT NULL
);
