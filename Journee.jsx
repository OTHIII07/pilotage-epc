import { useState } from 'react'
import { Check, Sunrise, Sun, Moon, Trophy, CalendarDays, FileText } from 'lucide-react'
import { useStore } from '../lib/store'
import { today, mondayOf, addDays, fmtDate, shortDay, weekNumber } from '../lib/format'
import { ROUTINE, ROUTINE_COUNT, CYCLE_HEBDO } from '../lib/content'
import TopBar from '../components/TopBar'
import { Ring, Progress, useToast } from '../components/ui'

const ICONES = { matin: Sunrise, jour: Sun, soir: Moon }

export default function Journee() {
  const { profil, routine, toggleRoutine, notesJour, setNoteJour, equipe } = useStore()
  const toast = useToast()
  const t = today()
  const [date, setDate] = useState([0, 6].includes(new Date(t + 'T12:00:00').getDay()) ? addDays(mondayOf(t), 4) : t)
  const lundi = mondayOf(date)
  const jours = [0, 1, 2, 3, 4].map((i) => addDays(lundi, i))
  const mine = routine[profil.id] || {}
  const jour = mine[date] || {}
  const nb = Object.keys(jour).length
  const taux = nb / ROUTINE_COUNT
  const notes = notesJour[profil.id]?.[date] || {}
  const dow = new Date(date + 'T12:00:00').getDay()
  const focusHebdo = dow === 1 ? CYCLE_HEBDO[0] : dow === 3 ? CYCLE_HEBDO[2] : dow === 5 ? CYCLE_HEBDO[3] : CYCLE_HEBDO[1]
  const collegues = equipe.filter((p) => p.id !== profil.id)
  const tauxSemaine = jours.reduce((s, d) => s + Object.keys(mine[d] || {}).length, 0) / (ROUTINE_COUNT * 5)

  const onToggle = (id) => {
    const avant = nb
    toggleRoutine(date, id)
    if (!jour[id] && avant + 1 === ROUTINE_COUNT) toast('Objectif de la journée atteint 🎉')
  }

  return (
    <>
      <TopBar title="Ma journée" sub={`Semaine ${weekNumber(date)} · ${fmtDate(lundi, { year: false })} → ${fmtDate(addDays(lundi, 4))}`} right={<button className="btn sm" onClick={() => setDate(t)}>Aujourd'hui</button>} />

      <div className="grid g2" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }}>
        {jours.map((d) => {
          const n = Object.keys(mine[d] || {}).length
          const r = n / ROUTINE_COUNT
          const on = d === date
          return (
            <button key={d} onClick={() => setDate(d)} className="card flat" style={{ padding: '10px 4px', textAlign: 'center', borderWidth: 2, borderColor: on ? 'var(--brand)' : 'var(--line)', background: on ? 'var(--brand-soft)' : 'var(--surface)' }}>
              <div className="tiny b" style={{ color: on ? 'var(--brand)' : 'var(--text-2)' }}>{shortDay(d)}</div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{new Date(d + 'T12:00:00').getDate()}</div>
              <div style={{ margin: '6px 8px 0' }}><Progress value={r} tone={r >= 1 ? 'ok' : r > 0 ? '' : ''} /></div>
              {d === t && <div className="tiny brand-t b" style={{ marginTop: 3 }}>auj.</div>}
            </button>
          )
        })}
      </div>

      <div className="grid lg-split mt16">
        <div className="grid">
          <div className="card flex" style={{ gap: 18 }}>
            <Ring value={taux} color={taux >= 1 ? 'var(--ok)' : 'var(--brand)'} label={`${Math.round(taux * 100)}%`} sub={`${nb}/${ROUTINE_COUNT}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="small muted">{fmtDate(date, { weekday: true })}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{taux >= 1 ? 'Objectif de la journée atteint' : taux > 0 ? 'Journée en cours' : 'Journée à démarrer'}</div>
              {taux >= 1 ? <span className="badge ok mt8"><Trophy size={13} />Toutes les tâches sont faites</span> : <div className="small muted mt8">Il reste {ROUTINE_COUNT - nb} tâche(s). Taux de la semaine : <b>{Math.round(tauxSemaine * 100)} %</b></div>}
            </div>
          </div>

          {ROUTINE.map((ph) => {
            const Icon = ICONES[ph.id]
            const n = ph.taches.filter(([id]) => jour[id]).length
            return (
              <div key={ph.id} className="card">
                <div className="card-h" style={{ marginBottom: 4 }}>
                  <span className="ico" style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon size={18} /></span>
                  <h3>{ph.titre}<div className="tiny muted" style={{ fontWeight: 500 }}>{ph.objectif}</div></h3>
                  <span className={'badge ' + (n === ph.taches.length ? 'ok' : 'muted')}>{n}/{ph.taches.length}</span>
                </div>
                <div>
                  {ph.taches.map(([id, label]) => (
                    <div key={id} className={'check' + (jour[id] ? ' done' : '')} onClick={() => onToggle(id)} role="checkbox" aria-checked={!!jour[id]} tabIndex={0} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onToggle(id))}>
                      <span className="box">{jour[id] && <Check size={15} strokeWidth={3} />}</span>
                      <span className="lbl">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="tiny muted mt8" style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 10 }}><FileText size={12} style={{ verticalAlign: -2 }} /> <b>Livrable :</b> {ph.livrable}</div>
              </div>
            )
          })}
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card" style={{ background: 'var(--warn-soft)', borderColor: 'transparent' }}>
            <div className="flex"><CalendarDays size={18} color="var(--warn)" /><b className="small" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--warn)' }}>Focus de la semaine — {focusHebdo[0]}</b></div>
            <div className="mt8" style={{ fontWeight: 650 }}>{focusHebdo[1]}</div>
            <div className="small muted">Résultat attendu : {focusHebdo[2]}</div>
          </div>
          <div className="card">
            <div className="card-h"><h3>Synthèse du matin</h3></div>
            <textarea className="input" rows={4} value={notes.matin || ''} onChange={(e) => setNoteJour(date, 'matin', e.target.value)} placeholder="Objectifs du jour, moyens disponibles, contraintes, alertes prioritaires…" />
          </div>
          <div className="card">
            <div className="card-h"><h3>État du soir</h3></div>
            <textarea className="input" rows={4} value={notes.soir || ''} onChange={(e) => setNoteJour(date, 'soir', e.target.value)} placeholder="Production, écarts, problèmes rencontrés, actions à poursuivre, priorités de demain…" />
            <div className="tiny muted mt8">Enregistré automatiquement.</div>
          </div>
          {collegues.length > 0 && (
            <div className="card">
              <div className="card-h"><h3>Mon binôme</h3></div>
              {collegues.map((p) => {
                const r = Object.keys(routine[p.id]?.[date] || {}).length / ROUTINE_COUNT
                return <div key={p.id} className="flex"><span className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{p.nom[0]}</span><div style={{ flex: 1 }}><div className="small b">{p.nom}</div><Progress value={r} /></div><span className="small b">{Math.round(r * 100)}%</span></div>
              })}
              <div className="tiny muted mt8">Selon la dernière synchronisation importée.</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
