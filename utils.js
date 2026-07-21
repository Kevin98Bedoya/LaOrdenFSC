const RANGOS = [
    { name: 'Sin-Rango', time: 1020, time3p: 1070, time2p: 1095, weight: 110 },
    { name: 'C', time: 1020, time3p: 1070, time2p: 1095, weight: 110 },
    { name: 'C+', time: 945, time3p: 990, time2p: 1015, weight: 110 },
    { name: 'B', time: 850, time3p: 890, time2p: 915, weight: 110 },
    { name: 'B+', time: 770, time3p: 810, time2p: 830, weight: 120 },
    { name: 'A', time: 720, time3p: 755, time2p: 775, weight: 130 },
    { name: 'A+', time: 675, time3p: 710, time2p: 725, weight: 130 },
    { name: 'S', time: 650, time3p: 680, time2p: 700, weight: 140 },
    { name: 'S+', time: 600, time3p: 630, time2p: 645, weight: 180 }
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

module.exports = {
    RANGOS,
    RANGOS_NOMBRES,
    getUserRank,
    getRankData,
    getRankIndex,
    ensureRole,
    getUserHistory,
    getCurrentSeason
};
