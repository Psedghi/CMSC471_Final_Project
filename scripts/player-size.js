const POSITIONS  = ["G", "F", "C"];
const POS_LABELS = { G: "Guards", F: "Forwards", C: "Centers" };
const POS_COLORS = { G: "#2457d6", F: "#247a55", C: "#c8452d" };

const SVG_W  = 680;
const SVG_H  = 460;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 62 };
const PLOT_W = SVG_W - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_H - MARGIN.top  - MARGIN.bottom;

const H_MIN = 68;   // 5'8"
const H_MAX = 90;   // 7'6"

const COL_W      = PLOT_W / POSITIONS.length;
const JITTER_W   = COL_W * 0.72;
const DOT_R      = 3.2;
const DOT_OPACITY = 0.45;

let allData  = {};
let seasons  = [];
let yScale, svg;

function jitter(id) {
  const x = Math.sin(id * 127.1 + 1.3) * 43758.5453;
  return ((x - Math.floor(x)) - 0.5) * JITTER_W;
}

function colCenter(posIndex) {
  return MARGIN.left + COL_W * posIndex + COL_W / 2;
}

function fmtHeight(inches) {
  const ft  = Math.floor(inches / 12);
  const inn = Math.round(inches % 12);
  return `${ft}'${inn}"`;
}

d3.json("../data/player_size.json").then((data) => {
  allData = data;
  seasons = Object.keys(data).sort();

  yScale = d3.scaleLinear()
    .domain([H_MIN, H_MAX])
    .range([MARGIN.top + PLOT_H, MARGIN.top]);

  svg = d3.select("#size-svg")
    .attr("viewBox", `0 0 ${SVG_W} ${SVG_H}`)
    .attr("width",  SVG_W)
    .attr("height", SVG_H);

  buildScaffold();

  const slider = document.getElementById("size-slider");
  slider.min   = 0;
  slider.max   = seasons.length - 1;
  slider.value = seasons.length - 1;

  update(seasons[seasons.length - 1]);

  slider.addEventListener("input", () => {
    update(seasons[+slider.value]);
  });
}).catch((err) => {
  console.error("Failed to load player_size.json:", err);
});

function buildScaffold() {
  // Y gridlines + axis
  const yAxis = d3.axisLeft(yScale)
    .tickValues(d3.range(H_MIN, H_MAX + 1, 3))
    .tickFormat((d) => fmtHeight(d));

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${MARGIN.left},0)`)
    .call(yAxis);

  const gridVals = d3.range(H_MIN, H_MAX + 1, 3);
  svg.append("g").attr("class", "grid-lines")
    .selectAll("line")
    .data(gridVals)
    .enter().append("line")
    .attr("x1", MARGIN.left)
    .attr("x2", MARGIN.left + PLOT_W)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d));

  // Vertical column dividers
  svg.append("g").attr("class", "col-dividers")
    .selectAll("line")
    .data([1, 2])
    .enter().append("line")
    .attr("x1", (i) => MARGIN.left + COL_W * i)
    .attr("x2", (i) => MARGIN.left + COL_W * i)
    .attr("y1", MARGIN.top)
    .attr("y2", MARGIN.top + PLOT_H);

  // Position labels (x-axis)
  POSITIONS.forEach((pos, i) => {
    svg.append("text")
      .attr("class", "pos-label")
      .attr("x", colCenter(i))
      .attr("y", MARGIN.top + PLOT_H + 34)
      .attr("text-anchor", "middle")
      .style("fill", POS_COLORS[pos])
      .text(POS_LABELS[pos]);
  });

  // Layers (order matters: grid → dots → avg lines)
  svg.append("g").attr("id", "dots-layer");
  svg.append("g").attr("id", "avg-layer");
}

function update(season) {
  document.querySelector(".season-label").textContent = season;

  const players = allData[season] || [];

  // Stat cards
  POSITIONS.forEach((pos) => {
    const group = players.filter((p) => p.pos === pos);
    const avg   = group.length
      ? group.reduce((s, p) => s + p.height, 0) / group.length
      : null;
    const el = document.querySelector(`[data-stat="${pos}"]`);
    if (el) el.textContent = avg !== null ? fmtHeight(avg) : "—";

    const nEl = document.querySelector(`[data-count="${pos}"]`);
    if (nEl) nEl.textContent = group.length ? `${group.length} players` : "";
  });

  // Dots
  const layer = d3.select("#dots-layer");
  const dots  = layer.selectAll("circle.pdot").data(players, (d) => d.id);

  dots.enter().append("circle")
    .attr("class", (d) => `pdot pos-${d.pos}`)
    .attr("cx", (d) => {
      const i = POSITIONS.indexOf(d.pos);
      return i >= 0 ? colCenter(i) + jitter(d.id) : -99;
    })
    .attr("cy", (d) => yScale(d.height))
    .attr("r", DOT_R)
    .attr("fill",    (d) => POS_COLORS[d.pos] || "#aaa")
    .attr("opacity", 0)
    .on("mouseover", (event, d) => showTooltip(event, d))
    .on("mousemove",  moveTooltip)
    .on("mouseout",   hideTooltip)
    .transition().duration(350)
    .attr("opacity", DOT_OPACITY);

  dots.transition().duration(500)
    .attr("cy",      (d) => yScale(d.height))
    .attr("opacity", DOT_OPACITY);

  dots.exit().transition().duration(250)
    .attr("opacity", 0)
    .remove();

  // Average lines
  const avgLayer = d3.select("#avg-layer");
  POSITIONS.forEach((pos, i) => {
    const group = players.filter((p) => p.pos === pos);
    if (!group.length) return;
    const avg = group.reduce((s, p) => s + p.height, 0) / group.length;
    const cx  = colCenter(i);
    const hw  = JITTER_W / 2 + 6;
    const id  = `avg-${pos}`;

    let line = avgLayer.select(`#${id}`);
    if (line.empty()) {
      line = avgLayer.append("line")
        .attr("id", id)
        .attr("x1", cx - hw)
        .attr("x2", cx + hw)
        .attr("stroke",       POS_COLORS[pos])
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round");
    } else {
      line.attr("x1", cx - hw).attr("x2", cx + hw);
    }

    line.transition().duration(500)
      .attr("y1", yScale(avg))
      .attr("y2", yScale(avg));

    // Avg label
    const labelId = `avg-label-${pos}`;
    let label = avgLayer.select(`#${labelId}`);
    if (label.empty()) {
      label = avgLayer.append("text")
        .attr("id", labelId)
        .attr("x", cx + hw + 4)
        .attr("text-anchor", "start")
        .attr("fill", POS_COLORS[pos])
        .attr("font-size", "11")
        .attr("font-weight", "700");
    } else {
      label.attr("x", cx + hw + 4);
    }

    label.transition().duration(500)
      .attr("y", yScale(avg) + 4)
      .text(fmtHeight(avg));
  });
}

function showTooltip(event, d) {
  const el = document.getElementById("size-tooltip");
  el.innerHTML = `<strong>${d.name}</strong><br/>${fmtHeight(d.height)} &middot; ${POS_LABELS[d.pos]}`;
  el.style.opacity = "1";
  el.style.left = `${event.pageX + 14}px`;
  el.style.top  = `${event.pageY - 32}px`;
}

function moveTooltip(event) {
  const el = document.getElementById("size-tooltip");
  el.style.left = `${event.pageX + 14}px`;
  el.style.top  = `${event.pageY - 32}px`;
}

function hideTooltip() {
  document.getElementById("size-tooltip").style.opacity = "0";
}
