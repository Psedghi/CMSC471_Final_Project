function initVisualizationPage(config) {
  const title = document.querySelector("[data-viz-title]");
  const description = document.querySelector("[data-viz-description]");
  const chart = document.querySelector("[data-viz-chart]");
  const dataList = document.querySelector("[data-viz-data]");

  if (title) {
    title.textContent = config.title;
  }

  if (description) {
    description.textContent = config.description;
  }

  if (chart) {
    chart.innerHTML = `
      <div>
        <strong>${config.chartLabel}</strong>
        <p>${config.placeholder}</p>
      </div>
    `;
  }

  if (dataList) {
    dataList.innerHTML = config.dataSources
      .map((source) => `<li>${source}</li>`)
      .join("");
  }
}

window.initVisualizationPage = initVisualizationPage;
