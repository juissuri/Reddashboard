import { DashboardData } from "./types";

export function uid(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function isoToday(offsetDays = 0): string {
	const d = new Date();
	d.setDate(d.getDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

/** Human label like "Today", "Tomorrow", "in 3 days", "12 Aug", or "Overdue". */
export function formatDeadline(iso: string | null): string {
	if (!iso) return "";
	const today = new Date(isoToday());
	const target = new Date(iso);
	const diffDays = Math.round(
		(target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays === -1) return "Yesterday";
	if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`;
	if (diffDays <= 6) return `in ${diffDays}d`;
	return target.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function isOverdue(iso: string | null): boolean {
	if (!iso) return false;
	return iso < isoToday();
}

/** Builds the fresh, first-run dataset described in the plugin brief. */
export function buildDefaultData(): DashboardData {
	return {
		folders: [
			{
				id: "my-projects",
				name: "My Projects",
				icon: "folder-kanban",
				subProjects: ["Cargo 083"],
			},
			{
				id: "language-learning",
				name: "Language Learning",
				icon: "languages",
				subProjects: [],
			},
			{
				id: "material-review",
				name: "Material Review",
				icon: "book-open-check",
				subProjects: [],
			},
			{
				id: "new-tasks",
				name: "New Tasks",
				icon: "sparkles",
				subProjects: [],
			},
		],
		tasks: [
			{
				id: uid(),
				folderId: "my-projects",
				subProject: "Cargo 083",
				text: "Configure nodes in Gaea for sand texture",
				deadline: isoToday(0),
				priority: "high",
				column: "do-now",
				completedDate: null,
				createdDate: isoToday(0),
				order: 1,
			},
			{
				id: uid(),
				folderId: "my-projects",
				subProject: "Cargo 083",
				text: "Import assets to Unreal Engine 5",
				deadline: isoToday(3),
				priority: "medium",
				column: "do-next",
				completedDate: null,
				createdDate: isoToday(0),
				order: 2,
			},
			{
				id: uid(),
				folderId: "language-learning",
				subProject: null,
				text: "A1 test on Friday",
				deadline: null,
				priority: "high",
				column: "do-now",
				completedDate: null,
				createdDate: isoToday(0),
				order: 3,
			},
			{
				id: uid(),
				folderId: "language-learning",
				subProject: null,
				text: "Review vocabulary",
				deadline: isoToday(1),
				priority: "low",
				column: "later",
				completedDate: null,
				createdDate: isoToday(0),
				order: 4,
			},
		],
	};
}
