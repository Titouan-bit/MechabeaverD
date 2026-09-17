const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const { ChannelType } = require('discord.js');

const app = express();
app.use(cors());
app.use(express.json());


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


client.once('ready', () => {
    console.log(`🤖 Bot Discord connecté en tant que ${client.user.tag} !`);
});

const SendVerifTickets = async function(TicketsChanel, message) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    const ticketEmbed = new EmbedBuilder()
        .setTitle('Résultats de la recherche de chaine')
        .setDescription('Veuillez cliquer sur le bouton qui contient la chaine voulue pour le post de ticket')
    
    const row = new ActionRowBuilder();

    let which = 0;
    if (TicketsChanel.size > 1) {
        TicketsChanel.forEach((channel) => {
            const ticketsButton = new ButtonBuilder()
            .setCustomId(`select_channel_${channel.id}`)
                .setLabel(channel.name)
                .setStyle(ButtonStyle.Primary);
            row.addComponents(ticketsButton);
        });
        which = 1;
    } else {
        const ticketButtonG = new ButtonBuilder()
        .setCustomId(`good`)
            .setLabel('Good !')
            .setStyle(ButtonStyle.Success);
        
        const ticketButtonF = new ButtonBuilder()
        .setCustomId(`false`)
            .setLabel('No !')
            .setStyle(ButtonStyle.Danger);
        row.addComponents(ticketButtonG, ticketButtonF);
        which = 2;
    }
    if (which == 1) {
        await message.channel.send({embeds: [ticketEmbed],components: [row]});
    } else {
        await message.channel.send({embeds: [ticketEmbed],components: [row]});
    }
    
}

client.on('guildCreate', async (guild) => {
    console.log(`🚀 Le bot a rejoint un nouveau serveur : ${guild.name}`);
    const textChannels = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildText
    );
    const roles = guild.roles.cache
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const text = message.content
    if (text === '/ping') {
        await message.reply('Pong! 🏓');
    }

    if (text === "/add-ticket") {
        const TicketsChanel = message.guild.channels.cache.filter(
            (channel) => channel.name.includes('tickets') && channel.type === ChannelType.GuildText
        );
        
        if (TicketsChanel.size === 0) {
            await message.channel.send('❌ There is no channel : Tickets');
            return;
        } else {
            await SendVerifTickets(TicketsChanel, message);
        }
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