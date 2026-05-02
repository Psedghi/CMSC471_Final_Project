# Evolution of Basketball

**Final Project — Group 20** **Team Members:** Arjun Shah, Parsa Sedghi, Elizabeth Ipe, Archit Shankar

## Project Overview 
Fans often debate how basketball has changed over the years. Instead of just watching highlight clips, our project uses data to tell the story of the modern NBA. We built data visualizations to uncover hidden trends in strategy, player types, and game management that you cannot easily see just by watching the games.

## What We Explore [NEED TO UPDATE]
Our project breaks down the biggest shifts in the sport:
- **The 3-Point Boom:** An interactive court heatmap with a year slider showing how shot selection has moved away from the basket.
- **Shooting Centers:** Highlighting the sudden increase in big men shooting a high volume of 3-pointers.
- **Higher Scoring:** Tracking the overall rise in league-wide scoring.
- **Player Size:** Looking at how average player heights have changed across all five positions.
- **Global Superstars:** Showing the rise of international players and their recent dominance in the MVP race.
- **Load Management:** Analyzing how modern player resting strategies affect the total minutes played in a season.

## Data Sources
- [**NBA API**](https://github.com/swar/nba_api): Our main source for official, highly detailed league data and shot charts.
- [**Basketball Reference**](https://www.basketball-reference.com/): Our backup source for pulling historical stats and cross-referencing.

## Project Structure
The baseline web structure gives each visualization its own page and browser script.

```text
.
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   ├── viz-page.js
│   ├── three-point-boom.js
│   ├── shooting-centers.js
│   ├── higher-scoring.js
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
    ├── readme.md
    ├── center_3s.py
    ├── center_threes_all.csv
    ├── center_threes_season_agg.csv
    └── center_threes_top5.csv
```

`index.html` is the project hub. Each file in `visualizations/` owns one visualization page, and each matching file in `scripts/` owns the JavaScript for that page. Shared page setup lives in `scripts/viz-page.js`; shared styling lives in `styles/main.css`.
