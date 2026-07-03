const RANGOS = [
    { name: 'Sin-Rango', time: 1020, weight: 110 },
    { name: 'C', time: 1020, weight: 110 },
    { name: 'C+', time: 945, weight: 110 },
    { name: 'B', time: 850, weight: 110 },
    { name: 'B+', time: 770, weight: 120 },
    { name: 'A', time: 720, weight: 130 },
    { name: 'A+', time: 675, weight: 130 },
    { name: 'S', time: 650, weight: 140 },
    { name: 'S+', time: 600, weight: 180 }
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

module.exports = {
    RANGOS,
    RANGOS_NOMBRES,
    getUserRank,
    getRankData,
    getRankIndex,
    ensureRole
};
