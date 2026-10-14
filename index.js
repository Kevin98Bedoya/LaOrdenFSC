require('dotenv').config();
const dns = require('node:dns');
// Forzar resolución IPv4 primero para evitar cuelgues de red/IPv6 en servidores Linux/Render
dns.setDefaultResultOrder('ipv4first');

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

// Monitoreo de eventos de red y límites de velocidad de la API de Discord
client.rest.on('rateLimited', (info) => {
	console.warn(`[REST RATELIMIT] Ruta: ${info.route} | Espera: ${info.timeToReset}ms | Global: ${info.global} | Límite: ${info.limit}`);
});

client.rest.on('invalidRequestWarning', (info) => {
	console.warn(`[REST INVALID WARNING] Conteo: ${info.count} | Tiempo restante: ${info.remainingTime}ms`);
});

client.on('warn', (info) => console.warn('[CLIENT WARN]', info));
client.on('error', (error) => console.error('[CLIENT ERROR]', error));

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

client.once('ready', () => {
	console.log(`[INFO] ¡Bot iniciado con éxito como ${client.user.tag}!`);
	const mem = process.memoryUsage();
	console.log(`[MEM] Heap usado: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
});

client.once('clientReady', () => {
	console.log(`[INFO] Evento clientReady disparado para ${client.user ? client.user.tag : 'bot'}`);
});

// Logs de depuración del WebSocket de Discord
client.on('debug', (info) => {
	if (info.includes('connect') || info.includes('Shard') || info.includes('Gateway') || info.includes('Identify') || info.includes('Session') || info.includes('token') || info.includes('Heartbeat')) {
		console.log('[DISCORD WS]', info);
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	const userTag = interaction.user ? interaction.user.tag : 'Desconocido';
	const channelName = interaction.channel ? interaction.channel.name : 'DM/Desconocido';
	const commandName = interaction.commandName;

	console.log(`[COMANDO] /${commandName} recibido de @${userTag} en #${channelName}`);

	if (!command) {
		console.warn(`[WARN] Comando /${commandName} no encontrado en client.commands.`);
		return;
	}

	// --- 1. Verificación de Comandos de Administrador / Oficial ---
	const adminCommands = ['nuevo', 'temporada-eliminar', 'temporada-nueva', 'temporada-reiniciar'];
	if (adminCommands.includes(commandName)) {
		const isAdmin = interaction.memberPermissions && interaction.memberPermissions.has('Administrator');
		const hasOficialRole = interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toLowerCase() === 'oficial');

		if (!isAdmin && !hasOficialRole) {
			console.log(`[PERMISOS] Denegado /${commandName} a @${userTag} (falta admin/oficial)`);
			return await interaction.reply({
				content: '❌ No tienes permisos para usar este comando. Se requiere ser **Administrador** o tener el rol **Oficial**.',
				ephemeral: true
			});
		}

		if (channelName !== '🕹️comandos-bot') {
			console.log(`[CANAL] Denegado /${commandName} en #${channelName} (requiere #🕹️comandos-bot)`);
			return await interaction.reply({
				content: '❌ Este comando solo se puede utilizar en el canal **#🕹️comandos-bot**.',
				ephemeral: true
			});
		}
	}

	// --- 2. Verificación de Canales para Comandos Generales ---
	const comandosBotGroup = ['tiempo', 'asignar-aleatorio', 'top'];
	if (comandosBotGroup.includes(commandName) && channelName !== '🕹️comandos-bot') {
		console.log(`[CANAL] Denegado /${commandName} en #${channelName} (requiere #🕹️comandos-bot)`);
		return await interaction.reply({
			content: '❌ Este comando solo se puede utilizar en el canal **#🕹️comandos-bot**.',
			ephemeral: true
		});
	}

	const comandosGremioGroup = ['top-gremio', 'premios'];
	if (comandosGremioGroup.includes(commandName) && channelName !== '🕹️🔵comandos-bot-gremio') {
		console.log(`[CANAL] Denegado /${commandName} en #${channelName} (requiere #🕹️🔵comandos-bot-gremio)`);
		return await interaction.reply({
			content: '❌ Este comando solo se puede utilizar en el canal **#🕹️🔵comandos-bot-gremio**.',
			ephemeral: true
		});
	}

	const envioRunsGroup = ['rango'];
	if (envioRunsGroup.includes(commandName) && channelName !== '📤envio-de-runs') {
		console.log(`[CANAL] Denegado /${commandName} en #${channelName} (requiere #📤envio-de-runs)`);
		return await interaction.reply({
			content: '❌ Este comando solo se puede utilizar en el canal **#📤envio-de-runs**.',
			ephemeral: true
		});
	}

	const startTime = Date.now();
	const warnTimer = setTimeout(() => {
		console.warn(`[ALERTA TIMEOUT] /${commandName} lleva más de 2500ms sin responder. Discord cancelará la interacción a los 3000ms si no se completó deferReply() o reply().`);
	}, 2500);

	try {
		console.log(`[EJECUCIÓN] Ejecutando /${commandName}...`);
		await command.execute(interaction);
		const duration = Date.now() - startTime;
		console.log(`[ÉXITO] /${commandName} completado en ${duration}ms.`);
	} catch (error) {
		const duration = Date.now() - startTime;
		console.error(`[ERROR] Falló /${commandName} tras ${duration}ms:`, error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: '¡Hubo un error al ejecutar este comando!', ephemeral: true }).catch(e => console.error('[ERROR] No se pudo enviar followUp:', e));
		} else {
			await interaction.reply({ content: '¡Hubo un error al ejecutar este comando!', ephemeral: true }).catch(e => console.error('[ERROR] No se pudo enviar reply:', e));
		}
	} finally {
		clearTimeout(warnTimer);
	}
});

// Capturadores globales de errores para evitar que el bot muera silenciosamente en Render
process.on('unhandledRejection', (reason, promise) => {
	console.error('[FATAL: unhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
	console.error('[FATAL: uncaughtException]', error);
});

console.log('[RED] Comprobando conectividad con Discord API...');
fetch('https://discord.com/api/v10/gateway', { signal: AbortSignal.timeout(5000) })
	.then(r => r.json())
	.then(data => console.log('[RED ÉXITO] Conectado a Discord API:', JSON.stringify(data)))
	.catch(err => console.error('[RED ERROR] Falló conexión a Discord API:', err.message));

const rawToken = process.env.DISCORD_TOKEN;
const token = rawToken ? rawToken.trim().replace(/^["']|["']$/g, '') : null;
console.log(`[CONFIG] DISCORD_TOKEN presente: ${Boolean(token)} (longitud: ${token ? token.length : 0})`);

if (!token) {
	console.error('[ERROR CRÍTICO] La variable de entorno DISCORD_TOKEN no está definida o está vacía en este entorno.');
} else {
	console.log('[LOGIN] Llamando client.login()...');
	client.login(token)
		.then(() => console.log('[LOGIN ÉXITO] Promise de client.login() resuelta con éxito.'))
		.catch(err => console.error('[LOGIN ERROR] client.login() fue rechazado con error:', err));
}

