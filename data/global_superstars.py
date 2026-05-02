"""
NBA International Players — Home Country & Team
Pulls all non-USA players for the past 20 seasons with their country and team.
Similar structure to center_3s.py.
"""

import time
import pandas as pd
from nba_api.stats.endpoints import leaguedashplayerstats, playerindex

# ── Config ─────────────────────────────────────────────────────────────────────
START_YEAR = 2004          # 2004-05 season → 20 seasons through 2024-25
END_YEAR   = 2024
DELAY      = 1.0           # seconds between API calls

_USA = {"usa", "united states", "united states of america", "u.s.a.", "us"}


# ── Helpers ────────────────────────────────────────────────────────────────────

def season_str(year: int) -> str:
    """2023 → '2023-24'"""
    return f"{year}-{str(year + 1)[-2:]}"


def build_country_map() -> dict[int, str]:
    """
    Fetch all NBA players (historical + active) and their country in one call.
    Returns {player_id: country_string}.
    """
    print("Fetching player country data (single bulk call)…", end=" ", flush=True)
    resp = playerindex.PlayerIndex(historical_nullable="1", league_id="00")
    df   = resp.get_data_frames()[0]
    mapping = {
        int(row["PERSON_ID"]): str(row["COUNTRY"]).strip()
        for _, row in df.iterrows()
        if pd.notna(row["COUNTRY"])
    }
    print(f"✓  ({len(mapping)} players)")
    return mapping


def fetch_season_stats(season: str) -> pd.DataFrame:
    """Fetch per-season totals for all players — returns PLAYER_ID, PLAYER_NAME, TEAM_ABBREVIATION, GP."""
    try:
        resp = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            season_type_all_star="Regular Season",
            per_mode_detailed="Totals",
        )
        df = resp.get_data_frames()[0]
        return df[["PLAYER_ID", "PLAYER_NAME", "TEAM_ABBREVIATION", "GP"]]
    except Exception as e:
        print(f"  ⚠  {e}")
        return pd.DataFrame()


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    seasons = [season_str(y) for y in range(START_YEAR, END_YEAR + 1)]
    print(f"Seasons: {seasons[0]} → {seasons[-1]}\n")

    # ── Step 1 : Build country map (1 API call) ────────────────────────────────
    country_map = build_country_map()
    time.sleep(DELAY)

    # ── Step 2 : Fetch per-season player/team data ─────────────────────────────
    print("\nFetching season stats…")
    rows = []
    for season in seasons:
        print(f"  {season} …", end=" ", flush=True)
        df = fetch_season_stats(season)
        if df.empty:
            print("no data")
            time.sleep(DELAY)
            continue

        intl_count = 0
        for _, row in df.iterrows():
            pid     = int(row["PLAYER_ID"])
            country = country_map.get(pid, "")
            if not country or country.lower() in _USA:
                continue
            rows.append({
                "SEASON":  season,
                "PLAYER_NAME": row["PLAYER_NAME"],
                "COUNTRY": country,
                "TEAM":    row["TEAM_ABBREVIATION"],
                "GP":      int(row["GP"]),
            })
            intl_count += 1

        print(f"✓  ({intl_count} international players)")
        time.sleep(DELAY)

    # ── Step 3 : Save ──────────────────────────────────────────────────────────
    df_out = pd.DataFrame(rows)
    df_out.to_csv("data/international_players.csv", index=False)

    # Season summary
    summary = (
        df_out.groupby("SEASON")
        .agg(intl_players=("PLAYER_NAME", "count"), countries=("COUNTRY", "nunique"))
        .reset_index()
    )
    summary.to_csv("data/international_season_summary.csv", index=False)

    # ── Print summary ──────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    print("INTERNATIONAL PLAYERS — SEASON COUNTS")
    print("=" * 55)
    print(summary.to_string(index=False))

    print("\n\nFiles saved:")
    print("  data/international_players.csv         — all intl players, every season")
    print("  data/international_season_summary.csv  — per-season totals")
    print(f"\nTotal rows: {len(df_out)}")


if __name__ == "__main__":
    main()
