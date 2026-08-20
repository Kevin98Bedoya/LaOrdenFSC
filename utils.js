const RANGOS = [
    { name: 'Sin-Rango', time: 1020, time3p: 1040, time2p: 1105, weight: 110, prizeWeight: 0 },
    { name: 'C', time: 1020, time3p: 1040, time2p: 1105, weight: 110, prizeWeight: 10 },
    { name: 'C+', time: 945, time3p: 970, time2p: 1030, weight: 110, prizeWeight: 13 },
    { name: 'B', time: 850, time3p: 880, time2p: 940, weight: 110, prizeWeight: 18 },
    { name: 'B+', time: 770, time3p: 800, time2p: 865, weight: 120, prizeWeight: 25 },
    { name: 'A', time: 720, time3p: 755, time2p: 815, weight: 130, prizeWeight: 34 },
    { name: 'A+', time: 675, time3p: 710, time2p: 770, weight: 130, prizeWeight: 46 },
    { name: 'S', time: 650, time3p: 690, time2p: 750, weight: 140, prizeWeight: 61 },
    { name: 'S+', time: 600, time3p: 640, time2p: 700, weight: 180, prizeWeight: 80 }
];

const RANGOS_NOMBRES = ['Sin-Rango', 'C', 'C+', 'B', 'B+', 'A', 'A+', 'S', 'S+'];

const getUserRank = (member) => {
    if (!member || !member.roles) return 'Sin-Rango';
    
    let highestIndex = 0; // Default a Sin-Rango
    let foundRank = false;

    member.roles.cache.forEach(role => {
        const index = RANGOS_NOMBRES.indexOf(role.name);
        if (index !== -1) {
            foundRank = true;
            if (index > highestIndex) {
                highestIndex = index;
            }
        }
    });

    if (!foundRank) return 'Sin-Rango';
    return RANGOS_NOMBRES[highestIndex];
};

const getRankData = (rankName) => RANGOS.find(r => r.name === rankName) || RANGOS[0];
const getRankIndex = (rankName) => RANGOS_NOMBRES.indexOf(rankName);

const ensureRole = async (guild, roleName) => {
    let role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
        role = await guild.roles.create({
            name: roleName,
            reason: 'Rol creado automáticamente por el Bot de Rangos.'
        });
    }
    return role;
};

const getUserHistory = (member) => {
    if (!member || !member.roles) return null;
    
    let bestHistory = null;
    let highestSeason = -1;

    member.roles.cache.forEach(role => {
        const match = role.name.match(/^(.+?)\s+T(\d+)$/);
        if (match) {
            const rankName = match[1];
            const seasonNum = parseInt(match[2], 10);
            if (RANGOS_NOMBRES.includes(rankName)) {
                if (seasonNum > highestSeason) {
                    highestSeason = seasonNum;
                    bestHistory = {
                        rankName: rankName,
                        season: `T${seasonNum}`,
                        index: RANGOS_NOMBRES.indexOf(rankName)
                    };
                }
            }
        }
    });

    return bestHistory;
};

const getCurrentSeason = (guild) => {
    let highestSeason = 0;
    guild.roles.cache.forEach(role => {
        const match = role.name.match(/^(.+?)\s+T(\d+)$/);
        if (match) {
            const rankName = match[1];
            const seasonNum = parseInt(match[2], 10);
            if (RANGOS_NOMBRES.includes(rankName)) {
                if (seasonNum > highestSeason) {
                    highestSeason = seasonNum;
                }
            }
        }
    });
    return highestSeason;
};

const RANGO_EMOJIS = {
    'S+': 'S2_Rank',
    'S': 'S_Rank',
    'A+': 'A2_Rank',
    'A': 'A_Rank',
    'B+': 'B2_Rank',
    'B': 'B_Rank',
    'C+': 'C2_Rank',
    'C': 'C_Rank',
    'Sin-Rango': 'No_Rank'
};

const getRankEmoji = (rankName, guildOrClient) => {
    const emojiName = RANGO_EMOJIS[rankName];
    if (!emojiName) return '';
    
    if (guildOrClient) {
        // Buscar primero en el caché de emojis del servidor o del cliente
        const emoji = guildOrClient.emojis?.cache.find(e => e.name === emojiName);
        if (emoji) return emoji.toString(); // Devuelve <:name:id>
    }
    
    return `:${emojiName}:`;
};

module.exports = {
    RANGOS,
    RANGOS_NOMBRES,
    RANGO_EMOJIS,
    getUserRank,
    getRankData,
    getRankIndex,
    ensureRole,
    getUserHistory,
    getCurrentSeason,
    getRankEmoji
};
