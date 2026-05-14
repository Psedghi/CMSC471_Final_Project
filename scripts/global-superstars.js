const chart = document.querySelector("[data-gs-chart]");
const tooltip = document.querySelector("[data-chart-tooltip]");
const metricName = document.querySelector("[data-metric-name]");
const driverList = document.querySelector("[data-driver-list]");
const metricButtons = Array.from(document.querySelectorAll("[data-metric]"));

const metrics = {
  intl_players: {
    label: "International players in the NBA",
    shortLabel: "Players",
    yAxisLabel: "Intl. players on rosters",
    unit: "players",
    color: "#c8452d",
    formatter: (v) => Math.round(v).toString(),
  },
  countries: {
    label: "Countries represented",
    shortLabel: "Countries",
    yAxisLabel: "Countries represented",
    unit: "countries",
    color: "#2457d6",
    formatter: (v) => Math.round(v).toString(),
  }
};

let data = [];
let mvps = [];
let mvpSeasonSet = new Set();

Promise.all([
  d3.csv("../data/international_season_summary.csv", (d) => ({
    SEASON: d.SEASON,
    intl_players: +d.intl_players,
    countries: +d.countries
  })),
  d3.csv("../data/mvp_winners.csv", (d) => ({
    SEASON: d.SEASON,
    player: d.PLAYER_NAME,
    country: d.COUNTRY,
    is_international: d.IS_INTERNATIONAL === "True"
  }))
]).then(([summaryRows, mvpRows]) => {
  data = summaryRows;
  mvps = mvpRows.filter((d) => d.is_international);
  mvpSeasonSet = new Set(mvps.map((m) => m.SEASON));

  renderDrivers();
  renderChart("intl_players");
}).catch((err) => {
  console.error("Failed to load data:", err);
});

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


function renderDrivers() {
  if (!driverList || data.length === 0) return;
  const first = data[0];
  const last = data[data.length - 1];

  const rows = [
    { label: "International Players", plain: "Total non-USA born players on rosters each season.", firstVal: first.intl_players, lastVal: last.intl_players, color: "#c8452d" },
    { label: "Countries Represented", plain: "Distinct home countries sending players to the NBA.", firstVal: first.countries, lastVal: last.countries, color: "#2457d6" }
  ];

  driverList.innerHTML = rows.map((row) => {
    const maxVal = Math.max(row.firstVal, row.lastVal);
    const startWidth = Math.round((row.firstVal / maxVal) * 88) + 4;
    const endWidth = Math.round((row.lastVal / maxVal) * 88) + 4;
    return `
      <article class="driver-row">
        <div>
          <h3>${row.label}</h3>
          <p>${row.plain}</p>
        </div>
        <div class="driver-bars" aria-label="${row.label}: ${first.SEASON} ${row.firstVal}, ${last.SEASON} ${row.lastVal}">
          <span style="width: ${startWidth}%"><b>${first.SEASON}</b>${row.firstVal}</span>
          <span class="is-latest" style="width: ${endWidth}%; --bar-color: ${row.color}"><b>${last.SEASON}</b>${row.lastVal}</span>
        </div>
      </article>
    `;
  }).join("");
}


function renderChart(metricKey) {
  if (!chart || data.length === 0) return;
  hideTooltip();

  const metric = metrics[metricKey];
  const width = 860;
  const height = 430;
  const margin = { top: 34, right: 34, bottom: 72, left: 92 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = data.map((row) => Number(row[metricKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.15 || 2;
  const yMin = min - padding;
  const yMax = max + padding;
  const x = scaleLinear(0, data.length - 1, margin.left, margin.left + plotWidth);
  const y = scaleLinear(yMin, yMax, margin.top + plotHeight, margin.top);
  const linePath = data
    .map((row, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(row[metricKey]).toFixed(2)}`)
    .join(" ");

  chart.innerHTML = "";

  const titleEl = svgEl("title", { id: "gs-chart-title" });
  titleEl.textContent = `${metric.label} by NBA season`;
  const descEl = svgEl("desc", { id: "gs-chart-desc" });
  descEl.textContent = `Line chart showing ${metric.label.toLowerCase()} from ${data[0].SEASON} through ${data[data.length - 1].SEASON}.`;
  chart.appendChild(titleEl);
  chart.appendChild(descEl);

  const grid = svgEl("g", { class: "chart-grid" });
  for (let i = 0; i <= 5; i++) {
    const val = yMin + ((yMax - yMin) / 5) * i;
    const yPos = y(val);
    grid.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + plotWidth, y1: yPos, y2: yPos }));
    const label = svgEl("text", { x: margin.left - 12, y: yPos + 4, "text-anchor": "end" });
    label.textContent = metric.formatter(val);
    grid.appendChild(label);
  }
  chart.appendChild(grid);

  const xAxis = svgEl("g", { class: "chart-axis" });
  data.forEach((row, i) => {
    if (i % 4 !== 0 && i !== data.length - 1) return;
    const label = svgEl("text", { x: x(i), y: height - 34, "text-anchor": "middle" });
    label.textContent = row.SEASON;
    xAxis.appendChild(label);
  });
  const xAxisTitle = svgEl("text", {
    class: "chart-axis-title chart-axis-title--x",
    x: margin.left + plotWidth / 2,
    y: height - 8,
    "text-anchor": "middle"
  });
  xAxisTitle.textContent = "Season";
  xAxis.appendChild(xAxisTitle);
  chart.appendChild(xAxis);

  const yMid = margin.top + plotHeight / 2;
  const yAxisTitle = svgEl("text", {
    class: "chart-axis-title chart-axis-title--y",
    x: 20,
    y: yMid,
    "text-anchor": "middle",
    transform: `rotate(-90, 20, ${yMid})`
  });
  yAxisTitle.textContent = metric.yAxisLabel;
  chart.appendChild(yAxisTitle);

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
    const isMvp = mvpSeasonSet.has(row.SEASON);
    const cx = x(i);
    const cy = y(row[metricKey]);

    if (isMvp) {
      const s = 7;
      const diamond = svgEl("polygon", {
        points: `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`,
        fill: "#f5a623",
        stroke: "#c8452d",
        "stroke-width": 1.5,
        style: "cursor:pointer"
      });
      diamond.addEventListener("pointerenter", (e) => showTooltip(e, row));
      diamond.addEventListener("pointermove", (e) => showTooltip(e, row));
      diamond.addEventListener("pointerleave", hideTooltip);
      points.appendChild(diamond);
    } else {
      const circle = svgEl("circle", {
        cx,
        cy,
        r: 5,
        fill: "#ffffff",
        stroke: metric.color,
        "stroke-width": 3,
        tabindex: "0",
        role: "img",
        "aria-label": `${row.SEASON}: ${metric.formatter(row[metricKey])} ${metric.unit}`
      });
      circle.addEventListener("pointerenter", (e) => showTooltip(e, row));
      circle.addEventListener("pointermove", (e) => showTooltip(e, row));
      circle.addEventListener("pointerleave", hideTooltip);
      circle.addEventListener("focus", (e) => showTooltip(e, row));
      circle.addEventListener("blur", hideTooltip);
      points.appendChild(circle);
    }
  });
  chart.appendChild(points);

  if (metricName) metricName.textContent = metric.label;
}

function showTooltip(event, row) {
  if (!tooltip) return;
  const mvp = mvps.find((m) => m.SEASON === row.SEASON);
  tooltip.innerHTML = `
    <strong>${row.SEASON}</strong>
    <span>Intl. players: ${row.intl_players}</span>
    <span>Countries: ${row.countries}</span>
    ${mvp ? `<span class="tooltip-mvp">MVP: ${mvp.player} (${mvp.country})</span>` : ""}
  `;
  tooltip.hidden = false;

  const stage = document.querySelector(".chart-wrap").getBoundingClientRect();
  const clientX = event.clientX || event.currentTarget.getBoundingClientRect().left;
  const clientY = event.clientY || event.currentTarget.getBoundingClientRect().top;
  const left = Math.max(8, Math.min(clientX - stage.left + 14, stage.width - 230));
  const top = Math.max(clientY - stage.top - 18, 8);
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function hideTooltip() {
  if (tooltip) tooltip.hidden = true;
}

metricButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    hideTooltip();
    metricButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    renderChart(btn.dataset.metric || "intl_players");
  });
});

if (chart) chart.addEventListener("pointerleave", hideTooltip);
