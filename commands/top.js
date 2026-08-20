const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRank, RANGOS_NOMBRES, getRankEmoji } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Muestra la Tierlist de todos los jugadores de la comunidad basándose en sus roles.'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const EMOJIS = {};
            RANGOS_NOMBRES.forEach(rn => {
                EMOJIS[rn] = getRankEmoji(rn, interaction.guild);
            });

            const members = await interaction.guild.members.fetch();
            
            const rankGroups = {
                'S+': [], 'S': [], 'A+': [], 'A': [], 'B+': [], 'B': [], 'C+': [], 'C': [], 'Sin-Rango': []
            };

            for (const [id, member] of members) {
                if (member.user.bot) continue;
                
                const rank = getUserRank(member);
                const hasExplicitSinRango = member.roles.cache.some(r => r.name === 'Sin-Rango');
                const hasHistory = member.roles.cache.some(r => RANGOS_NOMBRES.some(rn => r.name.startsWith(rn + ' ')));
                
                if (rank !== 'Sin-Rango' || hasExplicitSinRango || hasHistory) {
                    if (rankGroups[rank]) {
                        rankGroups[rank].push(member.displayName);
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🏆 TIER LIST DE JUGADORES 🏆')
                .setColor('#FFD700')
                .setDescription('Todos los jugadores con un rango asignado, ordenados de mayor a menor.\n\n');

            let description = embed.data.description;
            const orderedRanks = [...RANGOS_NOMBRES].reverse(); // De S+ a Sin-Rango

            orderedRanks.forEach(rankName => {
                const playersInRank = rankGroups[rankName];
                if (playersInRank && playersInRank.length > 0) {
                    const emoji = EMOJIS[rankName] || '🔹';
                    const titleRank = rankName === 'Sin-Rango' ? 'SIN RANGO' : rankName;
                    
                    description += `**${emoji} RANGO ${titleRank} ${emoji}**\n`;
                    playersInRank.sort((a, b) => a.localeCompare(b));
                    const formattedPlayers = playersInRank.map(p => `\`${p}\``).join(' | ');
                    description += `${formattedPlayers}\n\n`;
                }
            });

            if (description.length > 4096) {
                description = description.substring(0, 4090) + '...';
            }

            embed.setDescription(description);
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
