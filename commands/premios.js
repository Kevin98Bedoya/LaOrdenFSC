const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRank, RANGOS_NOMBRES, getRankData, getRankEmoji } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premios')
        .setDescription('Calcula y distribuye el premio de final de temporada del gremio.')
        .addIntegerOption(option => 
            option.setName('cantidad')
                .setDescription('Cantidad total de dinero a repartir')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Verificar si tiene el rol administrativo
        const hasPermission = interaction.member.roles.cache.some(role => 
            role.name === 'Líder Del Gremio' || role.name === 'Oficial'
        );

        if (!hasPermission && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando. Necesitas el rol "Líder Del Gremio" u "Oficial".', ephemeral: true });
        }

        const totalPrize = interaction.options.getInteger('cantidad');
        if (totalPrize <= 0) {
            return interaction.reply({ content: '❌ La cantidad debe ser mayor a 0.', ephemeral: true });
        }

        try {
            await interaction.deferReply();

            const EMOJIS = {};
            RANGOS_NOMBRES.forEach(rn => {
                EMOJIS[rn] = getRankEmoji(rn, interaction.guild);
            });

            const members = await interaction.guild.members.fetch();
            
            const rankGroups = {
                'S+': [], 'S': [], 'A+': [], 'A': [], 'B+': [], 'B': [], 'C+': [], 'C': []
            };

            for (const [id, member] of members) {
                if (member.user.bot) continue;
                
                // Filtro exclusivo para el gremio
                const isGremio = member.roles.cache.some(r => r.name.includes('La Orden Spiral'));
                if (!isGremio) continue;

                const rank = getUserRank(member);
                if (rank === 'Sin-Rango') continue; // No premiar a los Sin-Rango

                if (rankGroups[rank]) {
                    rankGroups[rank].push(member.displayName);
                }
            }

            // Identificar los 3 rangos más altos alcanzados
            const orderedRanks = [...RANGOS_NOMBRES].reverse().filter(r => r !== 'Sin-Rango'); // De S+ a C
            
            let top3Ranks = [];
            for (const rankName of orderedRanks) {
                if (rankGroups[rankName].length > 0) {
                    top3Ranks.push(rankName);
                    if (top3Ranks.length === 3) break;
                }
            }

            if (top3Ranks.length === 0) {
                return interaction.editReply({ content: '❌ No hay ningún jugador en el gremio con un rango válido para premiar.' });
            }

            // Calcular pesos
            let totalWeights = 0;
            const rankInfo = [];

            for (const rankName of top3Ranks) {
                const playerCount = rankGroups[rankName].length;
                const weight = getRankData(rankName).prizeWeight;
                const rankTotalWeight = playerCount * weight;
                
                totalWeights += rankTotalWeight;
                
                rankInfo.push({
                    rankName,
                    playerCount,
                    weight,
                    players: rankGroups[rankName]
                });
            }

            const valuePerWeight = totalPrize / totalWeights;

            // Construir Embed
            const embed = new EmbedBuilder()
                .setTitle('💰 REPARTO DE PREMIOS DEL GREMIO 💰')
                .setColor('#FFD700')
                .setDescription(`Se ha repartido un total de **$${totalPrize.toLocaleString('es-ES')}** entre los mejores jugadores de **La Orden Spiral**.\n\nEl premio se ha distribuido usando el sistema de pesos en función del rango (mayor rango = mayor prioridad y pago).\n\n`);

            let description = embed.data.description;

            for (const info of rankInfo) {
                const emoji = EMOJIS[info.rankName] || '🔹';
                const individualPrize = Math.floor(info.weight * valuePerWeight);
                
                description += `**${emoji} Rango ${info.rankName}** - ${info.playerCount} jugador(es)\n`;
                description += `💸 **Premio Individual:** $${individualPrize.toLocaleString('es-ES')}\n`;
                
                const formattedPlayers = info.players.sort((a, b) => a.localeCompare(b)).map(p => `\`${p}\``).join(', ');
                description += `👥 ${formattedPlayers}\n\n`;
            }

            embed.setDescription(description);
            embed.setFooter({ text: 'Solo se premian los 3 rangos más altos alcanzados por el gremio (Excluye Sin-Rango).' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Hubo un error al calcular los premios.' });
            } else {
                await interaction.reply({ content: 'Hubo un error al calcular los premios.', ephemeral: true });
            }
        }
    },
};
