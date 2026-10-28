import { useMemo } from 'react'
import { TrendingUp, Gauge, Wallet, BellRing, ArrowRight, HardHat, Gavel, CalendarClock, Plus, ListChecks } from 'lucide-react'
import { useStore } from '../lib/store'
import { go } from '../lib/router'
import { today, mondayOf, addDays, fmtDate, greeting, pct, money, daysBetween } from '../lib/format'
import { ROUTINE_COUNT, POSTES, PRINCIPES } from '../lib/content'
import { kpiChantier, prodPeriode, serieJours, statutDelai, statutCout, libelleStatut } from '../lib/kpi'
import { Stat, Ring, BarsPrevuRealise, Progress, Empty } from '../components/ui'
import InstallBanner from '../components/InstallBanner'

const tone = { ok: 'ok', vigilance: 'warn', critique: 'bad', neutre: 'muted' }

export default function Accueil({ onQuick }) {
  const data = useStore()
  const { profil, chantiers, alertes, routine, reglages } = data
  const t = today()
  const lundi = mondayOf(t)

  const k = useMemo(() => {
    const actifs = chantiers.filter((c) => c.statut !== 'Réceptionné')
    const parCh = actifs.map((c) => ({ c, k: kpiChantier(c, data, t) }))
    const sem = prodPeriode(data, lundi, t)
    const totMarche = parCh.reduce((s, x) => s + x.k.montantMarche, 0)
    const totExec = parCh.reduce((s, x) => s + x.k.valeurExecutee, 0)
    const totMarcheActs = parCh.reduce((s, x) => s + x.k.valeurMarcheActs, 0)
    const margePrev = parCh.reduce((s, x) => s + x.k.margePrev, 0)
    return { actifs, parCh, sem, av: totMarcheActs ? totExec / totMarcheActs : null, margePrev, tauxMarge: totMarche ? margePrev / totMarche : null, serie: serieJours(data, t, 7) }
  }, [data, t, lundi])

  const ouvertes = alertes.filter((a) => a.statut !== 'Résolue')
  const prio = [...ouvertes].sort((a, b) => ['Critique', 'Haute', 'Moyenne', 'Basse'].indexOf(a.urgence) - ['Critique', 'Haute', 'Moyenne', 'Basse'].indexOf(b.urgence)).slice(0, 4)
  const decisions = ouvertes.filter((a) => a.decisionDex)
  const enRetard = ouvertes.filter((a) => a.echeance && a.echeance < t)
  const done = Object.keys(routine[profil.id]?.[t] || {}).length
  const tauxRoutine = done / ROUTINE_COUNT
  const weekend = [0, 6].includes(new Date().getDay())
  const principe = PRINCIPES[new Date().getDate() % PRINCIPES.length]
  const nomCh = (id) => chantiers.find((c) => c.id === id)?.nom || 'Transversal'

  return (
    <>
      <header className="topbar mobile-only">
        <img src="./icon-192.png" alt="" style={{ width: 34, height: 34, borderRadius: 10 }} />
        <div style={{ flex: 1 }}><h1 style={{ fontSize: 17 }}>Pilotage EPC</h1><div className="sub">AMETHYSTE & CO · Direction d'Exploitation</div></div>
      </header>
      <header className="topbar desktop-only">
        <div style={{ flex: 1 }}><h1>Tableau de bord</h1><div className="sub">{fmtDate(t, { weekday: true })} · Semaine du {fmtDate(lundi, { year: false })}</div></div>
        <button className="btn primary" onClick={onQuick}><Plus size={17} />Saisie rapide</button>
      </header>

      <div className="grid">
        <div className="hero">
          <div className="flex" style={{ gap: 18, position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#cdbdf5', fontWeight: 600 }}>{fmtDate(t, { weekday: true })}</div>
              <h2>{greeting()}, {profil.nom.split(' ')[0]} 👋</h2>
              <p>{POSTES[profil.poste].label} — « {POSTES[profil.poste].question} »</p>
              <button className="btn sm mt12" style={{ background: 'rgba(255,255,255,.16)', color: '#fff', borderColor: 'transparent' }} onClick={() => go('journee')}>
                <ListChecks size={15} />{weekend ? 'Voir ma routine' : done ? 'Continuer ma journée' : 'Démarrer ma journée'}<ArrowRight size={15} />
              </button>
            </div>
            <Ring value={tauxRoutine} size={84} color="#f0c25c" track="rgba(255,255,255,.18)" label={<span style={{ color: '#fff' }}>{Math.round(tauxRoutine * 100)}%</span>} sub={<span style={{ color: '#cdbdf5' }}>{done}/{ROUTINE_COUNT}</span>} />
          </div>
        </div>

        <InstallBanner />

        {chantiers.length === 0 ? (
          <div className="card">
            <Empty icon={HardHat} title="Aucun chantier pour l'instant" text="Commencez par créer vos chantiers et leurs activités (lignes du DQE). Le tableau de bord se remplira automatiquement." action={<button className="btn primary" onClick={() => go('chantiers')}><Plus size={16} />Ajouter un chantier</button>} />
          </div>
        ) : (
          <>
            <div className="grid g2 g4">
              <Stat icon={TrendingUp} label="Réalisé / prévu (semaine)" value={pct(k.sem.taux)} hint={`${money(k.sem.realise, true)} sur ${money(k.sem.prevu, true)}`} tone={k.sem.taux == null ? null : k.sem.taux >= reglages.seuilProduction ? 'ok' : k.sem.taux >= 0.7 ? 'warn' : 'bad'} />
              <Stat icon={Gauge} label="Avancement physique" value={pct(k.av)} hint={`${k.actifs.length} chantier(s) actif(s)`} />
              <Stat icon={Wallet} label="Marge prévisionnelle" value={money(k.margePrev, true)} hint={`${pct(k.tauxMarge, 1)} du marché`} tone={k.tauxMarge == null ? null : k.tauxMarge > 0.1 ? 'ok' : k.tauxMarge > 0 ? 'warn' : 'bad'} />
              <Stat icon={BellRing} label="Alertes ouvertes" value={ouvertes.length} hint={`${ouvertes.filter((a) => a.urgence === 'Critique').length} critique(s) · ${enRetard.length} en retard`} tone={ouvertes.some((a) => a.urgence === 'Critique') ? 'bad' : ouvertes.length ? 'warn' : 'ok'} />
            </div>

            <div className="grid lg-split">
              <div className="card">
                <div className="card-h"><h3>Production des 7 derniers jours</h3><button className="link" onClick={() => go('production')}>Saisir</button></div>
                <div className="small muted mb12">Valorisée au prix du DQE pour comparer des unités différentes.</div>
                <BarsPrevuRealise data={k.serie} />
              </div>
              <div className="card">
                <div className="card-h"><h3>Alertes prioritaires</h3><button className="link" onClick={() => go('alertes')}>Tout voir</button></div>
                {prio.length === 0 ? <div className="empty small">Aucune alerte ouverte. 👌</div> : (
                  <div className="list">
                    {prio.map((a) => (
                      <div key={a.id} className="row clickable" onClick={() => go('alertes')}>
                        <i className="dot" style={{ background: a.urgence === 'Critique' ? 'var(--bad)' : a.urgence === 'Haute' ? 'var(--warn)' : 'var(--info)' }} />
                        <div className="grow"><div className="t" style={{ whiteSpace: 'nowrap' }}>{a.titre}</div><div className="s">{nomCh(a.chantierId)}{a.echeance && ` · échéance ${fmtDate(a.echeance, { year: false })}`}</div></div>
                        {a.echeance && a.echeance < t && <span className="badge bad">Retard</span>}
                      </div>
                    ))}
                  </div>
                )}
                {decisions.length > 0 && (
                  <button className="card flat flex mt12 clickable" style={{ width: '100%', background: 'var(--warn-soft)', borderColor: 'transparent', textAlign: 'left' }} onClick={() => go('alertes?dex')}>
                    <Gavel size={18} color="var(--warn)" /><span className="small" style={{ flex: 1 }}><b>{decisions.length} décision(s)</b> attendue(s) du Directeur d'Exploitation</span><ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>Situation des chantiers</h3><button className="link" onClick={() => go('chantiers')}>Détails</button></div>
              <div className="list">
                {k.parCh.map(({ c, k: kc }) => {
                  const sd = statutDelai(kc), sc = statutCout(kc, reglages.seuilCout)
                  return (
                    <div key={c.id} className="row clickable" onClick={() => go('chantier/' + c.id)} style={{ flexWrap: 'wrap' }}>
                      <i className="dot" style={{ background: c.couleur, width: 12, height: 12 }} />
                      <div className="grow" style={{ minWidth: 160 }}>
                        <div className="t">{c.nom}</div>
                        <div className="flex mt8" style={{ gap: 8 }}><div style={{ flex: 1 }}><Progress value={kc.avPhysique} tone={tone[sd]} /></div><span className="tiny b tnum">{pct(kc.avPhysique)}</span></div>
                        <div className="tiny muted mt8">Temps écoulé {pct(kc.avTemps)}{c.dateFin && ` · fin ${fmtDate(c.dateFin)}`}{kc.retardJours > 0 && ` · fin probable +${kc.retardJours} j`}</div>
                      </div>
                      <div className="flex wrap" style={{ gap: 6 }}>
                        <span className={'badge ' + tone[sd]}><CalendarClock size={12} />Délai : {libelleStatut[sd]}</span>
                        <span className={'badge ' + tone[sc]}><Wallet size={12} />Coût : {libelleStatut[sc]}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <div className="card flat" style={{ background: 'transparent', borderStyle: 'dashed' }}>
          <div className="tiny muted b" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Principe du jour</div>
          <div className="mt8" style={{ fontWeight: 600 }}>« {principe} »</div>
        </div>
      </div>
    </>
  )
}
