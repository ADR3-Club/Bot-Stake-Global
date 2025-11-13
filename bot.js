const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionFlagsBits,
    ActivityType,
    SlashCommandBuilder,
    REST,
    Routes,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Charger les variables d'environnement
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID || '0';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '0';
const POLL_ROLE_IDS = process.env.POLL_ROLE_IDS || '0';

// Variables globales pour les sondages
const activePollTimers = new Map();
const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// Charger la configuration non-sensible
let config;
try {
    const configData = fs.readFileSync('./config.json', 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('❌ Erreur lors du chargement de config.json:', error.message);
    process.exit(1);
}

/* =========================
   BLOCS PRÉDÉFINIS (éditables)
========================= */

// /inscription
const INSCRIPTION = {
    title: '📝 Inscription sur Stake',
    intro:
        'Voici les étapes pour créer ton compte Stake.\n\n' +
        'Clique sur les **boutons numérotés** pour voir le détail de chaque étape :',
    questions: [
        'Créer un compte et vérification',
        'Accès à Stake',
    ],
    answers: [
        '👉 Va sur le site officiel (ou miroir recommandé)\n' +
        '　　➡️ *Tous les sites mirroirs : https://playstake.club*\n\n' +
        '🔹 Renseigne email + mot de passe\n' +
        '🔹 Fais la vérification KYC niveau 2\n' +
        '　➡️ *Permets de débloquer achats/retraits et lever les restrictions sur ton compte*\n\n' +
        '🔹 Renseigne le code : ADR3 ou vois dans <#1407617681225416734>\n',

        '👉 Utilise un VPN : **UrbanVPN/CyberGhost VPN** en extension Chrome\n' +
        '　➡️ *Choisis la Norvège ou Allemagne*\n\n'+
        '🔹 Si tu as encore des soucis, tu as <#1407615950592806933> ou <#1410177168033710091>\n',
    ],
    ctas: [],
};

// /affiliation
const AFFILIATION = {
    title: '🤝 Affiliation du Club',
    intro:
        'Tout savoir sur l\'affiliation au Club\n\n' +
        'Clique sur les **boutons numérotés** pour lire les réponses :',
    questions: [
        'Je n'ai pas encore de compte Stake, comment m'affilier à ADR3 ?',
        'Y a-t-il des bonus disponibles ?',
        'J'ai déjà un compte, puis-je rejoindre le Club ?',
    ],
    answers: [
        '👉 Inscris toi sur Stake <#1409916078007779429>\n\n' +
        '👉 Utilise le lien direct\n' +
        '➡️ *https://stake.com/?offer=adr3&c=OEYRTwSJ*\n\n' +
        '👉 Renseigne le code\n' +
        '　➡️ *Paramètres -> Offres -> Code de bienvenue :* **ADR3**\n',
        '👉 Ça arrive soon !\n' +
        '　➡️ *Une fois la communauté assez grande, de bonnes suprises arrivent ! *\n\n',
        '👉 Oui, sous certaines conditions !\n' +
        '➡️ **Compte de moins de 24H** -> renseigner le code "ADR3"\n\n'+
        '➡️ **Compte de moins de 3 mois** -> demander au support Stake\n\n'+
        "➡️ **Si votre compte à plus de 3 mois OU que vous êtes déjà affilié, malheureusement, c'est trop tard** \n",
    ],
    ctas: [],
};

// Définition des slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('reglement')
        .setDescription('Poste le règlement du serveur avec validation par réaction')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('reglement-sync')
        .setDescription('Synchronise un message existant comme règlement')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID du message à utiliser comme règlement')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('inscription')
        .setDescription("Publie le guide d'inscription Stake (version boutons)")
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon où publier (sinon ici)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('ephemere')
                .setDescription('Prévisualiser en privé (true/false)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('couleur')
                .setDescription("Couleur de l'embed (ex: #2ecc71)")
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('affiliation')
        .setDescription("Publie la FAQ d'affiliation ADR3 (version boutons)")
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon où publier (sinon ici)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('ephemere')
                .setDescription('Prévisualiser en privé (true/false)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('couleur')
                .setDescription("Couleur de l'embed (ex: #3498db)")
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Créer un sondage interactif')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question du sondage')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Les options séparées par des points-virgules (;) - Maximum 10')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duree')
                .setDescription('Durée du sondage en heures')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(720)) // 30 jours max
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de vote')
                .setRequired(true)
                .addChoices(
                    { name: '🔘 Vote unique (un seul choix)', value: 'unique' },
                    { name: '☑️ Votes multiples (plusieurs choix possibles)', value: 'multiple' }
                )),
    new SlashCommandBuilder()
        .setName('poll-close')
        .setDescription('Fermer un sondage manuellement')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID du message du sondage à fermer')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('poll-history')
        .setDescription('Afficher l\'historique des sondages')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Numéro de page (5 sondages par page)')
                .setRequired(false)
                .setMinValue(1))
].map(command => command.toJSON());

// Créer le client Discord avec options de reconnexion
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    failIfNotExists: false,
    restTimeOffset: 0,
    restRequestTimeout: 15000,
    retryLimit: 3
});

/**
 * Logs avec horodatage
 */
function logWithTimestamp(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    console.log(`${prefix} ${message}`);
}

/**
 * Envoie un message dans le channel de logs si configuré
 */
async function sendLog(guild, message) {
    if (LOG_CHANNEL_ID === '0') {
        console.log(message);
        return;
    }

    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) {
        console.log(`⚠️ Channel de logs non trouvé (ID: ${LOG_CHANNEL_ID})`);
        console.log(message);
        return;
    }

    try {
        await logChannel.send(message);
        console.log(message);
    } catch (error) {
        console.log(`⚠️ Erreur lors de l'envoi du log: ${error.message}`);
        console.log(message);
    }
}

/**
 * Sauvegarde la configuration dans config.json
 */
function saveConfig() {
    try {
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4), 'utf8');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de config.json:', error.message);
    }
}

/**
 * Vérifie si un membre a les rôles requis pour créer des sondages
 */
function hasRequiredRole(member) {
    if (POLL_ROLE_IDS === '0') return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    const allowedRoleIds = POLL_ROLE_IDS.split(',').map(id => id.trim());
    return allowedRoleIds.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Formate le temps restant pour un sondage
 */
function formatTimeRemaining(endTime) {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) return 'Terminé';

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
}

/**
 * Met à jour l'embed d'un sondage avec les votes actuels
 */
async function updatePollEmbed(message, pollData) {
    try {
        const totalVotes = Object.values(pollData.votes).reduce((sum, voters) => sum + voters.length, 0);

        let description = '';
        pollData.options.forEach((option, index) => {
            const voters = pollData.votes[index] || [];
            const percentage = totalVotes > 0 ? Math.round((voters.length / totalVotes) * 100) : 0;

            description += `\n${numberEmojis[index]} **${option}**\n`;
            description += `└ ${voters.length} vote(s) (${percentage}%)\n`;

            if (voters.length > 0) {
                const voterMentions = voters.slice(0, 5).map(userId => `<@${userId}>`).join(', ');
                const remaining = voters.length > 5 ? ` +${voters.length - 5}` : '';
                description += `   ${voterMentions}${remaining}\n`;
            }
        });

        const typeIcon = pollData.type === 'unique' ? '🔘' : '☑️';
        const typeText = pollData.type === 'unique' ? 'Vote unique' : 'Votes multiples';

        const embed = new EmbedBuilder()
            .setColor(0xFF9900)
            .setTitle(`📊 ${pollData.question}`)
            .setDescription(description)
            .addFields(
                { name: 'Type de vote', value: `${typeIcon} ${typeText}`, inline: true },
                { name: 'Temps restant', value: `⏱️ ${formatTimeRemaining(pollData.endsAt)}`, inline: true },
                { name: 'Total de votes', value: `${totalVotes}`, inline: true }
            )
            .setFooter({ text: 'Réagis avec les emojis pour voter !' })
            .setTimestamp(pollData.createdAt);

        await message.edit({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'embed:', error);
    }
}

/**
 * Ferme un sondage et affiche les résultats finaux
 */
async function closePoll(messageId, reason = 'automatique') {
    const pollData = config.active_polls[messageId];
    if (!pollData) return;

    try {
        const channel = await client.channels.fetch(pollData.channelId);
        const message = await channel.messages.fetch(messageId);

        const totalVotes = Object.values(pollData.votes).reduce((sum, voters) => sum + voters.length, 0);
        let maxVotes = 0;
        let winners = [];

        pollData.options.forEach((option, index) => {
            const votes = (pollData.votes[index] || []).length;
            if (votes > maxVotes) {
                maxVotes = votes;
                winners = [option];
            } else if (votes === maxVotes && votes > 0) {
                winners.push(option);
            }
        });

        let resultsDescription = '**Résultats finaux :**\n\n';
        pollData.options.forEach((option, index) => {
            const voters = pollData.votes[index] || [];
            const percentage = totalVotes > 0 ? Math.round((voters.length / totalVotes) * 100) : 0;
            const isWinner = winners.includes(option) && maxVotes > 0;

            resultsDescription += `${numberEmojis[index]} **${option}** ${isWinner ? '🏆' : ''}\n`;
            resultsDescription += `└ ${voters.length} vote(s) (${percentage}%)\n\n`;
        });

        if (maxVotes === 0) {
            resultsDescription += '\n❌ Aucun vote enregistré';
        } else if (winners.length === 1) {
            resultsDescription += `\n🏆 **Gagnant :** ${winners[0]} avec ${maxVotes} vote(s)`;
        } else {
            resultsDescription += `\n🏆 **Égalité entre :** ${winners.join(', ')} avec ${maxVotes} vote(s) chacun`;
        }

        const finalEmbed = new EmbedBuilder()
            .setColor(0x95A5A6)
            .setTitle(`🔒 ${pollData.question}`)
            .setDescription(resultsDescription)
            .addFields(
                { name: 'Total de votes', value: `${totalVotes}`, inline: true },
                { name: 'Fermeture', value: reason === 'automatique' ? '⏰ Automatique' : '🛑 Manuelle', inline: true }
            )
            .setFooter({ text: 'Sondage terminé' })
            .setTimestamp();

        await message.edit({ embeds: [finalEmbed] });
        await message.reactions.removeAll().catch(() => {});

        savePollToHistory({
            ...pollData,
            messageId,
            closedAt: Date.now(),
            totalVotes,
            winners,
            reason
        });

        await sendLog(message.guild, `📊 Sondage terminé (${reason}) : "${pollData.question}" - ${totalVotes} vote(s)`);

        delete config.active_polls[messageId];
        saveConfig();

        if (activePollTimers.has(messageId)) {
            clearTimeout(activePollTimers.get(messageId));
            activePollTimers.delete(messageId);
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la fermeture du sondage ${messageId}:`, error);
    }
}

/**
 * Sauvegarde un sondage dans l'historique
 */
function savePollToHistory(pollData) {
    config.poll_history.unshift(pollData);
    if (config.poll_history.length > 20) {
        config.poll_history = config.poll_history.slice(0, 20);
    }
    saveConfig();
}

/* =========================
   UTILS POUR INSCRIPTION/AFFILIATION
========================= */

const sanitizeColor = (hex) => {
    if (!hex) return null;
    const h = hex.trim().replace('#', '');
    return /^[0-9a-fA-F]{6}$/.test(h) ? parseInt(h, 16) : null;
};

const buildListEmbed = (block, colorHex) => {
    const stepEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const lines = block.questions
        .map((q, i) => `${stepEmojis[i] || "➡️"} ${q}`)
        .join('\n\n');

    const embed = new EmbedBuilder()
        .setTitle(block.title)
        .setDescription(`${block.intro}\n\n${lines}`)
        .setTimestamp();

    if (colorHex) embed.setColor(colorHex);
    return embed;
};

const buildNumberedRows = (block, prefix) => {
    const rows = [];
    const stepEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

    for (let i = 0; i < block.questions.length; i += 5) {
        const slice = block.questions.slice(i, i + 5);
        rows.push(
            new ActionRowBuilder().addComponents(
                ...slice.map((_, idx) => {
                    const n = i + idx + 1;
                    return new ButtonBuilder()
                        .setCustomId(`${prefix}_q_${n}`)
                        .setLabel(stepEmojis[n - 1] || String(n))
                        .setStyle(ButtonStyle.Secondary);
                })
            )
        );
    }

    if (block.ctas?.length) {
        rows.push(
            new ActionRowBuilder().addComponents(
                ...block.ctas.slice(0, 5).map((c) =>
                    new ButtonBuilder().setLabel(c.label).setStyle(ButtonStyle.Link).setURL(c.url)
                )
            )
        );
    }
    return rows;
};

/**
 * Enregistre les slash commands auprès de Discord
 */
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    try {
        console.log('🔄 Enregistrement des slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log(`✅ Slash commands enregistrées avec succès pour le serveur ${GUILD_ID} !`);
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des slash commands:', error);
    }
}

// Événement : Bot prêt
client.once('clientReady', async () => {
    logWithTimestamp(`${client.user.tag} est connecté et prêt !`, 'SUCCESS');
    logWithTimestamp(`ID du bot: ${client.user.id}`, 'INFO');
    logWithTimestamp('------', 'INFO');
    logWithTimestamp(`Actif sur ${client.guilds.cache.size} serveur(s)`, 'INFO');
    logWithTimestamp('------', 'INFO');
    logWithTimestamp(`Attribution de rôle: ${VERIFIED_ROLE_ID !== '0' ? '✅ Activée' : '❌ Désactivée'}`, 'INFO');
    logWithTimestamp(`Logs Discord: ${LOG_CHANNEL_ID !== '0' ? '✅ Activés' : '❌ Désactivés'}`, 'INFO');
    logWithTimestamp('------', 'INFO');

    // Restaurer les timers des sondages actifs
    const activePolls = Object.keys(config.active_polls || {});
    if (activePolls.length > 0) {
        console.log(`🔄 Restauration de ${activePolls.length} sondage(s) actif(s)...`);

        for (const messageId of activePolls) {
            const pollData = config.active_polls[messageId];
            const now = Date.now();
            const remaining = pollData.endsAt - now;

            if (remaining <= 0) {
                console.log(`⏰ Fermeture du sondage expiré : "${pollData.question}"`);
                await closePoll(messageId, 'automatique');
            } else {
                const timer = setTimeout(() => {
                    closePoll(messageId, 'automatique');
                }, remaining);

                activePollTimers.set(messageId, timer);
                console.log(`✅ Timer restauré pour : "${pollData.question}" (${Math.round(remaining / 60000)} min restantes)`);
            }
        }

        console.log('------');
    }

    // Définir l'activité/statut du bot
    client.user.setPresence({
        activities: [{
            name: '🎮 Gestion de la communauté Stake',
            type: ActivityType.Custom
        }],
        status: 'online'
    });
});

// Événement : Interaction (slash command + boutons)
client.on('interactionCreate', async (interaction) => {
    try {
        // ========== SLASH COMMANDS ==========
        if (interaction.isChatInputCommand()) {

            // Commande /reglement
            if (interaction.commandName === 'reglement') {
                const embed = new EmbedBuilder()
                    .setTitle('📜 Règlement du Club')
                    .setDescription('Bienvenue dans le Club !\nPour un environnement agréable et respectueux, merci de suivre ces règles 👇')
                    .setColor(0x5865F2)
                    .addFields(
                        {
                            name: '✅ Respect et bienveillance',
                            value: '• Traitez chaque membre avec respect. Les propos offensants, discriminatoires ou harcelants ne seront pas tolérés.',
                            inline: false
                        },
                        {
                            name: '🚫 Mineurs strictement interdits',
                            value: 'Ban immédiat sans avertissement',
                            inline: false
                        },
                        {
                            name: '💰 Transactions financières',
                            value: '• Aucune transaction d\'argent (crypto, PayPal, etc.)\n• Ni en salon public, ni en message privé',
                            inline: false
                        },
                        {
                            name: '📛 Pas de spam',
                            value: '• Évitez de spammer les messages, les liens ou les publicités.',
                            inline: false
                        },
                        {
                            name: '🔒 Confidentialité',
                            value: '• Ne partagez pas d\'informations personnelles sans consentement.',
                            inline: false
                        },
                        {
                            name: '💬 Langage et comportement',
                            value: '• Utilisez un langage approprié. Les insultes et les menaces sont interdites.',
                            inline: false
                        },
                        {
                            name: '⚠️ Sujets sensibles',
                            value: '• Évitez politiques/religion sauf autorisation expresse des modérateurs.',
                            inline: false
                        },
                        {
                            name: '📌 Règles des salons',
                            value: '• Lisez les annonces & épingles pour les règles spécifiques.',
                            inline: false
                        },
                        {
                            name: '✉️ Sanctions',
                            value: '• Le non-respect peut entraîner avertissements, expulsions temporaires ou permanentes.',
                            inline: false
                        },
                        {
                            name: '💡 Suggestions et feedback',
                            value: '• Vos retours sont précieux !',
                            inline: false
                        }
                    )
                    .setImage('https://cdn.discordapp.com/attachments/1407614780356825109/1438521277324202166/image.png?ex=69172ed6&is=6915dd56&hm=699040c425ffeea5c59d8320d233add08dbcf0f4271f073538d0fa562fff5352&')
                    .setFooter({ text: 'Merci de votre compréhension et de votre coopération. Amusez-vous et profitez de votre temps ici !' });

                await interaction.reply({ content: '✅ Règlement posté !', flags: MessageFlags.Ephemeral });
                const ruleMessage = await interaction.channel.send({ embeds: [embed] });
                await ruleMessage.react(config.emoji);

                config.rules_message_id = ruleMessage.id;
                config.rules_channel_id = interaction.channel.id;
                saveConfig();

                console.log(`Règlement posté ! ID du message: ${ruleMessage.id}`);
            }

            // Commande /reglement-sync
            if (interaction.commandName === 'reglement-sync') {
                const messageId = interaction.options.getString('message_id');

                logWithTimestamp(`Tentative de synchronisation du message ${messageId} comme règlement`, 'INFO');

                const message = await interaction.channel.messages.fetch(messageId).catch(() => null);

                if (!message) {
                    logWithTimestamp(`Message ${messageId} non trouvé`, 'ERROR');
                    return interaction.reply({
                        content: '❌ Message introuvable. Vérifiez l\'ID du message et assurez-vous qu\'il est dans ce salon.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (message.author.id !== client.user.id) {
                    logWithTimestamp(`Message ${messageId} n'appartient pas au bot`, 'WARN');
                    return interaction.reply({
                        content: '⚠️ Ce message n\'a pas été posté par le bot. Je peux quand même le synchroniser, mais je ne pourrai pas le modifier.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const hasReaction = message.reactions.cache.has(config.emoji);
                if (!hasReaction) {
                    await message.react(config.emoji);
                    logWithTimestamp(`Réaction ${config.emoji} ajoutée au message ${messageId}`, 'INFO');
                } else {
                    logWithTimestamp(`Le message ${messageId} a déjà la réaction ${config.emoji}`, 'INFO');
                }

                config.rules_message_id = messageId;
                config.rules_channel_id = interaction.channel.id;
                saveConfig();

                logWithTimestamp(`Message ${messageId} synchronisé comme règlement avec succès`, 'SUCCESS');

                await interaction.reply({
                    content: `✅ Message synchronisé !\n\n**ID du message :** ${messageId}\n**Emoji :** ${config.emoji}\n\nLe bot détectera maintenant les réactions sur ce message pour attribuer le rôle.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Commande /inscription
            if (interaction.commandName === 'inscription') {
                const salon = interaction.options.getChannel('salon') || interaction.channel;
                const ephemere = interaction.options.getBoolean('ephemere') ?? false;
                const color = sanitizeColor(interaction.options.getString('couleur'));

                const payload = {
                    embeds: [buildListEmbed(INSCRIPTION, color)],
                    components: buildNumberedRows(INSCRIPTION, 'insc'),
                };

                if (ephemere) return interaction.reply({ ...payload, ephemeral: true });
                await salon.send(payload);
                return interaction.reply({ content: `✅ Inscription publiée dans ${salon}`, ephemeral: true });
            }

            // Commande /affiliation
            if (interaction.commandName === 'affiliation') {
                const salon = interaction.options.getChannel('salon') || interaction.channel;
                const ephemere = interaction.options.getBoolean('ephemere') ?? false;
                const color = sanitizeColor(interaction.options.getString('couleur'));

                const payload = {
                    embeds: [buildListEmbed(AFFILIATION, color)],
                    components: buildNumberedRows(AFFILIATION, 'aff'),
                };

                if (ephemere) return interaction.reply({ ...payload, ephemeral: true });
                await salon.send(payload);
                return interaction.reply({ content: `✅ Affiliation publiée dans ${salon}`, ephemeral: true });
            }

            // Commande /poll
            if (interaction.commandName === 'poll') {
                if (!hasRequiredRole(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Vous n\'avez pas la permission de créer des sondages.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const question = interaction.options.getString('question');
                const optionsString = interaction.options.getString('options');
                const duration = interaction.options.getInteger('duree');
                const type = interaction.options.getString('type');

                const options = optionsString.split(';').map(opt => opt.trim()).filter(opt => opt.length > 0);

                if (options.length < 2) {
                    return interaction.reply({
                        content: '❌ Il faut au moins 2 options pour créer un sondage.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (options.length > 10) {
                    return interaction.reply({
                        content: '❌ Maximum 10 options autorisées.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const now = Date.now();
                const endsAt = now + (duration * 60 * 60 * 1000);

                let description = '';
                options.forEach((option, index) => {
                    description += `\n${numberEmojis[index]} **${option}**\n`;
                    description += `└ 0 vote(s) (0%)\n`;
                });

                const typeIcon = type === 'unique' ? '🔘' : '☑️';
                const typeText = type === 'unique' ? 'Vote unique' : 'Votes multiples';

                const embed = new EmbedBuilder()
                    .setColor(0xFF9900)
                    .setTitle(`📊 ${question}`)
                    .setDescription(description)
                    .addFields(
                        { name: 'Type de vote', value: `${typeIcon} ${typeText}`, inline: true },
                        { name: 'Temps restant', value: `⏱️ ${formatTimeRemaining(endsAt)}`, inline: true },
                        { name: 'Total de votes', value: '0', inline: true }
                    )
                    .setFooter({ text: 'Réagis avec les emojis pour voter !' })
                    .setTimestamp(now);

                await interaction.reply({ content: '✅ Sondage créé avec succès !', flags: MessageFlags.Ephemeral });
                const pollMessage = await interaction.channel.send({ embeds: [embed] });

                for (let i = 0; i < options.length; i++) {
                    await pollMessage.react(numberEmojis[i]);
                }

                const pollData = {
                    messageId: pollMessage.id,
                    channelId: interaction.channel.id,
                    question,
                    options,
                    type,
                    createdBy: interaction.user.id,
                    createdAt: now,
                    endsAt,
                    votes: {}
                };

                options.forEach((_, index) => {
                    pollData.votes[index] = [];
                });

                config.active_polls[pollMessage.id] = pollData;
                saveConfig();

                const timer = setTimeout(() => {
                    closePoll(pollMessage.id, 'automatique');
                }, duration * 60 * 60 * 1000);

                activePollTimers.set(pollMessage.id, timer);

                let durationText;
                if (duration >= 24) {
                    const days = Math.floor(duration / 24);
                    const hours = duration % 24;
                    durationText = hours > 0 ? `${days}j ${hours}h` : `${days}j`;
                } else {
                    durationText = `${duration}h`;
                }
                await sendLog(interaction.guild, `📊 Nouveau sondage créé par **${interaction.user}** : "${question}" (${durationText})`);

                console.log(`✅ Sondage créé : "${question}" - ID: ${pollMessage.id}`);
            }

            // Commande /poll-close
            if (interaction.commandName === 'poll-close') {
                const messageId = interaction.options.getString('message_id');

                const pollData = config.active_polls[messageId];
                if (!pollData) {
                    return interaction.reply({
                        content: '❌ Aucun sondage actif trouvé avec cet ID.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const isCreator = pollData.createdBy === interaction.user.id;
                const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

                if (!isCreator && !isAdmin) {
                    return interaction.reply({
                        content: '❌ Seul le créateur du sondage ou un administrateur peut le fermer.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                await closePoll(messageId, 'manuelle');
                await interaction.reply({
                    content: '✅ Le sondage a été fermé avec succès !',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Commande /poll-history
            if (interaction.commandName === 'poll-history') {
                const page = interaction.options.getInteger('page') || 1;
                const perPage = 5;

                if (config.poll_history.length === 0) {
                    return interaction.reply({
                        content: '📊 Aucun sondage dans l\'historique.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const totalPages = Math.ceil(config.poll_history.length / perPage);
                const startIndex = (page - 1) * perPage;
                const endIndex = startIndex + perPage;
                const pagePolls = config.poll_history.slice(startIndex, endIndex);

                if (pagePolls.length === 0) {
                    return interaction.reply({
                        content: `❌ La page ${page} n'existe pas. Il y a ${totalPages} page(s) au total.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('📊 Historique des sondages')
                    .setFooter({ text: `Page ${page}/${totalPages} • Total: ${config.poll_history.length} sondage(s)` });

                pagePolls.forEach((poll, index) => {
                    const pollNumber = startIndex + index + 1;
                    const date = new Date(poll.closedAt).toLocaleString('fr-FR');
                    const winnersText = poll.winners && poll.winners.length > 0
                        ? `🏆 ${poll.winners.join(', ')}`
                        : '❌ Aucun vote';

                    embed.addFields({
                        name: `${pollNumber}. ${poll.question}`,
                        value: `**Votes:** ${poll.totalVotes} • **Date:** ${date}\n${winnersText}`,
                        inline: false
                    });
                });

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        // ========== BOUTONS ==========
        if (interaction.isButton()) {
            // INSCRIPTION
            if (interaction.customId.startsWith('insc_q_')) {
                const n = Number(interaction.customId.split('_').pop());
                const idx = isNaN(n) ? -1 : n - 1;
                const question = INSCRIPTION.questions[idx] ?? 'Question';
                const answer = INSCRIPTION.answers[idx] ?? 'Réponse non définie.';

                return interaction.reply({
                    content: `❓ **${question}**\n\n${answer}`,
                    ephemeral: true,
                });
            }

            // AFFILIATION
            if (interaction.customId.startsWith('aff_q_')) {
                const n = Number(interaction.customId.split('_').pop());
                const idx = isNaN(n) ? -1 : n - 1;
                const question = AFFILIATION.questions[idx] ?? 'Question';
                const answer = AFFILIATION.answers[idx] ?? 'Réponse non définie.';

                return interaction.reply({
                    content: `❓ **${question}**\n\n${answer}`,
                    ephemeral: true,
                });
            }
        }
    } catch (error) {
        console.error('❌ Erreur dans interactionCreate:', error);
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                ephemeral: true,
            }).catch(() => {});
        }
    }
});

// Événement : Réaction ajoutée
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (user.bot) return;

        logWithTimestamp(`Réaction ajoutée: ${reaction.emoji.name} par ${user.tag} sur message ${reaction.message.id}`, 'DEBUG');

        if (reaction.partial) {
            try {
                logWithTimestamp(`Récupération de la réaction partielle...`, 'DEBUG');
                await reaction.fetch();
                logWithTimestamp(`Réaction partielle récupérée avec succès`, 'DEBUG');
            } catch (error) {
                logWithTimestamp(`Erreur lors de la récupération de la réaction partielle: ${error.message}`, 'ERROR');
                console.error(error.stack);
                return;
            }
        }

        if (!reaction.message || !reaction.message.guild) {
            logWithTimestamp(`Message ou guild non accessible pour la réaction`, 'WARN');
            return;
        }

        // GESTION DES VOTES DE SONDAGES
        const pollData = config.active_polls[reaction.message.id];
        if (pollData) {
            const emojiName = reaction.emoji.name;
            const optionIndex = numberEmojis.indexOf(emojiName);

            if (optionIndex === -1 || optionIndex >= pollData.options.length) {
                await reaction.users.remove(user.id).catch(() => {});
                return;
            }

            if (pollData.type === 'unique') {
                for (let i = 0; i < pollData.options.length; i++) {
                    if (i !== optionIndex && pollData.votes[i].includes(user.id)) {
                        pollData.votes[i] = pollData.votes[i].filter(id => id !== user.id);

                        const oldReaction = reaction.message.reactions.cache.get(numberEmojis[i]);
                        if (oldReaction) {
                            await oldReaction.users.remove(user.id).catch(() => {});
                        }
                    }
                }
            }

            if (!pollData.votes[optionIndex].includes(user.id)) {
                pollData.votes[optionIndex].push(user.id);

                config.active_polls[reaction.message.id] = pollData;
                saveConfig();

                await updatePollEmbed(reaction.message, pollData);

                console.log(`✅ Vote enregistré : ${user.tag} -> Option ${optionIndex + 1} sur le sondage "${pollData.question}"`);
            }

            return;
        }

        // GESTION DU RÈGLEMENT
        try {
            if (reaction.message.id !== config.rules_message_id) {
                logWithTimestamp(`Réaction sur un message qui n'est pas le règlement (${reaction.message.id})`, 'DEBUG');
                return;
            }

            logWithTimestamp(`Réaction sur le message du règlement détectée`, 'INFO');

            if (reaction.emoji.name !== config.emoji) {
                logWithTimestamp(`Emoji incorrect: ${reaction.emoji.name} (attendu: ${config.emoji})`, 'DEBUG');
                return;
            }

            logWithTimestamp(`Emoji correct détecté: ${config.emoji}`, 'INFO');

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                logWithTimestamp(`Membre ${user.tag} non trouvé dans la guild`, 'WARN');
                return;
            }

            logWithTimestamp(`Membre ${member.user.tag} trouvé, vérification de l'attribution de rôle...`, 'INFO');

            if (VERIFIED_ROLE_ID === '0') {
                await sendLog(guild, `✅ **${member}** a accepté le règlement`);
                logWithTimestamp(`${member.user.tag} a accepté le règlement (attribution de rôle désactivée)`, 'INFO');
                return;
            }

            const memberRoles = member.roles.cache.filter(r => r.id !== guild.id);
            if (memberRoles.size > 0) {
                logWithTimestamp(`${member.user.tag} a déjà ${memberRoles.size} rôle(s), attribution ignorée`, 'INFO');
                await sendLog(guild, `✅ **${member}** a accepté le règlement (a déjà des rôles)`);
                return;
            }

            const role = guild.roles.cache.get(VERIFIED_ROLE_ID);
            if (!role) {
                logWithTimestamp(`Rôle avec l'ID ${VERIFIED_ROLE_ID} n'existe pas dans la guild`, 'ERROR');
                await sendLog(guild, `✅ **${member}** a accepté le règlement\n❌ Erreur: Le rôle avec l'ID ${VERIFIED_ROLE_ID} n'existe pas!`);
                return;
            }

            logWithTimestamp(`Tentative d'attribution du rôle "${role.name}" à ${member.user.tag}...`, 'INFO');

            try {
                await member.roles.add(role, 'Acceptation du règlement');
                await sendLog(guild, `✅ **${member}** a accepté le règlement et a reçu le rôle **${role.name}**`);
                logWithTimestamp(`✅ ${member.user.tag} a validé le règlement et reçu le rôle ${role.name}`, 'SUCCESS');
            } catch (roleError) {
                logWithTimestamp(`Erreur lors de l'attribution du rôle: ${roleError.message}`, 'ERROR');
                console.error(roleError.stack);
                await sendLog(guild, `✅ **${member}** a accepté le règlement\n❌ Erreur: Pas la permission de donner le rôle - ${roleError.message}`);
            }
        } catch (reglementError) {
            logWithTimestamp(`Erreur dans la gestion du règlement: ${reglementError.message}`, 'ERROR');
            console.error(reglementError.stack);
        }

    } catch (outerError) {
        logWithTimestamp(`Erreur critique dans messageReactionAdd: ${outerError.message}`, 'ERROR');
        console.error(outerError.stack);
    }
});

// Événement : Réaction retirée
client.on('messageReactionRemove', async (reaction, user) => {
    try {
        if (user.bot) return;

        logWithTimestamp(`Réaction retirée: ${reaction.emoji.name} par ${user.tag} sur message ${reaction.message.id}`, 'DEBUG');

        if (reaction.partial) {
            try {
                logWithTimestamp(`Récupération de la réaction partielle (removal)...`, 'DEBUG');
                await reaction.fetch();
                logWithTimestamp(`Réaction partielle récupérée avec succès (removal)`, 'DEBUG');
            } catch (error) {
                logWithTimestamp(`Erreur lors de la récupération de la réaction partielle (removal): ${error.message}`, 'ERROR');
                console.error(error.stack);
                return;
            }
        }

        if (!reaction.message || !reaction.message.guild) {
            logWithTimestamp(`Message ou guild non accessible pour le retrait de réaction`, 'WARN');
            return;
        }

        // GESTION DES VOTES DE SONDAGES
        const pollData = config.active_polls[reaction.message.id];
        if (pollData) {
            const emojiName = reaction.emoji.name;
            const optionIndex = numberEmojis.indexOf(emojiName);

            if (optionIndex === -1 || optionIndex >= pollData.options.length) {
                return;
            }

            if (pollData.votes[optionIndex].includes(user.id)) {
                pollData.votes[optionIndex] = pollData.votes[optionIndex].filter(id => id !== user.id);

                config.active_polls[reaction.message.id] = pollData;
                saveConfig();

                await updatePollEmbed(reaction.message, pollData);

                console.log(`❌ Vote retiré : ${user.tag} -> Option ${optionIndex + 1} sur le sondage "${pollData.question}"`);
            }

            return;
        }

        // GESTION DU RÈGLEMENT
        try {
            if (reaction.message.id !== config.rules_message_id) {
                logWithTimestamp(`Retrait de réaction sur un message qui n'est pas le règlement (${reaction.message.id})`, 'DEBUG');
                return;
            }

            logWithTimestamp(`Retrait de réaction sur le message du règlement détectée`, 'INFO');

            if (reaction.emoji.name !== config.emoji) {
                logWithTimestamp(`Emoji incorrect (removal): ${reaction.emoji.name} (attendu: ${config.emoji})`, 'DEBUG');
                return;
            }

            logWithTimestamp(`Emoji correct détecté (removal): ${config.emoji}`, 'INFO');

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                logWithTimestamp(`Membre ${user.tag} non trouvé dans la guild (removal)`, 'WARN');
                return;
            }

            logWithTimestamp(`Membre ${member.user.tag} trouvé, vérification du retrait de rôle...`, 'INFO');

            if (VERIFIED_ROLE_ID === '0') {
                await sendLog(guild, `❌ **${member}** a retiré son acceptation du règlement`);
                logWithTimestamp(`${member.user.tag} a retiré son acceptation (retrait de rôle désactivé)`, 'INFO');
                return;
            }

            const role = guild.roles.cache.get(VERIFIED_ROLE_ID);
            if (!role) {
                logWithTimestamp(`Rôle avec l'ID ${VERIFIED_ROLE_ID} n'existe pas dans la guild (removal)`, 'ERROR');
                await sendLog(guild, `❌ **${member}** a retiré son acceptation du règlement (rôle introuvable)`);
                return;
            }

            logWithTimestamp(`Tentative de retrait du rôle "${role.name}" à ${member.user.tag}...`, 'INFO');

            try {
                await member.roles.remove(role, 'Retrait d\'acceptation du règlement');
                await sendLog(guild, `❌ **${member}** a retiré son acceptation du règlement et le rôle **${role.name}** a été retiré`);
                logWithTimestamp(`❌ ${member.user.tag} a retiré son acceptation et perdu le rôle ${role.name}`, 'INFO');
            } catch (roleError) {
                logWithTimestamp(`Erreur lors du retrait du rôle: ${roleError.message}`, 'ERROR');
                console.error(roleError.stack);
                await sendLog(guild, `❌ **${member}** a retiré son acceptation du règlement\n❌ Erreur: Pas la permission de retirer le rôle - ${roleError.message}`);
            }
        } catch (reglementError) {
            logWithTimestamp(`Erreur dans la gestion du règlement (removal): ${reglementError.message}`, 'ERROR');
            console.error(reglementError.stack);
        }

    } catch (outerError) {
        logWithTimestamp(`Erreur critique dans messageReactionRemove: ${outerError.message}`, 'ERROR');
        console.error(outerError.stack);
    }
});

// ========================================
// GESTION DES ÉVÉNEMENTS DE CONNEXION
// ========================================

client.on('warn', info => {
    logWithTimestamp(`Avertissement Discord: ${info}`, 'WARN');
});

client.on('shardDisconnect', (event, shardId) => {
    logWithTimestamp(`Déconnexion du shard ${shardId} - Code: ${event.code} - Raison: ${event.reason || 'Non spécifiée'}`, 'WARN');
});

client.on('shardReconnecting', shardId => {
    logWithTimestamp(`Reconnexion du shard ${shardId} en cours...`, 'INFO');
});

client.on('shardResume', (shardId, replayedEvents) => {
    logWithTimestamp(`Shard ${shardId} reconnecté - ${replayedEvents} événements rejoués`, 'SUCCESS');
});

client.on('shardError', (error, shardId) => {
    logWithTimestamp(`Erreur sur le shard ${shardId}: ${error.message}`, 'ERROR');
    console.error(error.stack);
});

client.on('shardReady', (shardId, unavailableGuilds) => {
    logWithTimestamp(`Shard ${shardId} prêt - Guildes indisponibles: ${unavailableGuilds ? unavailableGuilds.size : 0}`, 'SUCCESS');
});

client.on('error', error => {
    logWithTimestamp(`Erreur du client Discord: ${error.message}`, 'ERROR');
    console.error(error.stack);
});

client.on('rateLimit', rateLimitData => {
    logWithTimestamp(`Rate limit atteint - Timeout: ${rateLimitData.timeout}ms - Route: ${rateLimitData.route}`, 'WARN');
});

process.on('unhandledRejection', (error, promise) => {
    logWithTimestamp(`Erreur non gérée (Promise): ${error.message}`, 'ERROR');
    console.error('Promise:', promise);
    console.error(error.stack);
});

process.on('uncaughtException', error => {
    logWithTimestamp(`Exception non capturée: ${error.message}`, 'ERROR');
    console.error(error.stack);
});

// Heartbeat pour vérifier que le bot est toujours vivant
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    logWithTimestamp(`Heartbeat - Mémoire: ${memoryMB}MB - Ping: ${client.ws.ping}ms - Guildes: ${client.guilds.cache.size}`, 'DEBUG');
}, 5 * 60 * 1000); // Toutes les 5 minutes

// Connexion du bot
if (!DISCORD_TOKEN) {
    console.error('❌ ERREUR: DISCORD_TOKEN non trouvé dans le fichier .env');
    console.error('Veuillez créer un fichier .env avec votre token Discord');
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error('❌ ERREUR: CLIENT_ID non trouvé dans le fichier .env');
    console.error('Veuillez ajouter l\'ID de votre bot dans le fichier .env');
    process.exit(1);
}

// Enregistrer les commandes puis se connecter
registerCommands().then(() => {
    client.login(DISCORD_TOKEN).catch(error => {
        console.error('❌ Erreur de connexion:', error.message);
        process.exit(1);
    });
}).catch(error => {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error.message);
    process.exit(1);
});