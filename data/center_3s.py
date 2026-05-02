"""
NBA Center 3-Point Data Fetcher
Pulls center 3-point stats for the past 20 seasons and identifies
the top 5 shooting centers (by 3PM) each season.
"""

from pathlib import Path
import time
import pandas as pd
from nba_api.stats.endpoints import leaguedashplayerstats

# ── Config ────────────────────────────────────────────────────────────────────
START_YEAR = 2004          # 2004-05 season  →  20 seasons through 2024-25
END_YEAR   = 2024
TOP_N      = 5             # top N centers per season
DELAY      = 1.0           # seconds between API calls (respect rate limits)
OUTPUT_DIR = Path(__file__).resolve().parent

# ── Helpers ───────────────────────────────────────────────────────────────────

def season_str(year: int) -> str:
    """Convert start year to NBA season string, e.g. 2023 → '2023-24'."""
    return f"{year}-{str(year + 1)[-2:]}"


def fetch_center_stats(season: str) -> pd.DataFrame:
    """
    Fetch per-season player stats filtered to Centers (C).
    Returns a DataFrame with relevant columns.
    """
    # Use the API's built-in position filter for Centers
    response_tot = leaguedashplayerstats.LeagueDashPlayerStats(
        season=season,
        season_type_all_star="Regular Season",
        per_mode_detailed="Totals",
        player_position_abbreviation_nullable="C",
    )
    df_tot = response_tot.get_data_frames()[0]

    merge_cols = ["PLAYER_ID", "PLAYER_NAME", "FG3M", "FG3A", "FG3_PCT", "GP", "MIN"]
    df_merged = df_tot[merge_cols].copy()

    df_merged["SEASON"] = season
    return df_merged


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    all_seasons: list[pd.DataFrame] = []
    top5_per_season: list[dict]     = []

    seasons = [season_str(y) for y in range(START_YEAR, END_YEAR + 1)]
    print(f"Fetching data for {len(seasons)} seasons: {seasons[0]} → {seasons[-1]}\n")

    for season in seasons:
        print(f"  Pulling {season} ...", end=" ", flush=True)
        try:
            df = fetch_center_stats(season)
            all_seasons.append(df)

            # Top-N centers by 3PM (minimum 1 GP to exclude empty rows)
            top = (
                df[df["GP"] >= 1]
                .sort_values("FG3M", ascending=False)
                .head(TOP_N)[["SEASON", "PLAYER_NAME", "FG3M", "FG3A", "FG3_PCT", "GP"]]
            )
            top5_per_season.append(top.to_dict(orient="records"))
            print(f"✓  ({len(df)} centers found, top FG3M: {int(top.iloc[0]['FG3M'])} by {top.iloc[0]['PLAYER_NAME']})")

        except Exception as e:
            print(f"✗  ERROR: {e}")

        time.sleep(DELAY)   # be kind to the API

    # ── Combine & save ────────────────────────────────────────────────────────
    master_df = pd.concat(all_seasons, ignore_index=True)

    # Aggregate: total 3PM per season across all centers
    season_agg = (
        master_df.groupby("SEASON")
        .agg(
            total_centers   = ("PLAYER_ID", "count"),
            total_fg3m      = ("FG3M", "sum"),
            total_fg3a      = ("FG3A", "sum"),
            avg_fg3m        = ("FG3M", "mean"),
            avg_fg3_pct     = ("FG3_PCT", "mean"),
        )
        .reset_index()
    )

    # Flatten top-5 list
    top5_flat = []
    for season_list in top5_per_season:
        top5_flat.extend(season_list)
    top5_df = pd.DataFrame(top5_flat)

    # Save outputs next to this script so paths stay stable from any cwd.
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    master_df.to_csv(OUTPUT_DIR / "center_threes_all.csv", index=False)
    season_agg.to_csv(OUTPUT_DIR / "center_threes_season_agg.csv", index=False)
    top5_df.to_csv(OUTPUT_DIR / "center_threes_top5.csv", index=False)

    # Pretty-print summary
    print("\n" + "=" * 60)
    print("SEASON AGGREGATES (all centers, regular season totals)")
    print("=" * 60)
    print(season_agg.to_string(index=False))

    print("\n" + "=" * 60)
    print(f"TOP {TOP_N} CENTERS BY 3PM — PER SEASON")
    print("=" * 60)
    for season in seasons:
        block = top5_df[top5_df["SEASON"] == season]
        if block.empty:
            continue
        print(f"\n{season}")
        print(block[["PLAYER_NAME", "FG3M", "FG3A", "FG3_PCT", "GP"]].to_string(index=False))

    print("\n\nFiles saved:")
    print(f"  {OUTPUT_DIR / 'center_threes_all.csv'}        — every center, every season")
    print(f"  {OUTPUT_DIR / 'center_threes_season_agg.csv'} — league-wide center 3PT totals per season")
    print(f"  {OUTPUT_DIR / 'center_threes_top5.csv'}       — top 5 centers by FG3M per season")


if __name__ == "__main__":
    main()
