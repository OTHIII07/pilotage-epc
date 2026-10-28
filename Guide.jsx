import { useState } from 'react'
import { Check, CalendarClock, Calculator, Users, Target, HelpCircle, Wrench, Compass, Lightbulb } from 'lucide-react'
import { useStore } from '../lib/store'
import { FICHES, COMPARAISON, ATTENTES_DEX, QUESTIONS_DIRECTEUR, QUESTIONS_A_POSER, PLAN_30J, MOYENS, PRINCIPES, COMPETENCES, CYCLE_HEBDO } from '../lib/content'
import { addDays, fmtDate, num, pct, daysBetween, today } from '../lib/format'
import TopBar from '../components/TopBar'
import { Progress, Ring, NumInput } from '../components/ui'

const TABS = [['poste', 'Les postes'], ['dex', 'Attentes du DEX'], ['plan', 'Plan 30 jours'], ['questions', 'Questions au DEX'], ['kpi', 'Indicateurs'], ['moyens', 'Moyens & compétences']]

export default function Guide() {
  const [tab, setTab] = useState('poste')
  return (
    <>
      <TopBar title="Guide du département" sub="Étude, Planification et Contrôle des coûts" />
      <div className="seg mb12">{TABS.map(([i, l]) => <button key={i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{l}</button>)}</div>
      {tab === 'poste' && <Postes />}
      {tab === 'dex' && <Attentes />}
      {tab === 'plan' && <Plan />}
      {tab === 'questions' && <Questions />}
      {tab === 'kpi' && <Indicateurs />}
      {tab === 'moyens' && <Moyens />}
      <div className="card mt16" style={{ background: 'var(--brand-deep)', color: '#fff', borderColor: 'transparent' }}>
        <div className="flex"><Lightbulb size={18} color="#f0c25c" /><b>Trois principes à ne jamais oublier</b></div>
        <ol style={{ margin: '10px 0 0', paddingLeft: 20, color: '#e2d6fb' }}>{PRINCIPES.map((p) => <li key={p} style={{ marginBottom: 4 }}>{p}</li>)}</ol>
      </div>
    </>
  )
}

function Postes() {
  const { profil } = useStore()
  return (
    <div className="grid">
      <div className="grid md-g2">
        {['planif', 'couts'].map((id) => {
          const f = FICHES[id]
          const Icon = id === 'planif' ? CalendarClock : Calculator
          const moi = profil.poste === id
          return (
            <div key={id} className="card" style={moi ? { borderColor: 'var(--brand)', borderWidth: 2 } : null}>
              <div className="card-h"><span className="ico" style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon size={19} /></span><h3>{f.titre}<div className="tiny brand-t">{f.question}</div></h3>{moi && <span className="badge">Mon poste</span>}</div>
              <p className="small muted" style={{ marginTop: 0 }}>{f.resume}</p>
              <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>{f.missions.map((m) => <li key={m} style={{ marginBottom: 5 }}>{m}</li>)}</ul>
            </div>
          )
        })}
      </div>
      <div className="card">
        <div className="card-h"><h3>La distinction essentielle</h3></div>
        <div className="table-wrap"><table className="t"><thead><tr><th>Sujet</th><th>Planificateur-ordonnanceur</th><th>Contrôleur des coûts</th></tr></thead><tbody>{COMPARAISON.map((r) => <tr key={r[0]}><td className="b">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
      </div>
      <div className="card">
        <div className="card-h"><Users size={18} color="var(--brand)" /><h3>Travailler en binôme — exemple</h3></div>
        <p className="small" style={{ marginTop: 0 }}>Fossés en béton armé : <b>200 ml prévus</b> dans la semaine, <b>150 ml réalisés</b>.</p>
        <div className="grid md-g2" style={{ gap: 10 }}>
          {[['Planificateur', "Constate l'écart de 50 ml (75 %), évalue l'effet sur le planning et propose un rattrapage."], ['Contrôleur des coûts', 'Vérifie béton, ciment, fer, heures d’engins et main-d’œuvre au regard des 150 ml obtenus.'], ['Ensemble', 'Déterminent si le retard entraîne surcoût, prolongation ou baisse de marge.'], ['Vers le DEX', 'Soumettent les mesures correctives et les arbitrages nécessaires.']].map(([t, d], i) => (
            <div key={t} className="card flat" style={{ background: 'var(--surface-2)' }}><div className="flex"><span className="badge">{i + 1}</span><b className="small">{t}</b></div><div className="small muted mt8">{d}</div></div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-h"><h3>Cycle hebdomadaire</h3></div>
        <div className="list">{CYCLE_HEBDO.map(([p, t, r]) => <div key={p} className="row"><span className="badge" style={{ minWidth: 92, justifyContent: 'center' }}>{p}</span><div className="grow"><div className="t" style={{ fontSize: 14 }}>{t}</div><div className="s">→ {r}</div></div></div>)}</div>
      </div>
    </div>
  )
}

function Attentes() {
  return (
    <div className="grid">
      <div className="grid md-g2">{ATTENTES_DEX.map(([t, d], i) => <div key={t} className="card"><div className="flex"><span className="badge">{i + 1}</span><b>{t}</b></div><div className="small muted mt8">{d}</div></div>)}</div>
      <div className="card">
        <div className="card-h"><Target size={18} color="var(--brand)" /><h3>Ce que le Directeur peut vous demander à tout moment</h3></div>
        <ol className="small" style={{ paddingLeft: 20, margin: 0 }}>{QUESTIONS_DIRECTEUR.map((q) => <li key={q} style={{ marginBottom: 6 }}>{q}</li>)}</ol>
        <div className="tiny muted mt12">L'application répond à la plupart de ces questions : Tableau de bord, Chantiers, Coûts et Rapport hebdo. L'essentiel est de savoir où trouver l'information, d'en vérifier la fiabilité et de répondre vite, de façon argumentée.</div>
      </div>
    </div>
  )
}

function Plan() {
  const { plan30, togglePlan, reglages, setReglages } = useStore()
  const total = PLAN_30J.reduce((s, p) => s + p.taches.length, 0)
  const fait = PLAN_30J.reduce((s, p) => s + p.taches.filter(([id]) => plan30[id]).length, 0)
  const jour = Math.min(30, Math.max(1, daysBetween(reglages.demarrage, today()) + 1))
  return (
    <div className="grid">
      <div className="card flex wrap" style={{ gap: 18 }}>
        <Ring value={fait / total} label={`${Math.round((fait / total) * 100)}%`} sub={`${fait}/${total}`} color={fait === total ? 'var(--ok)' : 'var(--brand)'} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Prise de fonction — jour {jour} / 30</div>
          <div className="small muted">Fin prévue le {fmtDate(addDays(reglages.demarrage, 29))}</div>
          <label className="field mt12" style={{ maxWidth: 220 }}><span>Date de démarrage</span><input type="date" className="input" value={reglages.demarrage} onChange={(e) => setReglages({ demarrage: e.target.value })} /></label>
        </div>
      </div>
      {PLAN_30J.map((p, i) => {
        const n = p.taches.filter(([id]) => plan30[id]).length
        const debut = addDays(reglages.demarrage, [0, 7, 14, 21][i])
        return (
          <div key={p.id} className="card">
            <div className="card-h"><span className="badge">{p.periode}</span><h3>{p.titre}<div className="tiny muted" style={{ fontWeight: 500 }}>à partir du {fmtDate(debut, { year: false })}</div></h3><span className={'badge ' + (n === p.taches.length ? 'ok' : 'muted')}>{n}/{p.taches.length}</span></div>
            <Progress value={n / p.taches.length} tone={n === p.taches.length ? 'ok' : ''} />
            <div className="mt8">{p.taches.map(([id, l]) => <div key={id} className={'check' + (plan30[id] ? ' done' : '')} onClick={() => togglePlan(id)}><span className="box">{plan30[id] && <Check size={15} strokeWidth={3} />}</span><span className="lbl">{l}</span></div>)}</div>
          </div>
        )
      })}
    </div>
  )
}

function Questions() {
  const { questionsDex, setQuestion } = useStore()
  const n = Object.values(questionsDex).filter((q) => q.fait).length
  return (
    <div className="grid">
      <div className="card flex"><HelpCircle size={20} color="var(--brand)" /><div style={{ flex: 1 }}><b>Entretien de cadrage avec le Directeur d'Exploitation</b><div className="small muted">Notez ses réponses : elles fixent votre périmètre, vos indicateurs et vos seuils d'alerte.</div></div><span className="badge">{n}/{QUESTIONS_A_POSER.length}</span></div>
      {QUESTIONS_A_POSER.map((q, i) => {
        const v = questionsDex[i] || {}
        return (
          <div key={i} className="card">
            <div className={'check' + (v.fait ? ' done' : '')} style={{ padding: 0 }} onClick={() => setQuestion(i, { fait: !v.fait })}><span className="box">{v.fait && <Check size={15} strokeWidth={3} />}</span><span className="lbl" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 650 }}>{q}</span></div>
            <textarea className="input mt8" rows={2} placeholder="Réponse du Directeur…" value={v.reponse || ''} onChange={(e) => setQuestion(i, { reponse: e.target.value })} />
          </div>
        )
      })}
    </div>
  )
}

function Indicateurs() {
  const [p, setP] = useState(200)
  const [r, setR] = useState(150)
  const IND = [
    ['Planification', [['Taux de réalisation', 'Réalisé ÷ Prévu (même période, même unité)'], ['Écart de production', 'Réalisé − Prévu'], ['Avancement physique', 'Valeur DQE réalisée ÷ valeur totale du DQE'], ['Écart d’avancement', 'Avancement physique − temps écoulé'], ['Fin probable', 'Durée écoulée ÷ avancement physique']]],
    ['Coûts', [['Coût réel par unité', 'Coût réel ÷ quantité produite'], ['Écart de consommation', 'Consommation réelle − consommation théorique'], ['Rendement', 'Quantité produite ÷ (équipe, engin ou jour)'], ['Écart de coût', 'Budget des travaux exécutés − coût réel'], ['Indice de performance coût (IPC)', 'Budget exécuté ÷ coût réel (≥ 1 = maîtrisé)']]],
    ['Rentabilité', [['Coût à terminaison', 'Coût réel + reste à faire budgété ÷ IPC'], ['Marge prévisionnelle', 'Montant du marché − coût à terminaison'], ['Évolution de la marge', 'Marge prévisionnelle − marge initiale']]]
  ]
  return (
    <div className="grid">
      <div className="card" style={{ background: 'var(--brand-soft)', borderColor: 'transparent' }}>
        <div className="card-h"><Calculator size={18} color="var(--brand)" /><h3>Calcul express</h3></div>
        <div className="grid g2" style={{ maxWidth: 420 }}>
          <label className="field"><span>Prévu</span><NumInput value={p} onChange={setP} /></label>
          <label className="field"><span>Réalisé</span><NumInput value={r} onChange={setR} /></label>
        </div>
        <div className="flex wrap mt12" style={{ gap: 18 }}>
          <div><div className="tiny muted">Taux de réalisation</div><b style={{ fontSize: 22 }} className={p && r / p >= 0.95 ? 'ok-t' : p && r / p >= 0.8 ? 'warn-t' : 'bad-t'}>{p ? pct(r / p) : '—'}</b></div>
          <div><div className="tiny muted">Écart</div><b style={{ fontSize: 22 }}>{num(r - p)}</b></div>
        </div>
      </div>
      {IND.map(([g, l]) => (
        <div key={g} className="card"><div className="card-h"><h3>Indicateurs de {g.toLowerCase()}</h3></div><div className="list">{l.map(([n, f]) => <div key={n} className="row"><div className="grow"><div className="t" style={{ fontSize: 14 }}>{n}</div><div className="s tnum">{f}</div></div></div>)}</div></div>
      ))}
      <div className="card flat small muted" style={{ background: 'var(--surface-2)' }}>⚠️ Le taux d'avancement physique ne suffit pas à mesurer la rentabilité : un chantier peut produire beaucoup tout en consommant trop. Et une marge prévisionnelle ne se calcule pas comme « marché − dépenses déjà enregistrées » : il faut ajouter le coût restant à engager.</div>
    </div>
  )
}

function Moyens() {
  return (
    <div className="grid">
      <div className="card">
        <div className="card-h"><Wrench size={18} color="var(--brand)" /><h3>Moyens à demander à la Direction</h3></div>
        <div className="list">{MOYENS.map(([m, u]) => <div key={m} className="row"><div className="grow"><div className="t" style={{ fontSize: 14 }}>{m}</div><div className="s">{u}</div></div></div>)}</div>
        <div className="tiny muted mt8">Faites préciser votre périmètre d’autorité : détecter un besoin et recommander un achat ne donne pas forcément le pouvoir de commander.</div>
      </div>
      <div className="grid md-g2">{COMPETENCES.map(([t, l]) => <div key={t} className="card"><div className="flex"><Compass size={17} color="var(--brand)" /><b>{t}</b></div><ul className="small mt8" style={{ paddingLeft: 18, margin: '8px 0 0' }}>{l.map((x) => <li key={x} style={{ marginBottom: 4 }}>{x}</li>)}</ul></div>)}</div>
    </div>
  )
}
