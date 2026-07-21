const ranks = [
    { name: 'C', ex4: 660, am4: 1020 },
    { name: 'C+', ex4: 630, am4: 945 },
    { name: 'B', ex4: 590, am4: 850 },
    { name: 'B+', ex4: 560, am4: 770 },
    { name: 'A', ex4: 540, am4: 720 },
    { name: 'A+', ex4: 510, am4: 675 },
    { name: 'S', ex4: 510, am4: 650 },
    { name: 'S+', ex4: 490, am4: 600 }
];

const WR_4P = 487;
const WR_3P = 523;
const WR_2P = 597;

const round5 = (num) => Math.round(num / 5) * 5;
const formatTime = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

console.log("=== MODELO PROPORCIONAL DE WR (Garantiza T2 > T3 > T4) ===");
console.log("3p mantiene 2/3 del bonus de tiempo. 2p mantiene 1/3 del bonus.");
ranks.forEach(r => {
    // 3p
    const t3_relaxed = r.am4 * (WR_3P / WR_4P);
    const bonus3 = t3_relaxed - r.am4;
    const final_3p = round5(r.am4 + bonus3 * (2/3));
    
    // 2p
    const t2_relaxed = r.am4 * (WR_2P / WR_4P);
    const bonus2 = t2_relaxed - r.am4;
    const final_2p = round5(r.am4 + bonus2 * (1/3));

    console.log(`${r.name.padEnd(9)} | 4p: ${formatTime(r.am4)} | 3p: ${formatTime(final_3p)} | 2p: ${formatTime(final_2p)}`);
});

console.log("\n=== EL MODELO MATEMATICO DEL USUARIO (El que reduce el tiempo en C) ===");
ranks.forEach(r => {
    const ratio = r.ex4 / r.am4;
    
    // 3p
    // WR 3p - WR 4p = 36. User usó 40 para S+. Usemos 36.
    const ex3 = r.ex4 + 36;
    const am3_theo = ex3 / ratio;
    const comp3 = am3_theo - ex3;
    const final_3p = round5(ex3 + comp3 * (2/3));
    
    // 2p
    const ex2 = r.ex4 + 110;
    const am2_theo = ex2 / ratio;
    const comp2 = am2_theo - ex2;
    const final_2p = round5(ex2 + comp2 * (1/3));

    console.log(`${r.name.padEnd(9)} | 4p: ${formatTime(r.am4)} | 3p: ${formatTime(final_3p)} | 2p: ${formatTime(final_2p)}`);
});
