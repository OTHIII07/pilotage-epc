import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, today, addDays, mondayOf } from './format'

export const APP_VERSION = '1.0.0'
export const COLLECTIONS = ['chantiers', 'activites', 'production', 'depenses', 'alertes']

const initial = {
  profil: null, // { id, nom, poste: 'planif' | 'couts' }
  equipe: [], // profils connus (soi + collègue via import)
  chantiers: [],
  activites: [],
  production: [],
  depenses: [],
  alertes: [],
  deleted: {}, // id -> timestamp (pour la fusion entre appareils)
  routine: {}, // { [profilId]: { [date]: { [tacheId]: true } } }
  notesJour: {}, // { [profilId]: { [date]: { matin, soir } } }
  plan30: {}, // { [tacheId]: true }
  questionsDex: {}, // { [index]: { fait, reponse } }
  rapports: {}, // { [lundi]: { synthese, verifications } }
  reglages: { seuilProduction: 0.85, seuilCout: 0.05, demarrage: today() },
  theme: 'auto'
}

const stamp = (o, by) => ({ ...o, updatedAt: Date.now(), by: by ?? o.by })

export const useStore = create(
  persist(
    (set, get) => ({
      ...initial,

      setProfil: (p) =>
        set((s) => {
          const profil = { id: p.id || uid(), nom: p.nom.trim(), poste: p.poste }
          const equipe = [...s.equipe.filter((x) => x.id !== profil.id), profil]
          return { profil, equipe }
        }),

      // CRUD générique
      add: (coll, data) => {
        const rec = stamp({ id: uid(), createdAt: Date.now(), ...data }, get().profil?.id)
        set((s) => ({ [coll]: [...s[coll], rec] }))
        return rec
      },
      update: (coll, id, patch) =>
        set((s) => ({ [coll]: s[coll].map((r) => (r.id === id ? stamp({ ...r, ...patch }, s.profil?.id) : r)) })),
      remove: (coll, id) =>
        set((s) => {
          const deleted = { ...s.deleted, [id]: Date.now() }
          const out = { [coll]: s[coll].filter((r) => r.id !== id), deleted }
          if (coll === 'chantiers') {
            for (const c of ['activites', 'production', 'depenses', 'alertes']) {
              const gone = s[c].filter((r) => r.chantierId === id)
              gone.forEach((r) => (deleted[r.id] = Date.now()))
              out[c] = s[c].filter((r) => r.chantierId !== id)
            }
          }
          if (coll === 'activites') {
            const gone = s.production.filter((r) => r.activiteId === id)
            gone.forEach((r) => (deleted[r.id] = Date.now()))
            out.production = s.production.filter((r) => r.activiteId !== id)
          }
          return out
        }),

      /** Enregistre (ou remplace) la production d'une activité pour une date */
      upsertProduction: (date, chantierId, activiteId, patch) =>
        set((s) => {
          const ex = s.production.find((p) => p.date === date && p.activiteId === activiteId)
          if (ex) return { production: s.production.map((p) => (p === ex ? stamp({ ...p, ...patch }, s.profil?.id) : p)) }
          const rec = stamp({ id: uid(), createdAt: Date.now(), date, chantierId, activiteId, prevu: 0, realise: 0, ...patch }, s.profil?.id)
          return { production: [...s.production, rec] }
        }),

      toggleRoutine: (date, tacheId) =>
        set((s) => {
          const pid = s.profil?.id || 'moi'
          const mine = s.routine[pid] || {}
          const day = { ...(mine[date] || {}) }
          if (day[tacheId]) delete day[tacheId]
          else day[tacheId] = true
          return { routine: { ...s.routine, [pid]: { ...mine, [date]: day } } }
        }),
      setNoteJour: (date, champ, valeur) =>
        set((s) => {
          const pid = s.profil?.id || 'moi'
          const mine = s.notesJour[pid] || {}
          return { notesJour: { ...s.notesJour, [pid]: { ...mine, [date]: { ...(mine[date] || {}), [champ]: valeur } } } }
        }),
      togglePlan: (id) => set((s) => ({ plan30: { ...s.plan30, [id]: !s.plan30[id] } })),
      setQuestion: (i, patch) => set((s) => ({ questionsDex: { ...s.questionsDex, [i]: { ...(s.questionsDex[i] || {}), ...patch } } })),
      setRapport: (lundi, patch) => set((s) => ({ rapports: { ...s.rapports, [lundi]: { ...(s.rapports[lundi] || {}), ...patch } } })),
      setReglages: (patch) => set((s) => ({ reglages: { ...s.reglages, ...patch } })),
      setTheme: (theme) => set({ theme }),

      /** Fusion d'une sauvegarde venant d'un collègue (le plus récent l'emporte) */
      importer: (data, mode = 'fusion') => {
        if (!data || data.app !== 'pilotage-epc') throw new Error('Fichier non reconnu')
        if (mode === 'remplacer') {
          set({ ...initial, ...data.etat, profil: get().profil, theme: get().theme })
          return
        }
        set((s) => {
          const deleted = { ...s.deleted, ...(data.etat.deleted || {}) }
          const out = { deleted }
          for (const c of COLLECTIONS) {
            const map = new Map(s[c].map((r) => [r.id, r]))
            for (const r of data.etat[c] || []) {
              const mine = map.get(r.id)
              if (!mine || (r.updatedAt || 0) > (mine.updatedAt || 0)) map.set(r.id, r)
            }
            out[c] = [...map.values()].filter((r) => !deleted[r.id])
          }
          // routines et notes : on garde celles de chaque profil
          out.routine = { ...(data.etat.routine || {}), ...s.routine }
          out.notesJour = { ...(data.etat.notesJour || {}), ...s.notesJour }
          if (s.profil && data.etat.routine?.[s.profil.id]) out.routine[s.profil.id] = s.routine[s.profil.id] || {}
          const eq = new Map(s.equipe.map((p) => [p.id, p]))
          for (const p of data.etat.equipe || []) if (!eq.has(p.id)) eq.set(p.id, p)
          out.equipe = [...eq.values()]
          out.plan30 = { ...(data.etat.plan30 || {}), ...s.plan30 }
          out.questionsDex = { ...(data.etat.questionsDex || {}), ...s.questionsDex }
          out.rapports = { ...(data.etat.rapports || {}), ...s.rapports }
          return out
        })
      },
      exporter: () => {
        const s = get()
        const etat = {}
        for (const k of Object.keys(initial)) if (k !== 'theme') etat[k] = s[k]
        return { app: 'pilotage-epc', version: APP_VERSION, exporteLe: new Date().toISOString(), par: s.profil?.nom, etat }
      },
      reinitialiser: () => set({ ...initial, profil: get().profil, equipe: get().equipe, theme: get().theme }),
      chargerDemo: () => set((s) => demo(s))
    }),
    { name: 'pilotage-epc', version: 1 }
  )
)

/* ---------- Données d'exemple (clairement identifiées) ---------- */
function demo(s) {
  const by = s.profil?.id
  const t = today()
  const debut = addDays(mondayOf(t), -21)
  const ch1 = { id: uid(), nom: 'EXEMPLE — Fossés BA et dalots', localisation: 'Site de démonstration', client: 'Maître d’ouvrage (exemple)', chef: 'Chef de chantier', dateDebut: debut, dateFin: addDays(debut, 120), montantMarche: 0, statut: 'En cours', couleur: '#7c4ddb', note: 'Chantier fictif pour découvrir l’application. Supprimez-le quand vous voulez.', demo: true }
  const ch2 = { id: uid(), nom: 'EXEMPLE — Réhabilitation école', localisation: 'Site de démonstration', client: 'Maître d’ouvrage (exemple)', chef: 'Chef de chantier', dateDebut: addDays(debut, -30), dateFin: addDays(debut, 60), montantMarche: 0, statut: 'En cours', couleur: '#2f9e8f', note: 'Chantier fictif.', demo: true }
  const A = (chantierId, designation, unite, qteMarche, prixUnitaire, coutUnitaire, cadence) => ({ id: uid(), chantierId, designation, unite, qteMarche, prixUnitaire, coutUnitaire, cadence })
  const acts = [
    A(ch1.id, 'Terrassement en déblai', 'm³', 6000, 4500, 3200, 120),
    A(ch1.id, 'Fossé maçonné / BA', 'ml', 3200, 62000, 45000, 40),
    A(ch1.id, 'Dalot 2x2x2', 'u', 6, 18_500_000, 13_800_000, 0.1),
    A(ch1.id, 'Béton de propreté', 'm³', 380, 85000, 61000, 8),
    A(ch2.id, 'Démolition / dépose', 'm²', 900, 6500, 4300, 40),
    A(ch2.id, 'Enduits ciment', 'm²', 2400, 9500, 6900, 70),
    A(ch2.id, 'Peinture', 'm²', 2600, 4800, 3100, 0),
    A(ch2.id, 'Plomberie sanitaire', 'ens', 4, 3_800_000, 2_900_000, 0.05)
  ]
  const prod = []
  const rnd = (a, b) => a + Math.random() * (b - a)
  for (let d = 0; d < 26; d++) {
    const date = addDays(debut, d)
    const wd = new Date(date + 'T12:00:00').getDay()
    if (wd === 0 || date > t) continue
    for (const a of acts) {
      if (!a.cadence) continue
      const prevu = Math.round(a.cadence * (a.unite === 'u' || a.unite === 'ens' ? 10 : 1)) / (a.unite === 'u' || a.unite === 'ens' ? 10 : 1)
      const realise = Math.round(prevu * rnd(0.55, 1.08) * 10) / 10
      const ecart = realise < prevu * 0.8
      prod.push({ id: uid(), date, chantierId: a.chantierId, activiteId: a.id, prevu, realise, effectif: Math.round(rnd(6, 18)), engins: Math.round(rnd(1, 4)), cause: ecart ? ['Panne d’engin', 'Rupture de ciment', 'Pluie', 'Absence de personnel'][Math.floor(rnd(0, 4))] : '', causeStatut: ecart ? (Math.random() > 0.5 ? 'confirmée' : 'à vérifier') : '', updatedAt: Date.now(), by })
    }
  }
  const dep = []
  const cats = ['materiaux', 'mo', 'carburant', 'engins', 'soustraitance', 'autres']
  const part = { materiaux: 0.42, mo: 0.24, carburant: 0.12, engins: 0.14, soustraitance: 0.05, autres: 0.03 }
  for (const ch of [ch1, ch2]) {
    const execBudget = prod.filter((p) => p.chantierId === ch.id).reduce((s, p) => s + p.realise * acts.find((a) => a.id === p.activiteId).coutUnitaire, 0)
    const facteur = ch === ch1 ? 1.09 : 0.97
    for (let w = 0; w < 4; w++) {
      for (const c of cats) {
        const dd = addDays(debut, w * 7 + 5)
        dep.push({ id: uid(), date: dd > t ? t : dd, chantierId: ch.id, categorie: c, libelle: `${{ materiaux: 'Achats matériaux', mo: 'Paie équipes', carburant: 'Gasoil', engins: 'Location engins', soustraitance: 'Sous-traitant', autres: 'Divers' }[c]} — semaine ${w + 1}`, montant: Math.round((execBudget * facteur * part[c]) / 4 / 1000) * 1000, updatedAt: Date.now(), by })
      }
    }
  }
  const al = [
    { titre: 'Stock de ciment insuffisant pour la semaine prochaine', type: 'Matériaux', urgence: 'Critique', statut: 'Ouverte', chantierId: ch1.id, impact: 'Arrêt du bétonnage des fossés sous 48 h', cause: 'Livraison fournisseur décalée', causeStatut: 'confirmée', action: 'Commande complémentaire de 300 sacs auprès d’un second fournisseur', responsable: 'Service approvisionnement', echeance: addDays(t, 2), decisionDex: true, decision: 'Valider la commande complémentaire' },
    { titre: 'Pelle hydraulique en panne', type: 'Engin / panne', urgence: 'Haute', statut: 'En cours', chantierId: ch1.id, impact: 'Terrassement à 60 % de la cadence prévue', cause: 'Flexible hydraulique', causeStatut: 'à vérifier', action: 'Réparation + location d’une pelle de remplacement si > 3 jours', responsable: 'Chef parc engins', echeance: addDays(t, 1), decisionDex: false },
    { titre: 'Consommation de ciment supérieure au théorique', type: 'Dérive de coût', urgence: 'Moyenne', statut: 'Ouverte', chantierId: ch1.id, impact: 'Surcoût estimé 4 % sur le béton', cause: 'Dosages et pertes à contrôler', causeStatut: 'à vérifier', action: 'Contrôle des bons de sortie et des volumes coulés', responsable: 'Contrôleur des coûts', echeance: addDays(t, 4), decisionDex: false },
    { titre: 'Attente validation des plans de plomberie', type: 'Attente de validation', urgence: 'Haute', statut: 'Ouverte', chantierId: ch2.id, impact: 'Plomberie bloquée depuis 6 jours', cause: 'Plans non validés par le bureau de contrôle', causeStatut: 'confirmée', action: 'Relance formelle du bureau de contrôle', responsable: 'Chef de projet', echeance: addDays(t, 3), decisionDex: true, decision: 'Appuyer la relance auprès du maître d’ouvrage' }
  ].map((a) => ({ id: uid(), date: addDays(t, -Math.floor(Math.random() * 5)), ...a, updatedAt: Date.now(), by }))
  return {
    chantiers: [...s.chantiers, ...[ch1, ch2].map((c) => ({ ...c, updatedAt: Date.now(), by }))],
    activites: [...s.activites, ...acts.map(({ cadence, ...a }) => ({ ...a, updatedAt: Date.now(), by }))],
    production: [...s.production, ...prod],
    depenses: [...s.depenses, ...dep],
    alertes: [...s.alertes, ...al]
  }
}
