import type { Locale } from './en'

// Dictionnaire français - doit avoir exactement la même forme que en.ts
// (vérifié par un test : i18n.test.ts compare les clés récursivement).

const fr: Locale = {
  meta: {
    language: 'Langue',
  },
  header: {
    subtitle:
      'Anonymisez vos documents avant de les envoyer à une IA — 100 % local, rien ne quitte cette machine.',
    offline: 'Hors ligne · 100 % local',
  },
  tabs: {
    anonymize: 'Anonymiser',
    personal: 'Mes données personnelles',
    metadata: 'Métadonnées',
  },
  common: {
    loading: 'Chargement…',
    errorTitle: 'Une erreur est survenue',
  },
  anonymize: {
    intro: 'Deux façons de nettoyer un document :',
    dropChoose: 'Choisir un fichier',
    dropOr: 'ou glissez-déposez-le ici',
    dropHint: 'PDF, PNG ou JPEG — traité 100 % localement',
    change: 'Changer',
    remove: 'Retirer',
    isPdf: 'C’est un PDF : une seule action est disponible.',
    isImage:
      'C’est une image : vous pouvez anonymiser son texte (OCR) ou noircir définitivement les zones sensibles.',
    anonymizeText: 'Anonymiser le texte',
    anonymizing: 'Anonymisation en cours…',
    anonymizeTextHelp:
      'Extrait le texte, remplace vos données personnelles et les informations sensibles → fichier .txt (+ PDF reconstruit sans métadonnées pour un PDF).',
    redact: 'Noircir l’image (pixels)',
    redacting: 'Noircissage en cours…',
    redactHelp:
      'Recouvre les zones sensibles de rectangles noirs définitifs. Irréversible : les pixels cachés sont détruits.',
    irreversible: 'irréversible',
    progress:
      'Extraction du texte et analyse en cours — l’OCR sur un PDF scanné ou une image peut prendre quelques secondes.',
    result: 'Résultat',
    resultReady: 'Prêt — contrôle anti-fuite réussi',
    resultFailed: (n: number) =>
      `Contrôle anti-fuite : ÉCHEC — ${n} donnée${n === 1 ? '' : 's'} personnelle${
        n === 1 ? '' : 's'
      } encore présente${n === 1 ? '' : 's'}`,
    resultFailedAction:
      'Ne partagez pas ces fichiers : complétez « Mes données personnelles » et relancez. Les valeurs des fuites restent masquées.',
    statsLine: (replacements: number, types: number) =>
      `${replacements} remplacement${replacements === 1 ? '' : 's'} · ${types} type${
        types === 1 ? '' : 's'
      } trouvé${types === 1 ? '' : 's'}`,
    detailSummary: (n: number) => (n === 1 ? 'Voir le détail (1 type)' : `Voir le détail (${n} types)`),
    downloadPdf: 'Télécharger le PDF anonymisé',
    downloadTxt: 'Télécharger le texte anonymisé (.txt)',
    downloadAlsoTxt: 'Télécharger aussi le .txt',
    downloadImage: 'Télécharger l’image noircie (PNG)',
    redactionBadge: 'Noircissage terminé — irréversible',
    redactionDone: (n: number) =>
      `${n} zone${n === 1 ? '' : 's'} noircie${n === 1 ? '' : 's'} — pixels détruits, irréversible`,
  },
  personal: {
    help: 'Renseignez ici ce qui vous identifie — une information par ligne (nom, adresse, IBAN, téléphone…). Avant toute analyse, chaque ligne est remplacée par un jeton [PERSO1], [PERSO2]…, puis le contrôle anti-fuite vérifie qu’aucune ne réapparaît dans le résultat. Le fichier perso.txt reste sur cette machine : il n’est jamais envoyé ni versionné.',
    label: 'Mes données personnelles, une par ligne',
    placeholder: 'Marie Dupont\n12 rue de la Paix, 75002 Paris\nFR76 3000 6000 0000 0000 0000 000',
    lines: (n: number) => `${n} ligne${n === 1 ? '' : 's'} renseignée${n === 1 ? '' : 's'}`,
    emptyWarn:
      'Aucune donnée renseignée : le contrôle anti-fuite n’aura rien à vérifier. Ajoutez au moins votre nom et votre IBAN.',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    saved: 'Enregistré localement (perso.txt) — jamais envoyé ailleurs.',
  },
  metadata: {
    help: 'Avant d’envoyer un fichier, vérifiez ce qu’il révèle de vous : auteur, modèle d’appareil, coordonnées GPS… Ces métadonnées (EXIF d’une image, champs d’un PDF) peuvent vous identifier même si le contenu du document est anonymisé.',
    inspect: 'Analyser les métadonnées',
    inspecting: 'Analyse en cours…',
    result: 'Résultat',
    badgeClean: 'Propre — aucun champ à risque',
    badgeRisky: (n: number) => `${n} champ${n === 1 ? '' : 's'} à risque`,
    summary: (total: number, leaks: number) =>
      `${total} métadonnée${total === 1 ? '' : 's'} · ${leaks} à risque`,
    noFields: 'Aucune métadonnée trouvée dans ce fichier.',
    field: 'Champ',
    value: 'Valeur',
    risk: 'Risque',
    atRisk: 'À risque',
    advice: 'Conseil : produisez une version nettoyée via l’onglet « Anonymiser » (texte ou noirçage de l’image).',
  },
  values: {
    extractionMode: {
      'pdf-text': 'Texte natif du PDF',
      'pdf-ocr': 'OCR (PDF scanné)',
      'image-ocr': 'OCR (image)',
    },
    entityType: {
      PERSON: 'Personne',
      ORGANIZATION: 'Organisation',
      LOCATION: 'Lieu',
      DATE_TIME: 'Date/heure',
      PHONE_NUMBER: 'Téléphone',
      EMAIL_ADDRESS: 'E-mail',
      IBAN_CODE: 'IBAN',
      CREDIT_CARD_NUMBER: 'Carte bancaire',
      IP_ADDRESS: 'Adresse IP',
      URL: 'URL',
      DATE_FR: 'Date',
      NUM_CONTRAT: 'N° de contrat',
      RCS_SIRET: 'RCS / SIRET',
      TEL_FR: 'Téléphone (FR)',
      CODE_POSTAL_VILLE: 'Code postal + ville',
      NUM_LONG: 'Numéro long',
      HEX_ID: 'Identifiant technique',
      IBAN_FR: 'IBAN (FR)',
      EMAIL: 'E-mail',
      ADRESSE: 'Adresse postale',
    },
    outputLabel: {
      'Anonymized text (.txt)': 'Télécharger le texte anonymisé (.txt)',
      'Anonymized PDF (metadata-free)': 'Télécharger le PDF reconstruit (sans métadonnées)',
      'Redacted image (metadata-free PNG)':
        'Télécharger l’image noircie (PNG, sans métadonnées)',
    },
    metadataField: {
      format: 'Format',
      version: 'Version PDF',
      encryption: 'Chiffrement',
      author: 'Auteur',
      creator: 'Créateur',
      producer: 'Outil de production',
      title: 'Titre',
      subject: 'Sujet',
      keywords: 'Mots-clés',
      creationDate: 'Date de création',
      modDate: 'Date de modification',
      'EXIF 271': 'Marque de l’appareil',
      'EXIF 272': 'Modèle de l’appareil',
      'EXIF 305': 'Logiciel',
      'EXIF 306': 'Date/heure',
      'EXIF 33432': 'Copyright',
      'EXIF 36864': 'Version EXIF',
      'EXIF 36867': 'Date de la photo',
      'EXIF 34853': 'Données GPS',
      'EXIF 37510': 'Commentaire',
    },
    errorPrefix: {
      'Unsupported file type': 'Type de fichier non pris en charge — PDF, PNG ou JPEG uniquement.',
      'Redaction only supports images': 'Le noirçage ne fonctionne que sur une image.',
      'No text could be extracted': 'Aucun texte n’a pu être extrait du document.',
    },
  },
}

export default fr
