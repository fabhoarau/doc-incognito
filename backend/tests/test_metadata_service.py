"""Unit tests for app.services.metadata_service (PDF metadata / image EXIF)."""

from app.services import metadata_service


def test_pdf_author_is_flagged_as_leak(tmp_path, make_pdf):
    pdf = make_pdf(
        tmp_path / "doc.pdf", "hello", metadata={"author": "Jean Dupont", "format": "PDF 1.7"}
    )
    report = metadata_service.inspect(pdf)
    assert report.filename == "doc.pdf"
    assert report.leak_count == 1
    assert report.is_clean is False
    author = next(f for f in report.fields if f.name == "author")
    assert author.value == "Jean Dupont"
    assert author.is_leak is True
    # technical fields are neutral, not leaks
    fmt = next(f for f in report.fields if f.name == "format")
    assert fmt.is_leak is False


def test_pdf_without_metadata_is_clean(tmp_path, make_pdf):
    pdf = make_pdf(tmp_path / "clean.pdf", "hello")
    report = metadata_service.inspect(pdf)
    assert report.is_clean is True
    assert report.leak_count == 0
    # pymupdf always reports the technical "format" field - neutral, not a leak
    assert all(not f.is_leak for f in report.fields)


def test_png_with_exif_is_flagged(tmp_path, make_image):
    png = make_image(
        tmp_path / "shot.png",
        "Jean Dupont",
        exif={0x8298: "Jean Dupont", 0x010F: "LeakCam"},  # Copyright, Make
    )
    report = metadata_service.inspect(png)
    assert report.leak_count == 2
    assert report.is_clean is False
    assert all(f.is_leak for f in report.fields)
    assert any(f.value == "Jean Dupont" for f in report.fields)


def test_png_without_exif_is_clean(tmp_path, make_image):
    png = make_image(tmp_path / "clean.png", "hello")
    report = metadata_service.inspect(png)
    assert report.is_clean is True
    assert report.leak_count == 0
