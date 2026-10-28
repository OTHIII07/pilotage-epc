import { useRef, useState } from 'react'
import { Download, Upload, Users, SlidersHorizontal, Palette, Database, Info, UserCog, Share2, Smartphone, Trash2, Sparkles } from 'lucide-react'
import { useStore, APP_VERSION } from '../lib/store'
import { POSTES } from '../lib/content'
import { today } from '../lib/format'
import TopBar from '../components/TopBar'
import { Field, useToast } from '../components/ui'
import { useInstall } from '../components/InstallBanner'

export default function Reglages() {
  const s = useStore()
  const toast = useToast()
  const fileRef = useRef()
  const [nom, setNom] = useState(s.profil.nom)
  const [poste, setPoste] = useState(s.profil.poste)
  const [mode, setMode] = useState('fusion')
  const { can, install, standalone, ios } = useInstall()
  const nbDemo = s.chantiers.filter((c) => c.demo).length

  const fichier = () => {
    const blob = new Blob([JSON.stringify(s.exporter())], { type: 'application/json' })
    const name = `pilotage-epc_${s.profil.nom.replace(/\s+/g, '-')}_${today()}.json`
    return new File([blob], name, { type: 'application/json' })
  }
  const telecharger = () => {
    const f = fichier()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(f)
    a.download = f.name
    a.click()
    toast('Sauvegarde téléchargée')
  }
  const partager = async () => {
    const f = fichier()
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], title: 'Données Pilotage EPC', text: 'Mes données Pilotage EPC à importer dans ton application.' }) } catch {}
    } else telecharger()
  }
  const importer = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (mode === 'remplacer' && !confirm('Remplacer toutes vos données par celles du fichier ?')) return
        s.importer(data, mode)
        toast(mode === 'fusion' ? `Données de ${data.par || 'votre binôme'} fusionnées` : 'Données remplacées')
      } catch (err) {
        alert('Import impossible : ' + err.message)
      }
      e.target.value = ''
    }
    reader.readAsText(f)
  }

  return (
    <>
      <TopBar title="Réglages & partage" sub={`Version ${APP_VERSION}`} />
      <div className="grid md-g2" style={{ alignItems: 'start' }}>
        <div className="grid">
          <div className="card">
            <div className="card-h"><UserCog size={18} color="var(--brand)" /><h3>Mon profil</h3></div>
            <div className="grid">
              <Field label="Nom"><input className="input" value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
              <Field label="Poste"><div className="seg">{Object.entries(POSTES).map(([k, v]) => <button key={k} className={poste === k ? 'on' : ''} onClick={() => setPoste(k)}>{v.court}</button>)}</div></Field>
              <button className="btn primary" disabled={!nom.trim()} onClick={() => { s.setProfil({ id: s.profil.id, nom, poste }); toast('Profil mis à jour') }}>Enregistrer</button>
            </div>
            {s.equipe.length > 1 && (
              <>
                <div className="section-title">Changer d'utilisateur sur cet appareil</div>
                <div className="chips">{s.equipe.map((p) => <button key={p.id} className={'chip' + (p.id === s.profil.id ? ' on' : '')} onClick={() => { s.setProfil(p); setNom(p.nom); setPoste(p.poste); toast(`Bonjour ${p.nom}`) }}>{p.nom} · {POSTES[p.poste]?.court}</button>)}</div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-h"><Users size={18} color="var(--brand)" /><h3>Partager avec mon binôme</h3></div>
            <p className="small muted" style={{ marginTop: 0 }}>Vos données restent sur votre appareil. Pour travailler sur la même base, envoyez-vous régulièrement vos données (WhatsApp, e-mail…) puis importez celles de votre collègue : l'application <b>fusionne</b> les deux, la saisie la plus récente l'emporte.</p>
            <div className="grid g2">
              <button className="btn" onClick={partager}><Share2 size={16} />Envoyer mes données</button>
              <button className="btn" onClick={telecharger}><Download size={16} />Sauvegarder</button>
            </div>
            <div className="section-title">Importer un fichier</div>
            <div className="seg mb12"><button className={mode === 'fusion' ? 'on' : ''} onClick={() => setMode('fusion')}>Fusionner</button><button className={mode === 'remplacer' ? 'on' : ''} onClick={() => setMode('remplacer')}>Remplacer tout</button></div>
            <button className="btn primary block" onClick={() => fileRef.current.click()}><Upload size={16} />Choisir un fichier .json</button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importer} />
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-h"><SlidersHorizontal size={18} color="var(--brand)" /><h3>Seuils d'alerte</h3></div>
            <div className="grid g2">
              <Field label="Écart de production significatif" hint="Taux réalisé/prévu en dessous duquel une cause est demandée"><select className="input" value={s.reglages.seuilProduction} onChange={(e) => s.setReglages({ seuilProduction: +e.target.value })}>{[0.7, 0.75, 0.8, 0.85, 0.9, 0.95].map((v) => <option key={v} value={v}>{Math.round(v * 100)} %</option>)}</select></Field>
              <Field label="Tolérance de dépassement de coût" hint="Au-delà, le chantier passe en « critique »"><select className="input" value={s.reglages.seuilCout} onChange={(e) => s.setReglages({ seuilCout: +e.target.value })}>{[0.02, 0.03, 0.05, 0.08, 0.1].map((v) => <option key={v} value={v}>{Math.round(v * 100)} %</option>)}</select></Field>
            </div>
            <div className="tiny muted mt8">À ajuster selon la réponse du Directeur à la question « Quel niveau d'écart doit déclencher une alerte ? ».</div>
          </div>

          <div className="card">
            <div className="card-h"><Palette size={18} color="var(--brand)" /><h3>Apparence</h3></div>
            <div className="seg">{[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => <button key={k} className={s.theme === k ? 'on' : ''} onClick={() => s.setTheme(k)}>{l}</button>)}</div>
          </div>

          <div className="card">
            <div className="card-h"><Smartphone size={18} color="var(--brand)" /><h3>Installation</h3></div>
            {standalone ? <div className="badge ok">Application installée sur cet appareil</div> : can ? <button className="btn primary" onClick={install}>Installer l'application</button> : (
              <div className="small muted">{ios ? "Sur iPhone : ouvrez le site dans Safari, touchez Partager puis « Sur l'écran d'accueil »." : "Sur Android (Chrome) : menu ⋮ puis « Installer l'application ». Sur ordinateur (Chrome/Edge) : icône d'installation dans la barre d'adresse."}</div>
            )}
          </div>

          <div className="card">
            <div className="card-h"><Database size={18} color="var(--brand)" /><h3>Données</h3></div>
            <div className="small muted mb12">{s.chantiers.length} chantier(s) · {s.activites.length} activité(s) · {s.production.length} saisie(s) de production · {s.depenses.length} dépense(s) · {s.alertes.length} alerte(s)</div>
            <div className="flex wrap">
              {nbDemo > 0 ? <button className="btn" onClick={() => { s.chantiers.filter((c) => c.demo).forEach((c) => s.remove('chantiers', c.id)); toast('Données d’exemple supprimées') }}><Trash2 size={15} />Supprimer les exemples ({nbDemo})</button>
                : <button className="btn" onClick={() => { s.chargerDemo(); toast('Exemples chargés') }}><Sparkles size={15} />Charger des exemples</button>}
              <button className="btn danger" onClick={() => { if (confirm('Effacer toutes les données de cet appareil ? Pensez à sauvegarder avant.')) { s.reinitialiser(); toast('Données effacées') } }}><Trash2 size={15} />Tout effacer</button>
            </div>
          </div>

          <div className="card">
            <div className="card-h"><Info size={18} color="var(--brand)" /><h3>À propos</h3></div>
            <div className="small muted">Pilotage EPC v{APP_VERSION} — application du département Étude, Planification et Contrôle des coûts, Direction d'Exploitation d'AMETHYSTE & CO. Fonctionne hors connexion ; les données sont stockées localement sur chaque appareil.</div>
          </div>
        </div>
      </div>
    </>
  )
}
