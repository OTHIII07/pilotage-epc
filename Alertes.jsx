import { useState } from 'react'
import { Plus, BellRing, Gavel, Share2, CheckCircle2, PlayCircle, User, CalendarClock } from 'lucide-react'
import { useStore } from '../lib/store'
import { today, fmtDate } from '../lib/format'
import TopBar from '../components/TopBar'
import { Empty, useToast } from '../components/ui'
import { AlerteForm } from '../components/forms'

const ORDRE = ['Critique', 'Haute', 'Moyenne', 'Basse']
const urgTone = { Critique: 'bad', Haute: 'warn', Moyenne: 'info', Basse: 'muted' }

export function partagerAlerte(a, nomCh) {
  const txt = `⚠️ ALERTE ${a.urgence.toUpperCase()} — ${nomCh}\n${a.titre}\n` +
    (a.impact ? `Impact : ${a.impact}\n` : '') +
    (a.cause ? `Cause (${a.causeStatut}) : ${a.cause}\n` : '') +
    (a.action ? `Action proposée : ${a.action}\n` : '') +
    (a.responsable ? `Responsable : ${a.responsable}` : '') + (a.echeance ? ` · Échéance : ${fmtDate(a.echeance)}\n` : '\n') +
    (a.decisionDex && a.decision ? `Décision attendue du DEX : ${a.decision}\n` : '') +
    `— Département EPC, AMETHYSTE & CO`
  if (navigator.share) return navigator.share({ text: txt }).then(() => null).catch(() => null)
  return navigator.clipboard?.writeText(txt).then(() => 'copié')
}

export function AlerteCard({ a, onEdit }) {
  const { chantiers, update } = useStore()
  const toast = useToast()
  const t = today()
  const nomCh = chantiers.find((c) => c.id === a.chantierId)?.nom || 'Transversal'
  const retard = a.statut !== 'Résolue' && a.echeance && a.echeance < t
  return (
    <div className={'card alert-card ' + a.urgence} style={a.statut === 'Résolue' ? { opacity: 0.65 } : null}>
      <div className="flex between" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={onEdit}>
          <div className="flex wrap" style={{ gap: 6, marginBottom: 6 }}>
            <span className={'badge ' + urgTone[a.urgence]}>{a.urgence}</span>
            <span className="badge muted">{a.type}</span>
            <span className={'badge ' + (a.statut === 'Résolue' ? 'ok' : a.statut === 'En cours' ? 'info' : 'muted')}>{a.statut}</span>
            {retard && <span className="badge bad">Échéance dépassée</span>}
            {a.decisionDex && <span className="badge warn"><Gavel size={11} />Décision DEX</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{a.titre}</div>
          <div className="small muted">{nomCh} · constaté le {fmtDate(a.date, { year: false })}</div>
        </div>
      </div>
      <div className="small mt8 col" style={{ gap: 4 }} onClick={onEdit}>
        {a.impact && <div><b>Impact :</b> {a.impact}</div>}
        {a.cause && <div><b>Cause</b> <span className={'badge ' + (a.causeStatut === 'confirmée' ? 'info' : 'muted')} style={{ fontSize: 10.5 }}>{a.causeStatut}</span> : {a.cause}</div>}
        {a.action && <div><b>Action :</b> {a.action}</div>}
        {a.decisionDex && a.decision && <div className="warn-t"><b>Décision attendue :</b> {a.decision}</div>}
      </div>
      <div className="flex wrap mt12 between" style={{ gap: 8 }}>
        <div className="flex small muted" style={{ gap: 12 }}>
          {a.responsable && <span className="flex" style={{ gap: 4 }}><User size={13} />{a.responsable}</span>}
          {a.echeance && <span className={'flex ' + (retard ? 'bad-t' : '')} style={{ gap: 4 }}><CalendarClock size={13} />{fmtDate(a.echeance, { year: false })}</span>}
        </div>
        <div className="flex" style={{ gap: 6 }}>
          {a.statut === 'Ouverte' && <button className="btn sm" onClick={() => { update('alertes', a.id, { statut: 'En cours' }); toast('Action en cours') }}><PlayCircle size={14} />En cours</button>}
          {a.statut !== 'Résolue' && <button className="btn sm" onClick={() => { update('alertes', a.id, { statut: 'Résolue', resoluLe: t }); toast('Alerte résolue') }}><CheckCircle2 size={14} />Résolue</button>}
          <button className="btn sm ghost" onClick={async () => { const r = await partagerAlerte(a, nomCh); if (r) toast('Message copié — collez-le dans WhatsApp ou un e-mail') }} aria-label="Partager"><Share2 size={15} /></button>
        </div>
      </div>
    </div>
  )
}

export default function Alertes() {
  const { alertes, chantiers } = useStore()
  const [form, setForm] = useState(null)
  const [f, setF] = useState(window.location.hash.includes('dex') ? 'DEX' : 'Ouvertes')
  const [chF, setChF] = useState('')
  const liste = alertes
    .filter((a) => (f === 'Ouvertes' ? a.statut !== 'Résolue' : f === 'Résolues' ? a.statut === 'Résolue' : f === 'DEX' ? a.decisionDex && a.statut !== 'Résolue' : f === 'Retard' ? a.statut !== 'Résolue' && a.echeance && a.echeance < today() : true))
    .filter((a) => !chF || a.chantierId === chF)
    .sort((a, b) => ORDRE.indexOf(a.urgence) - ORDRE.indexOf(b.urgence) || (a.echeance || '9').localeCompare(b.echeance || '9'))
  const n = (fn) => alertes.filter(fn).length

  return (
    <>
      <TopBar title="Alertes & actions" sub="Registre des problèmes, actions correctives et arbitrages" right={<button className="btn primary" onClick={() => setForm({})}><Plus size={17} /><span className="desktop-only">Nouvelle alerte</span></button>} />
      <div className="chips mb12">
        {[['Ouvertes', n((a) => a.statut !== 'Résolue')], ['DEX', n((a) => a.decisionDex && a.statut !== 'Résolue')], ['Retard', n((a) => a.statut !== 'Résolue' && a.echeance && a.echeance < today())], ['Résolues', n((a) => a.statut === 'Résolue')], ['Toutes', alertes.length]].map(([k, c]) => (
          <button key={k} className={'chip' + (f === k ? ' on' : '')} onClick={() => setF(k)}>{k === 'DEX' ? 'Décisions DEX' : k === 'Retard' ? 'En retard' : k} · {c}</button>
        ))}
      </div>
      {chantiers.length > 1 && <select className="input mb12" style={{ maxWidth: 320 }} value={chF} onChange={(e) => setChF(e.target.value)}><option value="">Tous les chantiers</option>{chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>}
      {liste.length === 0 ? <div className="card"><Empty icon={BellRing} title="Rien à signaler ici" text="Alertez tôt : une rupture annoncée, une panne, un retard de livraison ou un blocage en attente de validation." action={<button className="btn primary" onClick={() => setForm({})}><Plus size={16} />Nouvelle alerte</button>} /></div> : (
        <div className="grid md-g2">{liste.map((a) => <AlerteCard key={a.id} a={a} onEdit={() => setForm(a)} />)}</div>
      )}
      {form && <AlerteForm initial={form.id ? form : undefined} onClose={() => setForm(null)} />}
    </>
  )
}
