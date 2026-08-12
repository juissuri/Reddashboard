const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs: Record<string, string | number> = {}
): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
	return el;
}

export function withSkeleton(
	container: HTMLElement,
	kind: "bars" | "line",
	render: () => void,
	delay = 500
): void {
	container.empty();
	const skeleton = container.createDiv({ cls: `ndd-skeleton ndd-skeleton-${kind}` });
	if (kind === "bars") {
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

	requestAnimationFrame(() => {
		try {
			const len = (path as SVGPathElement).getTotalLength();
			path.style.strokeDasharray = String(len);
			path.style.strokeDashoffset = String(len);
			path.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
			requestAnimationFrame(() => {
				path.style.strokeDashoffset = "0";
			});
		} catch {}
	});
}