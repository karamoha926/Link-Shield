# 🛡️ Link Shield

**Vérifiez un lien avant de cliquer.**



Link ShiLink Shield est un petit scanner d'URL : collez un lien et découvrez s'il est signalé comme dangereux (hameçonnage, logiciel malveillant, logiciel indésirable). Les vérifications s'appuient sur Google Web Risk

- **Résultats réels** : aucune simulation, la réponse vient de Google Web Risk.
- **Le lien n'est jamais visité** : il est seulement envoyé à l'API Google depuis le serveur.
- **Clé API protégée** : elle reste côté serveur, jamais envoyée au navigateur.
- **Honnête** : « aucun signalement » ne veut pas dire « site sûr », et l'application le dit clairement.
- **Trois états simples** : Risque élevé, Aucun signalement, Indéterminé.

## Stack

Next.js · TypeScript · Tailwind CSS · Google Web Risk Lookup API

## Lancer le projet

```bash
npm install
copy .env.example .env.local
npm run dev
```

Ajoutez ensuite votre clé Google Web Risk dans `.env.local`, puis ouvrez `http://localhost:3000`.

## Configuration

Créez une clé API Google Cloud, activez **Web Risk API** (la facturation doit être activée sur le projet) et placez la clé dans `.env.local` :

```
WEB_RISK_API_KEY=votre_cle
```

Vérifiez les tarifs et conditions en vigueur sur la page Google Web Risk.

## Limites

- Projet MVP, prévu pour un usage local.
- La limite de requêtes est gardée en mémoire du serveur : insuffisante pour un site public.
- Les résultats dépendent uniquement des listes de Google.

Advisory provided by Google.