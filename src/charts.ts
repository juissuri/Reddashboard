const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs: Record<string, string | number> = {}
): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
	return el;
}

/**
 * Shows a shimmering skeleton placeholder inside `container`, then calls
 * `render` once the simulated load finishes and swaps it in.
 */
export function withSkeleton(
	container: HTMLElement,
	kind: "circle" | "bars" | "line",
	render: () => void,
	delay = 500
): void {
	container.empty();
	const skeleton = container.createDiv({ cls: `ndd-skeleton ndd-skeleton-${kind}` });
	if (kind === "circle") {
		skeleton.createDiv({ cls: "ndd-skeleton-circle" });
	} else if (kind === "bars") {
		for (let i = 0; i < 3; i++) skeleton.createDiv({ cls: "ndd-skeleton-bar" });
	} else {
		skeleton.createDiv({ cls: "ndd-skeleton-line" });
	}
	window.setTimeout(() => {
		if (!container.isConnected) return;
		container.empty();
		render();
	}, delay);
}

/** Animated circular "done today" ring with a counting percentage label. */
export function renderCircularProgress(
	container: HTMLElement,
	percent: number,
	doneCount: number,
	totalCount: number
): void {
	const size = 148;
	const stroke = 12;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;

	const wrap = container.createDiv({ cls: "ndd-circular" });
	const svg = svgEl("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}` });

	const defs = svgEl("defs");
	const filter = svgEl("filter", { id: "ndd-glow" });
	filter.appendChild(svgEl("feGaussianBlur", { stdDeviation: "3.2", result: "blur" }));
	const merge = svgEl("feMerge");
	merge.appendChild(svgEl("feMergeNode", { in: "blur" }));
	merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
	filter.appendChild(merge);
	defs.appendChild(filter);
	svg.appendChild(defs);

	const track = svgEl("circle", {
		cx: size / 2,
		cy: size / 2,
		r: radius,
		class: "ndd-ring-track",
		"stroke-width": stroke,
	});
	svg.appendChild(track);

	const ring = svgEl("circle", {
		cx: size / 2,
		cy: size / 2,
		r: radius,
		class: "ndd-ring-fill",
		"stroke-width": stroke,
		"stroke-dasharray": circumference,
		"stroke-dashoffset": circumference,
		filter: "url(#ndd-glow)",
	});
	ring.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
	svg.appendChild(ring);
	wrap.appendChild(svg);

	const label = wrap.createDiv({ cls: "ndd-circular-label" });
	const numberEl = label.createSpan({ cls: "ndd-circular-number", text: "0%" });
	label.createDiv({ cls: "ndd-circular-sub", text: `${doneCount}/${totalCount} done today` });

	// Trigger the stroke animation on the next frame so the transition fires.
	requestAnimationFrame(() => {
		const offset = circumference - (percent / 100) * circumference;
		ring.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)";
		ring.style.strokeDashoffset = String(offset);
	});

	// Animate the numeric counter in step with the ring.
	const duration = 1100;
	const start = performance.now();
	function tick(now: number) {
		const t = Math.min(1, (now - start) / duration);
		const eased = 1 - Math.pow(1 - t, 3);
		numberEl.setText(`${Math.round(eased * percent)}%`);
		if (t < 1) requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
}

/** Horizontal progress bars, one per sub-project, filling with an elastic ease. */
export function renderHorizontalBars(
	container: HTMLElement,
	bars: { label: string; percent: number }[]
): void {
	const wrap = container.createDiv({ cls: "ndd-hbars" });
	if (bars.length === 0) {
		wrap.createDiv({ cls: "ndd-empty-note", text: "No sub-projects yet." });
		return;
	}
	for (const bar of bars) {
		const row = wrap.createDiv({ cls: "ndd-hbar-row" });
		const top = row.createDiv({ cls: "ndd-hbar-top" });
		top.createSpan({ cls: "ndd-hbar-label", text: bar.label });
		const pct = top.createSpan({ cls: "ndd-hbar-pct", text: "0%" });
		const track = row.createDiv({ cls: "ndd-hbar-track" });
		const fill = track.createDiv({ cls: "ndd-hbar-fill" });
		fill.style.width = "0%";
		requestAnimationFrame(() => {
			fill.style.transition = "width 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)";
			fill.style.width = `${bar.percent}%`;
		});
		const duration = 900;
		const start = performance.now();
		function tick(now: number) {
			const t = Math.min(1, (now - start) / duration);
			pct.setText(`${Math.round(t * bar.percent)}%`);
			if (t < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}
}

/** 7-day "tasks completed per day" line chart with a glowing drawn-in line. */
export function renderWeeklyTrend(
	container: HTMLElement,
	points: { day: string; count: number }[]
): void {
	const width = 280;
	const height = 120;
	const padX = 14;
	const padY = 16;
	const max = Math.max(1, ...points.map((p) => p.count));

	const wrap = container.createDiv({ cls: "ndd-trend" });
	const svg = svgEl("svg", { width: "100%", height, viewBox: `0 0 ${width} ${height}` });

	const defs = svgEl("defs");
	const filter = svgEl("filter", { id: "ndd-line-glow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
	filter.appendChild(svgEl("feGaussianBlur", { stdDeviation: "2.4", result: "blur" }));
	const merge = svgEl("feMerge");
	merge.appendChild(svgEl("feMergeNode", { in: "blur" }));
	merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
	filter.appendChild(merge);
	defs.appendChild(filter);
	svg.appendChild(defs);

	const stepX = (width - padX * 2) / Math.max(1, points.length - 1);
	const coords = points.map((p, i) => {
		const x = padX + i * stepX;
		const y = height - padY - (p.count / max) * (height - padY * 2);
		return { x, y, p };
	});

	const pathD = coords
		.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
		.join(" ");

	const path = svgEl("path", {
		d: pathD,
		class: "ndd-trend-line",
		filter: "url(#ndd-line-glow)",
	});
	svg.appendChild(path);

	for (const c of coords) {
		const dot = svgEl("circle", { cx: c.x, cy: c.y, r: 3.2, class: "ndd-trend-dot" });
		svg.appendChild(dot);
	}

	wrap.appendChild(svg);

	const legend = wrap.createDiv({ cls: "ndd-trend-legend" });
	for (const p of points) legend.createSpan({ text: p.day });

	// Draw-in animation via dash offset.
	requestAnimationFrame(() => {
		try {
			const len = (path as SVGPathElement).getTotalLength();
			path.style.strokeDasharray = String(len);
			path.style.strokeDashoffset = String(len);
			path.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
			requestAnimationFrame(() => {
				path.style.strokeDashoffset = "0";
			});
		} catch {
			// getTotalLength can fail on a zero-length path; ignore.
		}
	});
}
