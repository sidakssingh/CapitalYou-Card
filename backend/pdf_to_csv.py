"""Minimal PDF-to-CSV conversion helpers.

Design goals:
- Be lazy about the pypdf dependency (import inside the function and emit a clear
  error if it's missing).
- Provide a simple, best-effort parser that extracts merchant/amount/date from
  free text; this is intentionally lightweight and meant as a stopgap for
  simple statements or debugging.

If you prefer to keep all PDF parsing outside the pipeline, the `convert_pdf_to_csv`
function can be called independently and its output passed to the existing
CSV-based pipeline functions.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import List, Dict, Optional

import pandas as pd

_AMOUNT_RE = re.compile(r"\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))")
_DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})")


def parse_transactions_from_text(text: str) -> List[Dict[str, object]]:
    """Parse transactions from extracted PDF text.

    The parser handles two common layouts:
    1. Multi-line blocks where a date is on its own line followed by merchant,
       optional location, and an amount on a separate line (typical of many
       credit-card statement extracts).
    2. Single-line rows that include the amount and merchant on the same line.

    Returns a list of dicts with keys `merchant`, `amount`, and `date` (date may
    be empty when not found). Lines without recognizable amounts are ignored.
    """
    rows: List[Dict[str, object]] = []
    lines = [ln.strip() for ln in text.splitlines()]
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            i += 1
            continue

        # Prefer multi-line pattern starting with a date line
        date_m = _DATE_RE.search(line)
        # Only treat as a multi-line record if the date line does NOT contain an amount
        if date_m and not _AMOUNT_RE.search(line):
            date = date_m.group(0)
            # Look ahead for merchant and amount
            merchant = ""
            amount = None
            j = i + 1
            # Find the first non-empty line that is not an amount or date to be merchant
            while j < len(lines):
                if not lines[j].strip():
                    j += 1
                    continue
                if _DATE_RE.search(lines[j]):
                    j += 1
                    continue
                if _AMOUNT_RE.search(lines[j]):
                    # amount appears immediately after date (no merchant line)
                    break
                merchant = lines[j]
                j += 1
                break

            # From current j, search forward for a line containing the amount
            k = j
            while k < len(lines):
                amt_match = _AMOUNT_RE.search(lines[k])
                if amt_match:
                    try:
                        amount = float(amt_match.group(1).replace(",", ""))
                    except ValueError:
                        amount = None
                    break
                k += 1

            if amount is not None:
                merchant_clean = merchant
                if merchant_clean:
                    merchant_clean = _AMOUNT_RE.sub("", merchant_clean)
                    merchant_clean = _DATE_RE.sub("", merchant_clean)
                    merchant_clean = merchant_clean.strip(" -:|,\t\n")
                if not merchant_clean:
                    merchant_clean = "unknown"
                rows.append({"merchant": merchant_clean, "amount": amount, "date": date})
                # Advance index past the amount line
                i = k + 1
                continue

        # Fallback: single-line with amount and merchant on same line
        m = _AMOUNT_RE.findall(line)
        if m:
            amt_str = m[-1]
            try:
                amount = float(amt_str.replace(",", ""))
            except ValueError:
                i += 1
                continue

            merchant = _AMOUNT_RE.sub("", line)
            merchant = _DATE_RE.sub("", merchant)
            merchant = merchant.strip(" -:|,\t\n")
            if merchant == "":
                merchant = "unknown"

            date_m = _DATE_RE.search(line)
            date = date_m.group(0) if date_m else ""

            rows.append({"merchant": merchant, "amount": amount, "date": date})

        i += 1

    return rows


def convert_pdf_to_csv(pdf_path: str, output_csv: Optional[str] = None, user_id: Optional[str] = None) -> str:
    """Convert a PDF file to CSV and return the CSV path.

    The function performs a lazy import of pypdf and raises an informative
    ImportError if the package is not installed.

    The output CSV will contain the columns: `user_id`, `date`, `merchant`,
    `amount`, `location` (matching the project's example CSV layout).
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path!r}")

    # lazy import so the module can be imported without pypdf installed
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception as exc:  # pragma: no cover - environment dependent
        raise ImportError(
            "PDF conversion requires `pypdf` to be installed. Run `pip install pypdf`." +
            f" Details: {exc}"
        )

    reader = PdfReader(str(pdf_path))
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages)

    rows = parse_transactions_from_text(text)
    if not rows:
        raise ValueError("No transactions could be parsed from the PDF")

    df = pd.DataFrame(rows)
    df["location"] = ""
    if "date" not in df.columns:
        df["date"] = ""
    if user_id is not None:
        df["user_id"] = user_id
    else:
        df["user_id"] = ""

    # Ensure column order matches example.csv
    df = df[["user_id", "date", "merchant", "amount", "location"]]

    if output_csv is None:
        output_csv = str(pdf_path.with_suffix(".csv"))

    df.to_csv(output_csv, index=False)
    return output_csv
