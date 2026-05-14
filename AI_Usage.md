## Data Preprocessing

The raw dataset (`NBA_2004_2025_Shots.csv`) contains **4,443,714 rows** (~400MB) of individual NBA shot attempts from the 2003-04 to 2024-25 seasons. This file is too large to load directly in a browser or push to GitHub.

Cursor was used to:
1. Aggregate the raw CSV into two lightweight JSON files
2. Bin shot coordinates into 1.5-foot grid cells per season
3. Compute per-bin statistics: shot count, FG%, 3PT rate, and shot frequency relative to total season shots
4. Separately aggregate league-wide season stats (total shots, 3PT rate, avg distance, FG%) for the timeline chart

Code used to generate `shots_heatmap.json` and `shots_timeline.json`:

```python
import pandas as pd
import numpy as np
import json

CSV_PATH = '/Users/bukih/Downloads/NBA_2004_2025_Shots.csv'
OUT_HEATMAP = '/Users/bukih/Desktop/CMSC471/final/data/shots_heatmap.json'
OUT_TIMELINE = '/Users/bukih/Desktop/CMSC471/final/data/shots_timeline.json'

print("Reading CSV...")
df = pd.read_csv(CSV_PATH)

print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Seasons: {sorted(df['SEASON_2'].unique())}")

df['SHOT_MADE'] = df['SHOT_MADE'].astype(str).str.upper() == 'TRUE'
df['IS_3PT'] = df['SHOT_TYPE'] == '3PT Field Goal'

print("\nBuilding timeline data...")
timeline = []
for season, grp in df.groupby('SEASON_2'):
    total = len(grp)
    three_pt = grp['IS_3PT'].sum()
    made = grp['SHOT_MADE'].sum()
    timeline.append({
        'season': season,
        'total_shots': int(total),
        'three_pt_attempts': int(three_pt),
        'pct_3pt': round(float(three_pt / total), 4),
        'fg_pct': round(float(made / total), 4),
        'avg_distance': round(float(grp['SHOT_DISTANCE'].mean()), 2)
    })

timeline.sort(key=lambda x: x['season'])
with open(OUT_TIMELINE, 'w') as f:
    json.dump(timeline, f)
print(f"Timeline saved: {len(timeline)} seasons")

print("\nBuilding heatmap data...")

BIN_SIZE = 1.5

df['x_bin'] = (df['LOC_X'] / BIN_SIZE).round() * BIN_SIZE
df['y_bin'] = (df['LOC_Y'] / BIN_SIZE).round() * BIN_SIZE

heatmap = {}
for season, grp in df.groupby('SEASON_2'):
    total_season = len(grp)
    agg = grp.groupby(['x_bin', 'y_bin']).agg(
        count=('SHOT_MADE', 'count'),
        made=('SHOT_MADE', 'sum'),
        is_3pt=('IS_3PT', 'sum')
    ).reset_index()

    agg['freq'] = (agg['count'] / total_season).round(6)
    agg['fg_pct'] = (agg['made'] / agg['count']).round(4)
    agg['pct_3pt'] = (agg['is_3pt'] / agg['count']).round(4)

    agg = agg[agg['count'] >= 5]

    heatmap[season] = agg[['x_bin', 'y_bin', 'count', 'freq', 'fg_pct', 'pct_3pt']].to_dict('records')
    print(f"  {season}: {len(agg)} bins")

with open(OUT_HEATMAP, 'w') as f:
    json.dump(heatmap, f)

print(f"\nHeatmap saved to {OUT_HEATMAP}")
print("Done!")
```

**Output files (pushed to repo):**
- `data/shots_heatmap.json` — shot frequency bins by season (~15,000 records)
- `data/shots_timeline.json` — league-wide stats per season (22 records)

**Raw data source:**
- [DomSamangy/NBA_Shots_04_25](https://github.com/DomSamangy/NBA_Shots_04_25)

## Court Visualization

Cursor was used to draw the NBA half-court SVG in `js/heatmap.js` (`buildCourt()` function).


## Load Management

### Load Management Visualization

Cursor was used to implement a D3-based load management visualization following the structure and conventions of existing visuals in the repository. This included updating the HTML, writing the chart and interaction logic in JavaScript, and adding a dedicated stylesheet.

---

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
