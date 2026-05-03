const COURT_WIDTH_FT  = 50;
const COURT_HEIGHT_FT = 47;
const BASKET_X_FT     = 0;
const BASKET_Y_FT     = 5.25;

const SVG_W  = 560;
const SVG_H  = 520;
const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };
const W      = SVG_W - MARGIN.left - MARGIN.right;
const H      = SVG_H - MARGIN.top  - MARGIN.bottom;

const xScale = d3.scaleLinear().domain([-25, 25]).range([0, W]);
const yScale = d3.scaleLinear().domain([-2, 40]).range([H, 0]);

let allData      = {};
let timelineData = [];
let currentMode  = 'all';

Promise.all([
  d3.json('../data/shots_heatmap.json'),
  d3.json('../data/shots_timeline.json')
]).then(([heatmap, timeline]) => {
  allData      = heatmap;
  timelineData = timeline;

  const seasons = Object.keys(allData).sort();
  const slider  = document.getElementById('season-slider');
  slider.min    = 0;
  slider.max    = seasons.length - 1;
  slider.value  = seasons.length - 1;

  buildCourt();
  update(seasons[seasons.length - 1]);

  slider.addEventListener('input', () => {
    update(seasons[+slider.value]);
  });

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      update(seasons[+slider.value]);
    });
  });
});

function buildCourt() {
  const svg = d3.select('#court-svg')
    .attr('width',  SVG_W)
    .attr('height', SVG_H)
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  const g = svg.append('g')
    .attr('id', 'court-g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  g.append('rect')
    .attr('class', 'court-outline')
    .attr('x', xScale(-25))
    .attr('y', yScale(35))
    .attr('width',  xScale(25)  - xScale(-25))
    .attr('height', yScale(-2)  - yScale(35));

  g.append('rect')
    .attr('class', 'court-line')
    .attr('x',      xScale(-8))
    .attr('y',      yScale(19))
    .attr('width',  xScale(8) - xScale(-8))
    .attr('height', yScale(0) - yScale(19))
    .attr('fill',   'rgba(23,32,42,0.10)');

  g.append('line')
    .attr('class', 'court-line')
    .attr('x1', xScale(-25)).attr('y1', yScale(0))
    .attr('x2', xScale(25)).attr('y2', yScale(0));

  g.append('line')
    .attr('class', 'court-line')
    .attr('x1', xScale(-8)).attr('y1', yScale(19))
    .attr('x2', xScale(8)).attr('y2', yScale(19));

  const ftR  = xScale(6) - xScale(0);
  const ftCx = xScale(0);
  const ftCy = yScale(19);
  g.append('path')
    .attr('class', 'court-arc')
    .attr('d', `M ${ftCx - ftR} ${ftCy} A ${ftR} ${ftR} 0 0 1 ${ftCx + ftR} ${ftCy}`)
    .attr('fill', 'none');
  g.append('path')
    .attr('class', 'court-line')
    .attr('d', `M ${ftCx - ftR} ${ftCy} A ${ftR} ${ftR} 0 0 0 ${ftCx + ftR} ${ftCy}`)
    .attr('fill', 'none')
    .attr('stroke-dasharray', '4,4');

  const raR  = xScale(4) - xScale(0);
  const bCx  = xScale(0);
  const bCy  = yScale(BASKET_Y_FT);
  g.append('path')
    .attr('class', 'restricted')
    .attr('d', `M ${bCx - raR} ${bCy} A ${raR} ${raR} 0 0 1 ${bCx + raR} ${bCy}`);

  const arcR  = xScale(23.75) - xScale(0);
  const arcCx = xScale(0);
  const arcCy = yScale(BASKET_Y_FT);
  const cornerX_l    = xScale(-22);
  const cornerX_r    = xScale(22);
  const cornerY      = yScale(0);
  const arcIntersectY = yScale(BASKET_Y_FT + Math.sqrt(23.75 ** 2 - 22 ** 2));

  g.append('line').attr('class', 'court-line')
    .attr('x1', cornerX_l).attr('y1', cornerY)
    .attr('x2', cornerX_l).attr('y2', arcIntersectY);
  g.append('line').attr('class', 'court-line')
    .attr('x1', cornerX_r).attr('y1', cornerY)
    .attr('x2', cornerX_r).attr('y2', arcIntersectY);

  const startAngle = Math.atan2(arcIntersectY - arcCy, cornerX_l - arcCx);
  const endAngle   = Math.atan2(arcIntersectY - arcCy, cornerX_r - arcCx);

  g.append('path')
    .attr('class', 'court-arc')
    .attr('d', describeArc(arcCx, arcCy, arcR, startAngle, endAngle));

  g.append('circle')
    .attr('cx', bCx).attr('cy', bCy)
    .attr('r', xScale(0.75) - xScale(0))
    .attr('fill', 'none').attr('stroke', 'rgba(23,32,42,0.5)').attr('stroke-width', 1.5);

  g.append('line')
    .attr('class', 'court-line')
    .attr('x1', xScale(-3)).attr('y1', yScale(4))
    .attr('x2', xScale(3)).attr('y2', yScale(4))
    .attr('stroke-width', 2);

  g.append('g').attr('id', 'shots-layer');
}

function update(season) {
  document.querySelector('.season-label').textContent = season;

  const raw = allData[season] || [];
  let bins  = raw.filter(d =>
    d.x_bin >= -25 && d.x_bin <= 25 &&
    d.y_bin >= -2  && d.y_bin <= 35
  );

  if (currentMode === '3pt') bins = bins.filter(d => d.pct_3pt > 0.5);
  if (currentMode === '2pt') bins = bins.filter(d => d.pct_3pt <= 0.5);

  const sortedFreq = bins.map(d => d.freq).sort(d3.ascending);
  const maxFreq    = d3.quantile(sortedFreq, 0.95) || d3.max(bins, d => d.freq) || 1;

  const colorScale = d3.scaleSequentialSqrt()
    .domain([0, maxFreq])
    .interpolator(d3.interpolateYlOrRd);

  const BIN_PX = Math.abs(xScale(1.5) - xScale(0));

  const layer = d3.select('#shots-layer');
  const rects = layer.selectAll('rect.shot-bin').data(bins, d => `${d.x_bin}_${d.y_bin}`);

  rects.enter().append('rect')
    .attr('class', 'shot-bin')
    .attr('rx', 2).attr('ry', 2)
    .attr('opacity', 0)
    .on('mouseover', (event, d) => showTooltip(event, d, season))
    .on('mousemove', (event) => moveTooltip(event))
    .on('mouseout', hideTooltip)
  .merge(rects)
    .transition().duration(400)
    .attr('x',      d => xScale(d.x_bin) - BIN_PX / 2)
    .attr('y',      d => yScale(d.y_bin) - BIN_PX / 2)
    .attr('width',  BIN_PX)
    .attr('height', BIN_PX)
    .attr('fill',   d => colorScale(Math.min(d.freq, maxFreq)))
    .attr('opacity', d => 0.25 + 0.75 * Math.sqrt(Math.min(d.freq, maxFreq) / maxFreq));

  rects.exit().transition().duration(300).attr('opacity', 0).remove();

  const td = timelineData.find(d => d.season === season);
  if (td) {
    document.getElementById('stat-total').textContent = td.total_shots.toLocaleString();
    document.getElementById('stat-3pt').textContent   = (td.pct_3pt * 100).toFixed(1) + '%';
    document.getElementById('stat-dist').textContent  = td.avg_distance.toFixed(1) + ' ft';
    document.getElementById('stat-fg').textContent    = (td.fg_pct * 100).toFixed(1) + '%';
  }
}

const tooltip = d3.select('#tooltip');

function showTooltip(event, d, season) {
  tooltip
    .style('opacity', 1)
    .html(`
      <strong>${d.pct_3pt > 0.5 ? '3PT Zone' : '2PT Zone'}</strong><br/>
      Shots: ${d.count.toLocaleString()}<br/>
      FG%: ${(d.fg_pct * 100).toFixed(1)}%<br/>
      Freq: ${(d.freq * 100).toFixed(2)}% of all shots
    `);
}

function moveTooltip(event) {
  tooltip
    .style('left', (event.pageX + 12) + 'px')
    .style('top',  (event.pageY - 28) + 'px');
}

function hideTooltip() {
  tooltip.style('opacity', 0);
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}
