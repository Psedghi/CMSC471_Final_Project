# Data

All generated and hand-cleaned datasets for the visualizations live here.

Current files:
- `center_3s.py`: pulls center 3-point data from the NBA API.
- `center_threes_all.csv`: every listed center for each fetched season.
- `center_threes_season_agg.csv`: season-level totals for centers.
- `center_threes_top5.csv`: top five centers by made threes per season.

Run data scripts from the project root unless a script says otherwise:

```bash
python data/center_3s.py
```
