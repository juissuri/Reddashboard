import { Plugin, WorkspaceLeaf } from "obsidian";
import { DashboardData } from "./src/types";
import { buildDefaultData } from "./src/data";
import { DashboardView, VIEW_TYPE_NEON_DASHBOARD } from "./src/view";

export default class NeonDashboardPlugin extends Plugin {
	data!: DashboardData;

	async onload(): Promise<void> {
		await this.loadPluginData();

		this.registerView(VIEW_TYPE_NEON_DASHBOARD, (leaf) => new DashboardView(leaf, this));

		this.addRibbonIcon("layout-dashboard", "Open Neon Daily Dashboard", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-neon-daily-dashboard",
			name: "Open Neon Daily Dashboard",
			callback: () => {
				void this.activateView();
			},
		});
	}

	onunload(): void {
		// Views are detached automatically by Obsidian; nothing else to tear down.
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const existing = workspace.getLeavesOfType(VIEW_TYPE_NEON_DASHBOARD);
		if (existing.length > 0) {
			leaf = existing[0];
		} else {
			leaf = workspace.getLeaf("tab");
			await leaf.setViewState({ type: VIEW_TYPE_NEON_DASHBOARD, active: true });
		}
		workspace.revealLeaf(leaf);
	}

	/** Loads data.json, seeding it with the default demo dataset on first run. */
	async loadPluginData(): Promise<void> {
		const stored = (await this.loadData()) as DashboardData | null;
		if (!stored || !stored.folders || !stored.tasks) {
			this.data = buildDefaultData();
			await this.savePluginData();
		} else {
			this.data = stored;
		}
	}

	async savePluginData(): Promise<void> {
		await this.saveData(this.data);
	}
}
