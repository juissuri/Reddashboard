export type Priority = "high" | "medium" | "low";

export type ColumnId = "do-now" | "do-next" | "later" | "done";

export interface TaskItem {
	id: string;
	folderId: string;
	subProject: string | null;
	text: string;
	deadline: string | null; // ISO date string (yyyy-mm-dd)
	priority: Priority;
	column: ColumnId;
	completedDate: string | null; // ISO date string, set when moved to Done
	createdDate: string; // ISO date string
	order: number; // manual sort position within its column
}

export interface FolderDef {
	id: string;
	name: string;
	icon: string; // lucide icon id
	subProjects: string[];
}

export interface DashboardData {
	folders: FolderDef[];
	tasks: TaskItem[];
}

export const COLUMNS: { id: ColumnId; label: string }[] = [
	{ id: "do-now", label: "Do Now" },
	{ id: "do-next", label: "Do Next" },
	{ id: "later", label: "Later" },
	{ id: "done", label: "Done" },
];

export const PRIORITY_LABEL: Record<Priority, string> = {
	high: "High",
	medium: "Medium",
	low: "Low",
};
