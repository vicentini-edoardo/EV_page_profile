#!/usr/bin/env python3
"""Convert raster images (PNG/JPG) to WebP and report oversized assets.

Walks an image tree, converts every PNG/JPEG to a sibling ``.webp`` file, and
prints the size saving for each. Files already in WebP are skipped. Use this
locally before committing new artwork so the repository only ships compact,
web-friendly assets.

Requires Pillow (``pip install Pillow``). Nothing is deleted by default; pass
``--replace`` to remove the original once a smaller WebP has been written.

Examples
--------
    # Dry run: report what would be converted and flag anything over budget
    python3 scripts/optimize_images.py --dry-run

    # Convert everything under assets/img and the root hero image, quality 82
    python3 scripts/optimize_images.py --quality 82

    # Convert and delete the originals (remember to update CSS/HTML refs)
    python3 scripts/optimize_images.py --replace
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONVERTIBLE = {".png", ".jpg", ".jpeg"}
# Default search roots, relative to the repository root.
DEFAULT_TARGETS = ["assets/img", "home_back.PNG"]
# Warn about any single image larger than this (bytes) after conversion.
DEFAULT_BUDGET_KB = 400


def human(num_bytes: int) -> str:
    """Return a compact human-readable size string."""
    value = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} GB"


def iter_images(targets: list[Path]) -> list[Path]:
    """Collect convertible image files from files and directories."""
    found: list[Path] = []
    for target in targets:
        if target.is_file() and target.suffix.lower() in CONVERTIBLE:
            found.append(target)
        elif target.is_dir():
            found.extend(
                p for p in sorted(target.rglob("*"))
                if p.is_file() and p.suffix.lower() in CONVERTIBLE
            )
    return found


def convert(path: Path, quality: int, replace: bool, dry_run: bool) -> tuple[int, int]:
    """Convert one image to WebP. Returns (original_bytes, webp_bytes)."""
    original_bytes = path.stat().st_size
    webp_path = path.with_suffix(".webp")

    if dry_run:
        print(f"  would convert {path.relative_to(ROOT)} ({human(original_bytes)})")
        return original_bytes, original_bytes

    from PIL import Image  # imported lazily so --dry-run/--help work without Pillow

    try:
        with Image.open(path) as img:
            # Preserve transparency for PNGs; flatten nothing else.
            save_kwargs = {"quality": quality, "method": 6}
            if img.mode in ("P", "LA"):
                img = img.convert("RGBA")
            img.save(webp_path, "WEBP", **save_kwargs)
    except Exception as exc:  # noqa: BLE001 - report and keep going
        print(f"  ERROR converting {path.relative_to(ROOT)}: {exc}", file=sys.stderr)
        return original_bytes, original_bytes

    webp_bytes = webp_path.stat().st_size
    saved = original_bytes - webp_bytes
    note = ""
    if webp_bytes >= original_bytes:
        note = "  (WebP not smaller; keeping original)"
        webp_path.unlink(missing_ok=True)
        webp_bytes = original_bytes
    elif replace:
        path.unlink()
        note = "  (original removed)"

    print(
        f"  {path.relative_to(ROOT)}: {human(original_bytes)} -> "
        f"{human(webp_bytes)} (saved {human(max(saved, 0))}){note}"
    )
    return original_bytes, webp_bytes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "targets", nargs="*", default=DEFAULT_TARGETS,
        help="Files or directories to scan (default: assets/img, home_back.PNG)",
    )
    parser.add_argument(
        "--quality", type=int, default=82,
        help="WebP quality 1-100 (default: 82)",
    )
    parser.add_argument(
        "--replace", action="store_true",
        help="Delete the original after writing a smaller WebP",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="List what would be converted without writing files",
    )
    parser.add_argument(
        "--budget-kb", type=int, default=DEFAULT_BUDGET_KB,
        help=f"Flag images larger than this in KB (default: {DEFAULT_BUDGET_KB})",
    )
    args = parser.parse_args()

    targets = [ROOT / t if not Path(t).is_absolute() else Path(t) for t in args.targets]
    images = iter_images(targets)
    if not images:
        print("No PNG/JPEG images found to convert.")
        return 0

    if not args.dry_run:
        try:
            import PIL  # noqa: F401
        except ImportError:
            print(
                "Pillow is required. Install it with: pip install Pillow",
                file=sys.stderr,
            )
            return 1

    print(f"Scanning {len(images)} image(s)...")
    total_before = total_after = 0
    for path in images:
        before, after = convert(path, args.quality, args.replace, args.dry_run)
        total_before += before
        total_after += after

    budget = args.budget_kb * 1024
    oversized = [p for p in images if p.exists() and p.stat().st_size > budget]
    if oversized:
        print(f"\nImages over {args.budget_kb} KB budget:")
        for path in oversized:
            print(f"  {human(path.stat().st_size)}  {path.relative_to(ROOT)}")

    if not args.dry_run:
        saved = total_before - total_after
        print(
            f"\nDone. {human(total_before)} -> {human(total_after)} "
            f"(saved {human(max(saved, 0))})."
        )
        print("Remember to update any CSS/HTML references to renamed files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
