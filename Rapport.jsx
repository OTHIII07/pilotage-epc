import { useMemo, useState } from 'react'
import { Printer, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useStore } from '../lib/store'
import { today, mondayOf, addDays, fmtDate, weekNumber, money, pct, num } from '../lib/format'
import { kpiChantier, prodPeriode } from '../lib/kpi'
import { SECTIONS_RAPPORT } from '../lib/content'
import TopBar from '../components/TopBar'
import { useToast } from '../components/ui'

export default function Rapport() {
  const data = useStore()
  const { chantiers, alertes, depenses, rapports, setRapport, profil, equipe, reglages } = data
  const toast = useToast()
  const [lundi, setLundi] = useState(mondayOf(today()))
  const fin = addDays(lundi, 5)
  const ref = fin < today() ? fin : today()
  const r = rapports[lundi] || {}
  const actifs = chantiers.filter((c) => c.statut !== 'Réceptionné')

  const R = useMemo(() => {
    const lignes = actifs.map((c) => {
      const k = kpiChantier(c, data, ref)
      const p = prodPeriode(data, lundi, fin, c.id)
      const depSem = depenses.filter((d) => d.chantierId === c.id && d.date >= lundi && d.date <= fin).reduce((s, d) => s + d.montant, 0)
      return { c, k, p, depSem }
    })
    const ecarts = []
    const causesC = [], causesV = []
    for (const { c, p } of lignes) {
      for (const x of p.parAct) {
        const taux = x.prevu ? x.realise / x.prevu : null
        if (taux != null && taux < reglages.seuilProduction) ecarts.push({ c, ...x, taux, ecart: x.realise - x.prevu })
        for (const cz of x.causes) (cz.statut === 'confirmée' ? causesC : causesV).push({ c, a: x.activite, ...cz })
      }
    }
    const ouv = alertes.filter((a) => a.statut !== 'Résolue')
    for (const a of ouv) if (a.cause) (a.causeStatut === 'confirmée' ? causesC : causesV).push({ c: chantiers.find((x) => x.id === a.chantierId), alerte: a, cause: a.cause })
    const totP = lignes.reduce((s, l) => s + l.p.prevu, 0)
    const totR = lignes.reduce((s, l) => s + l.p.realise, 0)
    return { lignes, ecarts: ecarts.sort((a, b) => a.taux - b.taux), causesC, causesV, ouv, totP, totR }
  }, [data, lundi, fin, actifs, alertes, chantiers, depenses, reglages])

  const nomCh = (id) => chantiers.find((c) => c.id === id)?.nom || 'Transversal'
  const actions = R.ouv.filter((a) => a.action)
  const risques = R.ouv.filter((a) => a.urgence === 'Critique' || a.urgence === 'Haute')
  const decisions = R.ouv.filter((a) => a.decisionDex)
  const auteurs = equipe.length ? equipe.map((p) => p.nom).join(' & ') : profil.nom

  const auto = `Semaine ${weekNumber(lundi)} : ${R.lignes.length} chantier(s) suivi(s). Production réalisée ${pct(R.totP ? R.totR / R.totP : null)} du programme (${money(R.totR, true)} sur ${money(R.totP, true)} valorisés au DQE). ${R.ecarts.length} écart(s) significatif(s), ${risques.length} risque(s) prioritaire(s) et ${decisions.length} décision(s) attendue(s) de la Direction.`

  const copier = () => {
    const el = document.getElementById('rapport')
    navigator.clipboard?.writeText(el.innerText).then(() => toast('Rapport copié — collez-le dans un e-mail ou Word'))
  }

  const H = ({ n }) => <h2>{n}. {SECTIONS_RAPPORT[n - 1]}</h2>

  return (
    <>
      <TopBar title="Rapport hebdomadaire" sub="Outil d'aide à la décision du Directeur d'Exploitation" right={<div className="flex no-print"><button className="btn sm" onClick={copier}><Copy size={15} /><span className="desktop-only">Copier</span></button><button className="btn sm primary" onClick={() => window.print()}><Printer size={15} />PDF</button></div>} />
      <div className="flex mb12 no-print">
        <button className="iconbtn" onClick={() => setLundi(addDays(lundi, -7))} aria-label="Semaine précédente"><ChevronLeft size={18} /></button>
        <div className="card flat" style={{ flex: 1, padding: '9px 14px', textAlign: 'center' }}><b>Semaine {weekNumber(lundi)}</b> <span className="muted small">· {fmtDate(lundi, { year: false })} → {fmtDate(fin)}</span></div>
        <button className="iconbtn" onClick={() => setLundi(addDays(lundi, 7))} aria-label="Semaine suivante"><ChevronRight size={18} /></button>
      </div>

      <div className="card report" id="rapport" style={{ padding: 22 }}>
        <div className="flex between wrap" style={{ borderBottom: '3px solid #5b2fb0', paddingBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#5b2fb0', fontWeight: 800 }}>AMETHYSTE & CO · Direction d'Exploitation</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Rapport hebdomadaire de pilotage — Semaine {weekNumber(lundi)}</div>
            <div className="small" style={{ color: '#5b5370' }}>Période du {fmtDate(lundi)} au {fmtDate(fin)} · Département Étude, Planification et Contrôle des coûts · {auteurs}</div>
          </div>
        </div>

        <H n={1} />
        <p className="small" style={{ color: '#5b5370', margin: '0 0 8px' }}>{auto}</p>
        <textarea className="input no-print" rows={3} placeholder="Votre message clé pour le Directeur (3 à 5 lignes)…" value={r.synthese || ''} onChange={(e) => setRapport(lundi, { synthese: e.target.value })} />
        {r.synthese && <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{r.synthese}</p>}

        <H n={2} />
        <Tbl head={['Chantier', 'Prévu (valeur DQE)', 'Réalisé', 'Taux', 'Écart']} rows={R.lignes.map(({ c, p }) => [c.nom, money(p.prevu), money(p.realise), pct(p.taux), money(p.realise - p.prevu)])} foot={['Total', money(R.totP), money(R.totR), pct(R.totP ? R.totR / R.totP : null), money(R.totR - R.totP)]} />

        <H n={3} />
        <Tbl head={['Chantier', 'Avancement physique', 'Temps écoulé', 'Écart (pts)', 'Fin contractuelle', 'Fin probable']} rows={R.lignes.map(({ c, k }) => [c.nom, pct(k.avPhysique), pct(k.avTemps), k.ecartAvancement == null ? '—' : (k.ecartAvancement * 100).toFixed(1).replace('.', ','), fmtDate(c.dateFin), k.finProbable ? fmtDate(k.finProbable) + (k.retardJours > 0 ? ` (+${k.retardJours} j)` : '') : '—'])} />

        <H n={4} />
        <Tbl head={['Chantier', 'Dépenses semaine', 'Coût réel cumulé', 'Budget exécuté', 'IPC', 'Coût à terminaison', 'Marge prév.']} rows={R.lignes.map(({ c, k, depSem }) => [c.nom, money(depSem), money(k.coutReel), money(k.budgetExecute), k.ipc ? num(k.ipc) : '—', money(k.cat), pct(k.tauxMargePrev, 1)])} />

        <H n={5} />
        {R.ecarts.length ? <Tbl head={['Chantier', 'Activité', 'Prévu', 'Réalisé', 'Écart', 'Taux']} rows={R.ecarts.map((e) => [e.c.nom, e.activite.designation, `${num(e.prevu)} ${e.activite.unite}`, num(e.realise), `${num(e.ecart)} ${e.activite.unite}`, pct(e.taux)])} /> : <Rien />}
        <p className="tiny" style={{ color: '#7d7396' }}>Seuil de significativité : taux de réalisation inférieur à {pct(reglages.seuilProduction)}.</p>

        <H n={6} />
        {R.causesC.length ? <ul className="small">{R.causesC.map((x, i) => <li key={i}><b>{x.c?.nom || 'Transversal'}</b>{x.a && ` — ${x.a.designation}`}{x.date && ` (${fmtDate(x.date, { year: false })})`} : {x.cause}</li>)}</ul> : <Rien />}

        <H n={7} />
        {R.causesV.length ? <ul className="small">{R.causesV.map((x, i) => <li key={i}><b>{x.c?.nom || 'Transversal'}</b>{x.a && ` — ${x.a.designation}`} : {x.cause} — <i>à confirmer</i></li>)}</ul> : <Rien />}
        <textarea className="input no-print" rows={2} placeholder="Autres vérifications à mener…" value={r.verifications || ''} onChange={(e) => setRapport(lundi, { verifications: e.target.value })} />
        {r.verifications && <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{r.verifications}</p>}

        <H n={8} />
        {actions.length ? <Tbl head={['Chantier', 'Action', 'Responsable', 'Échéance', 'Statut']} rows={actions.map((a) => [nomCh(a.chantierId), a.action, a.responsable || '—', fmtDate(a.echeance), a.statut])} /> : <Rien />}

        <H n={9} />
        {risques.length ? <Tbl head={['Urgence', 'Chantier', 'Risque / besoin', 'Impact', 'Échéance']} rows={risques.map((a) => [a.urgence, nomCh(a.chantierId), a.titre, a.impact || '—', fmtDate(a.echeance)])} /> : <Rien />}

        <H n={10} />
        {decisions.length ? <Tbl head={['Décision demandée', 'Justification / conséquence', 'Responsable', 'Échéance', 'Urgence']} rows={decisions.map((a) => [a.decision || a.titre, a.impact || '—', a.responsable || '—', fmtDate(a.echeance), a.urgence])} /> : <Rien />}

        <p className="tiny" style={{ color: '#7d7396', marginTop: 24 }}>Document généré par l'application Pilotage EPC le {fmtDate(today())}. Chiffres issus des saisies de production et de dépenses ; à rapprocher des rapports de chantier avant diffusion.</p>
      </div>
    </>
  )
}

const Rien = () => <p className="small" style={{ color: '#7d7396', margin: 0 }}>Néant sur la période.</p>

const isNum = (c) => typeof c === 'string' && /^[-+—\d]/.test(c) && !/[a-zA-Zéû]{3,}/.test(c)

function Tbl({ head, rows, foot }) {
  if (!rows.length) return <Rien />
  return (
    <div className="table-wrap">
      <table className="t" style={{ fontSize: 12.5 }}>
        <thead><tr>{head.map((h, i) => <th key={i} className={i && isNum(rows[0]?.[i]) ? 'n' : ''}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j && isNum(c) ? 'n' : ''}>{c}</td>)}</tr>)}</tbody>
        {foot && <tfoot><tr>{foot.map((c, j) => <td key={j} className={j ? 'n' : ''} style={{ fontWeight: 800, borderTop: '2px solid var(--line)' }}>{c}</td>)}</tr></tfoot>}
      </table>
    </div>
  )
}
