// Contenus métier du département Étude, Planification et Contrôle des coûts (EPC)

export const POSTES = {
  planif: { label: 'Planificateur-ordonnanceur', court: 'Planification', question: 'Respectons-nous le programme ?' },
  couts: { label: 'Contrôleur des coûts', court: 'Contrôle des coûts', question: 'Respectons-nous le budget ?' }
}

export const ROUTINE = [
  {
    id: 'matin',
    titre: 'Début de journée',
    moment: 'Matin',
    objectif: 'Vérifier que les chantiers disposent des conditions nécessaires pour produire.',
    livrable: 'Synthèse courte des objectifs, des moyens disponibles, des contraintes et des alertes prioritaires.',
    taches: [
      ['m1', 'Consulter le programme journalier de chaque chantier'],
      ['m2', 'Vérifier les objectifs quantitatifs de la journée'],
      ['m3', 'Contrôler les effectifs prévus, les équipes disponibles et les engins mobilisables'],
      ['m4', 'Vérifier les besoins urgents en ciment, sable, gravier, fer, carburant et autres matériaux'],
      ['m5', 'Examiner les problèmes non résolus de la veille'],
      ['m6', "Identifier les activités à risque et les décisions attendues du Directeur d'Exploitation"]
    ]
  },
  {
    id: 'jour',
    titre: 'Suivi en cours de journée',
    moment: 'Journée',
    objectif: 'Suivre la production, détecter les blocages et alerter sans attendre.',
    livrable: 'Alertes transmises en temps réel et actions correctives suivies.',
    taches: [
      ['j1', 'Recueillir les informations auprès des chefs de chantier et des responsables concernés'],
      ['j2', 'Suivre les blocages : pannes, matériaux, personnel, accès, validation, problème technique'],
      ['j3', 'Vérifier que les approvisionnements attendus arrivent conformément aux besoins'],
      ['j4', 'Examiner les écarts importants entre le programme et la production constatée'],
      ['j5', 'Alerter immédiatement en cas de risque majeur (sans attendre le rapport hebdomadaire)'],
      ['j6', 'Suivre les actions correctives déjà décidées']
    ]
  },
  {
    id: 'soir',
    titre: 'Clôture quotidienne',
    moment: 'Soir',
    objectif: 'Consolider les résultats et préparer le lendemain.',
    livrable: 'État synthétique de la production, des écarts, des problèmes rencontrés et des actions à poursuivre.',
    taches: [
      ['s1', 'Enregistrer ou vérifier les quantités effectivement exécutées'],
      ['s2', "Comparer le réalisé à l'objectif journalier"],
      ['s3', 'Vérifier la cohérence quantités produites / moyens mobilisés / consommations déclarées'],
      ['s4', 'Mettre à jour les tableaux de bord'],
      ['s5', 'Identifier les écarts significatifs : causes confirmées vs points à vérifier'],
      ['s6', 'Actualiser les besoins et les prévisions du lendemain'],
      ['s7', "Préparer les alertes ou demandes d'arbitrage"]
    ]
  }
]
export const ROUTINE_COUNT = ROUTINE.reduce((n, p) => n + p.taches.length, 0)

export const CYCLE_HEBDO = [
  ['Lundi', 'Consolider les objectifs et les plannings des chantiers', 'Programme hebdomadaire de référence'],
  ['Chaque jour', 'Collecter et vérifier les données de production et les alertes', 'Suivi actualisé'],
  ['Mercredi', 'Examiner les écarts et anticiper les besoins critiques', 'Alertes et propositions de correction'],
  ['Vendredi', 'Consolider les quantités, analyser les coûts et actualiser les prévisions', 'Tableau de bord hebdomadaire'],
  ['Réunion DEX', 'Présenter les écarts, risques et décisions nécessaires', 'Arbitrages et actions attribuées'],
  ['Après réunion', 'Formaliser les décisions et suivre leur exécution', 'Registre des actions et échéances']
]

export const CATEGORIES_COUTS = [
  { id: 'materiaux', label: 'Matériaux', couleur: '#7c4ddb' },
  { id: 'mo', label: "Main-d'œuvre", couleur: '#2f9e8f' },
  { id: 'carburant', label: 'Carburant', couleur: '#e0a128' },
  { id: 'engins', label: 'Engins / location', couleur: '#d1603d' },
  { id: 'soustraitance', label: 'Sous-traitance', couleur: '#4a7bd0' },
  { id: 'autres', label: 'Autres charges', couleur: '#8a8f9c' }
]

export const TYPES_ALERTE = ['Matériaux', 'Engin / panne', 'Personnel', 'Accès / météo', 'Attente de validation', 'Problème technique', 'Dérive de coût', 'Retard de production', 'Autre']
export const URGENCES = ['Critique', 'Haute', 'Moyenne', 'Basse']
export const STATUTS = ['Ouverte', 'En cours', 'Résolue']

export const UNITES = ['ml', 'm²', 'm³', 'kg', 't', 'u', 'ens', 'forfait', 'j']

export const FICHES = {
  planif: {
    titre: 'Planificateur-ordonnanceur',
    question: 'Quand et combien produire ?',
    resume: "Organise dans le temps les activités des chantiers et vérifie que les moyens disponibles permettent de respecter les objectifs.",
    missions: [
      'Élaborer et actualiser les plannings des chantiers',
      'Décliner les objectifs mensuels en objectifs hebdomadaires et journaliers',
      'Définir les quantités à produire par activité (terrassement, fossés, dalots, bétonnage, assainissement…)',
      'Comparer le programme prévu avec les quantités réellement exécutées',
      'Identifier les retards, les activités critiques et les risques de dépassement des délais',
      "Anticiper les besoins en main-d'œuvre, engins, matériaux et approvisionnements",
      "Proposer des mesures de rattrapage : renfort d'équipe, séquence, réaffectation d'engin",
      "Préparer une synthèse des délais et de l'avancement physique des projets"
    ]
  },
  couts: {
    titre: 'Contrôleur des coûts',
    question: 'Combien cela coûte-t-il ?',
    resume: 'Vérifie si les moyens engagés et les dépenses réelles restent cohérents avec les budgets et les coûts prévus.',
    missions: [
      'Exploiter le DQE, les sous-détails de prix, les budgets et les déboursés secs',
      "Suivre les coûts de production : matériaux, main-d'œuvre, carburant, engins, sous-traitance",
      'Comparer les consommations et coûts réels aux prévisions',
      'Calculer les écarts de consommation et de coût par activité, chantier et période',
      'Analyser les rendements : quantité produite par équipe, par engin ou par journée',
      'Identifier les activités susceptibles de dégrader la marge',
      'Estimer le coût à terminaison et la marge prévisionnelle',
      "Proposer des actions correctives et signaler les dérives au Directeur d'Exploitation"
    ]
  }
}

export const COMPARAISON = [
  ['Question principale', 'Respectons-nous le programme ?', 'Respectons-nous le budget ?'],
  ['Données de base', 'Planning, quantités, délais, ressources', 'Budget, DQE, coûts et consommations'],
  ['Analyse centrale', 'Retard ou avance de production', 'Écart de coût et risque sur la marge'],
  ['Prévision', 'Date probable de fin, besoins futurs', 'Coût final estimé, marge prévisionnelle'],
  ['Résultat attendu', 'Programme réaliste et rattrapage', 'Maîtrise des coûts et rentabilité']
]

export const ATTENTES_DEX = [
  ['Vision consolidée', "Connaître rapidement l'avancement, les objectifs, les retards, les besoins urgents et les risques financiers de chaque chantier."],
  ['Prévu vs réel', 'Mesurer les écarts entre programme et réalisations, et montrer ce qui reste à accomplir.'],
  ['Rentabilité', 'Repérer les chantiers qui consomment trop, les rendements insuffisants et les risques de perte de marge.'],
  ['Alerte précoce', 'Signaler un risque assez tôt pour permettre une décision (rupture de ciment, panne, retard de livraison…).'],
  ['Solutions', 'Pour chaque écart : une action, un responsable, un délai et un résultat attendu.'],
  ['Données fiables', 'Des chiffres vérifiés, cohérents avec les rapports de chantier et documentés.']
]

export const QUESTIONS_DIRECTEUR = [
  "Quel est le taux d'avancement physique de chaque chantier ?",
  'Quelles quantités étaient prévues cette semaine et lesquelles ont été réalisées ?',
  'Quels sont les principaux écarts et leurs causes confirmées ?',
  'Quels chantiers risquent de dépasser leurs délais ou leurs budgets ?',
  'Quels sont les besoins urgents des chantiers et pour quelle date ?',
  'Quelle est la conséquence probable de chaque problème sur la production, le coût et la marge ?',
  'Quelles décisions attendez-vous de lui pour débloquer les situations ?'
]

export const QUESTIONS_A_POSER = [
  'Quels résultats précis attendez-vous de notre département dans les trois prochains mois ?',
  'Quel est le périmètre exact du planificateur-ordonnanceur et celui du contrôleur des coûts ?',
  'Souhaitez-vous un tableau de bord quotidien, hebdomadaire ou les deux ?',
  'Quels indicateurs seront prioritaires : production, délais, coûts, marge ?',
  'Qui valide les quantités réellement exécutées et les consommations déclarées ?',
  'À quelles données financières aurons-nous accès, et qui en garantit la fiabilité ?',
  'Quel niveau d’écart doit déclencher une alerte immédiate ?',
  'Quelles décisions pouvons-nous prendre directement et lesquelles nécessitent votre validation ?',
  'Quel format de rapport souhaitez-vous recevoir et à quelle échéance ?',
  'Comment coordonner nos actions avec Travaux, QHSE, administration des projets et approvisionnements ?'
]

export const PLAN_30J = [
  {
    id: 'p1', periode: 'J1 – J7', titre: 'Diagnostic — Comprendre l’existant',
    taches: [
      ['p1a', 'Recenser tous les chantiers en cours'],
      ['p1b', 'Récupérer les DQE, budgets et déboursés secs'],
      ['p1c', 'Récupérer les plannings et fichiers de production'],
      ['p1d', 'Identifier les responsables de données sur chaque chantier'],
      ['p1e', 'Analyser les méthodes actuelles de reporting']
    ]
  },
  {
    id: 'p2', periode: 'J8 – J14', titre: 'Structuration — Uniformiser les données',
    taches: [
      ['p2a', 'Définir les formats de remontée des données'],
      ['p2b', 'Fixer les horaires de transmission avec les chefs de chantier'],
      ['p2c', 'Arrêter la liste des indicateurs suivis'],
      ['p2d', 'Répartir les tâches entre planification et contrôle des coûts']
    ]
  },
  {
    id: 'p3', periode: 'J15 – J21', titre: 'Déploiement — Premières analyses',
    taches: [
      ['p3a', 'Consolider les données de tous les chantiers'],
      ['p3b', 'Calculer les écarts prévu / réalisé et budget / réel'],
      ['p3c', 'Vérifier les causes des écarts'],
      ['p3d', 'Identifier les chantiers prioritaires'],
      ['p3e', 'Préparer un premier tableau de bord']
    ]
  },
  {
    id: 'p4', periode: 'J22 – J30', titre: 'Décision — Installer le pilotage',
    taches: [
      ['p4a', "Présenter le premier rapport structuré au Directeur d'Exploitation"],
      ['p4b', 'Faire valider les actions prioritaires'],
      ['p4c', 'Instaurer un suivi régulier des décisions prises']
    ]
  }
]

export const MOYENS = [
  ['DQE et marchés de chaque chantier', 'Quantités contractuelles et prix de référence'],
  ['Budgets et déboursés secs', 'Évaluer les coûts prévus et les écarts'],
  ['Plannings actualisés', 'Comparer le programme aux réalisations'],
  ['Rapports journaliers et hebdomadaires', 'Quantités, effectifs, engins et contraintes'],
  ["Données d'approvisionnement et de stock", 'Anticiper les ruptures et contrôler les consommations'],
  ['États de dépenses et de consommations', 'Analyser les coûts réels'],
  ['Situation des attachements et décomptes', 'Suivre l’évolution financière des travaux'],
  ['Accès aux chefs de chantier et services', 'Obtenir des réponses fiables et traiter les blocages'],
  ['Excel, Power Query, Power BI', 'Consolider les données et automatiser les reportings'],
  ['Procédure de remontée et validation', 'Qui transmet quoi, quand et à qui']
]

export const PRINCIPES = [
  'Ne jamais transmettre un chiffre sans référence ni contrôle.',
  "Ne jamais signaler un écart important sans en analyser les causes et les conséquences.",
  'Ne jamais présenter un problème à la Direction sans proposer une action ou préciser la décision nécessaire.'
]

export const COMPETENCES = [
  ['Techniques BTP', ['DQE, métrés, attachements, sous-détails de prix', 'Unités et méthodes de calcul des quantités', 'Rendements des équipes et des engins', 'Lecture de planning et dépendances']],
  ['Outils numériques', ['Excel avancé : SOMME.SI.ENS, INDEX/EQUIV, TCD', 'Power Query pour consolider les fichiers chantiers', 'MS Project ou équivalent', 'Power BI / tableaux de bord']],
  ['Analyse', ['Passer du constat à l’explication puis à l’action', 'Vérifier volumes, dosages, pertes et stocks avant de conclure']],
  ['Communication', ['Questions précises et factuelles aux chefs de chantier', 'Rapports courts, lisibles, argumentés', 'Rigueur, discrétion, objectivité', 'Suivi des décisions jusqu’à leur réalisation']]
]

export const SECTIONS_RAPPORT = [
  'Synthèse exécutive de la semaine',
  'Production prévue vs production réalisée',
  'Avancement physique et respect des délais',
  'Consommations, coûts et rentabilité',
  'Écarts significatifs et conséquences prévisibles',
  'Causes confirmées',
  'Vérifications à mener',
  'Actions correctives proposées et en cours',
  'Risques à court terme et besoins urgents',
  "Décisions attendues de la Direction d'Exploitation"
]
