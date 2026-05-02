initVisualizationPage({
  title: "Shooting Centers",
  description: "A view of how centers have increased their 3-point volume and efficiency across recent NBA seasons.",
  chartLabel: "Center 3-point trend scaffold",
  placeholder: "Use the generated center CSV files to build a line chart and top-five seasonal leaderboard.",
  dataSources: [
    "data/center_threes_season_agg.csv",
    "data/center_threes_top5.csv",
    "data/center_threes_all.csv"
  ]
});
