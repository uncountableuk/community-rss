ALTER TABLE `users` ADD `pending_email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `pending_email_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `pending_email_expires_at` integer;