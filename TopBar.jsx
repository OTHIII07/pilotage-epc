import { ChevronLeft } from 'lucide-react'
import { go } from '../lib/router'

export default function TopBar({ title, sub, right, back }) {
  return (
    <header className="topbar">
      {back && (
        <button className="iconbtn" onClick={() => (history.length > 1 ? history.back() : go(back))} aria-label="Retour">
          <ChevronLeft size={20} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right}
    </header>
  )
}
