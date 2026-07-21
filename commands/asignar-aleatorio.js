const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asignar-aleatorio')
        .setDescription('Asigna roles aleatorios a los 4 jugadores, cumpliendo las reglas estratégicas de Exsomnis.')
        .addStringOption(option => option.setName('jugador1').setDescription('Mención @jugador o "-" para vacío').setRequired(true))
        .addStringOption(option => option.setName('jugador2').setDescription('Mención @jugador o "-" para vacío').setRequired(true))
        .addStringOption(option => option.setName('jugador3').setDescription('Mención @jugador o "-" para vacío').setRequired(true))
        .addStringOption(option => option.setName('jugador4').setDescription('Mención @jugador o "-" para vacío').setRequired(true))
        .addUserOption(option => option.setName('voltedge').setDescription('Jugador que lleva la espada Voltedge (Opcional)').setRequired(false)),
    async execute(interaction) {
        const inputStrings = [
            interaction.options.getString('jugador1').trim(),
            interaction.options.getString('jugador2').trim(),
            interaction.options.getString('jugador3').trim(),
            interaction.options.getString('jugador4').trim()
        ];
        const voltedgeUser = interaction.options.getUser('voltedge');

        const assignments = [];

        for (let i = 0; i < 4; i++) {
            const input = inputStrings[i];
            const mentionMatch = input.match(/^<@!?(\d+)>$/);
            
            let realUser = null;
            let displayName = `J${i + 1}`;
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

            assignments.push({
                user: realUser,
                isFake: isFake,
                displayName: displayName,
                isVoltedge: voltedgeUser && realUser && realUser.id === voltedgeUser.id,
                roles: {}
            });
        }

        // --- D24 Estatuas ---
        let d24Pool = [
            { icon: '↖️', text: 'Arriba Izq', id: 'tl' },
            { icon: '↗️', text: 'Arriba Der', id: 'tr' },
            { icon: '↙️', text: 'Abajo Izq', id: 'bl' },
            { icon: '↘️', text: 'Abajo Der', id: 'br' }
        ];
        assignments.forEach(p => p.roles.D24 = pullRandomRole(d24Pool));

        // --- D25 Habitaciones ---
        let d25Pool = [
            { icon: '↖️', text: 'Arriba Izq', id: 'tl' },
            { icon: '↗️', text: 'Arriba Der', id: 'tr' },
            { icon: '↙️', text: 'Abajo Izq', id: 'bl' },
            { icon: '↘️', text: 'Abajo Der', id: 'br' }
        ];

        // Restricción: Uno de los 2 de abajo en D24 debe ir Arriba Der en D25
        const d24BottomPlayers = assignments.filter(p => p.roles.D24.id === 'bl' || p.roles.D24.id === 'br');
        const chosenForD25TR = d24BottomPlayers[Math.floor(Math.random() * d24BottomPlayers.length)];
        chosenForD25TR.roles.D25 = pullRoleById(d25Pool, 'tr');

        assignments.forEach(p => {
            if (!p.roles.D25) p.roles.D25 = pullRandomRole(d25Pool);
        });

        // --- D26 Arena 1 ---
        let d26A1Pool = [
            { icon: '🔫', text: 'Blitz', id: 'blitz' },
            { icon: '1️⃣', text: 'C1', id: 'c1' },
            { icon: '2️⃣', text: 'C2', id: 'c2' },
            { icon: '3️⃣', text: 'C3', id: 'c3' }
        ];
        const voltPlayer = assignments.find(p => p.isVoltedge);
        if (voltPlayer) voltPlayer.roles.D26A1 = pullRoleById(d26A1Pool, 'blitz');

        assignments.forEach(p => {
            if (!p.roles.D26A1) p.roles.D26A1 = pullRandomRole(d26A1Pool);
        });

        // --- D26 Última Arena ---
        let d26LastPool = [
            { icon: '↖️', text: 'Empuje Izq', id: 'left_push' },
            { icon: '↗️', text: 'Empuje Der', id: 'right_push' },
            { icon: '↙️', text: 'Receptor Izq', id: 'left_catcher' },
            { icon: '↘️', text: 'Receptor Der', id: 'right_catcher' }
        ];
        if (voltPlayer) {
            const catcherId = Math.random() < 0.5 ? 'left_catcher' : 'right_catcher';
            voltPlayer.roles.D26Last = pullRoleById(d26LastPool, catcherId);
        }
        assignments.forEach(p => {
            if (!p.roles.D26Last) p.roles.D26Last = pullRandomRole(d26LastPool);
        });

        // --- D26 Estrategia Bump ---
        let d26BumpPool = [
            { icon: '⬅️', text: 'Izquierda', id: 'left' },
            { icon: '➡️', text: 'Derecha', id: 'right' },
            { icon: '⬆️', text: 'Arriba', id: 'top' },
            { icon: '💥', text: 'Bump', id: 'bump' }
        ];
        // Restricción empujes
        assignments.forEach(p => {
            if (p.roles.D26Last.id === 'left_push') p.roles.D26Bump = pullRoleById(d26BumpPool, 'left');
            if (p.roles.D26Last.id === 'right_push') p.roles.D26Bump = pullRoleById(d26BumpPool, 'right');
        });
        assignments.forEach(p => {
            if (!p.roles.D26Bump) p.roles.D26Bump = pullRandomRole(d26BumpPool);
        });

        // --- D27 6 Cajas ---
        let d27BoxPool = [
            { icon: '🐴', text: 'Trojan', id: 'trojan' },
            { icon: '🔫', text: '2do blitz', id: '2nd_blitz' },
            { icon: '↗️', text: 'Arriba Der', id: 'tr' },
            { icon: '↖️', text: 'Arriba Izq', id: 'tl' }
        ];
        if (voltPlayer) {
            const topId = Math.random() < 0.5 ? 'tr' : 'tl';
            voltPlayer.roles.D27Box = pullRoleById(d27BoxPool, topId);
        }
        assignments.forEach(p => {
            if (!p.roles.D27Box) p.roles.D27Box = pullRandomRole(d27BoxPool);
        });

        // --- D27 Arena Wolver ---
        let d27WolverPool = [
            { icon: '⬅️', text: 'Izquierda', id: 'left' },
            { icon: '🗿', text: 'Tótems', id: 'totems' },
            { icon: '💣', text: 'EV', id: 'ev' },
            { icon: '⬆️', text: 'Empuje Arr', id: 'top_push' }
        ];
        if (voltPlayer) {
            voltPlayer.roles.D27Wolver = pullRoleById(d27WolverPool, 'ev');
        }
        assignments.forEach(p => {
            if (!p.roles.D27Wolver) p.roles.D27Wolver = pullRandomRole(d27WolverPool);
        });

        // --- D27 Última ---
        let d27LastPool = [
            { icon: '⬅️', text: 'Izquierda', id: 'left' },
            { icon: '🐴', text: 'Trojan', id: 'trojan' },
            { icon: '➡️', text: 'Derecha', id: 'right' },
            { icon: '🔄', text: 'Rotar/Asis', id: 'rotate' }
        ];
        assignments.forEach(p => p.roles.D27Last = pullRandomRole(d27LastPool));

        // --- D28 ¿Regando? ---
        let d28WaterPool = [
            { icon: '✅', text: 'Sí', id: 'yes' },
            { icon: '❌', text: 'No', id: 'no1' },
            { icon: '❌', text: 'No', id: 'no2' },
            { icon: '❌', text: 'No', id: 'no3' }
        ];
        assignments.forEach(p => p.roles.D28Water = pullRandomRole(d28WaterPool));

        // --- D28 Boost ---
        let d28BoostPool = [
            { icon: '🎭1️⃣', text: 'Máscara 1', id: 'mask1' },
            { icon: '🦶1️⃣', text: 'Caminar 1', id: 'walk1' },
            { icon: '🎭2️⃣', text: 'Máscara 2', id: 'mask2' },
            { icon: '🦶2️⃣', text: 'Caminar 2', id: 'walk2' }
        ];
        assignments.forEach(p => p.roles.D28Boost = pullRandomRole(d28BoostPool));

        // ==== FORMATO DE MENSAJES ====

        const d24BotNames = assignments.filter(p => ['bl', 'br'].includes(p.roles.D24.id)).map(p => p.displayName);
        const d25LeftNames = assignments.filter(p => ['tl', 'bl'].includes(p.roles.D25.id)).map(p => p.displayName);
        const allUsernames = assignments.map(p => p.displayName).join(', ');

        const d24SatisfiesD25 = d24BotNames.some(name => d25LeftNames.includes(name));
        let wormholeWarning = `⚠️ **Wormhole Necesario:** ${d24BotNames.join(' y ')}`;
        if (!d24SatisfiesD25) {
            wormholeWarning += `, y al menos uno de: ${d25LeftNames.join(' o ')}`;
        }

        const getPlayerForRole = (section, roleId) => {
            const player = assignments.find(p => p.roles[section].id === roleId);
            return player ? player.displayName : 'N/A';
        };

        const embed = new EmbedBuilder()
            .setTitle('✨ Asignación de Roles')
            .setColor(0x2b2d31)
            .setDescription(`${wormholeWarning}\n\nRoles para: **${allUsernames}**`);

        embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
        embed.addFields({
            name: '📍 Estatuas',
            value: `↖️ **Arriba Izq:** ${getPlayerForRole('D24', 'tl')}\n↗️ **Arriba Der:** ${getPlayerForRole('D24', 'tr')}\n↙️ **Abajo Izq:** ${getPlayerForRole('D24', 'bl')}\n↘️ **Abajo Der:** ${getPlayerForRole('D24', 'br')}`,
            inline: false
        });

        embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
        embed.addFields({
            name: '📍 Habitaciones',
            value: `↖️ **Arriba Izq:** ${getPlayerForRole('D25', 'tl')}\n↗️ **Arriba Der:** ${getPlayerForRole('D25', 'tr')}\n↙️ **Abajo Izq:** ${getPlayerForRole('D25', 'bl')}\n↘️ **Abajo Der:** ${getPlayerForRole('D25', 'br')}`,
            inline: false
        });

        embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
        embed.addFields({
            name: '📍 Arena 1',
            value: `🔫 **Blitz:** ${getPlayerForRole('D26A1', 'blitz')}\n1️⃣ **C1:** ${getPlayerForRole('D26A1', 'c1')}\n2️⃣ **C2:** ${getPlayerForRole('D26A1', 'c2')}\n3️⃣ **C3:** ${getPlayerForRole('D26A1', 'c3')}`,
            inline: true
        });
        embed.addFields({
            name: '📍 Última Arena',
            value: `↖️ **Empuje Izq:** ${getPlayerForRole('D26Last', 'left_push')}\n↗️ **Empuje Der:** ${getPlayerForRole('D26Last', 'right_push')}\n↙️ **Receptor Izq:** ${getPlayerForRole('D26Last', 'left_catcher')}\n↘️ **Receptor Der:** ${getPlayerForRole('D26Last', 'right_catcher')}`,
            inline: true
        });
        embed.addFields({
            name: '📍 Estrategia Bump',
            value: `⬅️ **Izquierda:** ${getPlayerForRole('D26Bump', 'left')}\n➡️ **Derecha:** ${getPlayerForRole('D26Bump', 'right')}\n⬆️ **Arriba:** ${getPlayerForRole('D26Bump', 'top')}\n💥 **Bump:** ${getPlayerForRole('D26Bump', 'bump')}`,
            inline: true
        });

        embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
        embed.addFields({
            name: '📍 6 Cajas',
            value: `🐴 **Trojan:** ${getPlayerForRole('D27Box', 'trojan')}\n🔫 **2do blitz:** ${getPlayerForRole('D27Box', '2nd_blitz')}\n↗️ **Arriba Der:** ${getPlayerForRole('D27Box', 'tr')}\n↖️ **Arriba Izq:** ${getPlayerForRole('D27Box', 'tl')}`,
            inline: true
        });
        embed.addFields({
            name: '📍 Arena Wolver',
            value: `⬅️ **Izquierda:** ${getPlayerForRole('D27Wolver', 'left')}\n🗿 **Tótems:** ${getPlayerForRole('D27Wolver', 'totems')}\n💣 **EV:** ${getPlayerForRole('D27Wolver', 'ev')}\n⬆️ **Empuje Arr:** ${getPlayerForRole('D27Wolver', 'top_push')}`,
            inline: true
        });
        embed.addFields({
            name: '📍 Última',
            value: `⬅️ **Izquierda:** ${getPlayerForRole('D27Last', 'left')}\n🐴 **Trojan:** ${getPlayerForRole('D27Last', 'trojan')}\n➡️ **Derecha:** ${getPlayerForRole('D27Last', 'right')}\n🔄 **Rotar/Asis:** ${getPlayerForRole('D27Last', 'rotate')}`,
            inline: true
        });

        embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
        embed.addFields({
            name: '📍 Agua',
            value: `✅ **Sí:** ${getPlayerForRole('D28Water', 'yes')}\n❌ **No:** ${getPlayerForRole('D28Water', 'no1')}\n❌ **No:** ${getPlayerForRole('D28Water', 'no2')}\n❌ **No:** ${getPlayerForRole('D28Water', 'no3')}`,
            inline: true
        });
        embed.addFields({
            name: '📍 Boost',
            value: `🎭1️⃣ **Máscara 1:** ${getPlayerForRole('D28Boost', 'mask1')}\n🦶1️⃣ **Caminar 1:** ${getPlayerForRole('D28Boost', 'walk1')}\n🎭2️⃣ **Máscara 2:** ${getPlayerForRole('D28Boost', 'mask2')}\n🦶2️⃣ **Máscara 2:** ${getPlayerForRole('D28Boost', 'walk2')}`,
            inline: true
        });

        await interaction.reply({ embeds: [embed] });

        // Enviar MDs
        for (let p of assignments) {
            if (p.isFake) continue;
            
            let dmMessage = `📌 **TUS ROLES**\n--------------------------------\n`;
            dmMessage += `D24: ${p.roles.D24.icon}\n--------------------------------\n`;
            dmMessage += `D25: ${p.roles.D25.icon}\n--------------------------------\n`;
            dmMessage += `D26: ${p.roles.D26A1.icon} | ${p.roles.D26Last.icon} | ${p.roles.D26Bump.icon}\n--------------------------------\n`;
            dmMessage += `D27: ${p.roles.D27Box.icon} | ${p.roles.D27Wolver.icon} | ${p.roles.D27Last.icon}\n--------------------------------\n`;
            dmMessage += `D28: ${p.roles.D28Water.icon} | ${p.roles.D28Boost.icon}\n`;

            let needsWormholeWarning = d24BotNames.includes(p.displayName);
            if (!d24SatisfiesD25 && d25LeftNames.includes(p.displayName)) {
                needsWormholeWarning = true;
            }

            if (needsWormholeWarning) {
                dmMessage = `⚠️ **Recordatorio:** ¡Necesitas tener el Wormhole instalado!\n\n` + dmMessage;
            }

            try {
                await p.user.send(dmMessage);
            } catch (err) {
                console.error(`No se pudo enviar MD a ${p.displayName}`, err);
                await interaction.followUp({ content: `❌ No pude enviar el MD a **${p.displayName}**. Asegúrate de que tiene los mensajes directos habilitados en este servidor.`, ephemeral: true });
            }
        }
    },
};
