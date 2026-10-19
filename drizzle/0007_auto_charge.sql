CREATE TABLE `auto_charge` (
	`user_id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`zapi_instance` text,
	`zapi_token` text,
	`zapi_client_token` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auto_charge_log` (
	`owner` text NOT NULL,
	`item` text NOT NULL,
	`client` text NOT NULL,
	`amount` integer NOT NULL,
	`due_date` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`sent_at` text NOT NULL,
	PRIMARY KEY(`owner`, `item`)
);
