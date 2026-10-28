import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, HardHat, Users, Truck, AlertCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import { go } from '../lib/router'
import { today, addDays, fmtDate, mondayOf, shortDay, num, pct, money } from '../lib/format'
import { cumulParActivite, prodPeriode } from '../lib/kpi'
import TopBar from '../components/TopBar'
import { NumInput, Progress, Empty, useToast } from '../components/ui'

const CAUSES = ['Panne d’engin', 'Manque de matériaux', 'Absence de personnel', 'Pluie / météo', 'Accès difficile', 'Attente de validation', 'Problème technique', 'Rendement faible']

export default function Production() {
  const data = useStore()
  const { chantiers, activites, production, upsertProduction, reglages } = data
  const toast = useToast()
  const actifs = chantiers.filter((c) => c.statut !== 'Réceptionné')
  const [date, setDate] = useState(today())
  const [chId, setChId] = useState(actifs[0]?.id)
  const [vue, setVue] = useState('saisie')
  const ch = chantiers.find((c) => c.id === chId)
  const acts = activites.filter((a) => a.chantierId === chId)
  const entry = (aid) => production.find((p) => p.date === date && p.activiteId === aid) || {}

  const jour = useMemo(() => prodPeriode(data, date, date, chId), [data, date, chId])
  const lundi = mondayOf(date)
  const semaine = [0, 1, 2, 3, 4, 5].map((i) => addDays(lundi, i))

  const recopier = () => {
    let src = null
    for (let i = 1; i <= 7 && !src; i++) {
      const d = addDays(date, -i)
      if (production.some((p) => p.date === d && p.chantierId === chId && p.prevu)) src = d
    }
    if (!src) return toast('Aucun programme récent à recopier')
    production.filter((p) => p.date === src && p.chantierId === chId).forEach((p) => upsertProduction(date, chId, p.activiteId, { prevu: p.prevu }))
    toast(`Programme du ${fmtDate(src, { year: false })} recopié`)
  }

  if (!actifs.length) return (<><TopBar title="Production & planning" /><div className="card"><Empty icon={HardHat} title="Aucun chantier actif" text="Créez un chantier et ses activités pour saisir la production." action={<button className="btn primary" onClick={() => go('chantiers')}>Aller aux chantiers</button>} /></div></>)

  return (
    <>
      <TopBar title="Production & planning" sub="Programme (prévu) et quantités exécutées (réalisé)" />
      <div className="chips mb12">{actifs.map((c) => <button key={c.id} className={'chip' + (c.id === chId ? ' on' : '')} onClick={() => setChId(c.id)}>{c.nom}</button>)}</div>
      <div className="flex wrap mb12 between">
        <div className="flex">
          <button className="iconbtn" onClick={() => setDate(addDays(date, -1))} aria-label="Jour précédent"><ChevronLeft size={18} /></button>
          <input type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 160 }} />
          <button className="iconbtn" onClick={() => setDate(addDays(date, 1))} aria-label="Jour suivant"><ChevronRight size={18} /></button>
        </div>
        <div className="seg"><button className={vue === 'saisie' ? 'on' : ''} onClick={() => setVue('saisie')}>Saisie du jour</button><button className={vue === 'semaine' ? 'on' : ''} onClick={() => setVue('semaine')}>Vue semaine</button></div>
      </div>

      {vue === 'saisie' && (
        <>
          <div className="card flex wrap mb12" style={{ gap: 16 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="small muted">{fmtDate(date, { weekday: true })}{date > today() && ' · programme futur'}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Taux de réalisation : <span className={jour.taux == null ? '' : jour.taux >= reglages.seuilProduction ? 'ok-t' : jour.taux >= 0.7 ? 'warn-t' : 'bad-t'}>{pct(jour.taux)}</span></div>
              <div className="tiny muted">Valeur réalisée {money(jour.realise, true)} / prévue {money(jour.prevu, true)}</div>
            </div>
            <button className="btn sm" onClick={recopier}><Copy size={15} />Recopier le dernier programme</button>
          </div>

          {acts.length === 0 ? <div className="card"><Empty title="Aucune activité sur ce chantier" text="Ajoutez d'abord les lignes du DQE dans la fiche du chantier." action={<button className="btn primary" onClick={() => go('chantier/' + chId)}>Ouvrir le chantier</button>} /></div> : (
            <div className="grid md-g2">
              {acts.map((a) => {
                const e = entry(a.id)
                const cu = cumulParActivite(data, a.id)
                const r = e.prevu ? (e.realise || 0) / e.prevu : null
                const ecart = e.prevu && (e.realise || 0) < e.prevu * reglages.seuilProduction
                const set = (patch) => upsertProduction(date, chId, a.id, patch)
                return (
                  <div key={a.id} className="card" style={ecart ? { borderColor: 'color-mix(in srgb, var(--bad) 40%, var(--line))' } : null}>
                    <div className="flex between" style={{ alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}><b>{a.designation}</b><div className="tiny muted">Cumul {num(cu.realise)} / {num(a.qteMarche)} {a.unite} · reste {num(Math.max(0, a.qteMarche - cu.realise))}</div></div>
                      {r != null && <span className={'badge ' + (r >= 0.95 ? 'ok' : r >= 0.8 ? 'warn' : 'bad')}>{pct(r)}</span>}
                    </div>
                    <div className="mt8"><Progress value={a.qteMarche ? cu.realise / a.qteMarche : 0} /></div>
                    <div className="grid g2 mt12" style={{ gap: 10 }}>
                      <label className="field"><span>Prévu ({a.unite})</span><NumInput value={e.prevu || 0} onChange={(v) => set({ prevu: v })} /></label>
                      <label className="field"><span>Réalisé ({a.unite})</span><NumInput value={e.realise || 0} onChange={(v) => set({ realise: v })} /></label>
                      <label className="field"><span><Users size={12} /> Effectif</span><NumInput value={e.effectif || 0} onChange={(v) => set({ effectif: v })} /></label>
                      <label className="field"><span><Truck size={12} /> Engins</span><NumInput value={e.engins || 0} onChange={(v) => set({ engins: v })} /></label>
                    </div>
                    {(ecart || e.cause) && (
                      <div className="mt12" style={{ padding: 12, background: 'var(--bad-soft)', borderRadius: 12 }}>
                        <div className="small b bad-t flex" style={{ gap: 6 }}><AlertCircle size={14} />Écart de {num((e.realise || 0) - e.prevu)} {a.unite} — cause ?</div>
                        <div className="chips mt8" style={{ flexWrap: 'wrap' }}>{CAUSES.map((cz) => <button key={cz} className={'chip' + (e.cause === cz ? ' on' : '')} style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => set({ cause: e.cause === cz ? '' : cz, causeStatut: e.causeStatut || 'à vérifier' })}>{cz}</button>)}</div>
                        <input className="input mt8" placeholder="Autre cause / précision" value={CAUSES.includes(e.cause) ? '' : e.cause || ''} onChange={(ev) => set({ cause: ev.target.value, causeStatut: e.causeStatut || 'à vérifier' })} />
                        <div className="seg mt8"><button className={e.causeStatut === 'confirmée' ? 'on' : ''} onClick={() => set({ causeStatut: 'confirmée' })}>Cause confirmée</button><button className={e.causeStatut !== 'confirmée' ? 'on' : ''} onClick={() => set({ causeStatut: 'à vérifier' })}>À vérifier</button></div>
                      </div>
                    )}
                    {e.effectif > 0 && e.realise > 0 && <div className="tiny muted mt8">Rendement : {num(e.realise / e.effectif, 2)} {a.unite} / homme-jour</div>}
                  </div>
                )
              })}
            </div>
          )}
          <div className="tiny muted mt12">Les saisies sont enregistrées automatiquement.</div>
        </>
      )}

      {vue === 'semaine' && (
        <div className="card">
          <div className="card-h"><h3>Semaine du {fmtDate(lundi)} — {ch?.nom}</h3></div>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Activité</th>{semaine.map((d) => <th key={d} className="n" style={{ cursor: 'pointer' }} onClick={() => { setDate(d); setVue('saisie') }}>{shortDay(d)} {new Date(d + 'T12:00:00').getDate()}</th>)}<th className="n">Total P / R</th><th className="n">Taux</th></tr></thead>
              <tbody>
                {acts.map((a) => {
                  let P = 0, R = 0
                  return (
                    <tr key={a.id}>
                      <td><b>{a.designation}</b><div className="tiny muted">{a.unite}</div></td>
                      {semaine.map((d) => {
                        const e = production.find((p) => p.date === d && p.activiteId === a.id)
                        P += e?.prevu || 0; R += e?.realise || 0
                        const r = e?.prevu ? e.realise / e.prevu : null
                        return <td key={d} className="n"><div className={r == null ? '' : r >= 0.95 ? 'ok-t' : r >= 0.8 ? 'warn-t' : 'bad-t'} style={{ fontWeight: 700 }}>{e ? num(e.realise) : '·'}</div><div className="tiny muted">{e ? num(e.prevu) : ''}</div></td>
                      })}
                      <td className="n">{num(P)} / <b>{num(R)}</b></td>
                      <td className="n"><span className={'badge ' + (!P ? 'muted' : R / P >= 0.95 ? 'ok' : R / P >= 0.8 ? 'warn' : 'bad')}>{P ? pct(R / P) : '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="tiny muted mt8">En gras : réalisé · en gris : prévu. Cliquez sur un jour pour le saisir.</div>
        </div>
      )}
    </>
  )
}
