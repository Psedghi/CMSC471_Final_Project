# Evolution of Basketball

**Final Project — Group 20**  
**Team Members:** Arjun Shah, Parsa Sedghi, Elizabeth Ipe, Archit Shankar, Abubakr Hussien

## Project Overview

Fans often debate how basketball has changed over the years. Instead of just watching highlight clips, our project uses data to tell the story of the modern NBA. We built interactive data visualizations to uncover hidden trends in strategy, player types, and game management that you cannot easily see just by watching the games.

## What We Explore

- **The 3-Point Boom:** An interactive court heatmap with a year slider showing how shot selection has moved away from the basket.
- **Shooting Centers:** Highlighting the sudden increase in big men shooting a high volume of 3-pointers.
- **Higher Scoring:** Tracking the overall rise in league-wide scoring.
- **Player Size:** How average player height has shifted across the three NBA positions (Guard, Forward, Center).
- **Global Superstars:** The rise of international players and their recent dominance in the MVP race.
- **Load Management:** Analyzing how modern player resting strategies affect total minutes played in a season.

## Data Sources

- [**NBA API**](https://github.com/swar/nba_api): Main source for official league data, shot charts, player bio stats, and roster information.
- [**Basketball Reference**](https://www.basketball-reference.com/): Backup source for historical stats and cross-referencing.

## Running the Project

This is a static site published on GitHub Pages — no build step or server required.

1. Clone the repo.
2. Open `index.html` in a browser, or visit the live GitHub Pages URL.

To regenerate the data files (requires Python 3 and `nba_api`):

```bash
pip install nba_api pandas
python3 data/player_size.py
python3 data/mvp_data.py
python3 data/global_superstars.py
python3 data/center_3s.py
python3 data/higher_scoring.py
```

## Project Structure

```text
.
├── index.html
├── styles/
│   ├── main.css
│   ├── global-superstars.css
│   ├── higher-scoring.css
│   ├── player-size.css
│   ├── shooting-centers.css
│   └── three-point-boom.css
├── scripts/
│   ├── viz-page.js
│   ├── three-point-boom.js
│   ├── shooting-centers.js
│   ├── shooting-centers-data.js
│   ├── higher-scoring.js
│   ├── higher-scoring-data.js
│   ├── player-size.js
│   ├── global-superstars.js
│   └── load-management.js
├── visualizations/
│   ├── three-point-boom.html
│   ├── shooting-centers.html
│   ├── higher-scoring.html
│   ├── player-size.html
│   ├── global-superstars.html
│   └── load-management.html
└── data/
    ├── center_3s.py
    ├── higher_scoring.py
    ├── global_superstars.py
    ├── mvp_data.py
    ├── player_size.py
    ├── center_threes_all.csv
    ├── center_threes_season_agg.csv
    ├── center_threes_top5.csv
    ├── higher_scoring_team_stats.csv
    ├── higher_scoring_season_summary.csv
    ├── international_players.csv
    ├── international_season_summary.csv
    ├── mvp_winners.csv
    └── player_size.json
```

## Work Breakdown

| Team Member     | Contributions |
|-----------------|---------------|
| Parsa Sedghi    | Player Size visualization (data pipeline, D3 dot strip plot, HTML/CSS); Global Superstars visualization (data pipeline, line chart, MVP list, HTML/CSS) |
| Arjun Shah      | Shooting Centers visualization (data pipeline, D3 line chart, top-5 table, HTML/CSS); injuries metric and overlay toggle for Load Management; "Before the chart" explanatory section for Shooting Centers |
| Elizabeth Ipe   | Load Management visualization (rough visual, HTML/CSS); axis labels and additional detail for Shooting Centers |
| Archit Shankar  | Higher Scoring visualization (data pipeline, D3 chart, HTML/CSS); baseline site structure (index, shared styles, visualization scaffolding); load management clarifications |
| Abubakr Hussien | 3-Point Boom heatmap (D3 court visualization, shot frequency binning, data pipeline); play button and slider animation for 3-Point Boom; "How to read" section for heatmap |
