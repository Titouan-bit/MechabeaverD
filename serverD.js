const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const ticketthemes = []
const uri = process.env.MONGO_URI || "mongodb+srv://cordetitouan_db_user:C4acjgzdyKx79C19@cluster0.0gs17s7.mongodb.net/discord_bot?appName=Cluster0";

mongoose.connect(uri)
  .then(() => console.log('🍃 Connecté à MongoDB (discord_bot) avec succès !'))
  .catch((err) => console.error('❌ Erreur de connexion MongoDB :', err));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const Time = function () {
    const time = Date.now() + (30 * 24 * 60 * 60 * 1000);
};

let TicketChannel = null;

client.once('ready', () => {
    console.log(`🤖 Bot Discord connecté en tant que ${client.user.tag} !`);
});

const SendTicket = async function(TicketChannel) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
}

const SendVerifTickets = async function(TicketsChanel, message) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
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
}

client.on('guildCreate', async (guild) => {
    console.log(`🚀 Le bot a rejoint un nouveau serveur : ${guild.name}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const text = message.content;
    
    if (text === '/ping') {
        await message.reply('Pong! 🏓');
    }

    if (text === "/add-ticket") {
        const fetchedChannels = await message.guild.channels.fetch();
        const TicketsChanel = fetchedChannels.filter(
            (channel) => channel && channel.name.toLowerCase().includes('ticket') && 
            (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)
        );
        console.log("Salons trouvés :", TicketsChanel.map(c => `${c.name} (type: ${c.type})`));
        
        if (TicketsChanel.size === 0) {
            await message.channel.send("❌ Il n'y a pas de salon comportant : tickets");
            return;
        } else {
            await SendVerifTickets(TicketsChanel, message);
        }
    }

    if (text.startsWith("/ticket-themes")) {
        if (Time) {
            const args = text.slice("/ticket-themes".length).trim();

            if (!args) {
                return await message.channel.reply("❌ Tu dois indiquer des thèmes séparés par une virgule (ex: /!ticket-themes bug, question, autre`)");
            }

            const themes = args.split(',').map(theme => theme.trim());
            ticketthemes.push(...themes);

            await message.channel.reply('✅ thèmes mis à jour ! J\'envoie le message');
            if (TicketChannel) {
                await SendTicket(TicketChannel);
            } else {
                await message.channel.reply('❌ Aucun salon de ticket n\'a été sélectionné au préalable.');
            }

        } else {
            await message.channel.reply('❌ Tu as dépassé le temps relance la commande !');
        }
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
        await interaction.reply({ content: 'Maintenant chosissez les thèmes des tickets avec /ticket-themes (themes séparés par une ,) dans les 3min', ephemeral: true });
        Time();
    }

    if (interaction.customId === "good") {
        const selectedChannel = interaction.guild.channels.cache.find(
            (channel) => channel.name.toLowerCase().includes('ticket') && channel.type === ChannelType.GuildText
        );

        if (!selectedChannel) {
            return await interaction.reply({ content: "❌ Salon introuvable.", ephemeral: true });
        }

        TicketChannel = selectedChannel;
        await interaction.reply({ content: 'Maintenant chosissez les thèmes des tickets avec /ticket-themes (themes séparés par une ,) dans les 3min', ephemeral: true });
        Time();
    }

    if (interaction.customId === "false") {
        await interaction.reply({ content: '❌ Relance la commande et si le problème persiste mp moi et envoie @aide', ephemeral: true });
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