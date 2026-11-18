"""API tests: FastAPI TestClient against the real app, isolated tmp storage."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_personal_data_get_put_roundtrip():
    r = client.get("/api/personal-data")
    assert r.status_code == 200
    assert "Jean Dupont" in r.json()["content"]

    r = client.put("/api/personal-data", json={"content": "Nouvelle entree\n"})
    assert r.status_code == 200
    assert client.get("/api/personal-data").json()["content"] == "Nouvelle entree\n"


def test_personal_data_put_unwritable_file_is_422_not_500(tmp_path, monkeypatch):
    # regression: read-only perso.txt mount in Docker used to produce a 500
    from app.core.config import settings

    monkeypatch.setattr(settings, "personal_data_file", tmp_path)  # a dir -> OSError
    r = client.put("/api/personal-data", json={"content": "x\n"})
    assert r.status_code == 422
    assert "Cannot write" in r.json()["detail"]


def test_anonymize_pdf_tokenizes_personal_data_and_passes_guardrail(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "doc.pdf", "Monsieur Jean Dupont, ne le 01/01/1990 a Paris.")
    with open(pdf, "rb") as fh:
        r = client.post("/api/anonymize", files={"file": ("doc.pdf", fh, "application/pdf")})
    assert r.status_code == 200
    data = r.json()
    assert data["extraction_mode"] == "pdf-text"
    assert data["guardrail_passed"] is True
    assert data["leaks"] == []
    names = [f["filename"] for f in data["output_files"]]
    assert any(n.endswith("_anonymized.txt") for n in names)
    assert any(n.endswith("_anonymized.pdf") for n in names)

    dl = client.get(data["output_files"][0]["download_url"])
    assert dl.status_code == 200
    # the personal entry must not survive (tokenized before analysis, then
    # possibly re-anonymized by Presidio - what matters is the entry is gone)
    assert "Jean Dupont" not in dl.text


def test_anonymize_rejects_unsupported_type(tmp_path):
    note = tmp_path / "note.txt"
    note.write_text("hello")
    with open(note, "rb") as fh:
        r = client.post("/api/anonymize", files={"file": ("note.txt", fh)})
    assert r.status_code == 422
    assert "Unsupported file type" in r.json()["detail"]


def test_redact_image_covers_personal_data(tmp_path, make_image):
    png = make_image(tmp_path / "shot.png", "Jean Dupont - jean.dupont@example.fr")
    with open(png, "rb") as fh:
        r = client.post("/api/redact", files={"file": ("shot.png", fh, "image/png")})
    assert r.status_code == 200
    data = r.json()
    assert data["redacted_zone_count"] >= 1
    dl = client.get(data["output_file"]["download_url"])
    assert dl.status_code == 200
    assert dl.headers["content-type"] == "image/png"


def test_redact_rejects_pdf(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "doc.pdf", "hello")
    with open(pdf, "rb") as fh:
        r = client.post("/api/redact", files={"file": ("doc.pdf", fh, "application/pdf")})
    assert r.status_code == 422
    assert "images" in r.json()["detail"]


def test_metadata_inspect_endpoint_flags_author(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "doc.pdf", "hello", metadata={"author": "Jean Dupont"})
    with open(pdf, "rb") as fh:
        r = client.post("/api/metadata/inspect", files={"file": ("doc.pdf", fh, "application/pdf")})
    assert r.status_code == 200
    data = r.json()
    assert data["is_clean"] is False
    assert data["leak_count"] >= 1
    assert any(f["name"] == "author" and f["is_leak"] for f in data["fields"])
