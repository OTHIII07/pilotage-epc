// Calcul des indicateurs : planification, coûts, rentabilité
import { today, daysBetween, addDays } from './format'

const sum = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0)
const safeDiv = (a, b) => (b ? a / b : null)

/**
 * Indicateurs d'un chantier.
 * - Avancement physique : valeur (PU DQE) des quantités réalisées / valeur totale du marché
 * - Avancement temporel : temps écoulé / durée contractuelle
 * - Budget des travaux exécutés (BTE) : réalisé × coût unitaire budget (déboursé sec)
 * - Indice de performance coût (IPC) = BTE / coût réel
 * - Coût à terminaison (CAT) = coût réel + reste à faire budgété / IPC
 * - Marge prévisionnelle = montant du marché − CAT
 */
export function kpiChantier(ch, data, ref = today()) {
  const acts = data.activites.filter((a) => a.chantierId === ch.id)
  const prod = data.production.filter((p) => p.chantierId === ch.id && p.date <= ref)
  const dep = data.depenses.filter((d) => d.chantierId === ch.id && d.date <= ref)
  const actMap = Object.fromEntries(acts.map((a) => [a.id, a]))

  const valeurMarcheActs = sum(acts, (a) => a.qteMarche * a.prixUnitaire)
  const montantMarche = ch.montantMarche || valeurMarcheActs
  const budgetActs = sum(acts, (a) => a.qteMarche * (a.coutUnitaire || 0))
  const budget = ch.budget || budgetActs

  const valeurExecutee = sum(prod, (p) => p.realise * (actMap[p.activiteId]?.prixUnitaire || 0))
  const valeurPrevue = sum(prod, (p) => p.prevu * (actMap[p.activiteId]?.prixUnitaire || 0))
  const budgetExecute = sum(prod, (p) => p.realise * (actMap[p.activiteId]?.coutUnitaire || 0))
  const coutReel = sum(dep, (d) => d.montant)

  const avPhysique = safeDiv(valeurExecutee, valeurMarcheActs)
  const duree = ch.dateDebut && ch.dateFin ? daysBetween(ch.dateDebut, ch.dateFin) : null
  const ecoule = ch.dateDebut ? Math.max(0, daysBetween(ch.dateDebut, ref)) : null
  const avTemps = duree ? Math.min(1, Math.max(0, ecoule / duree)) : null
  const ecartAvancement = avPhysique != null && avTemps != null ? avPhysique - avTemps : null

  const ipc = coutReel > 0 && budgetExecute > 0 ? budgetExecute / coutReel : null
  const resteBudget = Math.max(0, budget - budgetExecute)
  const cat = coutReel > 0 ? coutReel + (ipc ? resteBudget / ipc : resteBudget) : budget
  const margeInitiale = montantMarche - budget
  const margePrev = montantMarche - cat
  const ecartCout = budgetExecute - coutReel // + = économie, − = dépassement

  // Fin probable selon la cadence observée (valeur produite par jour écoulé)
  let finProbable = null
  if (avPhysique && avPhysique > 0.02 && ecoule > 0) {
    const joursTotal = ecoule / avPhysique
    finProbable = addDays(ch.dateDebut, Math.round(joursTotal))
  }
  const retardJours = finProbable && ch.dateFin ? daysBetween(ch.dateFin, finProbable) : null

  const tauxRealisation = safeDiv(valeurExecutee, valeurPrevue)

  return {
    acts, prod, dep, valeurMarcheActs, montantMarche, budget, valeurExecutee, valeurPrevue, budgetExecute, coutReel,
    avPhysique, avTemps, ecartAvancement, ipc, cat, margeInitiale, margePrev,
    tauxMargeInit: safeDiv(margeInitiale, montantMarche), tauxMargePrev: safeDiv(margePrev, montantMarche),
    ecartCout, finProbable, retardJours, tauxRealisation, duree, ecoule
  }
}

/** Statut synthétique : 'ok' | 'vigilance' | 'critique' */
export function statutDelai(k) {
  if (k.ecartAvancement == null) return 'neutre'
  if (k.ecartAvancement >= -0.03) return 'ok'
  if (k.ecartAvancement >= -0.1) return 'vigilance'
  return 'critique'
}
export function statutCout(k, seuil = 0.05) {
  if (k.ipc == null) return 'neutre'
  if (k.ipc >= 1) return 'ok'
  if (k.ipc >= 1 - seuil) return 'vigilance'
  return 'critique'
}

/** Production d'une période (pondérée par les prix pour comparer des unités différentes) */
export function prodPeriode(data, debut, fin, chantierId) {
  const actMap = Object.fromEntries(data.activites.map((a) => [a.id, a]))
  const prod = data.production.filter((p) => p.date >= debut && p.date <= fin && (!chantierId || p.chantierId === chantierId))
  const prevu = sum(prod, (p) => p.prevu * (actMap[p.activiteId]?.prixUnitaire || 0))
  const realise = sum(prod, (p) => p.realise * (actMap[p.activiteId]?.prixUnitaire || 0))
  // détail par activité
  const parAct = {}
  for (const p of prod) {
    const a = actMap[p.activiteId]
    if (!a) continue
    const o = (parAct[a.id] ||= { activite: a, prevu: 0, realise: 0, causes: [] })
    o.prevu += p.prevu
    o.realise += p.realise
    if (p.cause) o.causes.push({ date: p.date, cause: p.cause, statut: p.causeStatut })
  }
  return { prod, prevu, realise, taux: safeDiv(realise, prevu), parAct: Object.values(parAct) }
}

/** Série journalière prévu / réalisé (valeur) pour un graphique */
export function serieJours(data, fin, n, chantierId) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(fin, -i)
    const r = prodPeriode(data, d, d, chantierId)
    out.push({ date: d, prevu: r.prevu, realise: r.realise })
  }
  return out
}

export function cumulParActivite(data, activiteId, ref = today()) {
  const prod = data.production.filter((p) => p.activiteId === activiteId && p.date <= ref)
  return { prevu: sum(prod, (p) => p.prevu), realise: sum(prod, (p) => p.realise) }
}

export const couleurStatut = { ok: 'var(--ok)', vigilance: 'var(--warn)', critique: 'var(--bad)', neutre: 'var(--muted)' }
export const libelleStatut = { ok: 'Maîtrisé', vigilance: 'Vigilance', critique: 'Critique', neutre: 'Données insuffisantes' }
