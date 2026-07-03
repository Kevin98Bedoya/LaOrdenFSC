const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRank, getRankData, getRankIndex, RANGOS } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tiempo')
        .setDescription('Calcula el tiempo objetivo de la partida.')
        .addUserOption(option => option.setName('jugador1').setDescription('Jugador que intenta subir de rango').setRequired(true))
        .addUserOption(option => option.setName('jugador2').setDescription('Compañero 2').setRequired(true))
        .addUserOption(option => option.setName('jugador3').setDescription('Compañero 3').setRequired(true))
        .addUserOption(option => option.setName('jugador4').setDescription('Compañero 4').setRequired(true)),
    async execute(interaction) {
        const users = [
            interaction.options.getUser('jugador1'),
            interaction.options.getUser('jugador2'),
            interaction.options.getUser('jugador3'),
            interaction.options.getUser('jugador4')
        ];

        // Obtener rangos leyendo los roles del servidor
        const playerRanks = [];
        for (const user of users) {
            try {
                const member = await interaction.guild.members.fetch(user.id);
                playerRanks.push(getUserRank(member));
            } catch (error) {
                // Si el usuario ya no está en el servidor o hubo un error
                playerRanks.push('Sin-Rango');
            }
        }

        const p1CurrentRank = playerRanks[0];
        const p1Index = getRankIndex(p1CurrentRank);
        
        let warnings = [];

        // Comprobar diferencia de 2 rangos o más
        for (let i = 1; i < 4; i++) {
            const mateIndex = getRankIndex(playerRanks[i]);
            if (p1Index >= mateIndex + 2) {
                warnings.push(`⚠️ **Advertencia:** El jugador 1 tiene 2 o más rangos de diferencia con ${users[i].username}. No podrá subir de rango hasta que este compañero suba.`);
            }
        }

        // Si alguien es Sin-Rango
        if (playerRanks.includes('Sin-Rango')) {
            let msg = `⏳ **Tiempo Objetivo:** 17:00\n*Al haber un jugador "Sin-Rango" en la party, el tiempo requerido es automáticamente 17:00.*`;
            if (warnings.length > 0) msg += `\n\n${warnings.join('\n')}`;
            return interaction.reply({ content: msg });
        }

        if (p1CurrentRank === 'S+') {
            return interaction.reply({ content: 'El Jugador 1 ya es **S+** y no puede subir más de rango.' });
        }

        // Calcular rango efectivo para P1
        const p1EffectiveRankData = RANGOS[p1Index + 1];

        // Cálculo de promedio ponderado
        let sumTotal = p1EffectiveRankData.time * p1EffectiveRankData.weight;
        let sumWeights = p1EffectiveRankData.weight;

        for (let i = 1; i < 4; i++) {
            const rankData = getRankData(playerRanks[i]);
            sumTotal += (rankData.time * rankData.weight);
            sumWeights += rankData.weight;
        }

        const targetSecondsRaw = sumTotal / sumWeights;
        const totalSeconds = Math.floor(targetSecondsRaw);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const formatTime = (totalSecs) => {
            const m = Math.floor(totalSecs / 60);
            const s = totalSecs % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        const rows = [];
        const p1RowRank = `${p1CurrentRank}➔${p1EffectiveRankData.name}`;
        
        rows.push(`${users[0].username.padEnd(15, ' ').substring(0, 15)} ${p1RowRank.padEnd(11, ' ')} ${formatTime(p1EffectiveRankData.time).padStart(5, ' ')}  ${p1EffectiveRankData.weight}x`);
        
        for (let i = 1; i < 4; i++) {
            const rankData = getRankData(playerRanks[i]);
            rows.push(`${users[i].username.padEnd(15, ' ').substring(0, 15)} ${playerRanks[i].padEnd(11, ' ')} ${formatTime(rankData.time).padStart(5, ' ')}  ${rankData.weight}x`);
        }

        const partyBlock = `\`\`\`\n${rows.join('\n')}\n\`\`\``;

        const embed = new EmbedBuilder()
            .setTitle(`${users[0].username} ➔ ${p1EffectiveRankData.name} | Objetivo: ${formattedTime}`)
            .setColor('#00b0f4')
            .addFields({ name: 'Party', value: partyBlock });

        let replyOptions = { embeds: [embed] };
        if (warnings.length > 0) {
            replyOptions.content = warnings.join('\n');
        }

        await interaction.reply(replyOptions);
    },
};
