initVisualizationPage({
  title: "Load Management",
  description: "Modern NBA teams often manage star players like long-term investments. This visualization explains how availability, nightly minutes, planned rest, and injuries have shifted over time.",
  chartLabel: "Load management timeline",
  placeholder: "Line chart comparing workload signals for high-minute players by season.",
  dataSources: [
    "Illustrative season summary based on public NBA trend reporting",
    "Metrics shown: games played, minutes per game, estimated rest games, and injury games for stars"
  ]
});

const loadManagementData = [
  { season: "2004-05", avgGamesPlayed: 77.6, avgMinutesPerGame: 37.2, restGamesPerStar: 1.2, injuriesPerStar: 8.2 },
  { season: "2006-07", avgGamesPlayed: 76.9, avgMinutesPerGame: 36.8, restGamesPerStar: 1.4, injuriesPerStar: 8.6 },
  { season: "2008-09", avgGamesPlayed: 76.1, avgMinutesPerGame: 36.2, restGamesPerStar: 1.8, injuriesPerStar: 9.1 },
  { season: "2010-11", avgGamesPlayed: 75.4, avgMinutesPerGame: 35.7, restGamesPerStar: 2.3, injuriesPerStar: 9.8 },
  { season: "2012-13", avgGamesPlayed: 74.3, avgMinutesPerGame: 35.2, restGamesPerStar: 2.9, injuriesPerStar: 9.4 },
  { season: "2014-15", avgGamesPlayed: 72.8, avgMinutesPerGame: 34.6, restGamesPerStar: 3.8, injuriesPerStar: 8.9 },
  { season: "2016-17", avgGamesPlayed: 71.4, avgMinutesPerGame: 34.1, restGamesPerStar: 4.9, injuriesPerStar: 8.3 },
  { season: "2018-19", avgGamesPlayed: 70.1, avgMinutesPerGame: 33.5, restGamesPerStar: 6.1, injuriesPerStar: 7.8 },
  { season: "2020-21", avgGamesPlayed: 67.5, avgMinutesPerGame: 33.1, restGamesPerStar: 8.2, injuriesPerStar: 8.9 },
  { season: "2022-23", avgGamesPlayed: 69.4, avgMinutesPerGame: 33.6, restGamesPerStar: 7.3, injuriesPerStar: 7.2 },
  { season: "2024-25", avgGamesPlayed: 70.2, avgMinutesPerGame: 33.9, restGamesPerStar: 6.8, injuriesPerStar: 6.7 }
];

const metricConfig = {
  avgGamesPlayed: {
    label: "Availability",
    chartLabel: "Games played",
    description: "This shows how often star-level players appeared in regular-season games. Lower values mean stars are sitting out more often.",
    color: "#1f6feb",
    unit: "games",
    formatter: (value) => `${value.toFixed(1)} games`,
    context: "A decline here means fans are less likely to see every star on a random regular-season night."
  },
  avgMinutesPerGame: {
    label: "Nightly workload",
    chartLabel: "Minutes per game",
    description: "This shows how heavily stars are used when they do play. Fewer minutes can reduce fatigue even if the player still appears in the game.",
    color: "#2b9348",
    unit: "minutes",
    formatter: (value) => `${value.toFixed(1)} minutes`,
    context: "A decline here means teams are trimming the nightly burden, not just deciding whether a player plays at all."
  },
  restGamesPerStar: {
    label: "Planned rest",
    chartLabel: "Rest games",
    description: "This estimates how many games star-level players miss because teams are managing workload across the season.",
    color: "#c2410c",
    unit: "rest games",
    formatter: (value) => `${value.toFixed(1)} rest games`,
    context: "An increase here captures the most debated part of load management: healthy or near-healthy stars sitting out."
  },
  injuriesPerStar: {
    label: "Injuries",
    chartLabel: "Injury games",
    description: "This shows games missed per star player due to documented injuries — separate from planned rest. A downward trend suggests load management may be reducing injury burden.",
    color: "#d97706",
    unit: "injury games",
    formatter: (value) => `${value.toFixed(1)} injury games`,
    context: "A decline here is the hoped-for payoff of load management: fewer meaningful games lost to injury."
  }
};

const chart = document.querySelector("[data-load-chart]");
const tooltip = document.querySelector("[data-load-tooltip]");
const descriptionEl = document.querySelector("[data-load-description]");
const metricTitleEl = document.querySelector("[data-load-metric-title]");
const buttons = Array.from(document.querySelectorAll("[data-load-metric]"));
const overlayButton = document.querySelector("[data-load-overlay]");
const firstSeasonEl = document.querySelector("[data-load-first-season]");
const firstValueEl = document.querySelector("[data-load-first-value]");
const lastSeasonEl = document.querySelector("[data-load-last-season]");
const lastValueEl = document.querySelector("[data-load-last-value]");
const deltaEl = document.querySelector("[data-load-delta]");
const contextEl = document.querySelector("[data-load-context]");

const width = 860;
const height = 420;
const margin = { top: 32, right: 72, bottom: 56, left: 72 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
let activeMetric = "avgGamesPlayed";
let overlayActive = false;

function svgEl(name, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  return (value) => {
    if (domainMax === domainMin) {
      return (rangeMin + rangeMax) / 2;
    }
    return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
  };
}

function drawMetric(metricKey) {
  if (!chart) {
    return;
  }

  hideTooltip();

  const showOverlay = overlayActive && metricKey !== "injuriesPerStar";
  const config = metricConfig[metricKey];
  const values = loadManagementData.map((row) => Number(row[metricKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.15, 0.6);
  const yMin = min - padding;
  const yMax = max + padding;
  const x = scaleLinear(0, loadManagementData.length - 1, margin.left, margin.left + plotWidth);
  const y = scaleLinear(yMin, yMax, margin.top + plotHeight, margin.top);
  const linePath = loadManagementData
    .map((row, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(row[metricKey]).toFixed(2)}`)
    .join(" ");

  chart.innerHTML = "";

  const title = svgEl("title", { id: "load-chart-title" });
  title.textContent = showOverlay ? `${config.chartLabel} vs. Injury games` : `${config.chartLabel} trend`;
  const desc = svgEl("desc", { id: "load-chart-desc" });
  desc.textContent = `Line chart showing ${config.chartLabel.toLowerCase()} from ${loadManagementData[0].season} to ${loadManagementData[loadManagementData.length - 1].season}.`;
  chart.appendChild(title);
  chart.appendChild(desc);

  // Grid and left y-axis
  const grid = svgEl("g", { class: "chart-grid" });
  const yTicks = 5;
  for (let index = 0; index <= yTicks; index += 1) {
    const value = yMin + ((yMax - yMin) / yTicks) * index;
    const yPos = y(value);
    grid.appendChild(svgEl("line", {
      x1: margin.left,
      x2: margin.left + plotWidth,
      y1: yPos,
      y2: yPos
    }));
    const label = svgEl("text", {
      x: margin.left - 12,
      y: yPos + 4,
      "text-anchor": "end"
    });
    label.textContent = value.toFixed(1);
    grid.appendChild(label);
  }
  chart.appendChild(grid);

  // X-axis
  const xAxis = svgEl("g", { class: "chart-axis" });
  loadManagementData.forEach((row, index) => {
    if (index % 2 !== 0 && index !== loadManagementData.length - 1) {
      return;
    }
    const label = svgEl("text", {
      x: x(index),
      y: height - 20,
      "text-anchor": "middle"
    });
    label.textContent = row.season;
    xAxis.appendChild(label);
  });
  chart.appendChild(xAxis);

  // Primary line
  chart.appendChild(svgEl("path", {
    class: "chart-line",
    d: linePath,
    fill: "none",
    stroke: config.color,
    "stroke-width": 4,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }));

  // Primary points
  const points = svgEl("g", { class: "chart-points" });
  loadManagementData.forEach((row, index) => {
    const point = svgEl("circle", {
      class: "chart-point",
      cx: x(index),
      cy: y(row[metricKey]),
      r: 5.5,
      fill: "#ffffff",
      stroke: config.color,
      "stroke-width": 3,
      tabindex: "0",
      role: "img",
      "aria-label": `${row.season}: ${config.formatter(row[metricKey])}`
    });
    point.addEventListener("pointerenter", (event) => showTooltip(event, row, metricKey));
    point.addEventListener("pointermove", (event) => showTooltip(event, row, metricKey));
    point.addEventListener("pointerleave", hideTooltip);
    point.addEventListener("click", (event) => {
      event.currentTarget.blur();
      hideTooltip();
    });
    point.addEventListener("focus", (event) => showTooltip(event, row, metricKey));
    point.addEventListener("blur", hideTooltip);
    points.appendChild(point);
  });
  chart.appendChild(points);

  // Overlay: injury line on right y-axis
  if (showOverlay) {
    const injConfig = metricConfig.injuriesPerStar;
    const injValues = loadManagementData.map((row) => row.injuriesPerStar);
    const injMin = Math.min(...injValues);
    const injMax = Math.max(...injValues);
    const injPad = Math.max((injMax - injMin) * 0.15, 0.3);
    const injYMin = injMin - injPad;
    const injYMax = injMax + injPad;
    const yInj = scaleLinear(injYMin, injYMax, margin.top + plotHeight, margin.top);

    const injPath = loadManagementData
      .map((row, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${yInj(row.injuriesPerStar).toFixed(2)}`)
      .join(" ");

    // Right y-axis labels for injuries
    const rightAxis = svgEl("g", { class: "chart-axis chart-axis-right" });
    for (let index = 0; index <= yTicks; index += 1) {
      const value = injYMin + ((injYMax - injYMin) / yTicks) * index;
      const yPos = yInj(value);
      const label = svgEl("text", {
        x: margin.left + plotWidth + 12,
        y: yPos + 4,
        "text-anchor": "start"
      });
      label.textContent = value.toFixed(1);
      rightAxis.appendChild(label);
    }
    const axisTag = svgEl("text", {
      x: margin.left + plotWidth + 12,
      y: margin.top - 10,
      "text-anchor": "start",
      class: "chart-axis-right-label"
    });
    axisTag.textContent = "Inj. games →";
    rightAxis.appendChild(axisTag);
    chart.appendChild(rightAxis);

    // Injury line (dashed)
    chart.appendChild(svgEl("path", {
      class: "chart-line chart-line-overlay",
      d: injPath,
      fill: "none",
      stroke: injConfig.color,
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-dasharray": "8 4"
    }));

    // Injury points
    const injPoints = svgEl("g", { class: "chart-points" });
    loadManagementData.forEach((row, index) => {
      const point = svgEl("circle", {
        class: "chart-point",
        cx: x(index),
        cy: yInj(row.injuriesPerStar),
        r: 4.5,
        fill: "#ffffff",
        stroke: injConfig.color,
        "stroke-width": 2.5,
        tabindex: "0",
        role: "img",
        "aria-label": `${row.season}: ${injConfig.formatter(row.injuriesPerStar)}`
      });
      point.addEventListener("pointerenter", (event) => showTooltip(event, row, "injuriesPerStar"));
      point.addEventListener("pointermove", (event) => showTooltip(event, row, "injuriesPerStar"));
      point.addEventListener("pointerleave", hideTooltip);
      point.addEventListener("click", (event) => {
        event.currentTarget.blur();
        hideTooltip();
      });
      point.addEventListener("focus", (event) => showTooltip(event, row, "injuriesPerStar"));
      point.addEventListener("blur", hideTooltip);
      injPoints.appendChild(point);
    });
    chart.appendChild(injPoints);

    // Legend
    const legend = svgEl("g", { class: "chart-legend" });
    const legendY = margin.top / 2 + 2;
    const legendStartX = margin.left + plotWidth / 2 - 110;

    legend.appendChild(svgEl("line", {
      x1: legendStartX,
      x2: legendStartX + 22,
      y1: legendY,
      y2: legendY,
      stroke: config.color,
      "stroke-width": 4,
      "stroke-linecap": "round"
    }));
    const lText1 = svgEl("text", {
      x: legendStartX + 28,
      y: legendY + 4,
      "text-anchor": "start",
      class: "chart-legend-text"
    });
    lText1.textContent = config.chartLabel;
    legend.appendChild(lText1);

    const injLegendX = legendStartX + 150;
    legend.appendChild(svgEl("line", {
      x1: injLegendX,
      x2: injLegendX + 22,
      y1: legendY,
      y2: legendY,
      stroke: injConfig.color,
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-dasharray": "8 4"
    }));
    const lText2 = svgEl("text", {
      x: injLegendX + 28,
      y: legendY + 4,
      "text-anchor": "start",
      class: "chart-legend-text"
    });
    lText2.textContent = injConfig.chartLabel;
    legend.appendChild(lText2);

    chart.appendChild(legend);
  }

  renderSummary(metricKey, showOverlay);

  if (metricTitleEl) {
    metricTitleEl.textContent = showOverlay
      ? `${config.chartLabel} vs. Injuries`
      : config.chartLabel;
  }
  if (descriptionEl) {
    descriptionEl.textContent = showOverlay
      ? `${config.description} The dashed line shows injury games per star — overlay both to see if load management reduces injuries.`
      : config.description;
  }
}

function renderSummary(metricKey, showOverlay) {
  const config = metricConfig[metricKey];
  const first = loadManagementData[0];
  const last = loadManagementData[loadManagementData.length - 1];
  const delta = last[metricKey] - first[metricKey];
  const direction = delta >= 0 ? "increased" : "decreased";
  const sign = delta >= 0 ? "+" : "-";

  if (firstSeasonEl) {
    firstSeasonEl.textContent = first.season;
  }
  if (firstValueEl) {
    firstValueEl.textContent = `${config.chartLabel}: ${config.formatter(first[metricKey])}`;
  }
  if (lastSeasonEl) {
    lastSeasonEl.textContent = last.season;
  }
  if (lastValueEl) {
    lastValueEl.textContent = `${config.chartLabel}: ${config.formatter(last[metricKey])}`;
  }
  if (deltaEl) {
    deltaEl.textContent = `${sign}${Math.abs(delta).toFixed(1)} ${config.unit}`;
  }
  if (contextEl) {
    let text = `${config.context} In this view, ${config.chartLabel.toLowerCase()} ${direction} from ${first.season} to ${last.season}.`;
    if (showOverlay) {
      const injDelta = last.injuriesPerStar - first.injuriesPerStar;
      const injDir = injDelta >= 0 ? "increased" : "decreased";
      text += ` Injury games ${injDir} from ${first.injuriesPerStar.toFixed(1)} to ${last.injuriesPerStar.toFixed(1)} over the same span.`;
    }
    contextEl.textContent = text;
  }
}

function showTooltip(event, row, metricKey) {
  if (!tooltip) {
    return;
  }

  const config = metricConfig[metricKey];
  tooltip.innerHTML = `
    <strong>${row.season}</strong>
    <span>${config.chartLabel}: ${config.formatter(row[metricKey])}</span>
    <span>Availability: ${row.avgGamesPlayed.toFixed(1)} games</span>
    <span>Nightly workload: ${row.avgMinutesPerGame.toFixed(1)} min</span>
    <span>Planned rest: ${row.restGamesPerStar.toFixed(1)} games</span>
    <span>Injury games: ${row.injuriesPerStar.toFixed(1)} games</span>
  `;
  tooltip.hidden = false;

  const wrapRect = document.querySelector(".load-chart-wrap").getBoundingClientRect();
  const pointRect = event.currentTarget.getBoundingClientRect();
  const clientX = event.clientX || pointRect.left + pointRect.width / 2;
  const clientY = event.clientY || pointRect.top + pointRect.height / 2;
  const left = Math.max(8, Math.min(clientX - wrapRect.left + 12, wrapRect.width - 230));
  const top = Math.max(8, clientY - wrapRect.top - 14);
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function hideTooltip() {
  if (tooltip) {
    tooltip.hidden = true;
  }
}

function syncOverlayButtonState() {
  if (!overlayButton) {
    return;
  }
  const isInjuries = activeMetric === "injuriesPerStar";
  overlayButton.disabled = isInjuries;
  overlayButton.setAttribute("aria-pressed", String(!isInjuries && overlayActive));
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    activeMetric = button.dataset.loadMetric;
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    hideTooltip();
    syncOverlayButtonState();
    drawMetric(activeMetric);
  });
});

if (overlayButton) {
  overlayButton.addEventListener("click", () => {
    if (activeMetric === "injuriesPerStar") {
      return;
    }
    overlayActive = !overlayActive;
    overlayButton.setAttribute("aria-pressed", String(overlayActive));
    drawMetric(activeMetric);
  });
}

if (chart) {
  chart.addEventListener("pointerleave", hideTooltip);
}

syncOverlayButtonState();
drawMetric(activeMetric);
