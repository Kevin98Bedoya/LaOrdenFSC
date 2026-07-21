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

const WR_4P = 487; // 8:07
const WR_3P = 523; // 8:43
const WR_2P = 597; // 9:57

const diff_3p = WR_3P - WR_4P; // 36
const diff_2p = WR_2P - WR_4P; // 110

const round5 = (num) => Math.round(num / 5) * 5;

ranks.forEach(r => {
    const ratio = r.am4 / r.ex4; // > 1
    
    // Trio
    const ex3 = r.ex4 + diff_3p;
    const theo_am3 = ex3 * ratio;
    const comp_3p = theo_am3 - ex3;
    const final_3p = round5(ex3 + comp_3p * (2/3));
    
    // Duo
    const ex2 = r.ex4 + diff_2p;
    const theo_am2 = ex2 * ratio;
    const comp_2p = theo_am2 - ex2;
    const final_2p = round5(ex2 + comp_2p * (1/3));

    console.log(`{ name: '${r.name}', time: ${r.am4}, time3p: ${final_3p}, time2p: ${final_2p} }, // Ex4: ${r.ex4}, Ex3: ${ex3}, Ratio: ${ratio.toFixed(2)}, Comp3: ${comp_3p.toFixed(2)}, AppComp3: ${(comp_3p*2/3).toFixed(2)}`);
});
