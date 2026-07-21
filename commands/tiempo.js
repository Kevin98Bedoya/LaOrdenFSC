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
                        historySeason: history ? history.season : null
                    });
                } catch (error) {
                    playersInfo.push({
                        name: 'Desconocido',
                        currentRank: 'Sin-Rango',
                        previousRank: null,
                        historySeason: null
                    });
                }
            } else {
                // Es un string hipotético
                let currentRank = 'Sin-Rango';
                let previousRank = null;
                let historySeason = 'Hip'; // Etiqueta para hipotético

                const parts = input.split('/');
                const cRank = parts[0].trim();
                if (RANGOS_NOMBRES.includes(cRank)) currentRank = cRank;

                if (parts.length > 1) {
                    const pRank = parts[1].trim();
                    if (RANGOS_NOMBRES.includes(pRank)) previousRank = pRank;
                }

                playersInfo.push({
                    name: `J${i + 1}`,
                    currentRank: currentRank,
                    previousRank: previousRank,
                    historySeason: previousRank ? historySeason : null
                });
            }
        }

        const p1CurrentRank = playersInfo[0].currentRank;
        const p1Index = getRankIndex(p1CurrentRank);

        let warnings = [];

        // Comprobar diferencia de 2 rangos o más
        for (let i = 1; i < playerCount; i++) {
            const mateIndex = getRankIndex(playersInfo[i].currentRank);
            if (p1Index >= mateIndex + 2) {
                warnings.push(`⚠️ **Advertencia:** El jugador 1 tiene 2 o más rangos de diferencia con ${playersInfo[i].name}. No podrá subir de rango hasta que este compañero suba.`);
            }
        }

        // Si alguien es Sin-Rango (en su rango actual)
        const hasSinRango = playersInfo.some(p => p.currentRank === 'Sin-Rango');
        if (hasSinRango) {
            let sinRangoTime = '17:00';
            let extraReason = '';
            
            if (playerCount === 3) {
                sinRangoTime = '17:50';
                extraReason = ' y estar jugando en Trío (3 personas)';
            } else if (playerCount === 2) {
                sinRangoTime = '18:15';
                extraReason = ' y estar jugando en Dúo (2 personas)';
            }
            
            let msg = `⏳ **Tiempo Objetivo:** ${sinRangoTime}\n\n*Al haber un jugador "Sin-Rango" en la party (como rango actual)${extraReason}, el tiempo requerido es automáticamente ${sinRangoTime}.*`;
            if (warnings.length > 0) msg += `\n\n${warnings.join('\n')}`;
            return interaction.reply({ content: msg });
        }

        if (p1CurrentRank === 'S+') {
            return interaction.reply({ content: 'El Jugador 1 ya es **S+** y no puede subir más de rango.' });
        }

        // Calcular rango efectivo para P1
        const p1EffectiveRankData = RANGOS[p1Index + 1];
        const p1EffectiveRankName = p1EffectiveRankData.name;

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

        // Build row for P1
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

        await interaction.reply(replyOptions);
    },
};
