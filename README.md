# Pilotage EPC — AMETHYSTE & CO

Application du département **Étude, Planification et Contrôle des coûts** de la Direction d'Exploitation.
Installable sur téléphone et ordinateur (PWA) et utilisable hors connexion.

## Mettre l'application en ligne sur Vercel (une seule fois, environ 10 minutes)

### Option A : via GitHub (recommandée, car les mises à jour se publient ensuite toutes seules)
1. Créez un compte gratuit sur https://github.com, puis un dépôt nommé `pilotage-epc` (privé de préférence).
2. Sur la page du dépôt, cliquez sur **« uploading an existing file »**. Glissez-y **tout le contenu** du dossier décompressé (et non le dossier lui-même), puis cliquez sur **Commit changes**.
3. Créez un compte gratuit sur https://vercel.com avec **« Continue with GitHub »**.
4. Cliquez sur **Add New… → Project**, choisissez le dépôt `pilotage-epc`, puis **Deploy**. Vercel détecte automatiquement les réglages (Vite, `npm run build`, dossier `dist`).
5. Au bout d'une minute environ, vous obtenez une adresse du type `https://pilotage-epc.vercel.app`. Envoyez-la à votre collègue.

**Pour publier une mise à jour :** remplacez les fichiers dans le dépôt GitHub (Add file → Upload files). Vercel redéploie automatiquement, et l'application installée se met à jour à la prochaine ouverture.

### Option B : depuis un ordinateur avec Node.js
```bash
npm install
npx vercel --prod
```

## Installer l'application
- **Android (Chrome)** : ouvrez l'adresse, puis appuyez sur la bannière « Installer » ou passez par le menu ⋮ → *Installer l'application*.
- **iPhone (Safari)** : appuyez sur Partager → *Sur l'écran d'accueil*.
- **Ordinateur (Chrome / Edge)** : cliquez sur l'icône d'installation dans la barre d'adresse.

## Travailler à deux
Les données sont enregistrées **sur chaque appareil**. Pour les mettre en commun, ouvrez *Réglages & partage* :
- **Envoyer mes données** : le fichier peut être transmis par WhatsApp ou par e-mail.
- **Importer → Fusionner** : vos données et celles de votre binôme sont combinées. En cas de conflit, la saisie la plus récente l'emporte.

Faites aussi une sauvegarde régulière avec le bouton *Sauvegarder*.

## Développement local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # génère dist/
```
