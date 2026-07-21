const { SlashCommandBuilder } = require('discord.js');
const { ensureRole, getUserRank } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temporada-reiniciar')
        .setDescription('Reinicia los rangos actuales de todos los jugadores a "Sin-Rango" sin guardar historial.'),
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
            
            // Obtener todos los miembros
            const members = await interaction.guild.members.fetch();
            const sinRangoRole = await ensureRole(interaction.guild, 'Sin-Rango');

            let procesados = 0;

            for (const [id, member] of members) {
                if (member.user.bot) continue;

                const currentRank = getUserRank(member);
                if (currentRank !== 'Sin-Rango') {
                    // Remover rol actual
                    const currentRole = member.roles.cache.find(r => r.name === currentRank);
                    if (currentRole) {
                        await member.roles.remove(currentRole);
                    }
                    
                    // Asignar Sin-Rango si no lo tiene
                    if (!member.roles.cache.has(sinRangoRole.id)) {
                        await member.roles.add(sinRangoRole);
                    }
                }
                procesados++;
            }

            return interaction.editReply({ content: `✅ Se han reiniciado los rangos a "Sin-Rango" para todos los jugadores.` });
        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: '❌ Hubo un error al ejecutar el comando.' });
        }
    },
};
