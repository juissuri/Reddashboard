import { App, Modal, Setting } from "obsidian";
import { Priority, TaskItem, FolderDef } from "./types";

interface TaskModalOptions {
	task: TaskItem;
	originEl?: HTMLElement | null;
	onSave: (updated: TaskItem) => void;
	onDelete: (task: TaskItem) => void;
}

export class TaskEditModal extends Modal {
	private opts: TaskModalOptions;
	private draft: TaskItem;

	constructor(app: App, opts: TaskModalOptions) {
		super(app);
		this.opts = opts;
		this.draft = { ...opts.task };
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass("ndd-modal");

		const origin = this.opts.originEl?.getBoundingClientRect();
		if (origin) {
			const cx = ((origin.left + origin.width / 2) / window.innerWidth) * 100;
			const cy = ((origin.top + origin.height / 2) / window.innerHeight) * 100;
			modalEl.style.setProperty("--ndd-origin-x", `${cx}%`);
			modalEl.style.setProperty("--ndd-origin-y", `${cy}%`);
		}
		modalEl.addClass("ndd-modal-enter");

		contentEl.createEl("h2", { text: "Edit task", cls: "ndd-modal-title" });

		let textInput: HTMLTextAreaElement;
		new Setting(contentEl)
			.setName("Task")
			.addTextArea((ta) => {
				textInput = ta.inputEl;
				ta.setValue(this.draft.text);
				ta.inputEl.rows = 3;
				ta.onChange((v) => (this.draft.text = v));
			});

		new Setting(contentEl).setName("Deadline").addText((t) => {
			t.inputEl.type = "date";
			t.setValue(this.draft.deadline ?? "");
			t.onChange((v) => (this.draft.deadline = v || null));
		});

		new Setting(contentEl).setName("Priority").addDropdown((dd) => {
			dd.addOption("high", "High");
			dd.addOption("medium", "Medium");
			dd.addOption("low", "Low");
			dd.setValue(this.draft.priority);
			dd.onChange((v) => (this.draft.priority = v as Priority));
		});

		const btnRow = contentEl.createDiv({ cls: "ndd-modal-actions" });
		const deleteBtn = btnRow.createEl("button", { text: "Delete task", cls: "ndd-btn ndd-btn-ghost-danger" });
		deleteBtn.addEventListener("click", () => {
			this.opts.onDelete(this.opts.task);
			this.close();
		});

		const saveBtn = btnRow.createEl("button", { text: "Save changes", cls: "ndd-btn ndd-btn-primary" });
		saveBtn.addEventListener("click", () => {
			if (!this.draft.text.trim()) {
				textInput.focus();
				return;
			}
			this.opts.onSave(this.draft);
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

interface FolderModalOptions {
	folder: FolderDef;
	isNew: boolean;
	onSave: (updated: FolderDef) => void;
	onDelete: (folder: FolderDef) => void;
}

export class FolderEditModal extends Modal {
	private opts: FolderModalOptions;
	private draft: FolderDef;

	constructor(app: App, opts: FolderModalOptions) {
		super(app);
		this.opts = opts;
		this.draft = { ...opts.folder };
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		modalEl.addClass("ndd-modal", "ndd-modal-enter");

		contentEl.createEl("h2", { text: this.opts.isNew ? "Create Folder" : "Edit Folder", cls: "ndd-modal-title" });

		let nameInput: HTMLInputElement;
		new Setting(contentEl).setName("Name").addText(t => {
			nameInput = t.inputEl;
			t.setValue(this.draft.name);
			t.onChange(v => this.draft.name = v);
		});

		new Setting(contentEl).setName("Description").addTextArea(ta => {
			ta.inputEl.rows = 2;
			ta.setValue(this.draft.description);
			ta.onChange(v => this.draft.description = v);
		});

		new Setting(contentEl).setName("Icon (Lucide)").addText(t => {
			t.setValue(this.draft.icon);
			t.onChange(v => this.draft.icon = v || "folder");
		});

		const btnRow = contentEl.createDiv({ cls: "ndd-modal-actions" });
		if (!this.opts.isNew) {
			const deleteBtn = btnRow.createEl("button", { text: "Delete", cls: "ndd-btn ndd-btn-ghost-danger" });
			deleteBtn.addEventListener("click", () => {
				this.opts.onDelete(this.opts.folder);
				this.close();
			});
		} else {
			btnRow.createDiv();
		}

		const saveBtn = btnRow.createEl("button", { text: "Save folder", cls: "ndd-btn ndd-btn-primary" });
		saveBtn.addEventListener("click", () => {
			if (!this.draft.name.trim()) {
				nameInput.focus();
				return;
			}
			this.opts.onSave(this.draft);
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}