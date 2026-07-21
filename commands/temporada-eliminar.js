const { SlashCommandBuilder } = require('discord.js');
const { RANGOS_NOMBRES, getCurrentSeason } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temporada-eliminar')
        .setDescription('Elimina todos los roles históricos de la última temporada del servidor.'),
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
            
            const currentSeasonNum = getCurrentSeason(interaction.guild);
            if (currentSeasonNum === 0) {
                return interaction.editReply({ content: `⚠️ No se detectó ninguna temporada anterior en los roles del servidor.` });
            }
            
            const seasonName = `T${currentSeasonNum}`;
            
            // Buscar roles que coincidan con la convención de nombres: "[Rango] [Temporada]"
            const rolesToDelete = interaction.guild.roles.cache.filter(role => {
                return RANGOS_NOMBRES.some(rank => role.name === `${rank} ${seasonName}`);
            });

            if (rolesToDelete.size === 0) {
                return interaction.editReply({ content: `⚠️ No se encontró ningún rol perteneciente a la temporada **${seasonName}**. Asegúrate de escribirlo exactamente igual (Ej: T2).` });
            }

            let deletedCount = 0;

            // Eliminar los roles del servidor (Esto automáticamente se los quita a todos los usuarios)
            for (const [id, role] of rolesToDelete) {
                await role.delete(`Limpieza de la temporada ${seasonName} solicitada por ${interaction.user.tag}`);
                deletedCount++;
            }

            await interaction.editReply({ content: `✅ **¡Limpieza completada!** Se han eliminado **${deletedCount}** roles de la temporada **${seasonName}** del servidor.` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Hubo un error al intentar eliminar la temporada. Revisa que el bot tenga el permiso de "Administrar Roles" y que su rol esté por encima de los roles que intenta borrar.' });
        }
    },
};
