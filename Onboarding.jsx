import { useState } from 'react'
import { CalendarClock, Calculator, ArrowRight, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { POSTES } from '../lib/content'

export default function Onboarding() {
  const { setProfil, chargerDemo, equipe } = useStore()
  const [nom, setNom] = useState('')
  const [poste, setPoste] = useState('planif')
  const [demo, setDemo] = useState(true)

  const start = () => {
    setProfil({ nom, poste })
    if (demo) chargerDemo()
    window.location.hash = '/accueil'
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20, background: 'linear-gradient(160deg, #2c1655 0%, #4a249a 50%, #7c4ddb 100%)' }}>
      <div className="card" style={{ maxWidth: 460, width: '100%', padding: 26, borderRadius: 26 }}>
        <div className="flex" style={{ gap: 14, marginBottom: 18 }}>
          <img src="./icon-192.png" alt="" style={{ width: 56, height: 56, borderRadius: 16 }} />
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 800 }}>Pilotage EPC</h2>
            <div className="small muted">Étude, Planification & Contrôle des coûts<br />Direction d'Exploitation · AMETHYSTE & CO</div>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>Bienvenue ! Indiquez qui utilise cet appareil pour personnaliser votre routine et vos tableaux de bord.</p>

        {equipe.length > 0 && (
          <div className="mb12">
            <div className="small b mb8">Profils déjà connus</div>
            <div className="chips">{equipe.map((p) => <button key={p.id} className="chip" onClick={() => setProfil(p)}>{p.nom}</button>)}</div>
          </div>
        )}

        <label className="field mb12">
          <span>Votre prénom et nom</span>
          <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Othniel" autoFocus />
        </label>
        <div className="field">
          <span>Votre poste</span>
          <div className="grid g2">
            {[['planif', CalendarClock], ['couts', Calculator]].map(([id, Icon]) => (
              <button key={id} onClick={() => setPoste(id)} className="card flat" style={{ textAlign: 'left', padding: 14, borderWidth: 2, borderColor: poste === id ? 'var(--brand)' : 'var(--line)', background: poste === id ? 'var(--brand-soft)' : 'var(--surface)' }}>
                <Icon size={22} color="var(--brand)" />
                <div className="b mt8" style={{ fontSize: 14 }}>{POSTES[id].label}</div>
                <div className="tiny muted">{POSTES[id].question}</div>
              </button>
            ))}
          </div>
        </div>
        <label className="check mt12" style={{ padding: '10px 0' }}>
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--brand)' }} />
          <span className="small"><Sparkles size={14} style={{ verticalAlign: -2 }} /> Charger 2 chantiers <b>d'exemple</b> pour découvrir l'application (supprimables à tout moment)</span>
        </label>
        <button className="btn primary block mt12" style={{ padding: 14 }} disabled={!nom.trim()} onClick={start}>
          Commencer <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
