import { useMemo, useState } from 'react'
import { Plus, HardHat, MapPin, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { go } from '../lib/router'
import { today, pct, money, fmtDate } from '../lib/format'
import { kpiChantier, statutDelai, statutCout, libelleStatut } from '../lib/kpi'
import TopBar from '../components/TopBar'
import { Progress, Empty } from '../components/ui'
import { ChantierForm } from '../components/forms'

const tone = { ok: 'ok', vigilance: 'warn', critique: 'bad', neutre: 'muted' }

export default function Chantiers() {
  const data = useStore()
  const { chantiers, alertes, reglages } = data
  const [form, setForm] = useState(false)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState('Actifs')
  const t = today()

  const liste = useMemo(() => chantiers
    .filter((c) => (filtre === 'Tous' ? true : filtre === 'Actifs' ? c.statut !== 'Réceptionné' : c.statut === 'Réceptionné'))
    .filter((c) => (c.nom + ' ' + (c.localisation || '')).toLowerCase().includes(q.toLowerCase()))
    .map((c) => ({ c, k: kpiChantier(c, data, t) })), [chantiers, data, q, filtre, t])

  return (
    <>
      <TopBar title="Chantiers" sub={`${chantiers.length} projet(s) suivis`} right={<button className="btn primary" onClick={() => setForm(true)}><Plus size={17} /><span className="desktop-only">Nouveau chantier</span></button>} />
      <div className="flex wrap mb12">
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Rechercher un chantier…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg">{['Actifs', 'Réceptionnés', 'Tous'].map((f) => <button key={f} className={filtre === f ? 'on' : ''} onClick={() => setFiltre(f)}>{f}</button>)}</div>
      </div>

      {liste.length === 0 ? (
        <div className="card"><Empty icon={HardHat} title={chantiers.length ? 'Aucun résultat' : 'Aucun chantier'} text={chantiers.length ? 'Modifiez la recherche ou le filtre.' : 'Créez votre premier chantier puis ajoutez ses activités (lignes du DQE).'} action={!chantiers.length && <button className="btn primary" onClick={() => setForm(true)}><Plus size={16} />Créer un chantier</button>} /></div>
      ) : (
        <div className="grid md-g2">
          {liste.map(({ c, k }) => {
            const sd = statutDelai(k), sc = statutCout(k, reglages.seuilCout)
            const nbAl = alertes.filter((a) => a.chantierId === c.id && a.statut !== 'Résolue').length
            return (
              <button key={c.id} className="card clickable" style={{ textAlign: 'left', borderTop: `4px solid ${c.couleur}` }} onClick={() => go('chantier/' + c.id)}>
                <div className="flex between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 750, fontSize: 16 }}>{c.nom}</div>
                    <div className="small muted flex" style={{ gap: 4 }}><MapPin size={13} />{c.localisation || '—'} · {c.statut}</div>
                  </div>
                  {nbAl > 0 && <span className="badge bad">{nbAl} alerte{nbAl > 1 && 's'}</span>}
                </div>
                <div className="mt12 flex" style={{ gap: 8 }}><div style={{ flex: 1 }}><Progress value={k.avPhysique} tone={tone[sd]} /></div><b className="small tnum">{pct(k.avPhysique)}</b></div>
                <div className="tiny muted mt8">Temps écoulé {pct(k.avTemps)} · Fin {fmtDate(c.dateFin)}</div>
                <div className="grid g2 mt12" style={{ gap: 8 }}>
                  <div><div className="tiny muted">Marché</div><b className="tnum">{money(k.montantMarche, true)}</b></div>
                  <div><div className="tiny muted">Marge prév.</div><b className={'tnum ' + (k.tauxMargePrev > 0.1 ? 'ok-t' : k.tauxMargePrev > 0 ? 'warn-t' : 'bad-t')}>{pct(k.tauxMargePrev, 1)}</b></div>
                </div>
                <div className="flex wrap mt12" style={{ gap: 6 }}>
                  <span className={'badge ' + tone[sd]}>Délai : {libelleStatut[sd]}</span>
                  <span className={'badge ' + tone[sc]}>Coût : {libelleStatut[sc]}</span>
                  {c.demo && <span className="badge muted">Exemple</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
      {form && <ChantierForm onClose={(r) => { setForm(false) }} />}
    </>
  )
}
