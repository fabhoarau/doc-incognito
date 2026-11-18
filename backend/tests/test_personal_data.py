"""Unit tests for app.services.personal_data (perso.txt handling)."""

import pytest

from app.core.config import settings
from app.services import personal_data


def test_load_returns_non_empty_stripped_entries():
    assert personal_data.load() == ["Jean Dupont", "jean.dupont@example.fr"]


def test_tokenize_replaces_entries_case_insensitive():
    text = "JEAN DUPONT ecrit a jean.dupont@example.fr"
    out = personal_data.tokenize(text, personal_data.load())
    assert out == "[PERSO1] ecrit a [PERSO2]"


def test_tokenize_leaves_other_text_untouched():
    text = "Bonjour le monde"
    assert personal_data.tokenize(text, personal_data.load()) == text


def test_save_then_read_raw_roundtrip():
    personal_data.save("Nouvelle entree\n")
    assert personal_data.read_raw() == "Nouvelle entree\n"
    assert personal_data.load() == ["Nouvelle entree"]


def test_save_oserror_becomes_valueerror(tmp_path, monkeypatch):
    # e.g. read-only bind mount in Docker: writing must raise ValueError
    # (mapped to 422 by the API), never leak a raw OSError/500.
    monkeypatch.setattr(settings, "personal_data_file", tmp_path)  # a dir: IsADirectoryError
    with pytest.raises(ValueError, match="Cannot write"):
        personal_data.save("x\n")
