import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

let deferred = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    window.dispatchEvent(new Event('pwa-installable'))
  })
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function useInstall() {
  const [can, setCan] = useState(!!deferred)
  useEffect(() => {
    const f = () => setCan(true)
    window.addEventListener('pwa-installable', f)
    return () => window.removeEventListener('pwa-installable', f)
  }, [])
  const install = async () => {
    if (!deferred) return false
    deferred.prompt()
    const r = await deferred.userChoice
    deferred = null
    setCan(false)
    return r.outcome === 'accepted'
  }
  return { can, install, standalone: isStandalone(), ios: isIOS() }
}

export default function InstallBanner() {
  const { can, install, standalone, ios } = useInstall()
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('epc-install-hide') === '1' } catch { return false }
  })
  if (standalone || hidden || (!can && !ios)) return null
  const hide = () => {
    setHidden(true)
    try { localStorage.setItem('epc-install-hide', '1') } catch {}
  }
  return (
    <div className="card flex" style={{ background: 'var(--brand-soft)', borderColor: 'transparent', gap: 12 }}>
      <span className="ico" style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--brand)', color: '#fff', flex: 'none' }}><Download size={19} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 14 }}>Installer l'application</b>
        <div className="small muted">
          {ios && !can ? <>Sur iPhone : touchez <Share size={13} style={{ verticalAlign: -2 }} /> puis « Sur l'écran d'accueil ».</> : 'Accès en un geste depuis votre écran d’accueil, même hors connexion.'}
        </div>
      </div>
      {can && <button className="btn primary sm" onClick={install}>Installer</button>}
      <button className="iconbtn" style={{ width: 32, height: 32, background: 'transparent', border: 0 }} onClick={hide} aria-label="Masquer"><X size={16} /></button>
    </div>
  )
}
