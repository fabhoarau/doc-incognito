"""Unit tests for app.services.guardrail (final safety net)."""

from app.services.guardrail import find_leaks


def test_no_leak_when_entries_absent():
    assert find_leaks("texte anonymise [PERSO1] ici", ["Jean Dupont"]) == []


def test_detects_surviving_entry_case_insensitive():
    assert find_leaks("encore JEAN DUPONT ici", ["Jean Dupont"]) == ["Jean Dupont"]


def test_detects_multiple_leaks():
    entries = ["Jean Dupont", "jean.dupont@example.fr"]
    leaks = find_leaks("Jean Dupont et jean.dupont@example.fr", entries)
    assert leaks == entries


def test_special_regex_chars_in_entry_are_escaped():
    entry = "jean.dupont@example.fr"
    # '.' must not act as a wildcard: a near-miss string is NOT a leak
    assert find_leaks("jeanXdupont@exampleXfr", [entry]) == []
    assert find_leaks("contact: jean.dupont@example.fr", [entry]) == [entry]
