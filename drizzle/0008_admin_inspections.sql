CREATE TABLE `admin_inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_email` text NOT NULL,
	`target` text NOT NULL,
	`mode` text NOT NULL,
	`started_at` text NOT NULL
);
