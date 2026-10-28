import { useMemo, useState } from 'react'
import { Plus, Receipt, TrendingDown, Wallet, Scale, Target } from 'lucide-react'
import { useStore } from '../lib/store'
import { go } from '../lib/router'
import { today, money, pct, num, fmtDate } from '../lib/format'
import { kpiChantier, statutCout, libelleStatut } from '../lib/kpi'
import { CATEGORIES_COUTS } from '../lib/content'
import TopBar from '../components/TopBar'
import { Stat, CompareBar, Empty } from '../components/ui'
import { DepenseForm } from '../components/forms'
import { CoutsCategories } from './ChantierDetail'

const tone = { ok: 'ok', vigilance: 'warn', critique: 'bad', neutre: 'muted' }

export default function Couts() {
  const data = useStore()
  const { chantiers, depenses, activites, reglages } = data
  const [form, setForm] = useState(null)
  const [chF, setChF] = useState('')
  const [max, setMax] = useState(15)
  const t = today()

  const rows = useMemo(() => chantiers.map((c) => ({ c, k: kpiChantier(c, data, t) })), [chantiers, data, t])
  const tot = rows.reduce((s, { k }) => ({ marche: s.marche + k.montantMarche, budget: s.budget + k.budget, bte: s.bte + k.budgetExecute, reel: s.reel + k.coutReel, cat: s.cat + k.cat, marge: s.marge + k.margePrev }), { marche: 0, budget: 0, bte: 0, reel: 0, cat: 0, marge: 0 })
  const ipc = tot.reel ? tot.bte / tot.reel : null
  const deps = depenses.filter((d) => !chF || d.chantierId === chF).sort((a, b) => b.date.localeCompare(a.date))
  const faibles = activites.filter((a) => a.prixUnitaire && (a.prixUnitaire - a.coutUnitaire) / a.prixUnitaire < 0.1).slice(0, 6)
  const nomCh = (id) => chantiers.find((c) => c.id === id)?.nom || '—'

  return (
    <>
      <TopBar title="Coûts & rentabilité" sub="Budget, coût réel, écarts et marge prévisionnelle" right={<button className="btn primary" onClick={() => setForm({})} disabled={!chantiers.length}><Plus size={17} /><span className="desktop-only">Dépense</span></button>} />
      {!chantiers.length ? <div className="card"><Empty icon={Wallet} title="Aucun chantier" action={<button className="btn primary" onClick={() => go('chantiers')}>Créer un chantier</button>} /></div> : (
        <div className="grid">
          <div className="grid g2 g4">
            <Stat icon={Wallet} label="Coût réel cumulé" value={money(tot.reel, true)} hint={`Budget exécuté ${money(tot.bte, true)}`} />
            <Stat icon={Scale} label="Écart de coût" value={money(tot.bte - tot.reel, true)} hint={tot.bte - tot.reel >= 0 ? 'Économie' : 'Dépassement'} tone={tot.bte - tot.reel >= 0 ? 'ok' : 'bad'} />
            <Stat icon={Target} label="Coût à terminaison" value={money(tot.cat, true)} hint={`Budget total ${money(tot.budget, true)}`} tone={tot.cat > tot.budget * (1 + reglages.seuilCout) ? 'bad' : tot.cat > tot.budget ? 'warn' : 'ok'} />
            <Stat icon={TrendingDown} label="Marge prévisionnelle" value={pct(tot.marche ? tot.marge / tot.marche : null, 1)} hint={money(tot.marge, true)} tone={tot.marge / tot.marche > 0.1 ? 'ok' : tot.marge > 0 ? 'warn' : 'bad'} />
          </div>

          <div className="card">
            <div className="card-h"><h3>Rentabilité par chantier</h3><span className="badge muted">IPC global {ipc ? num(ipc) : '—'}</span></div>
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>Chantier</th><th className="n">Marché</th><th className="n">Budget exécuté</th><th className="n">Coût réel</th><th className="n">Écart</th><th className="n">IPC</th><th className="n">Coût à term.</th><th className="n">Marge init. → prév.</th><th>Statut</th></tr></thead>
                <tbody>
                  {rows.map(({ c, k }) => {
                    const s = statutCout(k, reglages.seuilCout)
                    return (
                      <tr key={c.id} className="clickable" onClick={() => go('chantier/' + c.id)}>
                        <td><div className="flex" style={{ gap: 8 }}><i className="dot" style={{ background: c.couleur }} /><b>{c.nom}</b></div></td>
                        <td className="n">{money(k.montantMarche, true)}</td>
                        <td className="n">{money(k.budgetExecute, true)}</td>
                        <td className="n">{money(k.coutReel, true)}</td>
                        <td className={'n ' + (k.ecartCout < 0 ? 'bad-t' : 'ok-t')}>{money(k.ecartCout, true)}</td>
                        <td className="n">{k.ipc ? num(k.ipc) : '—'}</td>
                        <td className="n">{money(k.cat, true)}</td>
                        <td className="n">{pct(k.tauxMargeInit, 1)} → <b className={k.tauxMargePrev < k.tauxMargeInit ? 'bad-t' : 'ok-t'}>{pct(k.tauxMargePrev, 1)}</b></td>
                        <td><span className={'badge ' + tone[s]}>{libelleStatut[s]}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="tiny muted mt8">IPC = budget des travaux exécutés ÷ coût réel. En dessous de 1, chaque franc produit coûte plus que prévu.</div>
          </div>

          <div className="grid md-g2">
            <div className="card">
              <div className="card-h"><h3>Budget exécuté vs coût réel</h3></div>
              <div className="col" style={{ gap: 16 }}>
                {rows.filter(({ k }) => k.coutReel || k.budgetExecute).map(({ c, k }) => (
                  <div key={c.id}><div className="small b mb8">{c.nom}</div><CompareBar a={k.budgetExecute} b={k.coutReel} labelA="Budget" labelB="Réel" colorB={k.coutReel > k.budgetExecute ? 'var(--bad)' : 'var(--ok)'} /></div>
                ))}
                {!rows.some(({ k }) => k.coutReel) && <div className="empty small">Saisissez des dépenses pour comparer.</div>}
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Répartition par nature</h3></div>
              <CoutsCategories depenses={depenses.filter((d) => !chF || d.chantierId === chF)} />
              {faibles.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 18 }}>Activités à marge faible (&lt; 10 %)</div>
                  {faibles.map((a) => <div key={a.id} className="flex small" style={{ padding: '4px 0' }}><span style={{ flex: 1 }}>{a.designation} <span className="muted tiny">· {nomCh(a.chantierId)}</span></span><span className="badge bad">{pct((a.prixUnitaire - a.coutUnitaire) / a.prixUnitaire, 1)}</span></div>)}
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Dépenses</h3>
              <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={chF} onChange={(e) => setChF(e.target.value)}><option value="">Tous les chantiers</option>{chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
            </div>
            {deps.length === 0 ? <Empty icon={Receipt} title="Aucune dépense" text="Enregistrez les coûts réels : matériaux, main-d'œuvre, carburant, engins, sous-traitance." /> : (
              <div className="list">
                {deps.slice(0, max).map((d) => {
                  const cat = CATEGORIES_COUTS.find((x) => x.id === d.categorie)
                  return (
                    <div key={d.id} className="row clickable" onClick={() => setForm(d)}>
                      <i className="dot" style={{ background: cat?.couleur }} />
                      <div className="grow"><div className="t" style={{ whiteSpace: 'nowrap' }}>{d.libelle || cat?.label}</div><div className="s">{fmtDate(d.date)} · {nomCh(d.chantierId)} · {cat?.label}</div></div>
                      <b className="tnum">{money(d.montant, true)}</b>
                    </div>
                  )
                })}
                {deps.length > max && <button className="btn sm mt12" style={{ alignSelf: 'center' }} onClick={() => setMax(max + 30)}>Afficher plus ({deps.length - max})</button>}
              </div>
            )}
          </div>
        </div>
      )}
      {form && <DepenseForm initial={form.id ? form : undefined} chantierId={chF || undefined} onClose={() => setForm(null)} />}
    </>
  )
}
