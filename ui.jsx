import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { X, Check } from 'lucide-react'
import { num, money, shortDay } from '../lib/format'

export function Sheet({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'sheet' + (wide ? ' wide' : '')} role="dialog" aria-label={title}>
        <div className="grabber" />
        <div className="sheet-h">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>
        <div className="sheet-b">{children}</div>
        {footer && <div className="sheet-f">{footer}</div>}
      </div>
    </div>
  )
}

export const Field = ({ label, children, hint }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint && <small className="muted tiny">{hint}</small>}
  </label>
)

export function NumInput({ value, onChange, ...p }) {
  const [txt, setTxt] = useState(value === 0 || value ? String(value).replace('.', ',') : '')
  useEffect(() => {
    const cur = parseFloat(txt.replace(/\s/g, '').replace(',', '.')) || 0
    if (cur !== (value || 0)) setTxt(value ? String(value).replace('.', ',') : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      className="input num"
      inputMode="decimal"
      value={txt}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d.,\s-]/g, '')
        setTxt(v)
        onChange(parseFloat(v.replace(/\s/g, '').replace(',', '.')) || 0)
      }}
      onFocus={(e) => e.target.select()}
      {...p}
    />
  )
}

export const Stat = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="card stat">
    <div className="label">
      {Icon && <span className="ico" style={tone ? { background: `var(--${tone}-soft)`, color: `var(--${tone})` } : null}><Icon size={16} /></span>}
      {label}
    </div>
    <div className={'value' + (tone ? ` ${tone}-t` : '')}>{value}</div>
    {hint && <div className="hint">{hint}</div>}
  </div>
)

export function Progress({ value, tone }) {
  const v = Math.max(0, Math.min(1, value || 0))
  return <div className={'progress ' + (tone || '')}><i style={{ width: v * 100 + '%' }} /></div>
}

export function Ring({ value, size = 92, stroke = 9, color = 'var(--brand)', label, sub, track = 'var(--line)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value || 0))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: size > 80 ? 20 : 14, lineHeight: 1 }}>{label}</div>
          {sub && <div className="tiny muted" style={{ marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

export const Empty = ({ icon: Icon, title, text, action }) => (
  <div className="empty">
    {Icon && <div className="ico"><Icon size={26} /></div>}
    <b>{title}</b>
    {text && <div className="small">{text}</div>}
    {action && <div className="mt16">{action}</div>}
  </div>
)

/** Barres groupées prévu / réalisé */
export function BarsPrevuRealise({ data, height = 170 }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.prevu, d.realise]))
  const has = data.some((d) => d.prevu || d.realise)
  if (!has) return <div className="empty small">Aucune production saisie sur la période.</div>
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '0 2px' }}>
        {data.map((d) => {
          const taux = d.prevu ? d.realise / d.prevu : null
          const col = taux == null ? 'var(--brand)' : taux >= 0.95 ? 'var(--ok)' : taux >= 0.8 ? 'var(--warn)' : 'var(--bad)'
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }} title={`${d.date} — prévu ${money(d.prevu, true)} / réalisé ${money(d.realise, true)}`}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%', width: '100%', justifyContent: 'center' }}>
                <div style={{ width: '38%', maxWidth: 16, height: (d.prevu / max) * 100 + '%', background: 'var(--brand-soft)', border: '1px solid color-mix(in srgb, var(--brand) 30%, transparent)', borderRadius: '5px 5px 2px 2px', minHeight: d.prevu ? 3 : 0 }} />
                <div style={{ width: '38%', maxWidth: 16, height: (d.realise / max) * 100 + '%', background: col, borderRadius: '5px 5px 2px 2px', minHeight: d.realise ? 3 : 0, transition: 'height .5s' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '6px 2px 0' }}>
        {data.map((d) => <div key={d.date} className="tiny muted" style={{ flex: 1, textAlign: 'center' }}>{shortDay(d.date)}</div>)}
      </div>
      <div className="flex tiny muted mt8" style={{ justifyContent: 'center', gap: 16 }}>
        <span className="flex" style={{ gap: 6 }}><i className="dot" style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand)' }} />Prévu</span>
        <span className="flex" style={{ gap: 6 }}><i className="dot" style={{ background: 'var(--ok)' }} />Réalisé (couleur = taux)</span>
      </div>
    </div>
  )
}

export function Donut({ parts, size = 150, stroke = 22, center }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {total > 0 && parts.map((p) => {
          const len = (p.value / total) * c
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-acc} />
          acc += len
          return el
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{center}</div>
    </div>
  )
}

/** Barre horizontale comparative (ex. budget vs réel) */
export function CompareBar({ a, b, labelA, labelB, colorB }) {
  const max = Math.max(a, b, 1)
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="flex tiny"><span style={{ width: 70 }} className="muted">{labelA}</span><div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--brand-soft)' }}><div style={{ width: (a / max) * 100 + '%', height: '100%', borderRadius: 5, background: 'var(--brand)' }} /></div><span className="tnum b" style={{ width: 74, textAlign: 'right' }}>{money(a, true)}</span></div>
      <div className="flex tiny"><span style={{ width: 70 }} className="muted">{labelB}</span><div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--surface-2)' }}><div style={{ width: (b / max) * 100 + '%', height: '100%', borderRadius: 5, background: colorB || 'var(--gold)' }} /></div><span className="tnum b" style={{ width: 74, textAlign: 'right' }}>{money(b, true)}</span></div>
    </div>
  )
}

/* Toasts */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const show = useCallback((m) => {
    setMsg(m)
    clearTimeout(window.__toastT)
    window.__toastT = setTimeout(() => setMsg(null), 2400)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast"><Check size={16} />{msg}</div>}
    </ToastCtx.Provider>
  )
}

export const Q = ({ v, u }) => <span className="tnum">{num(v)} <span className="muted small">{u}</span></span>
