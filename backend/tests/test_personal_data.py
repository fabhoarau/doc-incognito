"""Unit tests for app.services.personal_data (perso.txt handling)."""

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
