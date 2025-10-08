// ----------------- 確保敵方3周圍土地生成 -----------------
function ensureEnemy3Vicinity(radius = 3) {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy3");
    for (const cell of enemyCells) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                ensureCell(cell.x + dx, cell.y + dy);
            }
        }
    }
}

// ----------------- 敵方3產資源 -----------------
function enemy3Produce() {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy3");

    for (const cell of enemyCells) {
        if (cell.isBarrack) {
            const cost = barrackCost[cell.barrackLevel];
            if (enemy3Resources >= cost) {
                enemy3Resources -= cost;
                enemy3Army += barrackProd[cell.barrackLevel];
            }
        } else {
            const prod = getProduction(cell, "enemy3");
            enemy3Resources += prod;
            if (cell.level === 5) enemy3Special += 1;
        }
    }
}

// ----------------- 敵方3購地 -----------------
function enemy3BuyLand() {
    const possibleBuy = [...cells.values()].filter(c => 
        !c.owned && c.terrain !== 'mountain' && isAdjacentToEnemy3(c)
    );

    if (possibleBuy.length > 0) {
        const target = possibleBuy[Math.floor(Math.random() * possibleBuy.length)];
        const cost = getCost(target);
        if (enemy3Resources >= cost) {
            enemy3Resources -= cost;
            target.owned = true;
            target.owner = "enemy3";
            target.level = 1;
            return getProduction(target, "enemy3");
        }
    }
    return 0;
}

// ----------------- 判斷是否鄰近敵方3已擁有土地 -----------------
function isAdjacentToEnemy3(cell){
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    return dirs.some(d => {
        const key = `${cell.x + d[0]},${cell.y + d[1]}`;
        return cells.has(key) && cells.get(key).owner === "enemy3";
    });
}