## Shooting Centers — NBA Center 3-Point Data

### Data Collection

Claude was used to write the `data/center_3s.py` script that pulls NBA center 3-point statistics from the `nba_api` library across 21 seasons (2004-05 through 2024-25).

**Prompt used:**

> "Write a Python script using nba_api that fetches per-season stats for all centers (position = 'C') for the last 20 NBA seasons. I want total 3-pointers made, attempted, and percentage for each player per season. Also compute league-wide aggregates per season (total FG3M, total FG3A, average FG3M per center). Identify the top 5 centers by FG3M each season and save everything to separate CSVs. Add a sleep delay between API calls to avoid rate limiting."

**Output files generated:**
- `data/center_threes_all.csv` — every center, every season
- `data/center_threes_season_agg.csv` — league-wide center 3PT totals per season
- `data/center_threes_top5.csv` — top 5 centers by FG3M per season

---

### Data File for Visualization

Claude was used to convert the CSV outputs into the JavaScript data file `scripts/shooting-centers-data.js` so the data could be loaded directly in the browser without a backend.

**Prompt used:**

> "I have two CSVs: one with league-wide season aggregates for center 3-point shooting, and one with the top 5 centers per season. Convert these into a JavaScript file that assigns the data to two global window variables — `window.SHOOTING_CENTERS_DATA` for the season aggregates and `window.SHOOTING_CENTERS_TOP5` for the top 5 players. Format the data as arrays of objects. Only include the seasons 2004-05, 2016-17, and 2024-25 for the top 5 table since those are the most interesting inflection points."

---

### Visualization Logic

Claude was used to help write the D3.js chart in `scripts/viz-page.js` that renders the center 3-point trend line and the top 5 player table.

**Prompt used:**

> "Using D3.js, create a line chart that shows the total 3-pointers made by NBA centers per season from 2004-05 to 2024-25 using the data in `window.SHOOTING_CENTERS_DATA`. The x-axis should be the season, the y-axis should be total_fg3m. Add hover tooltips that show the season, total FG3M, total FG3A, and average FG3M per center. Below the chart, render a table of the top 5 shooting centers for three selected seasons (2004-05, 2016-17, 2024-25) with columns for player name, FG3M, FG3A, FG3%, and GP."

---

### Debugging

Claude helped debug an issue where the top-5 table was not rendering for all three seasons because the season strings in the CSV used a different format than expected.

**Prompt used:**

> "My D3 table filter using `d.SEASON === '2016-17'` is returning no rows even though I can see the data in the console. The CSV has the season column as `SEASON` and the values look like `2016-17`. What could cause the filter to fail and how do I fix it?"

Claude identified that the CSV was being parsed with leading/trailing whitespace in the season strings and suggested using `.trim()` when loading the data.
