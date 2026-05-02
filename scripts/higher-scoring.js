initVisualizationPage({
  title: "Higher Scoring",
  description: "NBA teams score far more than they did two decades ago. Use the tabs to separate the main ingredients: more scoring, more possessions, more threes, and better shot-making.",
  chartLabel: "Scoring timeline",
  placeholder: "League-wide NBA scoring trends from 2004-05 through 2024-25.",
  dataSources: [
    "data/higher_scoring.py",
    "data/higher_scoring_season_summary.csv",
    "data/higher_scoring_team_stats.csv"
  ]
});

const data = window.HIGHER_SCORING_DATA || [];
const chart = document.querySelector("[data-scoring-chart]");
const tooltip = document.querySelector("[data-chart-tooltip]");
const story = document.querySelector("[data-score-story]");
const metricName = document.querySelector("[data-metric-name]");
const metricReadout = document.querySelector("[data-metric-readout]");
const driverList = document.querySelector("[data-driver-list]");
const momentList = document.querySelector("[data-moment-list]");
const metricButtons = Array.from(document.querySelectorAll("[data-metric]"));

const metrics = {
  PTS_PER_TEAM_GAME: {
    label: "Points per team game",
    shortLabel: "Points",
    unit: "points",
    color: "#c8452d",
    formatter: (value) => value.toFixed(1),
    plain: "The average number of points each team scored in a game.",
    readout: "This is the headline number fans feel on the scoreboard: NBA games now have much more scoring on a typical night."
  },
  OFF_RATING: {
    label: "Points per 100 possessions",
    shortLabel: "Offense",
    unit: "points per 100 possessions",
    color: "#2457d6",
    formatter: (value) => value.toFixed(1),
    plain: "How many points a team would score if every team had the same number of chances.",
    readout: "This strips out game speed. If this rises, teams are not just playing faster; they are getting more out of each trip down the floor."
  },
  PACE: {
    label: "Possessions per 48 minutes",
    shortLabel: "Pace",
    unit: "possessions",
    color: "#247a55",
    formatter: (value) => value.toFixed(1),
    plain: "How many offensive chances a team gets in a regulation-length game.",
    readout: "A faster game creates more opportunities to score, even before shot quality changes."
  },
  FG3A_PER_TEAM_GAME: {
    label: "3-point attempts per team game",
    shortLabel: "3PA",
    unit: "attempts",
    color: "#7a3f98",
    formatter: (value) => value.toFixed(1),
    plain: "How often each team chooses a three instead of a two.",
    readout: "This is the biggest style change: teams have more than doubled their three-point attempts since 2004-05."
  },
  TS_PCT: {
    label: "True shooting percentage",
    shortLabel: "TS%",
    unit: "shooting percentage",
    color: "#b15f12",
    formatter: (value) => `${(value * 100).toFixed(1)}%`,
    plain: "A shooting percentage that treats threes as more valuable and includes free throws.",
    readout: "This shows that teams are not only taking different shots; they are turning shots and free throws into points more efficiently."
  }
};

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

function formatDelta(metric, start, end) {
  const delta = end - start;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${metrics[metric].formatter(delta)}`;
}

function metricValue(metric, row) {
  return metrics[metric].formatter(row[metric]);
}

function renderStory() {
  if (!story || data.length === 0) {
    return;
  }

  const first = data[0];
  const last = data[data.length - 1];
  const storyItems = [
    {
      label: "More scoring",
      value: `${formatDelta("PTS_PER_TEAM_GAME", first.PTS_PER_TEAM_GAME, last.PTS_PER_TEAM_GAME)} PPG`,
      detail: `${first.SEASON} to ${last.SEASON}`
    },
    {
      label: "More threes",
      value: `${formatDelta("FG3A_PER_TEAM_GAME", first.FG3A_PER_TEAM_GAME, last.FG3A_PER_TEAM_GAME)} 3PA`,
      detail: "per team game"
    },
    {
      label: "Cleaner scoring chances",
      value: `${formatDelta("TS_PCT", first.TS_PCT, last.TS_PCT)} TS`,
      detail: "shot value plus free throws"
    }
  ];

  story.innerHTML = storyItems
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
  if (!driverList || data.length === 0) {
    return;
  }

  const first = data[0];
  const last = data[data.length - 1];
  const driverMetrics = ["PTS_PER_TEAM_GAME", "OFF_RATING", "PACE", "FG3A_PER_TEAM_GAME", "TS_PCT"];

  driverList.innerHTML = driverMetrics
    .map((key) => {
      const metric = metrics[key];
      const start = Number(first[key]);
      const end = Number(last[key]);
      const high = Math.max(start, end);
      const low = Math.min(start, end);
      const range = Math.max(high - low, high * 0.04);
      const startWidth = 38 + ((start - low) / range) * 52;
      const endWidth = 38 + ((end - low) / range) * 52;

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

function renderMoments() {
  if (!momentList || data.length === 0) {
    return;
  }

  const lowest = data.reduce((best, row) => row.PTS_PER_TEAM_GAME < best.PTS_PER_TEAM_GAME ? row : best, data[0]);
  const highest = data.reduce((best, row) => row.PTS_PER_TEAM_GAME > best.PTS_PER_TEAM_GAME ? row : best, data[0]);
  const firstOver110 = data.find((row) => row.PTS_PER_TEAM_GAME >= 110);
  let biggestJump = data[1];
  let biggestJumpValue = data[1].PTS_PER_TEAM_GAME - data[0].PTS_PER_TEAM_GAME;

  data.slice(1).forEach((row, index) => {
    const previous = data[index];
    const jump = row.PTS_PER_TEAM_GAME - previous.PTS_PER_TEAM_GAME;
    if (jump > biggestJumpValue) {
      biggestJump = row;
      biggestJumpValue = jump;
    }
  });

  const moments = [
    {
      label: "Slowest scoring season",
      value: `${lowest.SEASON}: ${lowest.PTS_PER_TEAM_GAME.toFixed(1)} PPG`,
      detail: "The recent low point came during the lockout-shortened 2011-12 season."
    },
    {
      label: "Modern scoring threshold",
      value: `${firstOver110.SEASON}: ${firstOver110.PTS_PER_TEAM_GAME.toFixed(1)} PPG`,
      detail: "This is where the league first crossed 110 points per team game in this window."
    },
    {
      label: "Largest one-year leap",
      value: `${biggestJump.SEASON}: +${biggestJumpValue.toFixed(1)} PPG`,
      detail: "A visible jump into the current high-scoring era."
    },
    {
      label: "Peak in this dataset",
      value: `${highest.SEASON}: ${highest.PTS_PER_TEAM_GAME.toFixed(1)} PPG`,
      detail: "The top season shows how high the new scoring environment has climbed."
    }
  ];

  momentList.innerHTML = moments
    .map((moment) => `
      <article>
        <span>${moment.label}</span>
        <strong>${moment.value}</strong>
        <p>${moment.detail}</p>
      </article>
    `)
    .join("");
}

function renderChart(metricKey) {
  if (!chart || data.length === 0) {
    return;
  }

  hideTooltip();

  const metric = metrics[metricKey];
  const width = 860;
  const height = 430;
  const margin = { top: 34, right: 34, bottom: 56, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = data.map((row) => Number(row[metricKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.12 || 1;
  const yMin = min - padding;
  const yMax = max + padding;
  const x = scaleLinear(0, data.length - 1, margin.left, margin.left + plotWidth);
  const y = scaleLinear(yMin, yMax, margin.top + plotHeight, margin.top);
  const linePath = data
    .map((row, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(row[metricKey]).toFixed(2)}`)
    .join(" ");

  chart.innerHTML = "";
  const title = svgEl("title", { id: "scoring-chart-title" });
  title.textContent = `${metric.label} by NBA season`;
  const desc = svgEl("desc", { id: "scoring-chart-desc" });
  desc.textContent = `Line chart showing ${metric.label.toLowerCase()} from ${data[0].SEASON} through ${data[data.length - 1].SEASON}.`;
  chart.appendChild(title);
  chart.appendChild(desc);

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
    label.textContent = metric.formatter(value);
    grid.appendChild(label);
  }
  chart.appendChild(grid);

  const xAxis = svgEl("g", { class: "chart-axis" });
  data.forEach((row, index) => {
    if (index % 4 !== 0 && index !== data.length - 1) {
      return;
    }
    const label = svgEl("text", {
      x: x(index),
      y: height - 18,
      "text-anchor": "middle"
    });
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
  data.forEach((row, index) => {
    const point = svgEl("circle", {
      cx: x(index),
      cy: y(row[metricKey]),
      r: 6,
      fill: "#ffffff",
      stroke: metric.color,
      "stroke-width": 3,
      tabindex: "0",
      role: "img",
      "aria-label": `${row.SEASON}: ${metric.formatter(row[metricKey])} ${metric.unit}`
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

  if (metricName) {
    metricName.textContent = metric.label;
  }

  if (metricReadout) {
    const first = data[0];
    const last = data[data.length - 1];
    metricReadout.innerHTML = `
      <strong>${metric.plain}</strong>
      <span>${metric.readout}</span>
      <em>${first.SEASON}: ${metricValue(metricKey, first)}. ${last.SEASON}: ${metricValue(metricKey, last)}.</em>
    `;
  }
}

function showTooltip(event, row, metricKey) {
  if (!tooltip) {
    return;
  }

  const metric = metrics[metricKey];
  tooltip.innerHTML = `
    <strong>${row.SEASON}</strong>
    <span>${metric.label}: ${metric.formatter(row[metricKey])}</span>
    <span>Points: ${row.PTS_PER_TEAM_GAME.toFixed(1)} PPG</span>
    <span>3PA: ${row.FG3A_PER_TEAM_GAME.toFixed(1)}</span>
  `;
  tooltip.hidden = false;

  const stage = document.querySelector(".chart-wrap").getBoundingClientRect();
  const pointRect = event.currentTarget.getBoundingClientRect();
  const clientX = event.clientX || pointRect.left + pointRect.width / 2;
  const clientY = event.clientY || pointRect.top + pointRect.height / 2;
  const left = Math.max(8, Math.min(clientX - stage.left + 14, stage.width - 210));
  const top = Math.max(clientY - stage.top - 18, 8);
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function hideTooltip() {
  if (tooltip) {
    tooltip.hidden = true;
  }
}

metricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const metric = button.dataset.metric;
    hideTooltip();
    metricButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderChart(metric);
  });
});

if (chart) {
  chart.addEventListener("pointerleave", hideTooltip);
}

renderStory();
renderDrivers();
renderMoments();
renderChart("PTS_PER_TEAM_GAME");
