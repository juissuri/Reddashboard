import { App, Modal, Setting } from "obsidian";
import { Priority, TaskItem } from "./types";

interface TaskModalOptions {
	task: TaskItem;
	originEl?: HTMLElement | null;
	onSave: (updated: TaskItem) => void;
	onDelete: (task: TaskItem) => void;
}

/** Edit modal for a single task. Scales up visually from the card that opened it. */
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

		// Scale-up-from-card entrance: position the transform-origin near the
		// clicked card, then let the CSS keyframe take over.
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

		const deleteBtn = btnRow.createEl("button", {
			text: "Delete task",
			cls: "ndd-btn ndd-btn-ghost-danger",
		});
		deleteBtn.addEventListener("click", () => {
			this.opts.onDelete(this.opts.task);
			this.close();
		});

		const saveBtn = btnRow.createEl("button", {
			text: "Save changes",
			cls: "ndd-btn ndd-btn-primary",
		});
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
