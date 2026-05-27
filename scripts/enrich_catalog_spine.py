#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "cards" / "catalog.json"
DEFAULT_CDN_BASE = "https://raw.githubusercontent.com/phdev-design/spine-card/main"


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def save_catalog(catalog: dict) -> None:
    CATALOG_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def enrich_catalog(cdn_base: str = DEFAULT_CDN_BASE) -> dict:
    catalog = load_catalog()
    cdn_base = cdn_base.rstrip("/")

    for card in catalog["cards"]:
        monster_id = card["id"]
        json_path = ROOT / monster_id / f"{monster_id}.json"
        if not json_path.exists():
            continue

        skeleton = json.loads(json_path.read_text(encoding="utf-8"))
        animations = sorted(skeleton.get("animations", {}).keys())
        card["spine"] = {
            "version": skeleton.get("skeleton", {}).get("spine"),
            "jsonUrl": f"{cdn_base}/{monster_id}/{monster_id}.json",
            "atlasUrl": f"{cdn_base}/{monster_id}/{monster_id}.atlas",
            "animations": animations,
            "defaultAnimation": "std" if "std" in animations else animations[0],
        }

    catalog["generatedAt"] = datetime.now(timezone.utc).isoformat()
    catalog["cdnBase"] = cdn_base
    return catalog


if __name__ == "__main__":
    updated = enrich_catalog()
    save_catalog(updated)
    with_spine = sum(1 for card in updated["cards"] if "spine" in card)
    print(f"Updated {CATALOG_PATH}")
    print(f"Cards with spine metadata: {with_spine}/{updated['totalCount']}")
