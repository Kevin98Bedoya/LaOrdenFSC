const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRank, RANGOS_NOMBRES, RANGO_EMOJIS } = require('../utils');

const EMOJIS = RANGO_EMOJIS;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top-gremio')
        .setDescription('Muestra la Tierlist exclusiva de los miembros del gremio (La Orden Spiral).'),
    async execute(interaction) {
        // Verificar si tiene el rol administrativo
        const hasPermission = interaction.member.roles.cache.some(role => 
            role.name === 'Líder Del Gremio' || role.name === 'Oficial'
        );

        if (!hasPermission && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando. Necesitas el rol "Líder Del Gremio" u "Oficial".', ephemeral: true });
        }

        try {
            await interaction.deferReply();
            const members = await interaction.guild.members.fetch();
            
            const rankGroups = {
                'S+': [], 'S': [], 'A+': [], 'A': [], 'B+': [], 'B': [], 'C+': [], 'C': [], 'Sin-Rango': []
            };

            for (const [id, member] of members) {
                if (member.user.bot) continue;
                
                // Filtro exclusivo para el gremio
                const isGremio = member.roles.cache.some(r => r.name.includes('La Orden Spiral'));
                if (!isGremio) continue;

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
                .setTitle('🏆 TIER LIST DEL GREMIO 🏆')
                .setColor('#FFD700')
                .setDescription('Miembros oficiales de La Orden Spiral ordenados de mayor a menor.\n\n');

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
                await interaction.editReply({ content: 'Hubo un error al intentar mostrar el top del gremio.' });
            } else {
                await interaction.reply({ content: 'Hubo un error al intentar mostrar el top del gremio.', ephemeral: true });
            }
        }
    },
};
