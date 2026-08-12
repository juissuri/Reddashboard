import { setIcon } from "obsidian";
import { COLUMNS, ColumnId, FolderDef, TaskItem } from "./types";
import { formatDeadline, isOverdue, isoToday, uid } from "./data";

export interface KanbanCallbacks {
	onTasksChanged: () => void; // persist + refresh charts
	onOpenTask: (task: TaskItem, cardEl: HTMLElement) => void;
}

/** Renders and wires up the full 4-column kanban board for one folder. */
export class KanbanBoard {
	private containerEl: HTMLElement;
	private folder: FolderDef;
	private tasks: TaskItem[];
	private cb: KanbanCallbacks;
	private draggedId: string | null = null;

	constructor(containerEl: HTMLElement, folder: FolderDef, tasks: TaskItem[], cb: KanbanCallbacks) {
		this.containerEl = containerEl;
		this.folder = folder;
		this.tasks = tasks;
		this.cb = cb;
	}

	updateTasks(tasks: TaskItem[]): void {
		this.tasks = tasks;
		this.render();
	}

	render(): void {
		this.containerEl.empty();
		const board = this.containerEl.createDiv({ cls: "ndd-board" });

		for (const col of COLUMNS) {
			const colEl = board.createDiv({ cls: "ndd-column", attr: { "data-column": col.id } });

			const header = colEl.createDiv({ cls: "ndd-column-header" });
			header.createSpan({ cls: `ndd-column-dot ndd-dot-${col.id}` });
			header.createSpan({ cls: "ndd-column-title", text: col.label });
			const colTasks = this.tasksFor(col.id);
			header.createSpan({ cls: "ndd-column-count", text: String(colTasks.length) });

			const list = colEl.createDiv({ cls: "ndd-card-list" });
			this.wireDropZone(list, col.id);

			for (const task of colTasks) {
				list.appendChild(this.renderCard(task));
			}

			const addRow = colEl.createDiv({ cls: "ndd-quick-add" });
			const input = addRow.createEl("input", {
				type: "text",
				placeholder: "Add a task…",
				cls: "ndd-quick-add-input",
			});
			const addBtn = addRow.createEl("button", { cls: "ndd-quick-add-btn" });
			setIcon(addBtn, "plus");

			const submit = () => {
				const text = input.value.trim();
				if (!text) return;
				this.createTask(text, col.id);
				input.value = "";
				this.render();
			};
			addBtn.addEventListener("click", submit);
			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") submit();
			});
		}
	}

	private tasksFor(col: ColumnId): TaskItem[] {
		return this.tasks
			.filter((t) => t.column === col)
			.sort((a, b) => a.order - b.order);
	}

	private createTask(text: string, column: ColumnId): void {
		const newTask: TaskItem = {
			id: uid(),
			folderId: this.folder.id,
			subProject: null,
			text,
			deadline: null,
			priority: "medium",
			column,
			completedDate: column === "done" ? isoToday() : null,
			createdDate: isoToday(),
			order: Date.now(),
		};
		this.tasks.push(newTask);
		this.cb.onTasksChanged();
	}

	private renderCard(task: TaskItem): HTMLElement {
		const card = document.createElement("div");
		card.className = "ndd-card";
		card.setAttribute("draggable", "true");
		card.setAttribute("data-task-id", task.id);

		const priorityTag = card.createDiv({ cls: `ndd-priority-tag ndd-priority-${task.priority}` });
		priorityTag.setAttr("aria-label", `${task.priority} priority`);

		const body = card.createDiv({ cls: "ndd-card-body" });
		body.createDiv({ cls: "ndd-card-text", text: task.text });

		if (task.subProject) {
			body.createDiv({ cls: "ndd-card-subproject", text: task.subProject });
		}

		const footer = body.createDiv({ cls: "ndd-card-footer" });
		if (task.deadline) {
			const dl = footer.createSpan({
				cls: `ndd-card-deadline ${isOverdue(task.deadline) && task.column !== "done" ? "ndd-overdue" : ""}`,
			});
			setIcon(dl.createSpan({ cls: "ndd-deadline-icon" }), "calendar");
			dl.createSpan({ text: formatDeadline(task.deadline) });
		}

		card.addEventListener("click", () => this.cb.onOpenTask(task, card));

		card.addEventListener("dragstart", (e) => {
			this.draggedId = task.id;
			card.addClass("ndd-dragging");
			e.dataTransfer?.setData("text/plain", task.id);
			if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
		});
		card.addEventListener("dragend", () => {
			card.removeClass("ndd-dragging");
			this.draggedId = null;
			this.containerEl.querySelectorAll(".ndd-dropzone-active").forEach((el) =>
				el.removeClass("ndd-dropzone-active")
			);
		});

		return card;
	}

	private wireDropZone(list: HTMLElement, column: ColumnId): void {
		list.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
			list.addClass("ndd-dropzone-active");

			// Fluid reordering: move the dragged card's DOM node to sit right
			// before the card whose midpoint the cursor has passed.
			const draggingEl = list.ownerDocument.querySelector(".ndd-dragging") as HTMLElement | null;
			if (!draggingEl) return;
			const siblings = Array.from(list.querySelectorAll(".ndd-card:not(.ndd-dragging)")) as HTMLElement[];
			let insertBefore: HTMLElement | null = null;
			for (const sib of siblings) {
				const box = sib.getBoundingClientRect();
				const midpoint = box.top + box.height / 2;
				if (e.clientY < midpoint) {
					insertBefore = sib;
					break;
				}
			}
			if (insertBefore) {
				if (draggingEl.parentElement !== list || draggingEl.nextSibling !== insertBefore) {
					list.insertBefore(draggingEl, insertBefore);
				}
			} else if (draggingEl.parentElement !== list || draggingEl.nextSibling !== null) {
				list.appendChild(draggingEl);
			}
		});

		list.addEventListener("dragleave", (e) => {
			if (!list.contains(e.relatedTarget as Node)) {
				list.removeClass("ndd-dropzone-active");
			}
		});

		list.addEventListener("drop", (e) => {
			e.preventDefault();
			list.removeClass("ndd-dropzone-active");
			const taskId = e.dataTransfer?.getData("text/plain") ?? this.draggedId;
			if (!taskId) return;
			const task = this.tasks.find((t) => t.id === taskId);
			if (!task) return;

			const wasDone = task.column === "done";
			task.column = column;
			if (column === "done" && !wasDone) {
				task.completedDate = isoToday();
				this.spawnRipple(list, e.clientX, e.clientY);
			} else if (column !== "done") {
				task.completedDate = null;
			}

			// Re-derive order for every card in this column from the DOM order
			// the fluid-reorder step above already produced.
			const orderedIds = Array.from(list.querySelectorAll(".ndd-card")).map((el) =>
				el.getAttribute("data-task-id")
			);
			orderedIds.forEach((id, idx) => {
				const t = this.tasks.find((x) => x.id === id);
				if (t) t.order = idx;
			});

			this.cb.onTasksChanged();
			this.render();
		});
	}

	/** Small red ripple that expands outward from the drop point. */
	private spawnRipple(list: HTMLElement, clientX: number, clientY: number): void {
		const box = list.getBoundingClientRect();
		const ripple = document.createElement("div");
		ripple.className = "ndd-ripple";
		ripple.style.left = `${clientX - box.left}px`;
		ripple.style.top = `${clientY - box.top}px`;
		list.appendChild(ripple);
		ripple.addEventListener("animationend", () => ripple.remove());
	}
}
