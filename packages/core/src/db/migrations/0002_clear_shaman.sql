CREATE TABLE `pending_signups` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`terms_accepted_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `terms_accepted_at` integer;