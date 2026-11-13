"""Presidio analyzer factory - built once, reused everywhere (API and CLI)."""

from functools import lru_cache

from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer
from presidio_analyzer.nlp_engine import NlpEngineProvider

from app.core.config import settings
from app.core.patterns import FRENCH_PATTERNS


@lru_cache(maxsize=1)
def get_analyzer() -> AnalyzerEngine:
    """Build the singleton analyzer: spaCy NLP + French custom patterns.

    Uses the presidio 2.2.366 API: NlpEngineProvider(nlp_configuration=...)
    then .create_engine() with no argument.
    """
    nlp = NlpEngineProvider(nlp_configuration={
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": settings.language, "model_name": settings.spacy_model}],
    }).create_engine()

    analyzer = AnalyzerEngine(nlp_engine=nlp, supported_languages=[settings.language])
    for entity, regex in FRENCH_PATTERNS:
        analyzer.registry.add_recognizer(
            PatternRecognizer(
                supported_entity=entity,
                patterns=[Pattern(name="fr_pattern", regex=regex, score=settings.pattern_score)],
                supported_language=settings.language,
            )
        )
    return analyzer
