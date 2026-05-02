# Data

All generated and hand-cleaned datasets for the visualizations live here.

Current files:
- `center_3s.py`: pulls center 3-point data from the NBA API.
- `center_threes_all.csv`: every listed center for each fetched season.
- `center_threes_season_agg.csv`: season-level totals for centers.
- `center_threes_top5.csv`: top five centers by made threes per season.
- `higher_scoring.py`: pulls team scoring, pace, and efficiency data from the NBA API.
- `higher_scoring_team_stats.csv`: team-level per-game scoring data by season.
- `higher_scoring_season_summary.csv`: league-level season summary used by the Higher Scoring visualization.
- `global_superstars.py`: pulls international player data from the NBA API.
- `international_players.csv`: international players by season.
- `international_season_summary.csv`: season-level international player counts.

Run data scripts from the project root unless a script says otherwise:

```bash
python data/center_3s.py
python data/higher_scoring.py
python data/global_superstars.py
```
