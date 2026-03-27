#!/usr/bin/env python3
"""
Bracketology Data Pipeline
Scrapes Warren Nolan's NET Nitty Gritty Report + individual team sheets
for game-by-game results (top wins, bad losses).

Usage:
    python3 scrape_nitty_gritty.py                       # all teams, writes teams.json
    python3 scrape_nitty_gritty.py --top 68               # only scrape sheets for top 68
    python3 scrape_nitty_gritty.py --skip-sheets           # skip team sheet scraping (fast)
    python3 scrape_nitty_gritty.py -o my_output.json       # custom output path
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

BASE = "https://www.warrennolan.com"
LOGO_BASE = "https://www.warrennolan.com/images/team/new/80x80"


def safe_int(raw: str, default: int) -> int:
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


# ─── NITTY GRITTY TABLE ─────────────────────────────────────────────

def scrape_nitty_gritty(html: str) -> list[dict]:
    """
    Parse the Nitty Gritty table.
    Column layout (16 cells per row):
      0: NET rank
      1: Team name + conference
      2: JUNK (team sheet link cell). SKIP.
      3: Record
      4: SOS
      5: NC Record
      6: NC SOS
      7: Home
      8: Road
      9: Neutral
      10: Q1
      11: Q2
      12: Q3
      13: Q4
      14: Avg NET Wins
      15: Avg NET Losses
    """
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")

    data_table = None
    for table in tables:
        if len(table.find_all("tr")) > 20:
            data_table = table
            break

    if not data_table:
        raise ValueError("Could not find the Nitty Gritty data table.")

    teams = []
    for row in data_table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 16:
            continue

        try:
            net = int(cells[0].get_text(strip=True))
        except ValueError:
            continue

        # Team name from first non-empty link
        team_cell = cells[1]
        name = ""
        slug = ""
        for link in team_cell.find_all("a"):
            link_text = link.get_text(strip=True)
            if link_text:
                name = link_text
                href = link.get("href", "")
                # Extract slug from /basketball/2026/schedule/Duke
                parts = href.rstrip("/").split("/")
                if parts:
                    slug = parts[-1]
                break

        # Conference
        cell_text = team_cell.get_text("\n", strip=True)
        conf = ""
        conf_record = ""
        for line in cell_text.split("\n"):
            line = line.strip()
            if line and line != name:
                m = re.match(r"([A-Za-z\s\-&\.0-9]+?)(?:\s*\(|$)", line)
                if m:
                    conf = m.group(1).strip()
                cr = re.search(r"\((\d+-\d+)\)", line)
                if cr:
                    conf_record = cr.group(1)
                break

        record = cells[3].get_text(strip=True)
        sos = safe_int(cells[4].get_text(strip=True), 999)
        nc_record = cells[5].get_text(strip=True)
        nc_sos = safe_int(cells[6].get_text(strip=True), 999)

        home = cells[7].get_text(strip=True)
        road = cells[8].get_text(strip=True)
        neutral = cells[9].get_text(strip=True)
        q1 = cells[10].get_text(strip=True)
        q2 = cells[11].get_text(strip=True)
        q3 = cells[12].get_text(strip=True)
        q4 = cells[13].get_text(strip=True)

        avg_w = safe_int(cells[14].get_text(strip=True), 0)
        avg_l = safe_int(cells[15].get_text(strip=True), 0)

        # Build logo URL from slug
        logo = f"{LOGO_BASE}/{slug}.png" if slug else ""

        teams.append({
            "id": f"t{net}",
            "name": name,
            "slug": slug,
            "logo": logo,
            "conf": conf,
            "confRecord": conf_record,
            "net": net,
            "record": record,
            "sos": sos,
            "ncRecord": nc_record,
            "ncSos": nc_sos,
            "home": home,
            "road": road,
            "neutral": neutral,
            "q1": q1,
            "q2": q2,
            "q3": q3,
            "q4": q4,
            "avgNetWins": avg_w,
            "avgNetLosses": avg_l,
            "keyWins": [],
            "keyLosses": [],
        })

    return teams


# ─── TEAM SHEET SCRAPING ────────────────────────────────────────────

def scrape_team_sheet(slug: str, year: str = "2026") -> dict:
    """
    Scrape a single team's NET team sheet page for game-by-game results.
    Returns {"wins": [...], "losses": [...]} sorted by opponent NET.
    Each entry: {"opp": name, "oppNet": int, "score": "78-72", "site": "H/A/N", "date": "02-21"}
    """
    url = f"{BASE}/basketball/{year}/team-net-sheet?team={slug}"
    try:
        html = fetch_html(url)
    except Exception as e:
        print(f"  WARNING: Failed to fetch sheet for {slug}: {e}", file=sys.stderr)
        return {"wins": [], "losses": []}

    soup = BeautifulSoup(html, "html.parser")

    wins = []
    losses = []

    rows = soup.find_all("div", class_="ts-nitty-row")

    for row in rows:
        children = row.find_all("div", recursive=False)
        if len(children) < 6:
            continue

        try:
            opp_net = int(children[0].get_text(strip=True))
        except ValueError:
            continue

        site = children[1].get_text(strip=True)
        opp_name = children[2].get_text(strip=True)

        try:
            score1 = int(children[3].get_text(strip=True))
            score2 = int(children[4].get_text(strip=True))
        except (ValueError, IndexError):
            continue

        date_str = children[5].get_text(strip=True) if len(children) > 5 else ""

        opp_score_classes = children[4].get("class", [])
        is_loss = "ts-nitty-loss" in opp_score_classes or score1 < score2

        game = {
            "opp": opp_name,
            "oppNet": opp_net,
            "score": f"{score1}-{score2}",
            "site": site,
            "date": date_str,
        }

        if is_loss:
            losses.append(game)
        else:
            wins.append(game)

    wins.sort(key=lambda g: g["oppNet"])
    losses.sort(key=lambda g: g["oppNet"], reverse=True)

    metrics = {}
    metric_keys = [
        ["kpi", "sor", "wab"],
        ["bpi", "pom", "tRank"],
    ]
    half_widths = soup.find_all("div", class_="ts-half-width")
    mi = 0
    for hw in half_widths:
        data_left = hw.find("div", class_="ts-data-left")
        if not data_left or mi >= len(metric_keys):
            continue
        parts = []
        for item in data_left.children:
            if isinstance(item, str):
                val = item.strip()
                if val:
                    parts.append(val)
        keys = metric_keys[mi]
        for j, key in enumerate(keys):
            if j < len(parts):
                try:
                    metrics[key] = int(parts[j])
                except ValueError:
                    metrics[key] = parts[j]
            else:
                metrics[key] = None
        mi += 1

    return {"wins": wins[:5], "losses": losses[:5], "metrics": metrics}


# ─── MAIN ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape Warren Nolan Nitty Gritty + Team Sheets")
    parser.add_argument("-o", "--output", default="teams.json", help="Output JSON path")
    parser.add_argument("--year", default="2026", help="Season year")
    parser.add_argument("--top", type=int, default=None, help="Only scrape sheets for top N teams by NET")
    parser.add_argument("--skip-sheets", action="store_true", help="Skip team sheet scraping")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between sheet requests (seconds)")
    args = parser.parse_args()
    if args.top is not None and args.top <= 0:
        parser.error("--top must be a positive integer")
    if args.delay < 0:
        parser.error("--delay must be non-negative")

    # Step 1: Scrape Nitty Gritty
    url = f"{BASE}/basketball/{args.year}/net-nitty"
    print(f"Step 1: Fetching Nitty Gritty from {url} ...")
    try:
        html = fetch_html(url)
    except requests.RequestException as e:
        print(f"ERROR: Failed to fetch Nitty Gritty page: {e}", file=sys.stderr)
        sys.exit(1)
    print("  Parsing table ...")
    try:
        teams = scrape_nitty_gritty(html)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    if not teams:
        print("ERROR: No teams parsed.", file=sys.stderr)
        sys.exit(1)

    print(f"  Found {len(teams)} teams")
    if teams:
        t = teams[0]
        print(f"  Sanity check: #{t['net']} {t['name']} ({t['conf']}) {t['record']} Q1:{t['q1']} logo:{t['logo']}")

    # Step 2: Scrape team sheets for wins/losses
    if not args.skip_sheets:
        sheet_teams = teams if args.top is None else teams[:args.top]
        total = len(sheet_teams)
        print(f"\nStep 2: Scraping team sheets for {total} teams (delay={args.delay}s) ...")

        for i, team in enumerate(sheet_teams):
            slug = team.get("slug", "")
            if not slug:
                print(f"  [{i+1}/{total}] {team['name']}: no slug, skipping")
                continue

            print(f"  [{i+1}/{total}] {team['name']} ({slug}) ...", end=" ", flush=True)
            result = scrape_team_sheet(slug, args.year)
            team["keyWins"] = result["wins"]
            team["keyLosses"] = result["losses"]
            m = result.get("metrics", {})
            team["kpi"] = m.get("kpi")
            team["sor"] = m.get("sor")
            team["wab"] = m.get("wab")
            team["bpi"] = m.get("bpi")
            team["pom"] = m.get("pom")
            team["tRank"] = m.get("tRank")

            w_count = len(result["wins"])
            l_count = len(result["losses"])
            top_win = f"best: #{result['wins'][0]['oppNet']} {result['wins'][0]['opp']}" if result["wins"] else "no wins parsed"
            metrics_str = f"KPI:{m.get('kpi','-')} WAB:{m.get('wab','-')}"
            print(f"{w_count}W {l_count}L — {top_win} — {metrics_str}")

            if i < total - 1:
                time.sleep(args.delay)

        print(f"  Done scraping sheets.")
    else:
        print("\nStep 2: Skipping team sheets (--skip-sheets)")

    # Remove slug from output (keep logo, remove slug)
    for team in teams:
        team.pop("slug", None)

    # Write output
    output = {
        "meta": {
            "source": "Warren Nolan NET Nitty Gritty + Team Sheets",
            "url": url,
            "scrapedAt": datetime.now(timezone.utc).isoformat(),
            "season": args.year,
            "teamCount": len(teams),
            "sheetsScraped": not args.skip_sheets,
        },
        "teams": teams,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {len(teams)} teams to {output_path}")


if __name__ == "__main__":
    main()
