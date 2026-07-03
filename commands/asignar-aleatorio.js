const { SlashCommandBuilder } = require('discord.js');

const PATHS = [
    {
        name: 'Rol 1 (Necesita Wormhole)',
        content: `✨ **Tus roles asignados para la run:**

▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬
📍 **Estatua**
↘️ Abajo derecha

▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬
📍 **Habitaciones**
↗️ Arriba derecha

▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬
📍 **Arena 1**
2️⃣ C2
📍 **Última Arena**
↙️ Receptor izquierdo
📍 **Estrategia Bump**
⬆️ Arriba

▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬
📍 **6 Cajas**
🐴 Trojan
📍 **Arena Wolver**
🗿 Tótems
📍 **Última**
➡️ Derecha

▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬
📍 **¿Regando?**
❌ No
📍 **Boost**
3️⃣ Caminar 1`
    },
    {
        name: 'Rol 2',
        content: `✨ **Tus roles asignados para la run:**

▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬
📍 **Estatua**
↗️ Arriba derecha

▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬
📍 **Habitaciones**
↖️ Arriba izquierda

▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬
📍 **Arena 1**
🔫 Blitz
📍 **Última Arena**
↗️ Empujador derecho
📍 **Estrategia Bump**
➡️ Derecha

▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬
📍 **6 Cajas**
🔫 2do blitz
📍 **Arena Wolver**
⬆️ Empujar arriba
📍 **Última**
⬅️ Izquierda

▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬
📍 **¿Regando?**
✅ Sí
📍 **Boost**
4️⃣ Máscara 2`
    },
    {
        name: 'Rol 3 (Necesita Wormhole)',
        content: `✨ **Tus roles asignados para la run:**

▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬
📍 **Estatua**
↙️ Abajo izquierda

▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬
📍 **Habitaciones**
↙️ Abajo izquierda

▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬
📍 **Arena 1**
1️⃣ C1
📍 **Última Arena**
↘️ Receptor derecho
📍 **Estrategia Bump**
💥 Bump

▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬
📍 **6 Cajas**
↗️ Arriba derecha
📍 **Arena Wolver**
⬅️ Izquierda
📍 **Última**
🐴 Trojan

▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬
📍 **¿Regando?**
❌ No
📍 **Boost**
2️⃣ Máscara 1`
    },
    {
        name: 'Rol 4',
        content: `✨ **Tus roles asignados para la run:**

▬▬▬▬▬▬ PISO: D24 ▬▬▬▬▬▬
📍 **Estatua**
↖️ Arriba izquierda

▬▬▬▬▬▬ PISO: D25 ▬▬▬▬▬▬
📍 **Habitaciones**
↘️ Abajo derecha

▬▬▬▬▬▬ PISO: D26 ▬▬▬▬▬▬
📍 **Arena 1**
3️⃣ C3
📍 **Última Arena**
↖️ Empujador izquierdo
📍 **Estrategia Bump**
⬅️ Izquierda

▬▬▬▬▬▬ PISO: D27 ▬▬▬▬▬▬
📍 **6 Cajas**
↖️ Arriba izquierda
📍 **Arena Wolver**
💣 EV
📍 **Última**
🔄 Rotar / Asistir

▬▬▬▬▬▬ PISO: D28 ▬▬▬▬▬▬
📍 **¿Regando?**
❌ No
📍 **Boost**
5️⃣ Caminar 2`
    }
];

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asignar-aleatorio')
        .setDescription('Asigna roles aleatorios a los 4 jugadores en privado.')
        .addUserOption(option => option.setName('jugador1').setDescription('Jugador 1').setRequired(true))
        .addUserOption(option => option.setName('jugador2').setDescription('Jugador 2').setRequired(true))
        .addUserOption(option => option.setName('jugador3').setDescription('Jugador 3').setRequired(true))
        .addUserOption(option => option.setName('jugador4').setDescription('Jugador 4').setRequired(true)),
    async execute(interaction) {
        const users = [
            interaction.options.getUser('jugador1'),
            interaction.options.getUser('jugador2'),
            interaction.options.getUser('jugador3'),
            interaction.options.getUser('jugador4')
        ];

        // Asegurarse de que todos sean únicos? (Opcional, pero asumimos que eligen a 4 usuarios distintos)

        let shuffledPaths = shuffle([...PATHS]);

        await interaction.reply({
            content: `🎲 Asignando roles aleatorios para **${users.map(u => u.username).join(', ')}**...\nRevisen sus Mensajes Directos (MD) para ver qué roles les tocó. (Recuerden tener los MD abiertos).`
        });

        for (let i = 0; i < 4; i++) {
            try {
                await users[i].send(shuffledPaths[i].content);
            } catch (err) {
                console.error(`No se pudo enviar MD a ${users[i].username}`, err);
                await interaction.followUp({ content: `❌ No pude enviar el MD a **${users[i].username}**. Asegúrate de que tiene los mensajes directos habilitados en este servidor.`, ephemeral: true });
            }
        }

        // Identificar quiénes necesitan Wormhole
        const wormholeUsers = [];
        for (let i = 0; i < 4; i++) {
            if (shuffledPaths[i].name.includes('Wormhole')) {
                wormholeUsers.push(users[i].username);
            }
        }

        await interaction.followUp({
            content: `⚠️ **Jugadores que necesitan llevar Wormhole:** ${wormholeUsers.join(', ')}`
        });
    },
};
