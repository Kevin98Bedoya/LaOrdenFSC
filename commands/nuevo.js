const { SlashCommandBuilder } = require('discord.js');
const { ensureRole } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuevo')
        .setDescription('Registra a un nuevo miembro asignándole el rol "Sin-Rango".')
        .addUserOption(option => option.setName('usuario').setDescription('El usuario a registrar').setRequired(true)),
    async execute(interaction) {
        // Verificar si tiene el rol administrativo
        const hasPermission = interaction.member.roles.cache.some(role => 
            role.name === 'Líder Del Gremio' || role.name === 'Oficial'
        );

        if (!hasPermission && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando. Necesitas el rol "Líder Del Gremio" u "Oficial".', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            const role = await ensureRole(interaction.guild, 'Sin-Rango');

            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: `El usuario <@${targetUser.id}> ya tenía el rol **Sin-Rango**.` });
            }

            await member.roles.add(role);
            await interaction.reply({ content: `✅ <@${targetUser.id}> ha sido registrado exitosamente y se le asignó el rol **Sin-Rango**.` });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Hubo un error al intentar registrar al usuario. Revisa que mi rol de Bot esté por encima de "Sin-Rango".', ephemeral: true });
        }
    },
};
