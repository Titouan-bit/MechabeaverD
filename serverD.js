const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const ticketthemes = [];
const ModosRoles = []
const uri = process.env.MONGO_URI || "mongodb+srv://cordetitouan_db_user:C4acjgzdyKx79C19@cluster0.0gs17s7.mongodb.net/discord_bot?appName=Cluster0";

mongoose.connect(uri);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let TicketChannel = null;

client.once('ready', () => {
    console.log(`🤖 Bot Discord connecté en tant que ${client.user.tag} !`);
});

const SendTicket = async function(TicketChannel) {
    const CreateticketEmbed = new EmbedBuilder()
        .setTitle('Tickets')
        .setColor('#1E3A8A')
        .setDescription('Ouvre un ticket pour commencer une conversation avec le staff');

    const row = new ActionRowBuilder();

    const OpenTicket = new ButtonBuilder()
        .setCustomId('OpenTicket')
        .setLabel('Créer un ticket')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Secondary);

    row.addComponents(OpenTicket);

    await TicketChannel.send({ embeds: [CreateticketEmbed], components: [row] });
};

const SendThemes = async function(interaction) {
    const row = new ActionRowBuilder();

    const ticketEmbed = new EmbedBuilder()
        .setTitle('Choisir un thème')
        .setColor('#1E3A8A')
        .setDescription('Veuillez cliquer sur le bouton qui contient votre demande');

    ticketthemes.forEach((themes) => {
        const ticketsThemesButton = new ButtonBuilder()
            .setCustomId(`select_themes_${themes}`)
            .setLabel(themes)
            .setStyle(ButtonStyle.Success);
        row.addComponents(ticketsThemesButton);
    });
    
    await interaction.reply({ embeds: [ticketEmbed], components: [row], ephemeral: true });
};

const SendVerifTickets = async function(TicketsChanel, message) {
    const row = new ActionRowBuilder();
    const ticketEmbed = new EmbedBuilder()
        .setTitle('Résultats de la recherche de chaine')
        .setColor('#1E3A8A');

    if (TicketsChanel.size > 1) {
        ticketEmbed.setDescription('Veuillez cliquer sur le bouton qui contient la chaine voulue pour le post de ticket');
        TicketsChanel.forEach((channel) => {
            const ticketsButton = new ButtonBuilder()
                .setCustomId(`select_channel_${channel.id}`)
                .setLabel(channel.name)
                .setStyle(ButtonStyle.Primary);
            row.addComponents(ticketsButton);
        });
    } else {
        const channel = TicketsChanel.first();
        ticketEmbed.setDescription(`chaine trouvée: ${channel.name}`);
        const ticketButtonG = new ButtonBuilder()
            .setCustomId(`good`)
            .setLabel('Good !')
            .setStyle(ButtonStyle.Success);
        
        const ticketButtonF = new ButtonBuilder()
            .setCustomId(`false`)
            .setLabel('No !')
            .setStyle(ButtonStyle.Danger);
        row.addComponents(ticketButtonG, ticketButtonF);
    }

    await message.channel.send({ embeds: [ticketEmbed], components: [row] });
};

client.on('guildCreate', async (guild) => {
    console.log(`🚀 Le bot a rejoint un nouveau serveur : ${guild.name}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const isModo = message.member.roles.cache.some(role => 
        ModosRoles.map(r => r.toLowerCase()).includes(role.name.toLowerCase())
    );
    const text = message.content;
    

    if (text === '/ping') {
        await message.reply('Pong! 🏓');
    }

    if (text === "/add-ticket") {
        if (!isModo) {
            return message.reply("❌ Tu n'as pas les permissions d'administrateur pour utiliser cette commande !");
        }

        const staffRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'staff');
        if (!staffRole) {
            return message.reply("⚠️ Veuillez bien créer ou renommer un rôle en : Staff sur ce serveur pour que le bot puisse fonctionner, puis relancez la commande !");
        }

        const fetchedChannels = await message.guild.channels.fetch();
        const TicketsChanel = fetchedChannels.filter(
            (channel) => channel && channel.name.toLowerCase().includes('ticket') && 
            (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)
        );
        
        if (TicketsChanel.size === 0) {
            await message.channel.send("❌ Il n'y a pas de salon comportant : tickets");
            return;
        } else {
            await SendVerifTickets(TicketsChanel, message);
        }
    }

    if (text.startsWith("/ticket-themes")) {
        if (!isModo) {
            return message.reply("❌ Tu n'as pas les permissions d'administrateur pour utiliser cette commande !");
        }

        const args = text.slice("/ticket-themes".length).trim();

        if (!args) {
            return await message.channel.send("❌ Tu dois indiquer des thèmes séparés par une virgule (ex: /ticket-themes bug, question, autre)");
        }

        const themes = args.split(',').map(theme => theme.trim());
        ticketthemes.length = 0;
        ticketthemes.push(...themes);

        await message.channel.send('✅ thèmes mis à jour ! J\'envoie le message');
        if (TicketChannel) {
            await SendTicket(TicketChannel);
        } else {
            await message.channel.send('❌ Aucun salon de ticket n\'a été sélectionné au préalable.');
        }

    }

    if (text.startsWith('/def-modos')) {
        const args = text.slice("/def-modos".length).trim();

        if (!args) {
            return await message.channel.send("❌ Tu dois indiquer des roles séparés par une virgule (ex: /def-modos apprentis-modo, modo-prime, goats)");
        }

        const modos = args.split(',').map(theme => theme.trim());

        const invalidRoles = modos.filter(modoName => 
            !message.guild.roles.cache.find(role => role.name.toLowerCase() === modoName.toLowerCase())
        );
        if (invalidRoles.length > 0) {
            return await message.channel.send(`❌ Les rôles suivants n'existent pas sur ce serveur : ${invalidRoles.join(', ')}`);
        }

        await message.channel.send("✅ Rôles de modération enregistrés avec succès !");
        ModosRoles.push(...modos);
    }
});

client.on('interactionCreate', async function(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('select_channel_')) {
        const ChanelId = interaction.customId.replace('select_channel_', '');
        const selectedChannel = interaction.guild.channels.cache.get(ChanelId);
        
        if (!selectedChannel) {
            return await interaction.reply({ content: "❌ Salon introuvable.", ephemeral: true });
        }

        TicketChannel = selectedChannel;
        await interaction.reply({ content: 'Maintenant chosissez les thèmes des tickets avec /ticket-themes (themes séparés par une ,)', ephemeral: true });
    }

    if (interaction.customId === "good") {
        const selectedChannel = interaction.guild.channels.cache.find(
            (channel) => channel.name.toLowerCase().includes('ticket') && channel.type === ChannelType.GuildText
        );

        if (!selectedChannel) {
            return await interaction.reply({ content: "❌ Salon introuvable.", ephemeral: true });
        }

        TicketChannel = selectedChannel;
        await interaction.reply({ content: 'Maintenant chosissez les thèmes des tickets avec /ticket-themes (themes séparés par une ,)', ephemeral: true });
    }

    if (interaction.customId === "false") {
        await interaction.reply({ content: '❌ Relance la commande et si le problème persiste mp moi et envoie @aide', ephemeral: true });
    }

    if (interaction.customId === "OpenTicket") {
        await SendThemes(interaction);
    }

    if (interaction.customId.startsWith('select_themes_')) {
        const userName = interaction.user.username.toLowerCase();
        const theme = interaction.customId.replace('select_themes_', '');

        const staffRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'staff');
        const staffRoleId = staffRole ? staffRole.id : interaction.guild.id;
        const staffMention = staffRole ? `<@&${staffRole.id}>` : "@everyone";

        const Ticket = await interaction.guild.channels.create({
            name: `ticket-${userName}-${theme}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                },
                {
                    id: staffRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                },
            ],
        });
        
        await Ticket.send(`${staffMention}, un nouveau ticket pour ${theme}`);
        await Ticket.send(`<@${interaction.user.id}>, ton ticket a été pris en compte, un membre du staff va bientôt te répondre`);
    }
});

app.get('/ping', (req, res) => {
    res.send('OK');
});

app.get('/', (req, res) => {
    res.send('Bot Discord en ligne !');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Serveur web Discord actif sur le port ${port}`);
    
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "TOKEN";
    client.login(DISCORD_TOKEN);
});