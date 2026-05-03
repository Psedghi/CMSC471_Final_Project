const data = window.SHOOTING_CENTERS_DATA || [];
const top5All = window.SHOOTING_CENTERS_TOP5 || [];
const chart = document.querySelector("[data-sc-chart]");
const tooltip = document.querySelector("[data-chart-tooltip]");
const story = document.querySelector("[data-sc-story]");
const metricName = document.querySelector("[data-metric-name]");
const metricReadout = document.querySelector("[data-metric-readout]");
const driverList = document.querySelector("[data-driver-list]");
const leaderList = document.querySelector("[data-leader-list]");
const metricButtons = Array.from(document.querySelectorAll("[data-metric]"));

const metrics = {
  total_fg3a: {
    label: "Total 3-point attempts by centers",
    shortLabel: "3PA",
    unit: "attempts",
    color: "#c8452d",
    formatter: (v) => Math.round(v).toLocaleString(),
    axisFormatter: (v) => Math.round(v).toLocaleString(),
    plain: "The total number of three-point shots attempted by all centers in the league each season.",
    readout: "This is the headline volume number. Centers went from a token presence beyond the arc to a genuine offensive weapon."
  },
  total_fg3m: {
    label: "Total 3-pointers made by centers",
    shortLabel: "3PM",
    unit: "makes",
    color: "#2457d6",
    formatter: (v) => Math.round(v).toLocaleString(),
    axisFormatter: (v) => Math.round(v).toLocaleString(),
    plain: "How many three-pointers centers actually converted each season.",
    readout: "Volume without accuracy means little, but centers have maintained decent shooting percentages even as attempts skyrocketed."
  },
  avg_fg3m: {
    label: "Average 3PM per center per season",
    shortLabel: "Avg 3PM",
    unit: "makes",
    color: "#247a55",
    formatter: (v) => v.toFixed(1),
    axisFormatter: (v) => Math.round(v),
    plain: "The average number of three-pointers made per center on a roster each season.",
    readout: "Even the average center now makes more threes than the top centers did in the early 2000s."
  },
  fg3_pct: {
    label: "Center 3-point percentage",
    shortLabel: "3P%",
    unit: "shooting percentage",
    color: "#7a3f98",
    formatter: (v) => `${(v * 100).toFixed(1)}%`,
    axisFormatter: (v) => `${Math.round(v * 100)}%`,
    plain: "The league-wide three-point percentage for centers, calculated across all attempts.",
    readout: "Centers have held their own from deep, with most seasons landing between 33–37%, comparable to perimeter players."
  }
};

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  return (value) => {
    if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
    return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
  };
}

function renderStory() {
  if (!story || data.length === 0) return;

  const first = data[0];
  const last = data[data.length - 1];
  const volumeMultiplier = (last.total_fg3a / first.total_fg3a).toFixed(1);
  const peakSeason = data.reduce((best, row) => row.total_fg3a > best.total_fg3a ? row : best, data[0]);

  const items = [
    {
      label: "Volume explosion",
      value: `${volumeMultiplier}×`,
      detail: `more 3PA in ${last.SEASON} vs ${first.SEASON}`
    },
    {
      label: "Avg per center",
      value: `${last.avg_fg3m.toFixed(1)} 3PM`,
      detail: `up from ${first.avg_fg3m.toFixed(1)} in ${first.SEASON}`
    },
    {
      label: "Peak season",
      value: `${peakSeason.total_fg3a.toLocaleString()} 3PA`,
      detail: `${peakSeason.SEASON}, ${peakSeason.total_fg3m.toLocaleString()} made`
    }
  ];

  story.innerHTML = items
    .map((item) => `
      <div>
        <span>${item.label}</span>
        <strong>${item.value}</strong>
        <small>${item.detail}</small>
      </div>
    `)
    .join("");
}

function renderDrivers() {
  if (!driverList || data.length === 0) return;

  const first = data[0];
  const last = data[data.length - 1];
  const driverKeys = ["total_fg3a", "total_fg3m", "avg_fg3m", "fg3_pct"];

  driverList.innerHTML = driverKeys
    .map((key) => {
      const metric = metrics[key];
      const start = first[key];
      const end = last[key];
      const high = Math.max(start, end);
      const low = Math.min(start, end);
      const range = Math.max(high - low, high * 0.04);
      const startWidth = 28 + ((start - low) / range) * 62;
      const endWidth = 28 + ((end - low) / range) * 62;

      return `
        <article class="driver-row">
          <div>
            <h3>${metric.shortLabel}</h3>
            <p>${metric.plain}</p>
          </div>
          <div class="driver-bars" aria-label="${metric.label}: ${first.SEASON} ${metric.formatter(start)}, ${last.SEASON} ${metric.formatter(end)}">
            <span style="width: ${startWidth}%"><b>${first.SEASON}</b>${metric.formatter(start)}</span>
            <span class="is-latest" style="width: ${endWidth}%; --bar-color: ${metric.color}"><b>${last.SEASON}</b>${metric.formatter(end)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderLeaders() {
  if (!leaderList || top5All.length === 0) return;

  const latestSeason = data[data.length - 1].SEASON;
  const leaders = top5All.filter((row) => row.SEASON === latestSeason);

  leaderList.innerHTML = leaders
    .map((row, index) => `
      <article class="leader-row">
        <span class="leader-rank">${index + 1}</span>
        <div class="leader-info">
          <strong>${row.PLAYER_NAME}</strong>
          <span>${row.FG3M} made / ${row.FG3A} att &middot; ${(row.FG3_PCT * 100).toFixed(1)}%</span>
        </div>
        <div class="leader-bar-wrap">
          <div class="leader-bar" style="width: ${Math.round((row.FG3M / leaders[0].FG3M) * 100)}%"></div>
          <span>${row.FG3M}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderChart(metricKey) {
  if (!chart || data.length === 0) return;

  hideTooltip();

  const metric = metrics[metricKey];
  const width = 860;
  const height = 430;
  const margin = { top: 34, right: 34, bottom: 56, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = data.map((row) => Number(row[metricKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.12 || 1;
  const yMin = Math.max(0, min - padding);
  const yMax = max + padding;
  const x = scaleLinear(0, data.length - 1, margin.left, margin.left + plotWidth);
  const y = scaleLinear(yMin, yMax, margin.top + plotHeight, margin.top);
  const linePath = data
    .map((row, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(row[metricKey]).toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(2)} ${(margin.top + plotHeight).toFixed(2)} L ${x(0).toFixed(2)} ${(margin.top + plotHeight).toFixed(2)} Z`;

  chart.innerHTML = "";

  const title = svgEl("title", { id: "sc-chart-title" });
  title.textContent = `${metric.label} by NBA season`;
  const desc = svgEl("desc", { id: "sc-chart-desc" });
  desc.textContent = `Line chart showing ${metric.label.toLowerCase()} from ${data[0].SEASON} through ${data[data.length - 1].SEASON}.`;
  chart.appendChild(title);
  chart.appendChild(desc);

  const defs = svgEl("defs");
  const grad = svgEl("linearGradient", { id: "sc-area-grad", x1: "0", y1: "0", x2: "0", y2: "1" });
  const stop1 = svgEl("stop", { offset: "0%", "stop-color": metric.color, "stop-opacity": "0.18" });
  const stop2 = svgEl("stop", { offset: "100%", "stop-color": metric.color, "stop-opacity": "0.0" });
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  chart.appendChild(defs);

  chart.appendChild(svgEl("path", {
    d: areaPath,
    fill: "url(#sc-area-grad)",
    stroke: "none"
  }));

  const grid = svgEl("g", { class: "chart-grid" });
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const value = yMin + ((yMax - yMin) / yTicks) * i;
    const yPos = y(value);
    grid.appendChild(svgEl("line", {
      x1: margin.left, x2: margin.left + plotWidth, y1: yPos, y2: yPos
    }));
    const label = svgEl("text", { x: margin.left - 12, y: yPos + 4, "text-anchor": "end" });
    label.textContent = metric.axisFormatter(value);
    grid.appendChild(label);
  }
  chart.appendChild(grid);

  const xAxis = svgEl("g", { class: "chart-axis" });
  data.forEach((row, i) => {
    if (i % 4 !== 0 && i !== data.length - 1) return;
    const label = svgEl("text", { x: x(i), y: height - 18, "text-anchor": "middle" });
    label.textContent = row.SEASON;
    xAxis.appendChild(label);
  });
  chart.appendChild(xAxis);

  chart.appendChild(svgEl("path", {
    class: "chart-line",
    d: linePath,
    fill: "none",
    stroke: metric.color,
    "stroke-width": 4,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }));

  const points = svgEl("g", { class: "chart-points" });
  data.forEach((row, i) => {
    const point = svgEl("circle", {
      cx: x(i),
      cy: y(row[metricKey]),
      r: 6,
      fill: "#ffffff",
      stroke: metric.color,
      "stroke-width": 3,
      tabindex: "0",
      role: "img",
      "aria-label": `${row.SEASON}: ${metric.formatter(row[metricKey])} ${metric.unit}`
    });
    point.addEventListener("pointerenter", (e) => showTooltip(e, row, metricKey));
    point.addEventListener("pointermove", (e) => showTooltip(e, row, metricKey));
    point.addEventListener("pointerleave", hideTooltip);
    point.addEventListener("click", (e) => { e.currentTarget.blur(); hideTooltip(); });
    point.addEventListener("focus", (e) => showTooltip(e, row, metricKey));
    point.addEventListener("blur", hideTooltip);
    points.appendChild(point);
  });
  chart.appendChild(points);

  if (metricName) metricName.textContent = metric.label;

  if (metricReadout) {
    const first = data[0];
    const last = data[data.length - 1];
    metricReadout.innerHTML = `
      <strong>${metric.plain}</strong>
      <span>${metric.readout}</span>
      <em>${first.SEASON}: ${metric.formatter(first[metricKey])}. ${last.SEASON}: ${metric.formatter(last[metricKey])}.</em>
    `;
  }
}

function showTooltip(event, row, metricKey) {
  if (!tooltip) return;

  const metric = metrics[metricKey];
  tooltip.innerHTML = `
    <strong>${row.SEASON}</strong>
    <span>${metric.shortLabel}: ${metric.formatter(row[metricKey])}</span>
    <span>Total 3PA: ${row.total_fg3a.toLocaleString()}</span>
    <span>Total 3PM: ${row.total_fg3m.toLocaleString()}</span>
    <span>3P%: ${(row.fg3_pct * 100).toFixed(1)}%</span>
  `;
  tooltip.hidden = false;

  const stage = document.querySelector(".chart-wrap").getBoundingClientRect();
  const pointRect = event.currentTarget.getBoundingClientRect();
  const clientX = event.clientX || pointRect.left + pointRect.width / 2;
  const clientY = event.clientY || pointRect.top + pointRect.height / 2;
  const left = Math.max(8, Math.min(clientX - stage.left + 14, stage.width - 220));
  const top = Math.max(clientY - stage.top - 18, 8);
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function hideTooltip() {
  if (tooltip) tooltip.hidden = true;
}

metricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    hideTooltip();
    metricButtons.forEach((b) => b.classList.toggle("is-active", b === button));
    renderChart(button.dataset.metric);
  });
});

if (chart) {
  chart.addEventListener("pointerleave", hideTooltip);
}

renderStory();
renderDrivers();
renderLeaders();
renderChart("total_fg3a");
