#!/usr/bin/env python3
"""Compress PDFs in place using Ghostscript.

Conference decks and posters are often dominated by uncompressed bitmaps.
Re-distilling them with Ghostscript typically shaves 50-80% with no visible
loss. Each PDF is recompressed to a temporary file and only replaced if the
result is actually smaller, so the script is safe to re-run.

Requires Ghostscript (the ``gs`` command). On macOS: ``brew install ghostscript``;
on Debian/Ubuntu: ``sudo apt-get install ghostscript``.

Examples
--------
    # See projected savings without changing anything
    python3 scripts/compress_pdfs.py --dry-run

    # Compress every PDF under assets/files/conference at /ebook quality
    python3 scripts/compress_pdfs.py

    # Stronger compression for screen-only viewing
    python3 scripts/compress_pdfs.py --setting screen
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = "assets/files"
# Ghostscript PDFSETTINGS presets, from highest quality to smallest.
SETTINGS = {
    "printer": "/printer",    # 300 dpi, near-print quality
    "ebook": "/ebook",        # 150 dpi, good balance (default)
    "screen": "/screen",      # 72 dpi, smallest
}


def human(num_bytes: int) -> str:
    """Return a compact human-readable size string."""
    value = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} GB"


def compress(pdf: Path, setting: str, dry_run: bool, min_saving: float) -> tuple[int, int]:
    """Compress one PDF. Returns (original_bytes, final_bytes)."""
    original = pdf.stat().st_size
    if dry_run:
        print(f"  would compress {pdf.relative_to(ROOT)} ({human(original)})")
        return original, original

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        cmd = [
            "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.5",
            f"-dPDFSETTINGS={SETTINGS[setting]}",
            "-dNOPAUSE", "-dQUIET", "-dBATCH",
            f"-sOutputFile={tmp_path}", str(pdf),
        ]
        subprocess.run(cmd, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"  ERROR compressing {pdf.relative_to(ROOT)}: {exc}", file=sys.stderr)
        tmp_path.unlink(missing_ok=True)
        return original, original

    new_size = tmp_path.stat().st_size
    saving = 1 - (new_size / original) if original else 0
    if new_size < original and saving >= min_saving:
        shutil.move(str(tmp_path), str(pdf))
        print(
            f"  {pdf.relative_to(ROOT)}: {human(original)} -> "
            f"{human(new_size)} (-{saving * 100:.0f}%)"
        )
        return original, new_size

    tmp_path.unlink(missing_ok=True)
    print(f"  {pdf.relative_to(ROOT)}: kept ({human(original)}, no useful gain)")
    return original, original


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "directory", nargs="?", default=DEFAULT_DIR,
        help=f"Directory to scan recursively (default: {DEFAULT_DIR})",
    )
    parser.add_argument(
        "--setting", choices=sorted(SETTINGS), default="ebook",
        help="Ghostscript quality preset (default: ebook)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="List candidate PDFs without modifying them",
    )
    parser.add_argument(
        "--min-saving", type=float, default=0.05,
        help="Only replace a PDF if it shrinks by at least this fraction (default: 0.05)",
    )
    args = parser.parse_args()

    if not args.dry_run and shutil.which("gs") is None:
        print(
            "Ghostscript ('gs') not found. Install it and retry, "
            "or use --dry-run to preview.",
            file=sys.stderr,
        )
        return 1

    base = Path(args.directory)
    if not base.is_absolute():
        base = ROOT / base
    if not base.exists():
        print(f"Directory not found: {base}", file=sys.stderr)
        return 1

    pdfs = sorted(p for p in base.rglob("*.pdf") if p.is_file())
    if not pdfs:
        print(f"No PDFs found under {base}.")
        return 0

    print(f"Scanning {len(pdfs)} PDF(s) under {base.relative_to(ROOT)}...")
    total_before = total_after = 0
    for pdf in pdfs:
        before, after = compress(pdf, args.setting, args.dry_run, args.min_saving)
        total_before += before
        total_after += after

    if not args.dry_run:
        saved = total_before - total_after
        print(
            f"\nDone. {human(total_before)} -> {human(total_after)} "
            f"(saved {human(max(saved, 0))})."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
