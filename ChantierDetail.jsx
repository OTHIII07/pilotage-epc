import { useMemo, useState } from 'react'
import { Pencil, Plus, ClipboardPlus, Receipt, TriangleAlert, Layers, CalendarClock, Wallet, Gauge, Info } from 'lucide-react'
import { useStore } from '../lib/store'
import { go } from '../lib/router'
import { today, pct, money, num, fmtDate } from '../lib/format'
import { kpiChantier, serieJours, statutDelai, statutCout, libelleStatut, cumulParActivite } from '../lib/kpi'
import { CATEGORIES_COUTS } from '../lib/content'
import TopBar from '../components/TopBar'
import { Progress, BarsPrevuRealise, Donut, Empty, Ring } from '../components/ui'
import { ChantierForm, ActiviteForm, DepenseForm, AlerteForm } from '../components/forms'
import { AlerteCard } from './Alertes'

const tone = { ok: 'ok', vigilance: 'warn', critique: 'bad', neutre: 'muted' }

export default function ChantierDetail({ id }) {
  const data = useStore()
  const c = data.chantiers.find((x) => x.id === id)
  const [tab, setTab] = useState('synthese')
  const [form, setForm] = useState(null)
  const t = today()
  const k = useMemo(() => (c ? kpiChantier(c, data, t) : null), [c, data, t])

  if (!c) return (<><TopBar title="Chantier" back="chantiers" /><div className="card"><Empty title="Chantier introuvable" text="Il a peut-être été supprimé." action={<button className="btn" onClick={() => go('chantiers')}>Retour aux chantiers</button>} /></div></>)

  const sd = statutDelai(k), sc = statutCout(k, data.reglages.seuilCout)
  const alertes = data.alertes.filter((a) => a.chantierId === c.id)

  return (
    <>
      <TopBar back="chantiers" title={c.nom} sub={`${c.localisation || '—'} · ${c.statut}${c.chef ? ' · ' + c.chef : ''}`} right={<button className="iconbtn" onClick={() => setForm({ type: 'chantier' })} aria-label="Modifier"><Pencil size={17} /></button>} />
      {c.note && <div className="card flat small muted mb12 flex" style={{ background: 'var(--surface-2)' }}><Info size={16} />{c.note}</div>}
      <div className="seg mb12">
        {[['synthese', 'Synthèse'], ['dqe', 'DQE & avancement'], ['prod', 'Production'], ['couts', 'Coûts'], ['alertes', `Alertes (${alertes.filter((a) => a.statut !== 'Résolue').length})`]].map(([i, l]) => <button key={i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{l}</button>)}
      </div>

      {tab === 'synthese' && (
        <div className="grid">
          <div className="grid md-g2">
            <div className="card">
              <div className="card-h"><Gauge size={18} color="var(--brand)" /><h3>Délais & avancement</h3><span className={'badge ' + tone[sd]}>{libelleStatut[sd]}</span></div>
              <div className="flex" style={{ gap: 20 }}>
                <Ring value={k.avPhysique} label={pct(k.avPhysique)} sub="physique" color={sd === 'critique' ? 'var(--bad)' : sd === 'vigilance' ? 'var(--warn)' : 'var(--ok)'} />
                <dl className="kv" style={{ flex: 1 }}>
                  <dt>Temps écoulé</dt><dd>{pct(k.avTemps)}</dd>
                  <dt>Écart</dt><dd className={k.ecartAvancement < 0 ? 'bad-t' : 'ok-t'}>{k.ecartAvancement == null ? '—' : (k.ecartAvancement > 0 ? '+' : '') + (k.ecartAvancement * 100).toFixed(1).replace('.', ',') + ' pts'}</dd>
                  <dt>Fin contractuelle</dt><dd>{fmtDate(c.dateFin)}</dd>
                  <dt>Fin probable</dt><dd className={k.retardJours > 0 ? 'bad-t' : ''}>{fmtDate(k.finProbable)}{k.retardJours ? ` (${k.retardJours > 0 ? '+' : ''}${k.retardJours} j)` : ''}</dd>
                </dl>
              </div>
            </div>
            <div className="card">
              <div className="card-h"><Wallet size={18} color="var(--brand)" /><h3>Coûts & rentabilité</h3><span className={'badge ' + tone[sc]}>{libelleStatut[sc]}</span></div>
              <dl className="kv">
                <dt>Montant du marché</dt><dd>{money(k.montantMarche)}</dd>
                <dt>Budget (déboursé sec)</dt><dd>{money(k.budget)}</dd>
                <dt>Budget des travaux exécutés</dt><dd>{money(k.budgetExecute)}</dd>
                <dt>Coût réel cumulé</dt><dd>{money(k.coutReel)}</dd>
                <dt>Écart de coût</dt><dd className={k.ecartCout < 0 ? 'bad-t' : 'ok-t'}>{money(k.ecartCout)}</dd>
                <dt>Indice de performance coût</dt><dd>{k.ipc ? num(k.ipc) : '—'}</dd>
                <dt>Coût à terminaison estimé</dt><dd>{money(k.cat)}</dd>
                <dt>Marge initiale → prévisionnelle</dt><dd>{pct(k.tauxMargeInit, 1)} → <span className={k.tauxMargePrev < k.tauxMargeInit ? 'bad-t' : 'ok-t'}>{pct(k.tauxMargePrev, 1)}</span></dd>
              </dl>
            </div>
          </div>
          <div className="card">
            <div className="card-h"><h3>Production des 14 derniers jours</h3><button className="link" onClick={() => go('production')}>Saisir</button></div>
            <BarsPrevuRealise data={serieJours(data, t, 14, c.id)} />
          </div>
          <div className="card flat small muted" style={{ background: 'var(--surface-2)' }}>
            <b>Méthode :</b> avancement physique = valeur DQE des quantités réalisées / valeur totale du DQE. Indice de performance coût = budget des travaux exécutés / coût réel (≥ 1 = maîtrisé). Coût à terminaison = coût réel + reste à faire budgété / indice. Marge prévisionnelle = marché − coût à terminaison.
          </div>
        </div>
      )}

      {tab === 'dqe' && (
        <div className="card">
          <div className="card-h"><Layers size={18} color="var(--brand)" /><h3>Activités du DQE</h3><button className="btn sm primary" onClick={() => setForm({ type: 'activite' })}><Plus size={15} />Activité</button></div>
          {k.acts.length === 0 ? <Empty title="Aucune activité" text="Ajoutez les lignes du DQE : désignation, unité, quantité du marché, prix unitaire et coût unitaire budgété." /> : (
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>Activité</th><th className="n">Qté marché</th><th className="n">Réalisé</th><th style={{ minWidth: 110 }}>Avancement</th><th className="n">Reste</th><th className="n">Rendement moyen</th><th className="n">PU DQE</th><th className="n">Marge unit.</th></tr></thead>
                <tbody>
                  {k.acts.map((a) => {
                    const cu = cumulParActivite(data, a.id, t)
                    const av = a.qteMarche ? cu.realise / a.qteMarche : 0
                    const jours = new Set(data.production.filter((p) => p.activiteId === a.id && p.realise > 0).map((p) => p.date)).size
                    const mu = a.prixUnitaire ? (a.prixUnitaire - a.coutUnitaire) / a.prixUnitaire : null
                    return (
                      <tr key={a.id} className="clickable" onClick={() => setForm({ type: 'activite', initial: a })}>
                        <td><b>{a.designation}</b><div className="tiny muted">{a.unite}</div></td>
                        <td className="n">{num(a.qteMarche)}</td>
                        <td className="n">{num(cu.realise)}</td>
                        <td><div className="flex" style={{ gap: 6 }}><div style={{ flex: 1 }}><Progress value={av} /></div><span className="tiny b">{pct(av)}</span></div></td>
                        <td className="n">{num(Math.max(0, a.qteMarche - cu.realise))}</td>
                        <td className="n">{jours ? num(cu.realise / jours, 1) + ' ' + a.unite + '/j' : '—'}</td>
                        <td className="n">{money(a.prixUnitaire)}</td>
                        <td className="n"><span className={mu > 0.15 ? 'ok-t' : mu > 0 ? 'warn-t' : 'bad-t'}>{pct(mu, 1)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'prod' && <ProdListe chantierId={c.id} />}

      {tab === 'couts' && (
        <div className="grid">
          <div className="card">
            <div className="card-h"><h3>Répartition du coût réel</h3><button className="btn sm primary" onClick={() => setForm({ type: 'depense' })}><Plus size={15} />Dépense</button></div>
            <CoutsCategories depenses={k.dep} />
          </div>
          <div className="card">
            <div className="card-h"><h3>Dépenses enregistrées</h3></div>
            {k.dep.length === 0 ? <Empty icon={Receipt} title="Aucune dépense" /> : (
              <div className="list">
                {[...k.dep].sort((a, b) => b.date.localeCompare(a.date)).map((d) => {
                  const cat = CATEGORIES_COUTS.find((x) => x.id === d.categorie)
                  return (
                    <div key={d.id} className="row clickable" onClick={() => setForm({ type: 'depense', initial: d })}>
                      <i className="dot" style={{ background: cat?.couleur }} />
                      <div className="grow"><div className="t">{d.libelle || cat?.label}</div><div className="s">{fmtDate(d.date)} · {cat?.label}</div></div>
                      <b className="tnum">{money(d.montant)}</b>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'alertes' && (
        <div className="grid">
          <button className="btn primary" style={{ justifySelf: 'start' }} onClick={() => setForm({ type: 'alerte' })}><TriangleAlert size={16} />Nouvelle alerte</button>
          {alertes.length === 0 ? <div className="card"><Empty title="Aucune alerte sur ce chantier" /></div> : alertes.map((a) => <AlerteCard key={a.id} a={a} onEdit={() => setForm({ type: 'alerte', initial: a })} />)}
        </div>
      )}

      {form?.type === 'chantier' && <ChantierForm initial={c} onClose={(r) => { setForm(null); if (r === 'deleted') go('chantiers') }} />}
      {form?.type === 'activite' && <ActiviteForm chantierId={c.id} initial={form.initial} onClose={() => setForm(null)} />}
      {form?.type === 'depense' && <DepenseForm chantierId={c.id} initial={form.initial} onClose={() => setForm(null)} />}
      {form?.type === 'alerte' && <AlerteForm chantierId={c.id} initial={form.initial} onClose={() => setForm(null)} />}
    </>
  )
}

export function CoutsCategories({ depenses }) {
  const parts = CATEGORIES_COUTS.map((c) => ({ label: c.label, color: c.couleur, value: depenses.filter((d) => d.categorie === c.id).reduce((s, d) => s + d.montant, 0) }))
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (!total) return <div className="empty small">Aucune dépense saisie.</div>
  return (
    <div className="flex wrap" style={{ gap: 22 }}>
      <Donut parts={parts} center={<div><div className="tiny muted">Total</div><b>{money(total, true)}</b></div>} />
      <div className="col" style={{ flex: 1, minWidth: 200, gap: 8 }}>
        {parts.filter((p) => p.value).map((p) => (
          <div key={p.label} className="flex small"><i className="dot" style={{ background: p.color }} /><span style={{ flex: 1 }}>{p.label}</span><span className="muted tnum">{pct(p.value / total)}</span><b className="tnum" style={{ width: 82, textAlign: 'right' }}>{money(p.value, true)}</b></div>
        ))}
      </div>
    </div>
  )
}

function ProdListe({ chantierId }) {
  const { production, activites } = useStore()
  const prod = production.filter((p) => p.chantierId === chantierId).sort((a, b) => b.date.localeCompare(a.date))
  const dates = [...new Set(prod.map((p) => p.date))].slice(0, 20)
  const act = Object.fromEntries(activites.map((a) => [a.id, a]))
  if (!dates.length) return <div className="card"><Empty icon={ClipboardPlus} title="Aucune production saisie" action={<button className="btn primary" onClick={() => go('production')}>Saisir la production</button>} /></div>
  return (
    <div className="grid">
      {dates.map((d) => (
        <div key={d} className="card">
          <div className="card-h"><CalendarClock size={16} color="var(--brand)" /><h3>{fmtDate(d, { weekday: true })}</h3></div>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Activité</th><th className="n">Prévu</th><th className="n">Réalisé</th><th className="n">Taux</th><th>Cause d'écart</th></tr></thead>
              <tbody>
                {prod.filter((p) => p.date === d).map((p) => {
                  const r = p.prevu ? p.realise / p.prevu : null
                  return (
                    <tr key={p.id}>
                      <td>{act[p.activiteId]?.designation}</td>
                      <td className="n">{num(p.prevu)} {act[p.activiteId]?.unite}</td>
                      <td className="n">{num(p.realise)}</td>
                      <td className="n"><span className={'badge ' + (r == null ? 'muted' : r >= 0.95 ? 'ok' : r >= 0.8 ? 'warn' : 'bad')}>{pct(r)}</span></td>
                      <td className="small">{p.cause ? <>{p.cause} <span className={'badge ' + (p.causeStatut === 'confirmée' ? 'info' : 'muted')}>{p.causeStatut}</span></> : <span className="muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
