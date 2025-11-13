#!/bin/bash

# Script de démarrage du bot Discord

echo "🤖 Démarrage du Bot Stake Global..."

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé !"
    echo "📝 Création depuis .env.example..."
    cp .env.example .env
    echo "⚠️  Veuillez configurer votre .env avant de continuer"
    exit 1
fi

# Vérifier si config.json existe
if [ ! -f "config.json" ]; then
    echo "📝 Création de config.json..."
    echo '{
    "emoji": "✅",
    "rules_message_id": null,
    "rules_channel_id": null,
    "active_polls": {},
    "poll_history": []
}' > config.json
fi

# Lancer le bot
echo "🚀 Lancement du bot..."
node bot.js