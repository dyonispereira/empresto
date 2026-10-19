CREATE TABLE `subscriptions` (
	`owner` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`customer_id` text,
	`subscription_id` text,
	`status` text DEFAULT 'unconfigured' NOT NULL,
	`method` text,
	`payments` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL,
	`lock` text
);
