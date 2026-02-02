#!/usr/bin/env python3
"""Generate images.json manifests for award photo folders."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AWARDS_DIR = ROOT / 'images' / 'Awards'
ALLOWED = {'.jpg', '.jpeg', '.png', '.webp'}


def main() -> int:
    if not AWARDS_DIR.exists():
        return 0

    for folder in sorted(AWARDS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        images = [p.name for p in sorted(folder.iterdir()) if p.suffix.lower() in ALLOWED]
        manifest = {"images": images}
        (folder / 'images.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
