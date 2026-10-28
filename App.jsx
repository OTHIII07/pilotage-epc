import { useEffect, useState } from 'react'
import { LayoutDashboard, ListChecks, HardHat, BarChart3, Wallet, BellRing, FileText, BookOpen, Settings, Plus, Menu, ClipboardPlus, Receipt, TriangleAlert, Building2 } from 'lucide-react'
import { useStore } from './lib/store'
import { useRoute, go } from './lib/router'
import { POSTES } from './lib/content'
import { Sheet } from './components/ui'
import { DepenseForm, AlerteForm, ChantierForm } from './components/forms'
import Onboarding from './pages/Onboarding'
import Accueil from './pages/Accueil'
import Journee from './pages/Journee'
import Chantiers from './pages/Chantiers'
import ChantierDetail from './pages/ChantierDetail'
import Production from './pages/Production'
import Couts from './pages/Couts'
import Alertes from './pages/Alertes'
import Rapport from './pages/Rapport'
import Guide from './pages/Guide'
import Reglages from './pages/Reglages'

export const NAV = [
  { id: 'accueil', label: 'Tableau de bord', court: 'Accueil', icon: LayoutDashboard, groupe: 'Pilotage' },
  { id: 'journee', label: 'Ma journée', court: 'Ma journée', icon: ListChecks, groupe: 'Pilotage' },
  { id: 'alertes', label: 'Alertes & actions', court: 'Alertes', icon: BellRing, groupe: 'Pilotage' },
  { id: 'chantiers', label: 'Chantiers', icon: HardHat, groupe: 'Suivi' },
  { id: 'production', label: 'Production & planning', icon: BarChart3, groupe: 'Suivi' },
  { id: 'couts', label: 'Coûts & rentabilité', icon: Wallet, groupe: 'Suivi' },
  { id: 'rapport', label: 'Rapport hebdo DEX', icon: FileText, groupe: 'Restitution' },
  { id: 'guide', label: 'Guide du département', icon: BookOpen, groupe: 'Restitution' },
  { id: 'reglages', label: 'Réglages & partage', icon: Settings, groupe: 'Restitution' }
]

export default function App() {
  const path = useRoute()
  const profil = useStore((s) => s.profil)
  const theme = useStore((s) => s.theme)
  const alertes = useStore((s) => s.alertes)
  const [quick, setQuick] = useState(false)
  const [more, setMore] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  if (!profil) return <Onboarding />

  const [page, param] = path.split('/')
  const ouvertes = alertes.filter((a) => a.statut !== 'Résolue' && (a.urgence === 'Critique' || a.urgence === 'Haute')).length
  const actif = page === 'chantier' ? 'chantiers' : page

  let content
  switch (page) {
    case 'journee': content = <Journee />; break
    case 'chantiers': content = <Chantiers />; break
    case 'chantier': content = <ChantierDetail id={param} />; break
    case 'production': content = <Production />; break
    case 'couts': content = <Couts />; break
    case 'alertes': content = <Alertes />; break
    case 'rapport': content = <Rapport />; break
    case 'guide': content = <Guide />; break
    case 'reglages': content = <Reglages />; break
    default: content = <Accueil onQuick={() => setQuick(true)} />
  }

  const groupes = [...new Set(NAV.map((n) => n.groupe))]
  const initiales = profil.nom.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="./icon-192.png" alt="" />
          <div><b>Pilotage EPC</b><span>AMETHYSTE & CO · DEX</span></div>
        </div>
        <button className="btn primary block" style={{ marginBottom: 6, background: 'rgba(255,255,255,.14)' }} onClick={() => setQuick(true)}><Plus size={17} />Saisie rapide</button>
        {groupes.map((g) => (
          <div key={g}>
            <div className="navgroup">{g}</div>
            {NAV.filter((n) => n.groupe === g).map((n) => (
              <button key={n.id} className={'navitem' + (actif === n.id ? ' on' : '')} onClick={() => go(n.id)}>
                <n.icon size={18} />{n.label}
                {n.id === 'alertes' && ouvertes > 0 && <span className="count">{ouvertes}</span>}
              </button>
            ))}
          </div>
        ))}
        <button className="me" onClick={() => go('reglages')}>
          <span className="avatar">{initiales}</span>
          <span style={{ minWidth: 0 }}><b style={{ color: '#fff', fontSize: 13.5, display: 'block' }}>{profil.nom}</b><span style={{ fontSize: 11.5, color: '#b7a6e3' }}>{POSTES[profil.poste].label}</span></span>
        </button>
      </aside>

      <main className="main">
        <div className="page-enter" key={path}>{content}</div>
      </main>

      <nav className="bottomnav">
        {[NAV[0], NAV[1]].map((n) => (
          <button key={n.id} className={actif === n.id ? 'on' : ''} onClick={() => go(n.id)}><n.icon size={22} />{n.court}</button>
        ))}
        <button onClick={() => setQuick(true)} aria-label="Saisie rapide"><span className="fab"><Plus size={26} /></span></button>
        <button className={actif === 'alertes' ? 'on' : ''} onClick={() => go('alertes')}>
          <BellRing size={22} />Alertes{ouvertes > 0 && <span className="badge-dot">{ouvertes}</span>}
        </button>
        <button className={!['accueil', 'journee', 'alertes'].includes(actif) ? 'on' : ''} onClick={() => setMore(true)}><Menu size={22} />Plus</button>
      </nav>

      {quick && (
        <Sheet title="Saisie rapide" onClose={() => setQuick(false)}>
          <div className="grid g2">
            {[
              { icon: ClipboardPlus, t: 'Production du jour', s: 'Prévu / réalisé', fn: () => go('production') },
              { icon: Receipt, t: 'Dépense', s: 'Coût réel', fn: () => setForm('depense') },
              { icon: TriangleAlert, t: 'Alerte / action', s: 'Blocage, risque', fn: () => setForm('alerte') },
              { icon: Building2, t: 'Chantier', s: 'Nouveau projet', fn: () => setForm('chantier') }
            ].map((a) => (
              <button key={a.t} className="card clickable" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }} onClick={() => { setQuick(false); a.fn() }}>
                <span className="ico" style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--brand-soft)', color: 'var(--brand)' }}><a.icon size={20} /></span>
                <span><b style={{ display: 'block' }}>{a.t}</b><span className="small muted">{a.s}</span></span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {more && (
        <Sheet title="Menu" onClose={() => setMore(false)}>
          <div className="list">
            {NAV.slice(3).map((n) => (
              <button key={n.id} className="row clickable" style={{ border: 0, background: 'none', textAlign: 'left', width: '100%' }} onClick={() => { setMore(false); go(n.id) }}>
                <span className="ico" style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--brand-soft)', color: 'var(--brand)' }}><n.icon size={19} /></span>
                <span className="grow t">{n.label}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {form === 'depense' && <DepenseForm onClose={() => setForm(null)} />}
      {form === 'alerte' && <AlerteForm onClose={() => setForm(null)} />}
      {form === 'chantier' && <ChantierForm onClose={() => setForm(null)} />}
    </div>
  )
}
