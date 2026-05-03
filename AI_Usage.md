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
