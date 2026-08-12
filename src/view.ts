import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type NeonDashboardPlugin from "../main";
import { FolderDef, TaskItem } from "./types";
import { isoToday, uid } from "./data";
import { KanbanBoard } from "./kanban";
import { TaskEditModal, FolderEditModal } from "./modal";
import { renderHorizontalBars, renderWeeklyTrend, withSkeleton } from "./charts";

export const VIEW_TYPE_NEON_DASHBOARD = "neon-daily-dashboard-view";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class DashboardView extends ItemView {
	plugin: NeonDashboardPlugin;
	private currentFolderId: string | null = null;
	private kanban: KanbanBoard | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: NeonDashboardPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_NEON_DASHBOARD;
	}

	getDisplayText(): string {
		return "Reddashboard";
	}

	getIcon(): string {
		return "layout-dashboard";
	}

	async onOpen(): Promise<void> {
		this.containerEl.addClass("ndd-view-root");
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	private get data() {
		return this.plugin.data;
	}

	private persist(): void {
		void this.plugin.savePluginData();
	}

	render(): void {
		const root = this.contentEl;
		root.empty();
		root.addClass("ndd-root");

		if (!this.currentFolderId) {
			this.renderFolderGrid(root);
		} else {
			const folder = this.data.folders.find((f) => f.id === this.currentFolderId);
			if (!folder) {
				this.currentFolderId = null;
				this.renderFolderGrid(root);
				return;
			}
			this.renderWorkspace(root, folder);
		}
	}

	private renderFolderGrid(root: HTMLElement): void {
		const header = root.createDiv({ cls: "ndd-page-header" });
		
		const titleWrap = header.createDiv({ cls: "ndd-title-group" });
		titleWrap.createEl("h1", { text: "Reddashboard", cls: "ndd-page-title" });
		
		const addBtn = titleWrap.createEl("button", { cls: "ndd-icon-btn", attr: { "aria-label": "Add new folder" }});
		setIcon(addBtn, "folder-plus");
		addBtn.addEventListener("click", () => this.openFolderModal());

		header.createDiv({
			cls: "ndd-page-subtitle",
			text: new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
		});

		const grid = root.createDiv({ cls: "ndd-folder-grid" });
		for (const folder of this.data.folders) {
			grid.appendChild(this.renderFolderCard(folder));
		}
	}

	private renderFolderCard(folder: FolderDef): HTMLElement {
		const tasks = this.data.tasks.filter((t) => t.folderId === folder.id);
		const doneToday = tasks.filter((t) => t.completedDate === isoToday()).length;
		const pending = tasks.filter((t) => t.column !== "done").length;

		const card = document.createElement("div");
		card.className = "ndd-folder-card";
		card.tabIndex = 0;

		const iconWrap = card.createDiv({ cls: "ndd-folder-icon" });
		setIcon(iconWrap, folder.icon);

		card.createDiv({ cls: "ndd-folder-name", text: folder.name });
		
		if (folder.description) {
			card.createDiv({ cls: "ndd-folder-desc", text: folder.description });
		}

		const meta = card.createDiv({ cls: "ndd-folder-meta" });
		meta.createSpan({ text: `${pending} open` });
		if (doneToday > 0) {
			meta.createSpan({ cls: "ndd-folder-meta-dot", text: "•" });
			meta.createSpan({ cls: "ndd-folder-meta-done", text: `${doneToday} done today` });
		}

		const open = () => this.openFolder(folder.id);
		card.addEventListener("click", open);
		card.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				open();
			}
		});

		return card;
	}

	private openFolder(folderId: string): void {
		this.currentFolderId = folderId;
		this.render();
	}

	private openFolderModal(existingFolder?: FolderDef): void {
		const isNew = !existingFolder;
		const folder: FolderDef = existingFolder ? { ...existingFolder } : {
			id: uid(),
			name: "New Folder",
			description: "",
			icon: "folder",
			subProjects: []
		};

		new FolderEditModal(this.app, {
			folder,
			isNew,
			onSave: (updated) => {
				if (isNew) {
					this.data.folders.push(updated);
				} else {
					const idx = this.data.folders.findIndex(f => f.id === updated.id);
					if (idx >= 0) this.data.folders[idx] = updated;
				}
				this.persist();
				this.render();
			},
			onDelete: (toDelete) => {
				this.data.folders = this.data.folders.filter(f => f.id !== toDelete.id);
				this.data.tasks = this.data.tasks.filter(t => t.folderId !== toDelete.id);
				this.currentFolderId = null;
				this.persist();
				this.render();
			}
		}).open();
	}

	private renderWorkspace(root: HTMLElement, folder: FolderDef): void {
		const workspace = root.createDiv({ cls: "ndd-workspace ndd-enter" });

		const header = workspace.createDiv({ cls: "ndd-page-header" });
		const backBtn = header.createDiv({ cls: "ndd-back-btn" });
		setIcon(backBtn.createSpan(), "arrow-left");
		backBtn.createSpan({ text: "All folders" });
		backBtn.addEventListener("click", () => {
			this.currentFolderId = null;
			this.render();
		});

		const titleRow = workspace.createDiv({ cls: "ndd-workspace-title-row" });
		const iconWrap = titleRow.createDiv({ cls: "ndd-workspace-icon" });
		setIcon(iconWrap, folder.icon);
		
		const titleGroup = titleRow.createDiv({ cls: "ndd-title-group" });
		titleGroup.createEl("h1", { text: folder.name, cls: "ndd-page-title" });
		
		const editBtn = titleGroup.createEl("button", { cls: "ndd-icon-btn" });
		setIcon(editBtn, "pencil");
		editBtn.addEventListener("click", () => this.openFolderModal(folder));

		if (folder.description) {
			const descText = workspace.createDiv({ cls: "ndd-folder-desc" });
			const words = folder.description.split(/(#[^\s#]+)/g);
			for (const w of words) {
				if (w.startsWith("#")) descText.createSpan({ cls: "ndd-hashtag", text: w });
				else descText.appendChild(document.createTextNode(w));
			}
		}

		const chartsRow = workspace.createDiv({ cls: "ndd-charts-row" });
		const barsCard = chartsRow.createDiv({ cls: "ndd-chart-card" });
		barsCard.createDiv({ cls: "ndd-chart-card-title", text: "Sub-projects" });
		const barsBody = barsCard.createDiv({ cls: "ndd-chart-card-body" });

		const trendCard = chartsRow.createDiv({ cls: "ndd-chart-card" });
		trendCard.createDiv({ cls: "ndd-chart-card-title", text: "Last 7 days" });
		const trendBody = trendCard.createDiv({ cls: "ndd-chart-card-body" });

		this.mountCharts(folder, barsBody, trendBody);

		const boardHost = workspace.createDiv({ cls: "ndd-board-host" });
		const folderTasks = this.data.tasks.filter((t) => t.folderId === folder.id);
		this.kanban = new KanbanBoard(boardHost, folder, folderTasks, {
			onTasksChanged: () => {
				this.persist();
				this.mountCharts(folder, barsBody, trendBody);
			},
			onTaskCreated: (task) => {
				this.data.tasks.push(task);
				this.persist();
				this.kanban?.updateTasks(this.data.tasks.filter((t) => t.folderId === folder.id));
				this.mountCharts(folder, barsBody, trendBody);
			},
			onOpenTask: (task, cardEl) => this.openTaskModal(task, cardEl, folder, barsBody, trendBody),
		});
		this.kanban.render();
	}

	private mountCharts(folder: FolderDef, barsBody: HTMLElement, trendBody: HTMLElement): void {
		const tasks = this.data.tasks.filter((t) => t.folderId === folder.id);

		withSkeleton(barsBody, "bars", () => {
			const bars = folder.subProjects.map((sp) => {
				const spTasks = tasks.filter((t) => t.subProject === sp);
				const done = spTasks.filter((t) => t.column === "done").length;
				const percent = spTasks.length === 0 ? 0 : Math.round((done / spTasks.length) * 100);
				return { label: sp, percent };
			});
			renderHorizontalBars(barsBody, bars);
		});

		withSkeleton(trendBody, "line", () => {
			const points: { day: string; count: number }[] = [];
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const iso = d.toISOString().slice(0, 10);
				const count = tasks.filter((t) => t.completedDate === iso).length;
				points.push({ day: WEEKDAY_LABELS[d.getDay()], count });
			}
			renderWeeklyTrend(trendBody, points);
		});
	}

	private openTaskModal(
		task: TaskItem, cardEl: HTMLElement, folder: FolderDef,
		barsBody: HTMLElement, trendBody: HTMLElement
	): void {
		new TaskEditModal(this.app, {
			task,
			originEl: cardEl,
			onSave: (updated) => {
				const idx = this.data.tasks.findIndex((t) => t.id === updated.id);
				if (idx >= 0) this.data.tasks[idx] = updated;
				this.persist();
				this.kanban?.updateTasks(this.data.tasks.filter((t) => t.folderId === folder.id));
				this.mountCharts(folder, barsBody, trendBody);
			},
			onDelete: (toDelete) => {
				this.data.tasks = this.data.tasks.filter((t) => t.id !== toDelete.id);
				this.persist();
				this.kanban?.updateTasks(this.data.tasks.filter((t) => t.folderId === folder.id));
				this.mountCharts(folder, barsBody, trendBody);
			},
		}).open();
	}
}