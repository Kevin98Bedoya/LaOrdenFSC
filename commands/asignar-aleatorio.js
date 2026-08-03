const { SlashCommandBuilder } = require('discord.js');
const { asignarDuo, asignarTrio, asignarSquad } = require('../rolesHelper');

function pullRoleById(pool, id) {
    const index = pool.findIndex(r => r.id === id);
    if (index > -1) {
        return pool.splice(index, 1)[0];
    }
    return null;
}

function pullRandomRole(pool) {
    const index = Math.floor(Math.random() * pool.length);
    return pool.splice(index, 1)[0];
}

const getPlayerForRole = (assignments, section, roleId) => {
    const player = assignments.find(p => p.roles[section] && p.roles[section].id === roleId);
    return player ? player.displayName : 'N/A';
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asignar-aleatorio')
        .setDescription('Asigna roles aleatorios a los jugadores, cumpliendo las reglas estratégicas de Exsomnis.')
        .addStringOption(option => option.setName('jugador1').setDescription('Mención @jugador o texto').setRequired(true))
        .addStringOption(option => option.setName('jugador2').setDescription('Mención @jugador o texto').setRequired(true))
        .addStringOption(option => option.setName('jugador3').setDescription('Mención @jugador, texto, o "-" para vacío').setRequired(true))
        .addStringOption(option => option.setName('jugador4').setDescription('Mención @jugador, texto, o "-" para vacío').setRequired(true))
        .addStringOption(option => option.setName('voltedge').setDescription('Jugador que lleva la espada Voltedge (Opcional)').setRequired(false)),
    async execute(interaction) {
        const inputStrings = [
            interaction.options.getString('jugador1').trim(),
            interaction.options.getString('jugador2').trim(),
            interaction.options.getString('jugador3').trim(),
            interaction.options.getString('jugador4').trim()
        ];
        const voltedgeStr = interaction.options.getString('voltedge');

        const assignments = [];

        for (let i = 0; i < 4; i++) {
            const input = inputStrings[i];
            if (input === '-' || input === '') continue;

            const mentionMatch = input.match(/^<@!?(\d+)>$/);

            let realUser = null;
            let displayName = input;
            let isFake = true;

            if (mentionMatch) {
                const userId = mentionMatch[1];
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    realUser = member.user;
                    displayName = member.displayName;
                    isFake = false;
                } catch (e) {
                    console.error("Error fetching member", e);
                }
            }

            let isVoltedge = false;
            if (voltedgeStr) {
                const voltMatch = voltedgeStr.trim().match(/^<@!?(\d+)>$/);
                if (voltMatch && mentionMatch && voltMatch[1] === mentionMatch[1]) {
                    isVoltedge = true;
                } else if (voltedgeStr.trim().toLowerCase() === displayName.toLowerCase() || voltedgeStr.trim().toLowerCase() === input.toLowerCase()) {
                    isVoltedge = true;
                }
            }

            assignments.push({
                user: realUser,
                isFake: isFake,
                displayName: displayName,
                isVoltedge: isVoltedge,
                roles: {}
            });
        }

        const playerCount = assignments.length;

        let voltMessage = '';
        if (voltedgeStr) {
            const voltPlayer = assignments.find(p => p.isVoltedge);
            if (voltPlayer) {
                voltMessage = `\n✅ **Voltedge:** Asignado a **${voltPlayer.displayName}**.`;
            } else {
                return await interaction.reply({
                    content: `❌ **Error:** No se encontró a "${voltedgeStr}" entre los jugadores ingresados (Jugador 1 a 4). Corrige el nombre del usuario de Voltedge o elimina la opción Voltedge para continuar.`,
                    ephemeral: true
                });
            }
        }

        if (playerCount === 2) {
            await asignarDuo(interaction, assignments, voltMessage);
        } else if (playerCount === 3) {
            await asignarTrio(interaction, assignments, voltMessage);
        } else if (playerCount === 4) {
            await asignarSquad(interaction, assignments, voltMessage);
        } else {
            await interaction.reply({ content: 'Se requieren al menos 2 jugadores válidos.', ephemeral: true });
        }
    }
};
