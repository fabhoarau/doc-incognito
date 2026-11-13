"""CLI entry point: irreversible redaction of sensitive zones on an image.

Usage (from the backend/ directory, venv active):
    python -m scripts.redact_image path/to/image.png
"""

import sys
from pathlib import Path

from app.services import image_redactor


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.redact_image <file.png|file.jpg|file.jpeg>")
        sys.exit(1)

    output, zone_count = image_redactor.redact_image(Path(sys.argv[1]))
    print(f"Redacted {zone_count} zone(s) -> {output}")


if __name__ == "__main__":
    main()
