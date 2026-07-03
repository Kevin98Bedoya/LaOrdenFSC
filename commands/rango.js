const { SlashCommandBuilder } = require('discord.js');
const { ensureRole, RANGOS_NOMBRES } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rango')
        .setDescription('Actualiza el rango de un jugador modificando sus roles de Discord.')
        .addUserOption(option => option.setName('usuario').setDescription('El usuario a actualizar').setRequired(true))
        .addStringOption(option => 
            option.setName('nuevo_rango')
                .setDescription('El nuevo rango del jugador')
                .setRequired(true)
                .addChoices(
                    { name: 'S+', value: 'S+' },
                    { name: 'S', value: 'S' },
                    { name: 'A+', value: 'A+' },
                    { name: 'A', value: 'A' },
                    { name: 'B+', value: 'B+' },
                    { name: 'B', value: 'B' },
                    { name: 'C+', value: 'C+' },
                    { name: 'C', value: 'C' },
                    { name: 'Sin-Rango', value: 'Sin-Rango' }
                )
        ),
    async execute(interaction) {
        // Verificar si tiene el rol administrativo
        const hasPermission = interaction.member.roles.cache.some(role => 
            role.name === 'Líder Del Gremio' || role.name === 'Oficial'
        );

        if (!hasPermission && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando. Necesitas el rol "Líder Del Gremio" u "Oficial".', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const newRank = interaction.options.getString('nuevo_rango');

        try {
            await interaction.deferReply();
            const member = await interaction.guild.members.fetch(targetUser.id);
            
            // Identificar los roles de rango antiguos que tenga
            const rolesToRemove = [];
            member.roles.cache.forEach(role => {
                if (RANGOS_NOMBRES.includes(role.name)) {
                    rolesToRemove.push(role);
                }
            });

            // Removerlos todos
            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove);
            }

            // Asegurarse de que el rol exista y añadirlo
            const newRole = await ensureRole(interaction.guild, newRank);
            await member.roles.add(newRole);

            await interaction.editReply({ content: `✅ El rango de <@${targetUser.id}> ha sido actualizado a **${newRank}**.` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Hubo un error al intentar actualizar el rango. Revisa que mi rol de Bot esté por encima de todos los roles de rango.' });
        }
    },
};
