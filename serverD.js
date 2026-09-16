const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

// 1. Initialisation d'Express (utile pour garder le service actif sur Render)
const app = express();
app.use(cors());
app.use(express.json());

// 2. URI MongoDB pointant vers la base de données spécifique "discord_bot"
const uri = process.env.MONGO_URI || "mongodb+srv://cordetitouan_db_user:C4acjgzdyKx79C19@cluster0.0gs17s7.mongodb.net/discord_bot?appName=Cluster0";

// 3. Connexion à MongoDB
mongoose.connect(uri)
  .then(() => console.log('🍃 Connecté à MongoDB (discord_bot) avec succès !'))
  .catch((err) => console.error('❌ Erreur de connexion MongoDB :', err));

// 4. Initialisation du client Discord avec les intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Événement : quand le bot Discord est prêt
client.once('ready', () => {
    console.log(`🤖 Bot Discord connecté en tant que ${client.user.tag} !`);
});

// Exemple de gestion de message simple
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        await message.reply('Pong! 🏓');
    }
});

// 5. Routes Express basiques pour Render
app.get('/ping', (req, res) => {
    res.send('OK');
});

app.get('/', (req, res) => {
    res.send('Bot Discord en ligne !');
});

// 6. Démarrage du serveur et connexion du bot
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Serveur web Discord actif sur le port ${port}`);
    
    // Connexion à Discord via le Token (pense à le mettre dans tes variables d'environnement sur Render)
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "TON_TOKEN_DISCORD_ICI";
    client.login(DISCORD_TOKEN);
});