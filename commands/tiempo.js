const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRank, getRankData, getRankIndex, RANGOS, RANGOS_NOMBRES, getUserHistory } = require('../utils');

function calculateWeightedTime(currentRankName, previousRankName, playerCount = 4) {
    const currentData = getRankData(currentRankName);
    
    let baseTime = currentData.time;
    if (playerCount === 3) baseTime = currentData.time3p;
    else if (playerCount === 2) baseTime = currentData.time2p;

    if (previousRankName) {
        const cIndex = getRankIndex(currentRankName);
        const pIndex = getRankIndex(previousRankName);

        // Penalizar solo si el rango anterior era mayor (mejor) que el actual
        if (pIndex > cIndex) {
            const previousData = getRankData(previousRankName);
            let prevTime = previousData.time;
            if (playerCount === 3) prevTime = previousData.time3p;
            else if (playerCount === 2) prevTime = previousData.time2p;
            
            return (baseTime * (2 / 3)) + (prevTime * (1 / 3));
        }
    }

    return baseTime;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tiempo')
        .setDescription('Calcula el tiempo objetivo de la partida.')
        .addStringOption(option => option.setName('jugador1').setDescription('Mención @jugador o Rango (ej: S+, S/A)').setRequired(true))
        .addStringOption(option => option.setName('jugador2').setDescription('Compañero 2 (Mención o Rango)').setRequired(true))
        .addStringOption(option => option.setName('jugador3').setDescription('Compañero 3 (Mención, Rango, o "-" para vacío)').setRequired(true))
        .addStringOption(option => option.setName('jugador4').setDescription('Compañero 4 (Mención, Rango, o "-" para vacío)').setRequired(true)),
    async execute(interaction) {
        const inputStrings = [
            interaction.options.getString('jugador1'),
            interaction.options.getString('jugador2'),
            interaction.options.getString('jugador3'),
            interaction.options.getString('jugador4')
        ];

        // Filtrar inputs para contar los que no sean un guion "-"
        const validInputs = inputStrings.filter(input => {
            if (!input) return false;
            const str = input.trim();
            if (str === '-' || str.toLowerCase() === 'nada' || str.toLowerCase() === 'vacio') return false; // Ignorar explícitamente vacíos
            return true; // Contar cualquier otra cosa como jugador (si no es válido, se le asignará Sin-Rango)
        });
        const playerCount = validInputs.length;

        let playersInfo = [];

        for (let i = 0; i < playerCount; i++) {
            const input = validInputs[i].trim();
            const mentionMatch = input.match(/^<@!?(\d+)>$/);

            if (mentionMatch) {
                // Es un usuario mencionado
                const userId = mentionMatch[1];
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    const currentRank = getUserRank(member);
                    const history = getUserHistory(member);

                    playersInfo.push({
                        name: member.displayName,
                        currentRank: currentRank,
                        previousRank: history ? history.rankName : null,
                        historySeason: history ? history.season : null,
                        isMention: true,
                        user: member.user,
                        isFake: false,
                        id: userId
                    });
                } catch (error) {
                    playersInfo.push({
                        name: 'Desconocido',
                        currentRank: 'Sin-Rango',
                        previousRank: null,
                        historySeason: null,
                        isMention: true,
                        user: null,
                        isFake: false,
                        id: userId
                    });
                }
            } else {
                // Es un rango especificado como texto
                const parts = input.split('/');
                const cRank = parts[0].trim();

                // Validar que el primer rango sea válido
                if (!RANGOS_NOMBRES.includes(cRank)) {
                    return interaction.reply({
                        content: `❌ **Error:** "${input}" no es un parámetro válido. Cada espacio debe ser una mención (\`@Jugador\`), un guion (\`-\`) para omitir, o un rango válido (ej: \`C\` o \`S+/A\`).`,
                        ephemeral: true
                    });
                }

                let currentRank = cRank;
                let previousRank = null;
                let historySeason = 'Hip';

                if (parts.length > 1) {
                    const pRank = parts[1].trim();
                    if (!RANGOS_NOMBRES.includes(pRank)) {
                        return interaction.reply({
                            content: `❌ **Error:** El rango histórico "${pRank}" en "${input}" no es válido. Usa uno de: ${RANGOS_NOMBRES.join(', ')}.`,
                            ephemeral: true
                        });
                    }
                    previousRank = pRank;
                }

                playersInfo.push({
                    name: `J${i + 1}`,
                    currentRank: currentRank,
                    previousRank: previousRank,
                    historySeason: previousRank ? historySeason : null,
                    isMention: false,
                    user: null,
                    isFake: true,
                    id: null
                });
            }
        }

        const p1CurrentRank = playersInfo[0].currentRank;
        const p1Index = getRankIndex(p1CurrentRank);
        const p1EffectiveRankData = RANGOS[p1Index + 1];
        const p1EffectiveRankName = p1EffectiveRankData ? p1EffectiveRankData.name : null;

        if (p1CurrentRank === 'S+') {
            return interaction.reply({ content: 'El Jugador 1 ya es **S+** y no puede subir más de rango.' });
        }

        const isSRankUp = p1EffectiveRankName === 'S' || p1EffectiveRankName === 'S+';
        let logThread = null;
        let ticketCount = 0;

        // Validaciones estrictas para S y S+
        if (isSRankUp) {
            const hasNonMentions = playersInfo.some(p => !p.isMention);
            if (hasNonMentions) {
                return interaction.reply({ content: `❌ **Error:** Para subir a rango **${p1EffectiveRankName}**, TODOS los jugadores del equipo deben ser mencionados (@Jugador). No se permiten rangos en texto (Los vacíos con "-" sí están permitidos).`, ephemeral: true });
            }

            const uniqueIds = new Set(playersInfo.map(p => p.id));
            if (uniqueIds.size !== playersInfo.length) {
                return interaction.reply({ content: `❌ **Error:** Hay jugadores repetidos en el equipo. Por favor, menciona a jugadores distintos.`, ephemeral: true });
            }

            for (let i = 1; i < playerCount; i++) {
                const mateIndex = getRankIndex(playersInfo[i].currentRank);
                if (p1Index >= mateIndex + 2) {
                    return interaction.reply({ content: `❌ **Error:** El Jugador 1 tiene 2 o más rangos de diferencia con ${playersInfo[i].name}. No puede subir a **${p1EffectiveRankName}** hasta que este compañero suba de rango.`, ephemeral: true });
                }
            }

            // Validar Tickets en el hilo comandos-bot-caché
            const activeThreads = await interaction.guild.channels.fetchActiveThreads();
            logThread = activeThreads.threads.find(t => t.name === 'comandos-bot-caché');
            if (!logThread) {
                logThread = interaction.guild.channels.cache.find(c => c.name === 'comandos-bot-caché');
            }

            if (logThread) {
                const oldestValidTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours
                const messages = await logThread.messages.fetch({ limit: 100 });
                messages.forEach(msg => {
                    if (msg.createdTimestamp >= oldestValidTime) {
                        if (msg.content.includes(`USER: ${playersInfo[0].id}`) && msg.content.includes('TICKET S/S+')) {
                            ticketCount++;
                        }
                    }
                });
            }

            if (ticketCount >= 3) {
                return interaction.reply({ 
                    content: `❌ **Límite Alcanzado:** <@${playersInfo[0].id}> ha agotado sus 3 intentos de roles aleatorios para subir a rango S/S+. Debes esperar 2 horas desde tu primer intento para que se renueven los tickets.`, 
                    ephemeral: true 
                });
            }
        }

        let warnings = [];

        // Comprobar diferencia de 2 rangos o más (Solo advertencia para no-S)
        if (!isSRankUp) {
            for (let i = 1; i < playerCount; i++) {
                const mateIndex = getRankIndex(playersInfo[i].currentRank);
                if (p1Index >= mateIndex + 2) {
                    warnings.push(`⚠️ **Advertencia:** El jugador 1 tiene 2 o más rangos de diferencia con ${playersInfo[i].name}. No podrá subir de rango hasta que este compañero suba.`);
                }
            }
        }

        // Si alguien es Sin-Rango (en su rango actual)
        const sinRangoPlayers = playersInfo.filter(p => p.currentRank === 'Sin-Rango');
        if (sinRangoPlayers.length > 0) {
            let sinRangoTime = '17:00';
            let extraReason = '';
            
            if (playerCount === 3) {
                sinRangoTime = '17:20';
                extraReason = ' y estar jugando en Trío (3 personas)';
            } else if (playerCount === 2) {
                sinRangoTime = '18:25';
                extraReason = ' y estar jugando en Dúo (2 personas)';
            }
            
            const subenNombres = sinRangoPlayers.map(p => p.name).join(', ');
            let msg = `⏳ **Tiempo Objetivo:** ${sinRangoTime}\n\n*Al haber jugador(es) "Sin-Rango" en la party (${subenNombres})${extraReason}, el tiempo requerido es automáticamente ${sinRangoTime}.*`;
            msg += `\n\n🎉 **Promoción:** Si se logra este tiempo, el/los siguiente(s) integrante(s) subirán a **Rango C**: **${subenNombres}**.`;

            if (warnings.length > 0) msg += `\n\n${warnings.join('\n')}`;
            return interaction.reply({ content: msg });
        }

        // Cálculo de promedio ponderado
        const p1WeightedTime = calculateWeightedTime(p1EffectiveRankName, playersInfo[0].previousRank, playerCount);
        let sumTotal = p1WeightedTime * p1EffectiveRankData.weight;
        let sumWeights = p1EffectiveRankData.weight;

        for (let i = 1; i < playerCount; i++) {
            const pInfo = playersInfo[i];
            const rankData = getRankData(pInfo.currentRank);
            const weightedTime = calculateWeightedTime(pInfo.currentRank, pInfo.previousRank, playerCount);

            sumTotal += (weightedTime * rankData.weight);
            sumWeights += rankData.weight;
        }

        const targetSecondsRaw = sumTotal / sumWeights;
        const totalSeconds = Math.floor(targetSecondsRaw);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const formatTime = (totalSecs) => {
            const m = Math.floor(totalSecs / 60);
            const s = Math.floor(totalSecs % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        const rows = [];
        const p1RowRank = `${p1CurrentRank}➔${p1EffectiveRankName}`;

        let p1PrevStr = '';
        if (playersInfo[0].previousRank) {
            const pIndex = getRankIndex(playersInfo[0].previousRank);
            const cIndex = getRankIndex(p1EffectiveRankName);
            if (pIndex > cIndex) {
                const pWeight = getRankData(playersInfo[0].previousRank).weight;
                p1PrevStr = `  ${playersInfo[0].historySeason}: ${playersInfo[0].previousRank} ${pWeight}x`;
            }
        }
        rows.push(`${playersInfo[0].name.padEnd(15, ' ').substring(0, 15)} ${p1RowRank.padEnd(11, ' ')} ${formatTime(p1WeightedTime).padStart(5, ' ')}  ${p1EffectiveRankData.weight}x${p1PrevStr}`);

        for (let i = 1; i < playerCount; i++) {
            const pInfo = playersInfo[i];
            const rankData = getRankData(pInfo.currentRank);
            const weightedTime = calculateWeightedTime(pInfo.currentRank, pInfo.previousRank, playerCount);

            let prevStr = '';
            if (pInfo.previousRank) {
                const pIndex = getRankIndex(pInfo.previousRank);
                const cIndex = getRankIndex(pInfo.currentRank);
                if (pIndex > cIndex) {
                    const pWeight = getRankData(pInfo.previousRank).weight;
                    prevStr = `  ${pInfo.historySeason}: ${pInfo.previousRank} ${pWeight}x`;
                }
            }
            rows.push(`${pInfo.name.padEnd(15, ' ').substring(0, 15)} ${pInfo.currentRank.padEnd(11, ' ')} ${formatTime(weightedTime).padStart(5, ' ')}  ${rankData.weight}x${prevStr}`);
        }

        const partyBlock = `\`\`\`\n${rows.join('\n')}\n\`\`\``;

        const embed = new EmbedBuilder()
            .setTitle(`${playersInfo[0].name} ➔ ${p1EffectiveRankName} | Objetivo: ${formattedTime} (${playerCount}P)`)
            .setColor('#00b0f4')
            .addFields({ name: '', value: partyBlock });

        let replyOptions = { embeds: [embed] };
        
        if (warnings.length > 0) {
            replyOptions.content = warnings.join('\n');
        }

        if (isSRankUp) {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const contentPrefix = replyOptions.content ? replyOptions.content + '\n\n' : '';
            replyOptions.content = contentPrefix + `⚠️ **ATENCIÓN:** Para subir a Rango **${p1EffectiveRankName}**, es obligatorio jugar con **Roles Aleatorios**.\nHaz clic en el botón 🎲 abajo para generar tus roles. *(Intentos restantes: ${3 - ticketCount}/3)*`;
            
            const btnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('generar_roles_s')
                    .setEmoji('🎲')
                    .setLabel('Generar Roles Aleatorios')
                    .setStyle(ButtonStyle.Primary)
            );
            
            replyOptions.components = [btnRow];
        }

        const replyMessage = await interaction.reply({ ...replyOptions, fetchReply: true });

        if (isSRankUp) {
            const filter = i => i.customId === 'generar_roles_s';
            const collector = replyMessage.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.user.id !== playersInfo[0].id) {
                    await btnInteraction.reply({ content: `❌ Solo el jugador que va a subir de rango (<@${playersInfo[0].id}>) puede iniciar la asignación de roles.`, ephemeral: true });
                    return;
                }

                collector.stop('success');
                
                // Deshabilitar el botón
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('generar_roles_s')
                        .setEmoji('🎲')
                        .setLabel('Generar Roles Aleatorios')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
                await btnInteraction.update({ components: [disabledRow] }).catch(() => {});

                if (logThread) {
                    await logThread.send(`TICKET S/S+ | USER: ${playersInfo[0].id} | NAME: ${playersInfo[0].name} | DATE: <t:${Math.floor(Date.now() / 1000)}:F>`);
                }

                const assignments = playersInfo.map(p => ({
                    user: p.user,
                    isFake: p.isFake,
                    displayName: p.name,
                    isVoltedge: false,
                    roles: {}
                }));

                const { asignarDuo, asignarTrio, asignarSquad } = require('../rolesHelper');
                const officialMessage = `VÁLIDA PARA SUBIDA A RANGO ${p1EffectiveRankName} DE ${playersInfo[0].name}`;

                // Usa interaction.followUp ya que btnInteraction fue respondido con update
                if (playerCount === 2) {
                    await asignarDuo(btnInteraction, assignments, '', officialMessage);
                } else if (playerCount === 3) {
                    await asignarTrio(btnInteraction, assignments, '', officialMessage);
                } else if (playerCount === 4) {
                    await asignarSquad(btnInteraction, assignments, '', officialMessage);
                }
            });
            
            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const expiredRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('generar_roles_s')
                            .setEmoji('🎲')
                            .setLabel('Tiempo Expirado')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                    await interaction.editReply({ components: [expiredRow] }).catch(() => {});
                }
            });
        }
    },
};
