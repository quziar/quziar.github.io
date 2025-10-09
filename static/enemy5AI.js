// ----------------- 確保敵方5周圍土地生成 -----------------
function ensureEnemy5Vicinity(radius = 3) {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy5");
    for (const cell of enemyCells) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                ensureCell(cell.x + dx, cell.y + dy);
            }
        }
    }
}

// ----------------- 敵方5產資源 -----------------
function enemy5Produce() {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy5");

    for (const cell of enemyCells) {
        if (cell.isBarrack) {
            enemy5Resources += (barrackProd[cell.barrackLevel]*5);
        } else {
            const prod = getProduction(cell, "enemy5");
            enemy5Resources += prod;
            if (cell.level >= 5) enemy5Special += (cell.level-4);
        }
    }
}

// ----------------- 敵方5佔領 -----------------
async function enemy5Attack() {
    const targets = [...cells.values()].filter(c => 
        c.owner && c.owner !== "enemy5" && isAdjacentToEnemy5(c)
    );

    const strongestAltar = [...cells.values()].reduce((max, c) => {
        return (c.owner === "enemy5" && c.isAltar && (!max || c.altarLevel > max.altarLevel)) ? c : max;
    }, null);

    if (strongestAltar === null);
    else {
        if(enemy5Resources>=1000 && enemy5Special>=100 && strongestAltar.altarLevel<10){
            strongestAltar.altarLevel++;
            if(strongestAltar.altarLevel>=10)await bigbang({enemy5Resources:enemy5Resources,enemy5Special:enemy5Special});
        }
    }

    if (targets.length === 0) return 0;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const required = target.isAltar
            ? (target.altarLevel * 100)
            : target.isBarrack
                ? (target.barrackLevel * 100)
                : (target.level * 10);

    if (enemy5Resources >= required*5) {
        enemy5Resources -= required*5;

        target.owner = "enemy5";
    }
}

// ----------------- 判斷是否鄰近敵方5已擁有土地 -----------------
function isAdjacentToEnemy5(cell){
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    return dirs.some(d => {
        const key = `${cell.x + d[0]},${cell.y + d[1]}`;
        return cells.has(key) && cells.get(key).owner === "enemy5";
    });
}