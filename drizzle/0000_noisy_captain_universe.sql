CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`category` text DEFAULT '工作' NOT NULL,
	`dueDate` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
