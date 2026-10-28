import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { today } from '../lib/format'
import { CATEGORIES_COUTS, TYPES_ALERTE, URGENCES, STATUTS, UNITES } from '../lib/content'
import { Sheet, Field, NumInput, useToast } from './ui'

const COULEURS = ['#7c4ddb', '#2f9e8f', '#d1603d', '#4a7bd0', '#e0a128', '#c2448f', '#5a6b7f', '#3c9d3c']

function Footer({ onCancel, onSave, onDelete, saveLabel = 'Enregistrer', disabled }) {
  return (
    <>
      {onDelete && <button className="btn danger" onClick={onDelete} aria-label="Supprimer"><Trash2 size={16} /></button>}
      <button className="btn" style={{ flex: 1 }} onClick={onCancel}>Annuler</button>
      <button className="btn primary" style={{ flex: 2 }} onClick={onSave} disabled={disabled}>{saveLabel}</button>
    </>
  )
}

export function ChantierForm({ initial, onClose }) {
  const { add, update, remove } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ nom: '', localisation: '', client: '', chef: '', dateDebut: today(), dateFin: '', montantMarche: 0, budget: 0, statut: 'En cours', couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)], note: '', ...initial })
  const s = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const save = () => {
    if (initial?.id) update('chantiers', initial.id, f)
    else add('chantiers', f)
    toast(initial?.id ? 'Chantier mis à jour' : 'Chantier créé')
    onClose(true)
  }
  const del = () => {
    if (confirm(`Supprimer « ${f.nom} » et toutes ses données (activités, production, coûts, alertes) ?`)) {
      remove('chantiers', initial.id)
      toast('Chantier supprimé')
      onClose('deleted')
    }
  }
  return (
    <Sheet title={initial?.id ? 'Modifier le chantier' : 'Nouveau chantier'} onClose={() => onClose()} footer={<Footer onCancel={() => onClose()} onSave={save} onDelete={initial?.id && del} disabled={!f.nom.trim()} />}>
      <div className="grid">
        <Field label="Nom du chantier *"><input className="input" value={f.nom} onChange={s('nom')} placeholder="Ex. Dalot 2x3x2 Katiola" autoFocus /></Field>
        <div className="grid g2">
          <Field label="Localisation"><input className="input" value={f.localisation} onChange={s('localisation')} /></Field>
          <Field label="Statut">
            <select className="input" value={f.statut} onChange={s('statut')}>{['En préparation', 'En cours', 'Suspendu', 'Réceptionné'].map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
          <Field label="Maître d'ouvrage / client"><input className="input" value={f.client} onChange={s('client')} /></Field>
          <Field label="Chef de chantier"><input className="input" value={f.chef} onChange={s('chef')} /></Field>
          <Field label="Date de démarrage"><input type="date" className="input" value={f.dateDebut} onChange={s('dateDebut')} /></Field>
          <Field label="Date de fin contractuelle"><input type="date" className="input" value={f.dateFin} onChange={s('dateFin')} /></Field>
          <Field label="Montant du marché (F CFA)" hint="Vide = somme du DQE"><NumInput value={f.montantMarche} onChange={s('montantMarche')} /></Field>
          <Field label="Budget / déboursé sec (F CFA)" hint="Vide = somme des coûts unitaires"><NumInput value={f.budget} onChange={s('budget')} /></Field>
        </div>
        <Field label="Couleur">
          <div className="flex wrap">{COULEURS.map((c) => <button key={c} onClick={() => s('couleur')(c)} style={{ width: 30, height: 30, borderRadius: 10, background: c, border: f.couleur === c ? '3px solid var(--text)' : '3px solid transparent' }} aria-label={c} />)}</div>
        </Field>
        <Field label="Notes"><textarea className="input" value={f.note} onChange={s('note')} /></Field>
      </div>
    </Sheet>
  )
}

export function ActiviteForm({ chantierId, initial, onClose }) {
  const { add, update, remove } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ designation: '', unite: 'ml', qteMarche: 0, prixUnitaire: 0, coutUnitaire: 0, ...initial })
  const s = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const save = () => {
    if (initial?.id) update('activites', initial.id, f)
    else add('activites', { ...f, chantierId })
    toast(initial?.id ? 'Activité mise à jour' : 'Activité ajoutée')
    onClose()
  }
  const marge = f.prixUnitaire ? (f.prixUnitaire - f.coutUnitaire) / f.prixUnitaire : null
  return (
    <Sheet title={initial?.id ? "Modifier l'activité" : 'Nouvelle activité (ligne DQE)'} onClose={onClose} footer={<Footer onCancel={onClose} onSave={save} onDelete={initial?.id && (() => { if (confirm('Supprimer cette activité et sa production ?')) { remove('activites', initial.id); onClose() } })} disabled={!f.designation.trim()} />}>
      <div className="grid">
        <Field label="Désignation *"><input className="input" value={f.designation} onChange={s('designation')} placeholder="Ex. Fossé maçonné" autoFocus /></Field>
        <div className="grid g2">
          <Field label="Unité"><select className="input" value={f.unite} onChange={s('unite')}>{UNITES.map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Quantité marché (DQE)"><NumInput value={f.qteMarche} onChange={s('qteMarche')} /></Field>
          <Field label="Prix unitaire DQE (F)"><NumInput value={f.prixUnitaire} onChange={s('prixUnitaire')} /></Field>
          <Field label="Coût unitaire budget (F)" hint="Déboursé sec unitaire"><NumInput value={f.coutUnitaire} onChange={s('coutUnitaire')} /></Field>
        </div>
        {marge != null && <div className={'badge ' + (marge > 0.15 ? 'ok' : marge > 0 ? 'warn' : 'bad')} style={{ alignSelf: 'flex-start' }}>Marge unitaire prévue : {(marge * 100).toFixed(1).replace('.', ',')} %</div>}
      </div>
    </Sheet>
  )
}

export function DepenseForm({ initial, chantierId, onClose }) {
  const { add, update, remove, chantiers, activites } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ date: today(), chantierId: chantierId || chantiers[0]?.id || '', categorie: 'materiaux', libelle: '', montant: 0, activiteId: '', quantite: 0, ...initial })
  const s = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const acts = activites.filter((a) => a.chantierId === f.chantierId)
  const save = () => {
    if (initial?.id) update('depenses', initial.id, f)
    else add('depenses', f)
    toast('Dépense enregistrée')
    onClose()
  }
  return (
    <Sheet title={initial?.id ? 'Modifier la dépense' : 'Nouvelle dépense'} onClose={onClose} footer={<Footer onCancel={onClose} onSave={save} onDelete={initial?.id && (() => { remove('depenses', initial.id); onClose() })} disabled={!f.chantierId || !f.montant} />}>
      <div className="grid">
        <Field label="Chantier"><select className="input" value={f.chantierId} onChange={s('chantierId')}>{chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
        <Field label="Catégorie">
          <div className="chips" style={{ flexWrap: 'wrap' }}>{CATEGORIES_COUTS.map((c) => <button key={c.id} className={'chip' + (f.categorie === c.id ? ' on' : '')} onClick={() => s('categorie')(c.id)}>{c.label}</button>)}</div>
        </Field>
        <div className="grid g2">
          <Field label="Date"><input type="date" className="input" value={f.date} onChange={s('date')} /></Field>
          <Field label="Montant (F CFA) *"><NumInput value={f.montant} onChange={s('montant')} /></Field>
        </div>
        <Field label="Libellé"><input className="input" value={f.libelle} onChange={s('libelle')} placeholder="Ex. 200 sacs de ciment CPJ 42.5" /></Field>
        <Field label="Activité concernée (facultatif)"><select className="input" value={f.activiteId} onChange={s('activiteId')}><option value="">— Toutes / frais généraux —</option>{acts.map((a) => <option key={a.id} value={a.id}>{a.designation}</option>)}</select></Field>
      </div>
    </Sheet>
  )
}

export function AlerteForm({ initial, chantierId, onClose }) {
  const { add, update, remove, chantiers } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ date: today(), chantierId: chantierId || chantiers[0]?.id || '', titre: '', type: 'Matériaux', urgence: 'Haute', statut: 'Ouverte', impact: '', cause: '', causeStatut: 'à vérifier', action: '', responsable: '', echeance: '', decisionDex: false, decision: '', ...initial })
  const s = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }))
  const save = () => {
    if (initial?.id) update('alertes', initial.id, f)
    else add('alertes', f)
    toast(initial?.id ? 'Alerte mise à jour' : 'Alerte enregistrée')
    onClose()
  }
  return (
    <Sheet title={initial?.id ? "Modifier l'alerte / action" : 'Nouvelle alerte / action'} onClose={onClose} footer={<Footer onCancel={onClose} onSave={save} onDelete={initial?.id && (() => { if (confirm('Supprimer cette alerte ?')) { remove('alertes', initial.id); onClose() } })} disabled={!f.titre.trim()} />}>
      <div className="grid">
        <Field label="Problème constaté *"><input className="input" value={f.titre} onChange={s('titre')} placeholder="Ex. Rupture de ciment annoncée dans 2 jours" autoFocus /></Field>
        <div className="grid g2">
          <Field label="Chantier"><select className="input" value={f.chantierId} onChange={s('chantierId')}><option value="">Tous / transversal</option>{chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
          <Field label="Type"><select className="input" value={f.type} onChange={s('type')}>{TYPES_ALERTE.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="Urgence"><div className="seg">{URGENCES.map((u) => <button key={u} className={f.urgence === u ? 'on' : ''} onClick={() => s('urgence')(u)}>{u}</button>)}</div></Field>
        <Field label="Impact (production, coût, délai)"><textarea className="input" value={f.impact} onChange={s('impact')} rows={2} /></Field>
        <div className="grid g2">
          <Field label="Cause"><input className="input" value={f.cause} onChange={s('cause')} /></Field>
          <Field label="Statut de la cause"><div className="seg"><button className={f.causeStatut === 'confirmée' ? 'on' : ''} onClick={() => s('causeStatut')('confirmée')}>Confirmée</button><button className={f.causeStatut === 'à vérifier' ? 'on' : ''} onClick={() => s('causeStatut')('à vérifier')}>À vérifier</button></div></Field>
        </div>
        <Field label="Action corrective proposée"><textarea className="input" value={f.action} onChange={s('action')} rows={2} /></Field>
        <div className="grid g2">
          <Field label="Responsable"><input className="input" value={f.responsable} onChange={s('responsable')} /></Field>
          <Field label="Échéance"><input type="date" className="input" value={f.echeance} onChange={s('echeance')} /></Field>
          <Field label="Date du constat"><input type="date" className="input" value={f.date} onChange={s('date')} /></Field>
          <Field label="Statut"><select className="input" value={f.statut} onChange={s('statut')}>{STATUTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <label className="check" style={{ padding: '8px 0' }}>
          <input type="checkbox" checked={f.decisionDex} onChange={s('decisionDex')} style={{ width: 20, height: 20, accentColor: 'var(--brand)' }} />
          <span className="lbl">Une décision du Directeur d'Exploitation est nécessaire</span>
        </label>
        {f.decisionDex && <Field label="Décision demandée au DEX"><textarea className="input" value={f.decision} onChange={s('decision')} rows={2} placeholder="Décision, justification, conséquence si rien n'est décidé" /></Field>}
      </div>
    </Sheet>
  )
}
