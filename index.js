require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { Client, Collection, GatewayIntentBits, Options } = require('discord.js');

// Servidor HTTP simple para mantener Render despierto mediante pings
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Bot de Discord activo');
}).listen(PORT, () => {
	console.log(`Servidor HTTP listo en el puerto ${PORT}`);
});

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		PresenceManager: 0,
		ReactionManager: 0,
		ThreadManager: 0,
		GuildBanManager: 0,
		GuildInviteManager: 0,
		GuildScheduledEventManager: 0,
		GuildStickerManager: 0,
		StageScaleManager: 0,
		VoiceStateManager: 0
	})
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[ADVERTENCIA] Al comando en ${filePath} le falta una propiedad "data" o "execute" requerida.`);
	}
}

client.once('clientReady', () => {
	console.log(`¡Bot iniciado como ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	const channelName = interaction.channel ? interaction.channel.name : '';
	const commandName = interaction.commandName;

	// --- 1. Verificación de Comandos de Administrador / Oficial ---
	const adminCommands = ['nuevo', 'temporada-eliminar', 'temporada-nueva', 'temporada-reiniciar'];
	if (adminCommands.includes(commandName)) {
		const isAdmin = interaction.memberPermissions && interaction.memberPermissions.has('Administrator');
		const hasOficialRole = interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toLowerCase() === 'oficial');

		if (!isAdmin && !hasOficialRole) {
			return await interaction.reply({
				content: '❌ No tienes permisos para usar este comando. Se requiere ser **Administrador** o tener el rol **Oficial**.',
				ephemeral: true
			});
		}

		if (channelName !== '🕹️comandos-bot') {
			return await interaction.reply({
				content: '❌ Este comando solo se puede utilizar en el canal **#🕹️comandos-bot**.',
				ephemeral: true
			});
		}
	}

	// --- 2. Verificación de Canales para Comandos Generales ---
	const comandosBotGroup = ['tiempo', 'asignar-aleatorio', 'top'];
	if (comandosBotGroup.includes(commandName) && channelName !== '🕹️comandos-bot') {
		return await interaction.reply({
			content: '❌ Este comando solo se puede utilizar en el canal **#🕹️comandos-bot**.',
			ephemeral: true
		});
	}

	const comandosGremioGroup = ['top-gremio', 'premios'];
	if (comandosGremioGroup.includes(commandName) && channelName !== '🕹️🔵comandos-bot-gremio') {
		return await interaction.reply({
			content: '❌ Este comando solo se puede utilizar en el canal **#🕹️🔵comandos-bot-gremio**.',
			ephemeral: true
		});
	}

	const envioRunsGroup = ['rango'];
	if (envioRunsGroup.includes(commandName) && channelName !== '📤envio-de-runs') {
		return await interaction.reply({
			content: '❌ Este comando solo se puede utilizar en el canal **#📤envio-de-runs**.',
			ephemeral: true
		});
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: '¡Hubo un error al ejecutar este comando!', ephemeral: true });
		} else {
			await interaction.reply({ content: '¡Hubo un error al ejecutar este comando!', ephemeral: true });
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
