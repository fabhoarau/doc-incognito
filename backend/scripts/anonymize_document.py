"""CLI entry point: anonymize a document (PDF or image) - text pipeline.

Usage (from the backend/ directory, venv active):
    python -m scripts.anonymize_document path/to/file.pdf
"""

import sys
from pathlib import Path

from app.core.config import settings
from app.services import anonymizer


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.anonymize_document <file.pdf|file.png|file.jpg>")
        sys.exit(1)

    result = anonymizer.anonymize_document(Path(sys.argv[1]))

    print(f"Input:        {result.input_name}")
    print(f"Extraction:   {result.extraction_mode.value}")
    print(f"Replacements: {result.total_replacements}")
    for summary in result.replacements:
        print(f"  {summary.entity_type:<20} x{summary.count}")
    for output in result.output_files:
        print(f"Output: {settings.output_dir / output.filename}")

    if result.guardrail_passed:
        print("Guardrail OK: no personal entry remains.")
    else:
        # result.leaks is already masked by the service - never print raw values
        print(f"WARNING - guardrail failed: {len(result.leaks)} personal "
              f"entr{'y' if len(result.leaks) == 1 else 'ies'} still present (values masked). "
              "No output file was written.")
        sys.exit(2)


if __name__ == "__main__":
    main()
