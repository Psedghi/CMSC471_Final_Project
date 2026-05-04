"""
NBA MVP Winners with Nationality — 2004-05 through 2024-25

MVP winners are a fixed historical record (one winner per season, immutable
once announced), so they are stored here as a reference list.

Country data is fetched live from the NBA API PlayerIndex endpoint — the
same source used by global_superstars.py — so no country is hardcoded.

Columns saved to data/mvp_winners.csv:
  SEASON           — e.g. "2004-05"
  PLAYER_NAME      — winner's name
  COUNTRY          — home country from NBA API PlayerIndex
  IS_INTERNATIONAL — True if country is not USA
"""

import time
import unicodedata
import pandas as pd
from nba_api.stats.endpoints import playerindex

DELAY = 1.0

# Historical NBA MVP winners, 2004-05 through 2024-25.
# This list grows by one entry per season; past entries never change.
MVP_WINNERS = {
    "2004-05": "Steve Nash",
    "2005-06": "Steve Nash",
    "2006-07": "Dirk Nowitzki",
    "2007-08": "Kobe Bryant",
    "2008-09": "LeBron James",
    "2009-10": "LeBron James",
    "2010-11": "Derrick Rose",
    "2011-12": "LeBron James",
    "2012-13": "LeBron James",
    "2013-14": "Kevin Durant",
    "2014-15": "Stephen Curry",
    "2015-16": "Stephen Curry",
    "2016-17": "Russell Westbrook",
    "2017-18": "James Harden",
    "2018-19": "Giannis Antetokounmpo",
    "2019-20": "Giannis Antetokounmpo",
    "2020-21": "Nikola Jokic",
    "2021-22": "Nikola Jokic",
    "2022-23": "Joel Embiid",
    "2023-24": "Nikola Jokic",
    "2024-25": "Shai Gilgeous-Alexander",
}

_USA = {"usa", "united states", "united states of america", "u.s.a.", "us"}


def normalize(name: str) -> str:
    """Strip accents and lowercase for fuzzy name matching."""
    return "".join(
        c for c in unicodedata.normalize("NFD", name)
        if unicodedata.category(c) != "Mn"
    ).lower().strip()


def build_country_map() -> dict[str, str]:
    """
    Fetch all NBA players (historical + active) from the NBA API PlayerIndex
    and return {normalized_full_name: country}.
    """
    print("Fetching player country data from NBA API...", end=" ", flush=True)
    resp = playerindex.PlayerIndex(historical_nullable="1", league_id="00")
    df   = resp.get_data_frames()[0]

    name_map: dict[str, str] = {}
    for _, row in df.iterrows():
        country = str(row.get("COUNTRY", "")).strip()
        if not country or country == "nan":
            continue
        first = str(row.get("PLAYER_FIRST_NAME", "")).strip()
        last  = str(row.get("PLAYER_LAST_NAME",  "")).strip()
        full  = f"{first} {last}".strip()
        if full:
            name_map[normalize(full)] = country

    print(f"✓  ({len(name_map)} players mapped)")
    return name_map


def lookup_country(name: str, country_map: dict[str, str]) -> str:
    key = normalize(name)
    if key in country_map:
        return country_map[key]
    # Last-name-only fallback (handles rare accent/spacing mismatches)
    last = key.split()[-1] if key.split() else ""
    for stored_key, country in country_map.items():
        if last and stored_key.endswith(last):
            return country
    return "Unknown"


def main() -> None:
    print("=" * 55)
    print("NBA MVP WINNERS WITH NATIONALITY")
    print("=" * 55 + "\n")

    country_map = build_country_map()
    time.sleep(DELAY)

    rows = []
    for season, player in MVP_WINNERS.items():
        country = lookup_country(player, country_map)
        is_intl = country.lower() not in _USA and country not in ("Unknown", "")
        rows.append({
            "SEASON":           season,
            "PLAYER_NAME":      player,
            "COUNTRY":          country,
            "IS_INTERNATIONAL": is_intl,
        })
        print(f"  {season}: {player} — {country}")

    df = pd.DataFrame(rows)

    print("\n" + "=" * 55)
    intl = df[df["IS_INTERNATIONAL"]]
    print(f"International MVPs: {len(intl)} of {len(df)}")
    print(intl[["SEASON", "PLAYER_NAME", "COUNTRY"]].to_string(index=False))

    df.to_csv("data/mvp_winners.csv", index=False)
    print("\nSaved: data/mvp_winners.csv")


if __name__ == "__main__":
    main()
