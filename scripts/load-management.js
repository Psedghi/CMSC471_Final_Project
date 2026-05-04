initVisualizationPage({
  title: "Load Management",
  description: "Teams now protect high-minute players more aggressively. Use the metric tabs to compare changes in games played, minutes per game, and planned rest days for star-level workloads.",
  chartLabel: "Load management timeline",
  placeholder: "D3 line chart comparing workload signals for high-minute players by season.",
  dataSources: [
    "Illustrative season summary based on public NBA trend reporting",
    "Metrics shown: average games played, average minutes per game, average rest games for stars"
  ]
});

const loadManagementData = [
  { season: "2004-05", avgGamesPlayed: 77.6, avgMinutesPerGame: 37.2, restGamesPerStar: 1.2 },
  { season: "2006-07", avgGamesPlayed: 76.9, avgMinutesPerGame: 36.8, restGamesPerStar: 1.4 },
  { season: "2008-09", avgGamesPlayed: 76.1, avgMinutesPerGame: 36.2, restGamesPerStar: 1.8 },
  { season: "2010-11", avgGamesPlayed: 75.4, avgMinutesPerGame: 35.7, restGamesPerStar: 2.3 },
  { season: "2012-13", avgGamesPlayed: 74.3, avgMinutesPerGame: 35.2, restGamesPerStar: 2.9 },
  { season: "2014-15", avgGamesPlayed: 72.8, avgMinutesPerGame: 34.6, restGamesPerStar: 3.8 },
  { season: "2016-17", avgGamesPlayed: 71.4, avgMinutesPerGame: 34.1, restGamesPerStar: 4.9 },
  { season: "2018-19", avgGamesPlayed: 70.1, avgMinutesPerGame: 33.5, restGamesPerStar: 6.1 },
  { season: "2020-21", avgGamesPlayed: 67.5, avgMinutesPerGame: 33.1, restGamesPerStar: 8.2 },
  { season: "2022-23", avgGamesPlayed: 69.4, avgMinutesPerGame: 33.6, restGamesPerStar: 7.3 },
  { season: "2024-25", avgGamesPlayed: 70.2, avgMinutesPerGame: 33.9, restGamesPerStar: 6.8 }
];

const metricConfig = {
  avgGamesPlayed: {
    label: "Games played",
    description: "Average games played by star-level, high-minute players each season.",
    color: "#1f6feb",
    unit: "games",
    formatter: (value) => `${value.toFixed(1)} games`
  },
  avgMinutesPerGame: {
    label: "Minutes per game",
    description: "Average minutes per game for the same group of high-workload players.",
    color: "#2b9348",
    unit: "minutes",
    formatter: (value) => `${value.toFixed(1)} mpg`
  },
  restGamesPerStar: {
    label: "Rest games",
    description: "Estimated games missed primarily for rest management among stars.",
    color: "#c2410c",
    unit: "rest games",
    formatter: (value) => `${value.toFixed(1)} rest games`
  }
};

const svg = d3.select("[data-load-chart]");
const tooltip = document.querySelector("[data-load-tooltip]");
const descriptionEl = document.querySelector("[data-load-description]");
const buttons = Array.from(document.querySelectorAll("[data-load-metric]"));
const firstSeasonEl = document.querySelector("[data-load-first-season]");
const firstValueEl = document.querySelector("[data-load-first-value]");
const lastSeasonEl = document.querySelector("[data-load-last-season]");
const lastValueEl = document.querySelector("[data-load-last-value]");
const deltaEl = document.querySelector("[data-load-delta]");
const contextEl = document.querySelector("[data-load-context]");

const width = 860;
const height = 420;
const margin = { top: 28, right: 36, bottom: 56, left: 72 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const x = d3
  .scalePoint()
  .domain(loadManagementData.map((d) => d.season))
  .range([margin.left, margin.left + plotWidth]);

let activeMetric = "avgGamesPlayed";

function drawMetric(metricKey) {
  const config = metricConfig[metricKey];
  const values = loadManagementData.map((d) => d[metricKey]);
  const min = d3.min(values);
  const max = d3.max(values);
  const padding = Math.max((max - min) * 0.15, 0.6);
  const y = d3
    .scaleLinear()
    .domain([min - padding, max + padding])
    .range([margin.top + plotHeight, margin.top]);

  const line = d3
    .line()
    .x((d) => x(d.season))
    .y((d) => y(d[metricKey]))
    .curve(d3.curveMonotoneX);

  svg.selectAll("*").remove();
  svg
    .append("title")
    .text(`${config.label} trend from ${loadManagementData[0].season} to ${loadManagementData[loadManagementData.length - 1].season}`);
  svg
    .append("desc")
    .text(`Line chart of ${config.label.toLowerCase()} for high-minute NBA players by season.`);

  const yAxis = d3
    .axisLeft(y)
    .ticks(5)
    .tickSize(-plotWidth)
    .tickFormat((value) => value.toFixed(1));

  svg
    .append("g")
    .attr("class", "chart-grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll("text").attr("x", -10));

  svg
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${margin.top + plotHeight})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(loadManagementData.map((d) => d.season).filter((_, i) => i % 2 === 0 || i === loadManagementData.length - 1))
    )
    .call((g) => g.select(".domain").remove());

  svg
    .append("path")
    .datum(loadManagementData)
    .attr("class", "chart-line")
    .attr("fill", "none")
    .attr("stroke", config.color)
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("d", line);

  svg
    .append("g")
    .selectAll("circle")
    .data(loadManagementData)
    .join("circle")
    .attr("class", "chart-point")
    .attr("cx", (d) => x(d.season))
    .attr("cy", (d) => y(d[metricKey]))
    .attr("r", 5.5)
    .attr("fill", "#ffffff")
    .attr("stroke", config.color)
    .attr("stroke-width", 3)
    .attr("tabindex", 0)
    .on("pointerenter", (event, d) => showTooltip(event, d, metricKey))
    .on("pointermove", (event, d) => showTooltip(event, d, metricKey))
    .on("pointerleave", hideTooltip)
    .on("focus", (event, d) => showTooltip(event, d, metricKey))
    .on("blur", hideTooltip);

  renderSummary(metricKey);
  if (descriptionEl) {
    descriptionEl.textContent = config.description;
  }
}

function renderSummary(metricKey) {
  const config = metricConfig[metricKey];
  const first = loadManagementData[0];
  const last = loadManagementData[loadManagementData.length - 1];
  const delta = last[metricKey] - first[metricKey];
  const direction = delta >= 0 ? "increased" : "decreased";
  const sign = delta >= 0 ? "+" : "";

  if (firstSeasonEl) {
    firstSeasonEl.textContent = first.season;
  }
  if (firstValueEl) {
    firstValueEl.textContent = `${config.label}: ${config.formatter(first[metricKey])}`;
  }
  if (lastSeasonEl) {
    lastSeasonEl.textContent = last.season;
  }
  if (lastValueEl) {
    lastValueEl.textContent = `${config.label}: ${config.formatter(last[metricKey])}`;
  }
  if (deltaEl) {
    deltaEl.textContent = `${sign}${Math.abs(delta).toFixed(1)} ${config.unit}`;
  }
  if (contextEl) {
    contextEl.textContent = `Across this time window, ${config.label.toLowerCase()} ${direction} while teams became more intentional about managing star workloads.`;
  }
}

function showTooltip(event, row, metricKey) {
  if (!tooltip) {
    return;
  }
  const config = metricConfig[metricKey];
  tooltip.innerHTML = `
    <strong>${row.season}</strong>
    <span>${config.label}: ${config.formatter(row[metricKey])}</span>
    <span>Games played: ${row.avgGamesPlayed.toFixed(1)}</span>
    <span>Minutes: ${row.avgMinutesPerGame.toFixed(1)} mpg</span>
  `;
  tooltip.hidden = false;

  const wrapRect = document.querySelector(".load-chart-wrap").getBoundingClientRect();
  const left = Math.max(8, Math.min(event.clientX - wrapRect.left + 12, wrapRect.width - 220));
  const top = Math.max(8, event.clientY - wrapRect.top - 14);
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function hideTooltip() {
  if (tooltip) {
    tooltip.hidden = true;
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    activeMetric = button.dataset.loadMetric;
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    hideTooltip();
    drawMetric(activeMetric);
  });
});

drawMetric(activeMetric);
