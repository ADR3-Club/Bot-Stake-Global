# 🤖 Bot Stake Global

Bot Discord complet pour la gestion d'une communauté Stake avec système de règlement, inscription, affiliation et sondages interactifs.

## ✨ Fonctionnalités

### 📜 Gestion du Règlement
- **`/reglement`** - Poste le règlement du serveur avec validation par réaction
- **`/reglement-sync`** - Synchronise un message existant comme règlement
- Attribution automatique de rôle lors de l'acceptation du règlement
- Logs des validations dans un channel dédié

### 📝 Guides Interactifs
- **`/inscription`** - Guide d'inscription Stake avec boutons interactifs
- **`/affiliation`** - FAQ d'affiliation ADR3 avec système de Q&R
- Réponses éphémères (privées) aux questions

### 📊 Système de Sondages
- **`/poll`** - Créer un sondage interactif avec options multiples
  - Vote unique ou votes multiples
  - Durée configurable (1h à 30 jours)
  - Affichage en temps réel des votes
  - Fermeture automatique à la fin
- **`/poll-close`** - Fermer manuellement un sondage actif
- **`/poll-history`** - Consulter l'historique des sondages (20 derniers)

## 🚀 Installation

### Prérequis
- Node.js >= 16.9.0
- npm ou yarn
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/ADR3-Club/Bot-Stake-Global.git
cd Bot-Stake-Global
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration**

Copier le fichier `.env.example` vers `.env` :
```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos informations :
```env
# REQUIRED
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id

# OPTIONAL
VERIFIED_ROLE_ID=0              # ID du rôle à attribuer (0 = désactivé)
LOG_CHANNEL_ID=0                # ID du channel de logs (0 = désactivé)
POLL_ROLE_IDS=0                 # IDs des rôles autorisés à créer des polls (0 = tout le monde)
```

4. **Lancer le bot**

Avec le script automatique :
```bash
bash start.sh
```

Ou manuellement :
```bash
node bot.js
```

## 📋 Configuration Détaillée

### Variables d'environnement

| Variable | Description | Obligatoire | Défaut |
|----------|-------------|-------------|--------|
| `DISCORD_TOKEN` | Token du bot Discord | ✅ Oui | - |
| `CLIENT_ID` | ID de l'application Discord | ✅ Oui | - |
| `GUILD_ID` | ID du serveur Discord | ✅ Oui | - |
| `VERIFIED_ROLE_ID` | ID du rôle à attribuer lors de l'acceptation du règlement | ❌ Non | `0` (désactivé) |
| `LOG_CHANNEL_ID` | ID du channel pour les logs Discord | ❌ Non | `0` (désactivé) |
| `POLL_ROLE_IDS` | IDs des rôles autorisés à créer des sondages (séparés par des virgules) | ❌ Non | `0` (tout le monde) |

### Fichier config.json

Le fichier `config.json` est généré automatiquement et contient :

```json
{
    "emoji": "✅",
    "rules_message_id": null,
    "rules_channel_id": null,
    "active_polls": {},
    "poll_history": []
}
```

- **`emoji`** : Emoji pour la validation du règlement
- **`rules_message_id`** : ID du message du règlement
- **`rules_channel_id`** : ID du channel contenant le règlement
- **`active_polls`** : Sondages actifs en cours
- **`poll_history`** : Historique des 20 derniers sondages terminés

## 📖 Utilisation des Commandes

### Commandes Règlement (Administrateur uniquement)

#### `/reglement`
Poste le règlement du serveur avec validation par réaction.

**Fonctionnement :**
1. Le bot poste un embed avec les règles
2. Ajoute automatiquement la réaction ✅
3. Les utilisateurs réagissent pour accepter
4. Attribution automatique du rôle (si configuré)

#### `/reglement-sync`
Synchronise un message existant comme règlement.

**Options :**
- `message_id` (requis) : ID du message à synchroniser

**Exemple :**
```
/reglement-sync message_id:123456789012345678
```

### Commandes Guides

#### `/inscription`
Publie le guide d'inscription Stake avec boutons interactifs.

**Options :**
- `salon` (optionnel) : Channel où publier le message
- `ephemere` (optionnel) : Prévisualiser en privé (true/false)
- `couleur` (optionnel) : Couleur de l'embed (ex: #2ecc71)

**Exemple :**
```
/inscription salon:#bienvenue couleur:#00ff00
```

#### `/affiliation`
Publie la FAQ d'affiliation ADR3 avec système de questions/réponses.

**Options :**
- `salon` (optionnel) : Channel où publier le message
- `ephemere` (optionnel) : Prévisualiser en privé (true/false)
- `couleur` (optionnel) : Couleur de l'embed (ex: #3498db)

**Exemple :**
```
/affiliation salon:#affiliation couleur:#3498db ephemere:true
```

### Commandes Sondages

#### `/poll`
Créer un sondage interactif.

**Options :**
- `question` (requis) : La question du sondage
- `options` (requis) : Les options séparées par des `;` (2 à 10 options)
- `duree` (requis) : Durée en heures (1 à 720h = 30 jours)
- `type` (requis) :
  - `unique` : Un seul choix possible
  - `multiple` : Plusieurs choix possibles

**Exemples :**
```
/poll question:"Quel jeu préférez-vous ?" options:"Pragmatic;Hacksaw;Nolimit" duree:24 type:unique

/poll question:"Quels providers aimez-vous ?" options:"Pragmatic;Hacksaw;Nolimit;BGaming" duree:48 type:multiple
```

**Fonctionnement :**
- Les utilisateurs votent avec les réactions emoji (1️⃣, 2️⃣, etc.)
- L'embed se met à jour en temps réel
- Affichage des pourcentages et des votants
- Fermeture automatique à la fin de la durée

#### `/poll-close`
Fermer manuellement un sondage actif.

**Options :**
- `message_id` (requis) : ID du message du sondage

**Permissions :**
- Créateur du sondage
- OU Administrateur du serveur

**Exemple :**
```
/poll-close message_id:123456789012345678
```

#### `/poll-history`
Afficher l'historique des sondages terminés.

**Options :**
- `page` (optionnel) : Numéro de page (défaut: 1)

**Affichage :**
- 5 sondages par page
- Date de fermeture
- Nombre de votes
- Gagnant(s)

**Exemple :**
```
/poll-history page:2
```

## 🔧 Personnalisation

### Modifier les contenus Inscription/Affiliation

Éditer le fichier `bot.js` aux lignes 47-106 :

```javascript
// /inscription
const INSCRIPTION = {
    title: '📝 Inscription sur Stake',
    intro: 'Voici les étapes...',
    questions: [
        'Étape 1',
        'Étape 2',
    ],
    answers: [
        'Réponse étape 1...',
        'Réponse étape 2...',
    ],
    ctas: [], // Boutons liens optionnels
};

// /affiliation
const AFFILIATION = {
    title: '🤝 Affiliation du Club',
    intro: 'Tout savoir...',
    questions: [
        'Question 1',
        'Question 2',
        'Question 3',
    ],
    answers: [
        'Réponse 1...',
        'Réponse 2...',
        'Réponse 3...',
    ],
    ctas: [], // Boutons liens optionnels
};
```

### Modifier le règlement

Éditer le fichier `bot.js` aux lignes 636-672 dans la commande `/reglement`.

### Changer l'emoji de validation

Modifier le fichier `config.json` :
```json
{
    "emoji": "✅"
}
```

## 🛠️ Déploiement Production

### Avec PM2 (recommandé)

1. **Installer PM2**
```bash
npm install -g pm2
```

2. **Lancer le bot**
```bash
pm2 start bot.js --name "bot-stake-global"
```

3. **Configuration auto-start**
```bash
pm2 startup
pm2 save
```

4. **Commandes utiles**
```bash
pm2 status                 # Voir l'état du bot
pm2 logs bot-stake-global  # Voir les logs
pm2 restart bot-stake-global  # Redémarrer
pm2 stop bot-stake-global  # Arrêter
```

### Avec systemd

Créer le fichier `/etc/systemd/system/bot-stake-global.service` :

```ini
[Unit]
Description=Bot Discord Stake Global
After=network.target

[Service]
Type=simple
User=votre_utilisateur
WorkingDirectory=/chemin/vers/Bot-Stake-Global
ExecStart=/usr/bin/node bot.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Commandes :
```bash
sudo systemctl enable bot-stake-global
sudo systemctl start bot-stake-global
sudo systemctl status bot-stake-global
```

## 📊 Logs et Monitoring

### Types de logs

Le bot affiche différents niveaux de logs :
- **INFO** : Informations générales
- **SUCCESS** : Opérations réussies
- **WARN** : Avertissements
- **ERROR** : Erreurs
- **DEBUG** : Informations de débogage

### Heartbeat

Toutes les 5 minutes, le bot affiche :
- Utilisation mémoire
- Ping Discord
- Nombre de serveurs

### Logs Discord

Si `LOG_CHANNEL_ID` est configuré, le bot envoie automatiquement des logs dans le channel spécifié :
- Acceptations du règlement
- Créations de sondages
- Fermetures de sondages

## 🔒 Sécurité

### Bonnes pratiques

- ✅ Ne jamais commit le fichier `.env`
- ✅ Régénérer le token si compromis
- ✅ Limiter les permissions du bot au strict nécessaire
- ✅ Utiliser des rôles spécifiques pour les sondages si besoin

### Permissions Discord requises

Permissions minimales pour le bot :
- `View Channels`
- `Send Messages`
- `Embed Links`
- `Add Reactions`
- `Read Message History`
- `Manage Roles` (uniquement si VERIFIED_ROLE_ID est configuré)

### Intents requis

```javascript
GatewayIntentBits.Guilds
GatewayIntentBits.GuildMessages
GatewayIntentBits.MessageContent
GatewayIntentBits.GuildMessageReactions
GatewayIntentBits.GuildMembers
```

## 🐛 Dépannage

### Le bot ne démarre pas

**Erreur : `DISCORD_TOKEN non trouvé`**
- Vérifier que le fichier `.env` existe
- Vérifier que le token est correct

**Erreur : `config.json non trouvé`**
- Créer le fichier avec `bash start.sh`
- Ou copier le contenu du template ci-dessus

### Les commandes n'apparaissent pas

- Vérifier que `CLIENT_ID` et `GUILD_ID` sont corrects
- Attendre quelques minutes (les commandes peuvent prendre du temps)
- Vérifier les permissions du bot sur le serveur

### Le règlement ne fonctionne pas

- Vérifier que le message a bien la réaction ✅
- Vérifier `VERIFIED_ROLE_ID` dans `.env`
- Vérifier que le bot a la permission `Manage Roles`
- Vérifier que le rôle du bot est au-dessus du rôle à attribuer

### Les sondages ne se ferment pas automatiquement

- Vérifier que le bot n'a pas été redémarré pendant le sondage
- Les timers sont restaurés au démarrage si le bot crash

## 📝 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

## 👤 Auteur

**ADR3N4LYN3**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer des améliorations
- Soumettre des pull requests

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Rejoindre le serveur Discord de support

---

**⭐ Si ce bot vous est utile, n'hésitez pas à mettre une étoile sur GitHub !**