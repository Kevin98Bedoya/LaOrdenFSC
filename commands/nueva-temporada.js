const { SlashCommandBuilder } = require('discord.js');
const { ensureRole, getUserRank, RANGOS_NOMBRES } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nueva-temporada')
        .setDescription('Reinicia los rangos de todos los jugadores guardando su historial de roles.')
        .addStringOption(option => 
            option.setName('nombre')
                .setDescription('El nombre de la temporada que termina (Ej: T2, T3)')
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

        const seasonName = interaction.options.getString('nombre');

        try {
            await interaction.deferReply();
            
            // Obtener todos los miembros
            const members = await interaction.guild.members.fetch();
            const sinRangoRole = await ensureRole(interaction.guild, 'Sin-Rango');
            
            let updatedCount = 0;

            for (const [id, member] of members) {
                if (member.user.bot) continue;

                const currentRank = getUserRank(member);
                if (currentRank !== 'Sin-Rango') {
                    // Si tiene un rango mayor a Sin-Rango, crear su rol histórico
                    const historyRoleName = `${currentRank} ${seasonName}`;
                    const historyRole = await ensureRole(interaction.guild, historyRoleName);

                    // Identificar roles actuales de rango puro para removerlos
                    const rolesToRemove = member.roles.cache.filter(role => RANGOS_NOMBRES.includes(role.name));
                    
                    if (rolesToRemove.size > 0) {
                        await member.roles.remove(rolesToRemove);
                    }
                    
                    // Añadir el rol de historial y pasarlo a Sin-Rango
                    await member.roles.add([historyRole, sinRangoRole]);
                    updatedCount++;
                }
            }

            await interaction.editReply({ content: `✅ **¡La nueva temporada ha comenzado!** Se reiniciaron los rangos de **${updatedCount}** jugadores, pasándolos a "Sin-Rango" y guardando su progreso anterior como **[Rango] ${seasonName}**.` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Hubo un error al intentar reiniciar la temporada. Revisa los permisos y jerarquía del bot.' });
        }
    },
};
