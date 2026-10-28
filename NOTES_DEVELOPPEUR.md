# Notes développeur — à lire avant toute mise à jour

> Pour une mise à jour avec Claude : joindre **le zip complet du projet** (ou donner l'accès au dépôt GitHub) et décrire la modification souhaitée.

## Pile technique
- **React 18** avec **Vite 5**, en JavaScript (sans TypeScript).
- **Zustand** avec `persist` : tout l'état est conservé dans `localStorage` sous la clé `pilotage-epc` (version 1).
- **vite-plugin-pwa** : manifeste, service worker en `autoUpdate` et fonctionnement hors ligne.
- **lucide-react** pour les icônes. Les graphiques sont des SVG maison (`components/ui.jsx`), sans bibliothèque externe.
- Routage par hash (`#/page/param`), défini dans `lib/router.js`. Le déploiement sur Vercel se fait sans configuration serveur.

## Arborescence
```
src/
  main.jsx              point d'entrée
  App.jsx               coque (barre latérale bureau, barre d'onglets mobile, saisie rapide), NAV, routage
  styles.css            système de design (variables, thème clair/sombre, impression)
  lib/
    store.js            état global, CRUD générique, fusion d'import, données d'exemple, APP_VERSION
    kpi.js              tous les calculs d'indicateurs
    content.js          contenu métier (routine, fiches de poste, plan 30 j, questions DEX, catégories)
    format.js           dates, nombres, F CFA
    router.js
  components/
    ui.jsx              Sheet, Field, NumInput, Stat, Ring, Progress, graphiques, Toast
    forms.jsx           formulaires : chantier, activité, dépense, alerte
    TopBar.jsx, InstallBanner.jsx
  pages/                Accueil, Journee, Chantiers, ChantierDetail, Production, Couts, Alertes, Rapport, Guide, Reglages, Onboarding
```

## Modèle de données (store.js)
| Collection | Champs principaux |
|---|---|
| chantiers | nom, localisation, client, chef, dateDebut, dateFin, montantMarche (0 = somme DQE), budget (0 = somme coûts unitaires), statut, couleur, demo |
| activites | chantierId, designation, unite, qteMarche, prixUnitaire (DQE), coutUnitaire (déboursé sec) |
| production | date, chantierId, activiteId, prevu, realise, effectif, engins, cause, causeStatut (« confirmée » ou « à vérifier ») |
| depenses | date, chantierId, categorie (materiaux, mo, carburant, engins, soustraitance, autres), libelle, montant, activiteId? |
| alertes | date, chantierId, titre, type, urgence, statut, impact, cause, causeStatut, action, responsable, echeance, decisionDex, decision |

Chaque enregistrement porte `id`, `updatedAt` et `by` (identifiant du profil). Les suppressions sont tracées dans `deleted` (identifiant → horodatage) pour que la fusion entre appareils les respecte.
Autres champs : `profil`, `equipe`, `routine[profilId][date][tacheId]`, `notesJour`, `plan30`, `questionsDex`, `rapports[lundi]`, `reglages` (seuilProduction, seuilCout, demarrage), `theme`.

**Ajouter un champ :** prévoir une valeur par défaut dans le code. Si la structure change de façon incompatible, augmenter `version` dans `persist` et écrire une fonction `migrate`.

## Indicateurs (kpi.js)
- Avancement physique = Σ(réalisé × PU DQE) / Σ(qté marché × PU DQE)
- IPC = Σ(réalisé × coût unitaire) / coût réel
- Coût à terminaison (CAT) = coût réel + (budget − budget exécuté) / IPC
- Marge prévisionnelle = marché − CAT
- Fin probable = date de début + jours écoulés / avancement physique

## Pistes d'évolution déjà identifiées
1. **Synchronisation en ligne en temps réel** entre les deux postes (Supabase ou Vercel Postgres avec authentification). Elle remplacera l'échange de fichiers.
2. Import du DQE depuis Excel (SheetJS).
3. Export Excel du rapport hebdomadaire et du registre des alertes.
4. Suivi des consommations de matériaux par rapport aux consommations théoriques (ciment, fer, gasoil).
5. Notifications de rappel (routine du matin et clôture du soir).

## Historique des versions
- **1.0.0** (28/10/2026) : première version. Tableau de bord, routine quotidienne, chantiers et DQE, production prévu/réalisé, coûts et rentabilité, registre des alertes et actions, rapport hebdomadaire en 10 sections (impression PDF), guide du département, partage par fichier, PWA.
