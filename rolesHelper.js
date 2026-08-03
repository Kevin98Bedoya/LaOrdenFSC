const { EmbedBuilder } = require('discord.js');

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

async function asignarDuo(interaction, assignments, voltMessage, officialMessage = '') {
    const voltPlayer = assignments.find(p => p.isVoltedge);

    // --- D24 Estatuas ---
    let d24Pool = [
        { icon: '↖️', text: 'Arriba Izq', id: 'tl' },
        { icon: '➡️', text: 'Centro Der', id: 'cr' }
    ];
    assignments.forEach(p => p.roles.D24 = pullRandomRole(d24Pool));

    // --- D25 Habitaciones ---
    let d25Pool = [
        { icon: '↘️', text: 'Derecha', id: 'right' },
        { icon: '↙️', text: 'Izquierda', id: 'left' }
    ];
    if (voltPlayer) {
        voltPlayer.roles.D25 = pullRoleById(d25Pool, 'right');
    }
    assignments.forEach(p => { if (!p.roles.D25) p.roles.D25 = pullRandomRole(d25Pool); });

    // --- D26 Arena 1 ---
    let d26A1Pool = [];
    if (voltPlayer) {
        d26A1Pool = [
            { icon: '🔫', text: 'Blitz', id: 'blitz' },
            { icon: '1️⃣', text: 'C1', id: 'c1' }
        ];
        voltPlayer.roles.D26A1 = pullRoleById(d26A1Pool, 'blitz');
    } else {
        d26A1Pool = [
            { icon: '1️⃣', text: 'C1', id: 'c1' },
            { icon: '2️⃣', text: 'C2', id: 'c2' }
        ];
    }
    assignments.forEach(p => { if (!p.roles.D26A1) p.roles.D26A1 = pullRandomRole(d26A1Pool); });

    // --- D26 Última Arena ---
    let d26LastPool = [
        { icon: '⬅️', text: 'Izquierda', id: 'left' },
        { icon: '➡️', text: 'Derecha', id: 'right' }
    ];
    assignments.forEach(p => {
        p.roles.D26Last = pullRandomRole(d26LastPool);
        if (p.isVoltedge) {
            p.roles.D26Last.text += ' (⚠️ Voltedge)';
        }
    });

    // --- D27 6 Cajas ---
    let d27BoxPool = [
        { icon: '🐴', text: 'Trojan', id: 'trojan' },
        { icon: '⬆️', text: 'Arriba', id: 'top' }
    ];
    if (voltPlayer) {
        voltPlayer.roles.D27Box = pullRoleById(d27BoxPool, 'top');
    }
    assignments.forEach(p => { if (!p.roles.D27Box) p.roles.D27Box = pullRandomRole(d27BoxPool); });

    // --- D27 Arena Wolver ---
    let d27WolverPool = [
        { icon: '🗿', text: '1er Tótem', id: 'totem1' },
        { icon: '💣', text: 'EV 2do Tótem', id: 'ev' }
    ];
    if (voltPlayer) {
        voltPlayer.roles.D27Wolver = pullRoleById(d27WolverPool, 'ev');
    }
    assignments.forEach(p => { if (!p.roles.D27Wolver) p.roles.D27Wolver = pullRandomRole(d27WolverPool); });

    // --- D27 Última ---
    let d27LastPool = [
        { icon: '⬅️', text: 'Izquierda', id: 'left' },
        { icon: '➡️', text: 'Derecha', id: 'right' }
    ];
    assignments.forEach(p => p.roles.D27Last = pullRandomRole(d27LastPool));

    // --- D28 Agua ---
    let d28WaterPool = [
        { icon: '✅', text: 'Sí', id: 'yes' },
        { icon: '❌', text: 'No', id: 'no' }
    ];
    assignments.forEach(p => p.roles.D28Water = pullRandomRole(d28WaterPool));

    // --- D28 Boost ---
    let d28BoostPool = [
        { icon: '🦶1️⃣', text: 'Caminar 1', id: 'walk1' },
        { icon: '🦶2️⃣', text: 'Caminar 2', id: 'walk2' }
    ];
    assignments.forEach(p => p.roles.D28Boost = pullRandomRole(d28BoostPool));

    const wormholeNames = assignments.filter(p => p.roles.D24.id === 'cr' || p.roles.D25.id === 'left').map(p => p.displayName);
    const wormholeWarning = wormholeNames.length > 0 ? `⚠️ **Wormhole Necesario:** ${wormholeNames.join(' y ')}` : `⚠️ **Wormhole Necesario:** Ninguno`;

    const allUsernames = assignments.map(p => p.displayName).join(', ');
    const extraMsg = officialMessage ? `\n\n${officialMessage}` : '';

    const embed = new EmbedBuilder()
        .setTitle('✨ Asignación de Roles')
        .setColor(0x2b2d31)
        .setDescription(`${wormholeWarning}${voltMessage}${extraMsg}\n\nRoles para: **${allUsernames}**`);

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Estatuas', value: `↖️ **Arriba Izq:** ${getPlayerForRole(assignments, 'D24', 'tl')}\n➡️ **Centro Der:** ${getPlayerForRole(assignments, 'D24', 'cr')}`, inline: false });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Habitaciones', value: `↘️ **Derecha:** ${getPlayerForRole(assignments, 'D25', 'right')}\n↙️ **Izquierda:** ${getPlayerForRole(assignments, 'D25', 'left')}`, inline: false });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    const d26A1Str = voltPlayer ? `🔫 **Blitz:** ${getPlayerForRole(assignments, 'D26A1', 'blitz')}\n1️⃣ **C1:** ${getPlayerForRole(assignments, 'D26A1', 'c1')}` : `1️⃣ **C1:** ${getPlayerForRole(assignments, 'D26A1', 'c1')}\n2️⃣ **C2:** ${getPlayerForRole(assignments, 'D26A1', 'c2')}`;
    embed.addFields({ name: '📍 Arena 1', value: d26A1Str, inline: true });
    embed.addFields({ name: '📍 Última Arena', value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D26Last', 'left')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D26Last', 'right')}`, inline: true });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 6 Cajas', value: `🐴 **Trojan:** ${getPlayerForRole(assignments, 'D27Box', 'trojan')}\n⬆️ **Arriba:** ${getPlayerForRole(assignments, 'D27Box', 'top')}`, inline: true });
    embed.addFields({ name: '📍 Arena Wolver', value: `🗿 **1er Tótem:** ${getPlayerForRole(assignments, 'D27Wolver', 'totem1')}\n💣 **EV 2do Tótem:** ${getPlayerForRole(assignments, 'D27Wolver', 'ev')}`, inline: true });
    embed.addFields({ name: '📍 Última', value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D27Last', 'left')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D27Last', 'right')}`, inline: true });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Agua', value: `✅ **Sí:** ${getPlayerForRole(assignments, 'D28Water', 'yes')}\n❌ **No:** ${getPlayerForRole(assignments, 'D28Water', 'no')}`, inline: true });
    embed.addFields({ name: '📍 Boost', value: `🦶1️⃣ **Caminar 1:** ${getPlayerForRole(assignments, 'D28Boost', 'walk1')}\n🦶2️⃣ **Caminar 2:** ${getPlayerForRole(assignments, 'D28Boost', 'walk2')}`, inline: true });

    if (officialMessage) {
        await interaction.channel.send({ embeds: [embed] });
    } else {
        await interaction.reply({ embeds: [embed] });
    }

    for (let p of assignments) {
        if (p.isFake) continue;
        let dmMessage = `📌 **TUS ROLES**\n--------------------------------\n`;
        dmMessage += `D24: ${p.roles.D24.icon}\n--------------------------------\n`;
        dmMessage += `D25: ${p.roles.D25.icon}\n--------------------------------\n`;
        dmMessage += `D26: ${p.roles.D26A1.icon} | ${p.roles.D26Last.icon.replace(' (⚠️ Voltedge)', '')}\n--------------------------------\n`;
        dmMessage += `D27: ${p.roles.D27Box.icon} | ${p.roles.D27Wolver.icon} | ${p.roles.D27Last.icon}\n--------------------------------\n`;
        dmMessage += `D28: ${p.roles.D28Water.icon} | ${p.roles.D28Boost.icon}\n`;

        if (wormholeNames.includes(p.displayName)) {
            dmMessage = `⚠️ **Recordatorio:** ¡Necesitas tener el Wormhole instalado!\n\n` + dmMessage;
        }
        
        if (officialMessage) {
            dmMessage = `✅ **Asignación Oficial** (Aprobado para Rango)\n\n` + dmMessage;
        }

        try { await p.user.send(dmMessage); } catch (err) {
            await interaction.channel.send({ content: `❌ No pude enviar el MD a **${p.displayName}**.`});
        }
    }
}

async function asignarTrio(interaction, assignments, voltMessage, officialMessage = '') {
    const voltPlayer = assignments.find(p => p.isVoltedge);

    // --- D24 Estatuas ---
    let d24Pool = [
        { icon: '⬆️', text: 'Arriba', id: 'top' },
        { icon: '➡️', text: 'Derecha', id: 'right' },
        { icon: '↙️', text: 'Izquierda', id: 'left' }
    ];
    assignments.forEach(p => p.roles.D24 = pullRandomRole(d24Pool));

    // --- D25 Habitaciones ---
    let d25Pool = [
        { icon: '↘️', text: 'Abajo Der', id: 'br' },
        { icon: '↗️', text: 'Arriba Der', id: 'tr' },
        { icon: '↙️', text: 'Izquierda', id: 'bl' }
    ];
    const d24SidePlayers = assignments.filter(p => p.roles.D24.id === 'right' || p.roles.D24.id === 'left');
    const chosenForD25TR = d24SidePlayers[Math.floor(Math.random() * d24SidePlayers.length)];
    chosenForD25TR.roles.D25 = pullRoleById(d25Pool, 'tr');

    assignments.forEach(p => { if (!p.roles.D25) p.roles.D25 = pullRandomRole(d25Pool); });

    // --- D26 Arena 1 ---
    let d26A1Pool = [
        { icon: '🔫', text: 'Blitz', id: 'blitz' },
        { icon: '1️⃣', text: 'C1', id: 'c1' },
        { icon: '2️⃣', text: 'C2', id: 'c2' }
    ];
    if (voltPlayer) { voltPlayer.roles.D26A1 = pullRoleById(d26A1Pool, 'blitz'); }
    assignments.forEach(p => { if (!p.roles.D26A1) p.roles.D26A1 = pullRandomRole(d26A1Pool); });

    // --- D26 Última Arena ---
    let d26LastPool = [
        { icon: '↖️', text: 'Empuje Izq', id: 'left_push' },
        { icon: '↗️', text: 'Empuje Der', id: 'right_push' },
        { icon: '↙️', text: 'Receptor', id: 'catcher' }
    ];
    if (voltPlayer) { voltPlayer.roles.D26Last = pullRoleById(d26LastPool, 'catcher'); }
    assignments.forEach(p => { if (!p.roles.D26Last) p.roles.D26Last = pullRandomRole(d26LastPool); });

    // --- D26 Estrategia Slags ---
    let d26BumpPool = [
        { icon: '⬅️', text: 'Izquierda', id: 'left' },
        { icon: '➡️', text: 'Derecha', id: 'right' },
        { icon: '⬆️', text: 'Arriba', id: 'top' }
    ];
    assignments.forEach(p => {
        if (p.roles.D26Last.id === 'left_push') p.roles.D26Bump = pullRoleById(d26BumpPool, 'left');
        if (p.roles.D26Last.id === 'right_push') p.roles.D26Bump = pullRoleById(d26BumpPool, 'right');
    });
    assignments.forEach(p => { if (!p.roles.D26Bump) p.roles.D26Bump = pullRandomRole(d26BumpPool); });

    // --- D27 6 Cajas ---
    let d27BoxPool = [
        { icon: '🐴', text: 'Trojan', id: 'trojan' },
        { icon: '↗️', text: 'Arriba Der', id: 'tr' },
        { icon: '↖️', text: 'Arriba Izq', id: 'tl' }
    ];
    if (voltPlayer) {
        const topId = Math.random() < 0.5 ? 'tr' : 'tl';
        voltPlayer.roles.D27Box = pullRoleById(d27BoxPool, topId);
    }
    assignments.forEach(p => { if (!p.roles.D27Box) p.roles.D27Box = pullRandomRole(d27BoxPool); });

    // --- D27 Arena Wolver ---
    let d27WolverPool = [
        { icon: '⬅️', text: 'Izquierda', id: 'left' },
        { icon: '🗿', text: '1er Tótem', id: 'totem1' },
        { icon: '💣', text: 'EV 2do Tótem', id: 'ev' }
    ];
    if (voltPlayer) { voltPlayer.roles.D27Wolver = pullRoleById(d27WolverPool, 'ev'); }
    assignments.forEach(p => { if (!p.roles.D27Wolver) p.roles.D27Wolver = pullRandomRole(d27WolverPool); });

    // --- D27 Última ---
    let d27LastPool = [
        { icon: '⬅️', text: 'Izquierda', id: 'left' },
        { icon: '🐴', text: 'Trojan', id: 'trojan' },
        { icon: '➡️', text: 'Derecha', id: 'right' }
    ];
    assignments.forEach(p => p.roles.D27Last = pullRandomRole(d27LastPool));

    // --- D28 Agua ---
    let d28WaterPool = [
        { icon: '✅', text: 'Sí', id: 'yes' },
        { icon: '❌', text: 'No', id: 'no1' },
        { icon: '❌', text: 'No', id: 'no2' }
    ];
    assignments.forEach(p => p.roles.D28Water = pullRandomRole(d28WaterPool));

    // --- D28 Boost ---
    let d28BoostPool = [
        { icon: '🎭', text: 'Máscara', id: 'mask' },
        { icon: '🦶1️⃣', text: 'Caminar 1', id: 'walk1' },
        { icon: '🦶2️⃣', text: 'Caminar 2', id: 'walk2' }
    ];
    assignments.forEach(p => p.roles.D28Boost = pullRandomRole(d28BoostPool));

    const wormholeWarning = `⚠️ **Wormhole Necesario:** TODOS`;
    const allUsernames = assignments.map(p => p.displayName).join(', ');
    const extraMsg = officialMessage ? `\n\n${officialMessage}` : '';

    const embed = new EmbedBuilder()
        .setTitle('✨ Asignación de Roles')
        .setColor(0x2b2d31)
        .setDescription(`${wormholeWarning}${voltMessage}${extraMsg}\n\nRoles para: **${allUsernames}**`);

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Estatuas', value: `⬆️ **Arriba:** ${getPlayerForRole(assignments, 'D24', 'top')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D24', 'right')}\n↙️ **Izquierda:** ${getPlayerForRole(assignments, 'D24', 'left')}`, inline: false });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Habitaciones', value: `↘️ **Abajo Der:** ${getPlayerForRole(assignments, 'D25', 'br')}\n↗️ **Arriba Der:** ${getPlayerForRole(assignments, 'D25', 'tr')}\n↙️ **Izquierda:** ${getPlayerForRole(assignments, 'D25', 'bl')}`, inline: false });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Arena 1', value: `🔫 **Blitz:** ${getPlayerForRole(assignments, 'D26A1', 'blitz')}\n1️⃣ **C1:** ${getPlayerForRole(assignments, 'D26A1', 'c1')}\n2️⃣ **C2:** ${getPlayerForRole(assignments, 'D26A1', 'c2')}`, inline: true });
    embed.addFields({ name: '📍 Última Arena', value: `↖️ **Empuje Izq:** ${getPlayerForRole(assignments, 'D26Last', 'left_push')}\n↗️ **Empuje Der:** ${getPlayerForRole(assignments, 'D26Last', 'right_push')}\n↙️ **Receptor:** ${getPlayerForRole(assignments, 'D26Last', 'catcher')}`, inline: true });
    embed.addFields({ name: '📍 Estrategia Slags', value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D26Bump', 'left')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D26Bump', 'right')}\n⬆️ **Arriba:** ${getPlayerForRole(assignments, 'D26Bump', 'top')}`, inline: true });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 6 Cajas', value: `🐴 **Trojan:** ${getPlayerForRole(assignments, 'D27Box', 'trojan')}\n↗️ **Arriba Der:** ${getPlayerForRole(assignments, 'D27Box', 'tr')}\n↖️ **Arriba Izq:** ${getPlayerForRole(assignments, 'D27Box', 'tl')}`, inline: true });
    embed.addFields({ name: '📍 Arena Wolver', value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D27Wolver', 'left')}\n🗿 **1er Tótem:** ${getPlayerForRole(assignments, 'D27Wolver', 'totem1')}\n💣 **EV 2do Tótem:** ${getPlayerForRole(assignments, 'D27Wolver', 'ev')}`, inline: true });
    embed.addFields({ name: '📍 Última', value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D27Last', 'left')}\n🐴 **Trojan:** ${getPlayerForRole(assignments, 'D27Last', 'trojan')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D27Last', 'right')}`, inline: true });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({ name: '📍 Agua', value: `✅ **Sí:** ${getPlayerForRole(assignments, 'D28Water', 'yes')}\n❌ **No:** ${getPlayerForRole(assignments, 'D28Water', 'no1')}\n❌ **No:** ${getPlayerForRole(assignments, 'D28Water', 'no2')}`, inline: true });
    embed.addFields({ name: '📍 Boost', value: `🎭 **Máscara:** ${getPlayerForRole(assignments, 'D28Boost', 'mask')}\n🦶1️⃣ **Caminar 1:** ${getPlayerForRole(assignments, 'D28Boost', 'walk1')}\n🦶2️⃣ **Caminar 2:** ${getPlayerForRole(assignments, 'D28Boost', 'walk2')}`, inline: true });

    if (officialMessage) {
        await interaction.channel.send({ embeds: [embed] });
    } else {
        await interaction.reply({ embeds: [embed] });
    }

    for (let p of assignments) {
        if (p.isFake) continue;
        let dmMessage = `📌 **TUS ROLES**\n--------------------------------\n`;
        dmMessage += `D24: ${p.roles.D24.icon}\n--------------------------------\n`;
        dmMessage += `D25: ${p.roles.D25.icon}\n--------------------------------\n`;
        dmMessage += `D26: ${p.roles.D26A1.icon} | ${p.roles.D26Last.icon} | ${p.roles.D26Bump.icon}\n--------------------------------\n`;
        dmMessage += `D27: ${p.roles.D27Box.icon} | ${p.roles.D27Wolver.icon} | ${p.roles.D27Last.icon}\n--------------------------------\n`;
        dmMessage += `D28: ${p.roles.D28Water.icon} | ${p.roles.D28Boost.icon}\n`;

        dmMessage = `⚠️ **Recordatorio:** ¡Necesitas tener el Wormhole instalado!\n\n` + dmMessage;
        if (officialMessage) {
            dmMessage = `✅ **Asignación Oficial** (Aprobado para Rango)\n\n` + dmMessage;
        }

        try { await p.user.send(dmMessage); } catch (err) {
            await interaction.channel.send({ content: `❌ No pude enviar el MD a **${p.displayName}**.` });
        }
    }
}

async function asignarSquad(interaction, assignments, voltMessage, officialMessage = '') {
    const voltPlayer = assignments.find(p => p.isVoltedge);

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

    const d24BotNames = assignments.filter(p => ['bl', 'br'].includes(p.roles.D24.id)).map(p => p.displayName);
    const d25LeftNames = assignments.filter(p => ['tl', 'bl'].includes(p.roles.D25.id)).map(p => p.displayName);
    const allUsernames = assignments.map(p => p.displayName).join(', ');

    const d24SatisfiesD25 = d24BotNames.some(name => d25LeftNames.includes(name));
    let wormholeWarning = `⚠️ **Wormhole Necesario:** ${d24BotNames.join(' y ')}`;
    if (!d24SatisfiesD25) {
        wormholeWarning += `, y al menos uno de: ${d25LeftNames.join(' o ')}`;
    }
    
    const extraMsg = officialMessage ? `\n\n${officialMessage}` : '';

    const embed = new EmbedBuilder()
        .setTitle('✨ Asignación de Roles')
        .setColor(0x2b2d31)
        .setDescription(`${wormholeWarning}${voltMessage}${extraMsg}\n\nRoles para: **${allUsernames}**`);

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({
        name: '📍 Estatuas',
        value: `↖️ **Arriba Izq:** ${getPlayerForRole(assignments, 'D24', 'tl')}\n↗️ **Arriba Der:** ${getPlayerForRole(assignments, 'D24', 'tr')}\n↙️ **Abajo Izq:** ${getPlayerForRole(assignments, 'D24', 'bl')}\n↘️ **Abajo Der:** ${getPlayerForRole(assignments, 'D24', 'br')}`,
        inline: false
    });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({
        name: '📍 Habitaciones',
        value: `↖️ **Arriba Izq:** ${getPlayerForRole(assignments, 'D25', 'tl')}\n↗️ **Arriba Der:** ${getPlayerForRole(assignments, 'D25', 'tr')}\n↙️ **Abajo Izq:** ${getPlayerForRole(assignments, 'D25', 'bl')}\n↘️ **Abajo Der:** ${getPlayerForRole(assignments, 'D25', 'br')}`,
        inline: false
    });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({
        name: '📍 Arena 1',
        value: `🔫 **Blitz:** ${getPlayerForRole(assignments, 'D26A1', 'blitz')}\n1️⃣ **C1:** ${getPlayerForRole(assignments, 'D26A1', 'c1')}\n2️⃣ **C2:** ${getPlayerForRole(assignments, 'D26A1', 'c2')}\n3️⃣ **C3:** ${getPlayerForRole(assignments, 'D26A1', 'c3')}`,
        inline: true
    });
    embed.addFields({
        name: '📍 Última Arena',
        value: `↖️ **Empuje Izq:** ${getPlayerForRole(assignments, 'D26Last', 'left_push')}\n↗️ **Empuje Der:** ${getPlayerForRole(assignments, 'D26Last', 'right_push')}\n↙️ **Receptor Izq:** ${getPlayerForRole(assignments, 'D26Last', 'left_catcher')}\n↘️ **Receptor Der:** ${getPlayerForRole(assignments, 'D26Last', 'right_catcher')}`,
        inline: true
    });
    embed.addFields({
        name: '📍 Estrategia Bump',
        value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D26Bump', 'left')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D26Bump', 'right')}\n⬆️ **Arriba:** ${getPlayerForRole(assignments, 'D26Bump', 'top')}\n💥 **Bump:** ${getPlayerForRole(assignments, 'D26Bump', 'bump')}`,
        inline: true
    });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({
        name: '📍 6 Cajas',
        value: `🐴 **Trojan:** ${getPlayerForRole(assignments, 'D27Box', 'trojan')}\n🔫 **2do blitz:** ${getPlayerForRole(assignments, 'D27Box', '2nd_blitz')}\n↗️ **Arriba Der:** ${getPlayerForRole(assignments, 'D27Box', 'tr')}\n↖️ **Arriba Izq:** ${getPlayerForRole(assignments, 'D27Box', 'tl')}`,
        inline: true
    });
    embed.addFields({
        name: '📍 Arena Wolver',
        value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D27Wolver', 'left')}\n🗿 **Tótems:** ${getPlayerForRole(assignments, 'D27Wolver', 'totems')}\n💣 **EV:** ${getPlayerForRole(assignments, 'D27Wolver', 'ev')}\n⬆️ **Empuje Arr:** ${getPlayerForRole(assignments, 'D27Wolver', 'top_push')}`,
        inline: true
    });
    embed.addFields({
        name: '📍 Última',
        value: `⬅️ **Izquierda:** ${getPlayerForRole(assignments, 'D27Last', 'left')}\n🐴 **Trojan:** ${getPlayerForRole(assignments, 'D27Last', 'trojan')}\n➡️ **Derecha:** ${getPlayerForRole(assignments, 'D27Last', 'right')}\n🔄 **Rotar/Asis:** ${getPlayerForRole(assignments, 'D27Last', 'rotate')}`,
        inline: true
    });

    embed.addFields({ name: '▬▬▬▬▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬▬▬▬▬', value: '\u200b', inline: false });
    embed.addFields({
        name: '📍 Agua',
        value: `✅ **Sí:** ${getPlayerForRole(assignments, 'D28Water', 'yes')}\n❌ **No:** ${getPlayerForRole(assignments, 'D28Water', 'no1')}\n❌ **No:** ${getPlayerForRole(assignments, 'D28Water', 'no2')}\n❌ **No:** ${getPlayerForRole(assignments, 'D28Water', 'no3')}`,
        inline: true
    });
    embed.addFields({
        name: '📍 Boost',
        value: `🎭1️⃣ **Máscara 1:** ${getPlayerForRole(assignments, 'D28Boost', 'mask1')}\n🦶1️⃣ **Caminar 1:** ${getPlayerForRole(assignments, 'D28Boost', 'walk1')}\n🎭2️⃣ **Máscara 2:** ${getPlayerForRole(assignments, 'D28Boost', 'mask2')}\n🦶2️⃣ **Caminar 2:** ${getPlayerForRole(assignments, 'D28Boost', 'walk2')}`,
        inline: true
    });

    if (officialMessage) {
        await interaction.channel.send({ embeds: [embed] });
    } else {
        await interaction.reply({ embeds: [embed] });
    }

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
        
        if (officialMessage) {
            dmMessage = `✅ **Asignación Oficial** (Aprobado para Rango)\n\n` + dmMessage;
        }

        try {
            await p.user.send(dmMessage);
        } catch (err) {
            await interaction.channel.send({ content: `❌ No pude enviar el MD a **${p.displayName}**.` });
        }
    }
}

module.exports = {
    asignarDuo,
    asignarTrio,
    asignarSquad
};
