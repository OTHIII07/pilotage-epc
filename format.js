// Utilitaires de formatage et de dates (fuseau Abidjan = UTC)

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const today = () => toISO(new Date())

export function toISO(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Lundi de la semaine contenant la date */
export function mondayOf(iso) {
  const d = new Date(iso + 'T12:00:00')
  const wd = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - wd)
  return toISO(d)
}

export function weekNumber(iso) {
  const d = new Date(iso + 'T12:00:00')
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - yearStart) / 86400000 + 1) / 7)
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000)
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function fmtDate(iso, opts = {}) {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  const base = `${d.getDate()} ${MOIS[d.getMonth()]}${opts.year === false ? '' : ' ' + d.getFullYear()}`
  return opts.weekday ? `${JOURS[d.getDay()]} ${base}` : base
}
export const dayName = (iso) => JOURS[new Date(iso + 'T12:00:00').getDay()]
export const shortDay = (iso) => dayName(iso).slice(0, 3)

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export const num = (v, dec = 2) =>
  v == null || isNaN(v) ? '—' : (dec === 0 ? nf0 : nf2).format(v)

/** Montant en FCFA, abrégé si demandé (M = millions) */
export function money(v, short = false) {
  if (v == null || isNaN(v)) return '—'
  if (short) {
    const a = Math.abs(v)
    if (a >= 1e9) return nf2.format(v / 1e9) + ' Md'
    if (a >= 1e6) return nf2.format(v / 1e6) + ' M'
    if (a >= 1e3) return nf0.format(v / 1e3) + ' k'
  }
  return nf0.format(v) + ' F'
}

export const pct = (v, dec = 0) =>
  v == null || isNaN(v) || !isFinite(v) ? '—' : (v * 100).toFixed(dec).replace('.', ',') + ' %'

export const parseNum = (s) => {
  if (s === '' || s == null) return 0
  const n = parseFloat(String(s).replace(/\s/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
}
