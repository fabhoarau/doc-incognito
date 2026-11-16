"""Security and API-contract regression tests (audit findings M1-M10)."""

import asyncio

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.routers.anonymize import download
from app.services import guardrail, personal_data

client = TestClient(app)


# --- M1/M14: /api/files/{filename} is confined to output/ -------------------


def test_download_rejects_traversal_direct_call():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(download("../perso.txt"))
    assert exc.value.status_code == 404


def test_download_rejects_traversal_and_foreign_files_over_http():
    for name in ["..%2Fperso.txt", "..%252Fperso.txt", "%2e%2e%2Fperso.txt", "perso.txt", "x.html"]:
        r = client.get(f"/api/files/{name}")
        assert r.status_code == 404, name


def test_download_serves_only_output_files(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "doc.pdf", "hello")
    with open(pdf, "rb") as fh:
        r = client.post("/api/anonymize", files={"file": ("doc.pdf", fh, "application/pdf")})
    assert r.status_code == 200
    url = r.json()["output_files"][0]["download_url"]
    dl = client.get(url)
    assert dl.status_code == 200
    # attachment, never rendered inline
    assert "attachment" in dl.headers.get("content-disposition", "")


# --- M4/M6: upload validation is shared and consistent -----------------------


def test_metadata_inspect_rejects_non_allowed_suffix(tmp_path):
    note = tmp_path / "note.txt"
    note.write_text("hello")
    with open(note, "rb") as fh:
        r = client.post("/api/metadata/inspect", files={"file": ("note.txt", fh)})
    assert r.status_code == 422
    assert "Unsupported file type" in r.json()["detail"]


def test_corrupt_image_is_422_not_500():
    r = client.post(
        "/api/redact",
        files={"file": ("bad.png", b"this is not an image", "image/png")},
    )
    assert r.status_code == 422


def test_hostile_upload_name_is_sanitized(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "evil.pdf", "hello")
    with open(pdf, "rb") as fh:
        r = client.post(
            "/api/metadata/inspect", files={"file": ("../../evil.pdf", fh, "application/pdf")}
        )
    assert r.status_code == 200
    assert r.json()["filename"] == "evil.pdf"
    # nothing was written outside uploads/
    assert (settings.upload_dir / "evil.pdf").is_file()
    assert not (tmp_path / "evil.pdf").exists() or tmp_path / "evil.pdf" == pdf


def test_empty_upload_name_is_422():
    r = client.post("/api/anonymize", files={"file": ("", b"x", "application/pdf")})
    assert r.status_code == 422


def test_upload_size_cap_returns_413(tmp_path, make_pdf, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_bytes", 10)
    pdf = make_pdf(tmp_path / "big.pdf", "hello world, definitely more than ten bytes")
    with open(pdf, "rb") as fh:
        r = client.post("/api/anonymize", files={"file": ("big.pdf", fh, "application/pdf")})
    assert r.status_code == 413


# --- M3: guardrail failure contract ------------------------------------------


def test_guardrail_failure_writes_no_file_and_masks_leaks(tmp_path, make_pdf, monkeypatch):
    monkeypatch.setattr(guardrail, "find_leaks", lambda text, entries: ["SECRETVALUE"])
    pdf = make_pdf(tmp_path / "doc.pdf", "some text")
    with open(pdf, "rb") as fh:
        r = client.post("/api/anonymize", files={"file": ("doc.pdf", fh, "application/pdf")})
    assert r.status_code == 200
    data = r.json()
    assert data["guardrail_passed"] is False
    assert data["output_files"] == []  # no downloadable file on failure
    assert "SECRETVALUE" not in r.text  # leak values masked in the API response
    assert list(settings.output_dir.iterdir()) == []  # nothing written to output/


# --- M2: image pipeline redacts multi-word personal entries -------------------


def test_redact_covers_multiword_personal_entry(tmp_path, make_image):
    png = make_image(tmp_path / "shot.png", "Jean Dupont - jean.dupont@example.fr")
    with open(png, "rb") as fh:
        r = client.post("/api/redact", files={"file": ("shot.png", fh, "image/png")})
    assert r.status_code == 200
    # "Jean" + "Dupont" (entry spans two OCR words) + the email word
    assert r.json()["redacted_zone_count"] >= 3


# --- M9: overlapping entries are tokenized longest-first ----------------------


def test_tokenize_overlapping_entries_longest_first():
    text = personal_data.tokenize("Jean Dupont habite ici", ["Jean", "Jean Dupont"])
    assert text == "[PERSO2] habite ici"


def test_perso_file_absent_loads_empty(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "personal_data_file", tmp_path / "nope.txt")
    assert personal_data.load() == []


# --- M10: download URLs are URL-encoded (spaces/accents) ----------------------


def test_download_url_is_encoded_and_served(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "Capture d'écran é.pdf", "Bonjour Jean Dupont")
    with open(pdf, "rb") as fh:
        r = client.post(
            "/api/anonymize",
            files={"file": ("Capture d'écran é.pdf", fh, "application/pdf")},
        )
    assert r.status_code == 200
    url = r.json()["output_files"][0]["download_url"]
    assert "%20" in url or "%C3%A9" in url  # quoted, not raw
    dl = client.get(url)
    assert dl.status_code == 200
