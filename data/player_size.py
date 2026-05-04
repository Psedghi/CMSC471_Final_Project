"""
NBA Player Heights by Season and Position — 2004-05 through 2024-25

Uses:
  - NBA API PlayerIndex             → position per player (one call)
  - NBA API LeagueDashPlayerBioStats → height + active players per season (21 calls)

Output: data/player_size.json
  {
    "2004-05": [
      {"id": 2544, "name": "LeBron James", "pos": "F", "height": 81.0, "gp": 79},
      ...
    ],
    ...
  }
"""

import time
import json
import pandas as pd
from nba_api.stats.endpoints import playerindex, leaguedashplayerbiostats

START_YEAR = 2004
END_YEAR   = 2024
DELAY      = 1.2
MIN_GP     = 20   # exclude players who barely played


def season_str(year: int) -> str:
    return f"{year}-{str(year + 1)[-2:]}"


def primary_position(pos_str: str) -> str | None:
    """Return G / F / C from NBA API position strings like 'G', 'F-G', 'C-F'."""
    p = str(pos_str).strip()
    if not p or p in ("nan", ""):
        return None
    first = p.split("-")[0].strip()
    if first == "C":
        return "C"
    if first == "F":
        return "F"
    if first == "G":
        return "G"
    return None


def build_position_map() -> dict[int, str]:
    """Fetch all players from PlayerIndex and return {player_id: 'G'|'F'|'C'}."""
    print("Fetching position data from NBA API PlayerIndex...", end=" ", flush=True)
    resp = playerindex.PlayerIndex(historical_nullable="1", league_id="00")
    df   = resp.get_data_frames()[0]

    pos_map: dict[int, str] = {}
    for _, row in df.iterrows():
        pos = primary_position(row.get("POSITION", ""))
        if pos:
            pos_map[int(row["PERSON_ID"])] = pos

    print(f"✓  ({len(pos_map)} players mapped)")
    return pos_map


def fetch_season(season: str) -> pd.DataFrame:
    resp = leaguedashplayerbiostats.LeagueDashPlayerBioStats(
        season=season,
        season_type_all_star="Regular Season",
        per_mode_simple="PerGame",
        league_id="00",
    )
    return resp.get_data_frames()[0]


def main() -> None:
    print("=" * 55)
    print("NBA PLAYER HEIGHTS BY SEASON")
    print("=" * 55 + "\n")

    pos_map = build_position_map()
    time.sleep(DELAY)

    result: dict[str, list] = {}

    for year in range(START_YEAR, END_YEAR + 1):
        season = season_str(year)
        print(f"  {season} ...", end=" ", flush=True)

        try:
            df = fetch_season(season)
            rows = []

            for _, row in df.iterrows():
                pid = int(row["PLAYER_ID"])
                gp  = int(row.get("GP", 0))

                if gp < MIN_GP:
                    continue

                pos = pos_map.get(pid)
                if not pos:
                    continue

                # PLAYER_HEIGHT_INCHES is a float like 79.0
                raw_h = row.get("PLAYER_HEIGHT_INCHES")
                if pd.isna(raw_h) or raw_h is None:
                    continue
                h = float(raw_h)
                if h < 60 or h > 96:
                    continue

                rows.append({
                    "id":     pid,
                    "name":   str(row["PLAYER_NAME"]),
                    "pos":    pos,
                    "height": round(h, 1),
                    "gp":     gp,
                })

            result[season] = rows
            print(f"✓  ({len(rows)} players)")

        except Exception as exc:
            print(f"error — {exc}")

        time.sleep(DELAY)

    # ── Save ──────────────────────────────────────────────────────────────────
    with open("data/player_size.json", "w") as fh:
        json.dump(result, fh)
    print("\nSaved: data/player_size.json")

    # ── Quick summary ─────────────────────────────────────────────────────────
    from collections import defaultdict
    print("\nAverage height by position (first vs last season):")
    for season in [season_str(START_YEAR), season_str(END_YEAR)]:
        if season not in result:
            continue
        by_pos: dict[str, list] = defaultdict(list)
        for p in result[season]:
            by_pos[p["pos"]].append(p["height"])
        print(f"\n  {season}:")
        for pos in ["G", "F", "C"]:
            hs = by_pos[pos]
            if hs:
                avg = sum(hs) / len(hs)
                ft  = int(avg) // 12
                inn = avg % 12
                print(f"    {pos}: {avg:.2f}\"  ({ft}'{inn:.1f}\")  n={len(hs)}")


if __name__ == "__main__":
    main()
