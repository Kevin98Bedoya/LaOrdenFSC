const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRank, getRankIndex, RANGOS_NOMBRES } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Muestra la Tierlist de todos los jugadores basándose en sus roles.'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            // Obtener todos los miembros del servidor
            const members = await interaction.guild.members.fetch();
            
            const players = [];

            for (const [id, member] of members) {
                if (member.user.bot) continue;

                const rank = getUserRank(member);
                
                // Extraer el historial: Roles que empiecen con el nombre de un rango pero tengan texto extra (ej. "B+ T1")
                const historyRoles = [];
                member.roles.cache.forEach(role => {
                    const isPureRank = RANGOS_NOMBRES.includes(role.name);
                    const isHistoryRank = RANGOS_NOMBRES.some(rn => role.name.startsWith(rn + ' '));
                    
                    if (!isPureRank && isHistoryRank) {
                        historyRoles.push(role.name);
                    }
                });

                // Lo incluimos en el top si tiene algún rol de rango activo o un historial, o explícitamente el rol "Sin-Rango"
                const hasExplicitSinRango = member.roles.cache.some(r => r.name === 'Sin-Rango');
                
                if (rank !== 'Sin-Rango' || historyRoles.length > 0 || hasExplicitSinRango) {
                    players.push({
                        user_id: id,
                        rank: rank,
                        history: historyRoles.join(', ')
                    });
                }
            }

            if (players.length === 0) {
                return interaction.editReply({ content: 'No hay ningún jugador registrado o con roles de rango en el servidor.' });
            }

            // Ordenamos de mayor a menor rango (S+ primero)
            players.sort((a, b) => getRankIndex(b.rank) - getRankIndex(a.rank));

            const embed = new EmbedBuilder()
                .setTitle('🏆 Clasificación del Gremio (Tierlist)')
                .setColor('#FFD700')
                .setDescription('Lista de todos los jugadores ordenados por su rol actual.');

            let listText = '';
            players.forEach((player, index) => {
                let historyText = player.history ? ` *(Historial: ${player.history})*` : '';
                listText += `**${index + 1}.** <@${player.user_id}> - **${player.rank}**${historyText}\n`;
            });

            if (listText.length > 4096) {
                listText = listText.substring(0, 4090) + '...';
            }

            embed.setDescription(listText);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Hubo un error al intentar mostrar el top. ¿Tiene el bot permisos para leer miembros?' });
            } else {
                await interaction.reply({ content: 'Hubo un error al intentar mostrar el top.', ephemeral: true });
            }
        }
    },
};
