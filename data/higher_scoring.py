"""
NBA Higher Scoring Data Fetcher
Pulls league-wide scoring indicators for recent NBA seasons.
"""

from pathlib import Path
import json
import time

import pandas as pd
from nba_api.stats.endpoints import leaguedashteamstats

START_YEAR = 2004
END_YEAR = 2024
DELAY = 0.7
TIMEOUT = 15
OUTPUT_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = OUTPUT_DIR.parent / "scripts"


def season_str(year: int) -> str:
    """Convert start year to NBA season string, e.g. 2023 -> '2023-24'."""
    return f"{year}-{str(year + 1)[-2:]}"


def fetch_team_stats(season: str, measure_type: str) -> pd.DataFrame:
    """Fetch team per-game stats for a season and measure type."""
    response = leaguedashteamstats.LeagueDashTeamStats(
        season=season,
        season_type_all_star="Regular Season",
        per_mode_detailed="PerGame",
        measure_type_detailed_defense=measure_type,
        timeout=TIMEOUT,
    )
    df = response.get_data_frames()[0]
    df["SEASON"] = season
    return df


def weighted_average(df: pd.DataFrame, column: str) -> float:
    """Weight team per-game metrics by games played."""
    return (df[column] * df["GP"]).sum() / df["GP"].sum()


def main() -> None:
    seasons = [season_str(year) for year in range(START_YEAR, END_YEAR + 1)]
    team_rows = []
    summary_rows = []

    print(f"Fetching higher scoring data for {seasons[0]} through {seasons[-1]}\n")

    for season in seasons:
        print(f"  Pulling {season} ...", end=" ", flush=True)
        try:
            base = fetch_team_stats(season, "Base")
            time.sleep(DELAY)
            advanced = fetch_team_stats(season, "Advanced")

            merged = base[
                [
                    "SEASON",
                    "TEAM_ID",
                    "TEAM_NAME",
                    "GP",
                    "W",
                    "L",
                    "PTS",
                    "FGM",
                    "FGA",
                    "FG_PCT",
                    "FG3M",
                    "FG3A",
                    "FG3_PCT",
                    "FTM",
                    "FTA",
                    "TOV",
                ]
            ].merge(
                advanced[
                    [
                        "TEAM_ID",
                        "OFF_RATING",
                        "DEF_RATING",
                        "NET_RATING",
                        "PACE",
                        "EFG_PCT",
                        "TS_PCT",
                    ]
                ],
                on="TEAM_ID",
                how="left",
            )
            team_rows.append(merged)

            team_games = int(merged["GP"].sum())
            total_points = int(round((merged["PTS"] * merged["GP"]).sum()))
            summary_rows.append(
                {
                    "SEASON": season,
                    "SEASON_START": int(season[:4]),
                    "TEAMS": int(merged["TEAM_ID"].nunique()),
                    "TEAM_GAMES": team_games,
                    "TOTAL_POINTS": total_points,
                    "PTS_PER_TEAM_GAME": round(total_points / team_games, 2),
                    "FG3A_PER_TEAM_GAME": round(weighted_average(merged, "FG3A"), 2),
                    "FG3M_PER_TEAM_GAME": round(weighted_average(merged, "FG3M"), 2),
                    "FG3_PCT": round(weighted_average(merged, "FG3_PCT"), 3),
                    "OFF_RATING": round(weighted_average(merged, "OFF_RATING"), 1),
                    "PACE": round(weighted_average(merged, "PACE"), 2),
                    "EFG_PCT": round(weighted_average(merged, "EFG_PCT"), 3),
                    "TS_PCT": round(weighted_average(merged, "TS_PCT"), 3),
                }
            )
            print(f"done ({len(merged)} teams)")

        except Exception as exc:
            print(f"ERROR: {exc}")

        time.sleep(DELAY)

    if not team_rows or not summary_rows:
        raise RuntimeError("No higher scoring data was fetched.")

    team_df = pd.concat(team_rows, ignore_index=True)
    summary_df = pd.DataFrame(summary_rows)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

    team_path = OUTPUT_DIR / "higher_scoring_team_stats.csv"
    summary_path = OUTPUT_DIR / "higher_scoring_season_summary.csv"
    data_js_path = SCRIPTS_DIR / "higher-scoring-data.js"

    team_df.to_csv(team_path, index=False)
    summary_df.to_csv(summary_path, index=False)

    records = summary_df.to_dict(orient="records")
    data_js_path.write_text(
        "window.HIGHER_SCORING_DATA = "
        + json.dumps(records, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    print("\n" + "=" * 72)
    print("HIGHER SCORING SEASON SUMMARY")
    print("=" * 72)
    print(
        summary_df[
            [
                "SEASON",
                "PTS_PER_TEAM_GAME",
                "OFF_RATING",
                "PACE",
                "FG3A_PER_TEAM_GAME",
                "TS_PCT",
            ]
        ].to_string(index=False)
    )

    print("\nFiles saved:")
    print(f"  {team_path}")
    print(f"  {summary_path}")
    print(f"  {data_js_path}")


if __name__ == "__main__":
    main()
