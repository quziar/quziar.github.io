let enemy6TargetCell = null;
let nu = 0;

// ----------------- 確保敵方6周圍土地生成 -----------------
function ensureEnemy6Vicinity(radius = 3) {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy6");
    for (const cell of enemyCells) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                ensureCell(cell.x + dx, cell.y + dy);
            }
        }
    }
}

// ----------------- 判斷是否鄰近敵方6已擁有土地 -----------------
function isAdjacentToEnemy6(cell){
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    return dirs.some(d => {
        const key = `${cell.x + d[0]},${cell.y + d[1]}`;
        return cells.has(key) && cells.get(key).owner === "enemy6";
    });
}

// ----------------- 敵方6產資源 -----------------
function enemy6Produce() {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy6");

    for (const cell of enemyCells) {
        if (cell.isBarrack) {
            const cost = barrackCost[cell.barrackLevel];
            if (enemy6Resources >= cost) {
                enemy6Resources -= cost;
                enemy6Army += barrackProd[cell.barrackLevel];
            }
        } else {
            const prod = getProduction(cell, "enemy6");
            enemy6Resources += prod;
        }
    }
}

// ----------------- 敵方6購地 -----------------
function enemy6BuyLand() {
    if (!enemy6TargetCell || !enemy6TargetCell.owned || enemy6TargetCell.owner === "enemy6") {
        // 找出最多土地的勢力
        const counts = {};
        for (const c of cells.values()) {
            if (c.owned && c.owner !== "enemy6") {
                counts[c.owner] = (counts[c.owner] || 0) + 1;
            }
        }
        const maxOwner = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, null);

        if (!maxOwner) return 0;

        // 在該勢力的土地中隨機挑一塊當目標
        const enemyLands = [...cells.values()].filter(c => c.owner === maxOwner);
        if (enemyLands.length === 0) return 0;

        enemy6TargetCell = enemyLands[Math.floor(Math.random() * enemyLands.length)];
    }

    // 找出 enemy6 當前土地
    const current = [...cells.values()].find(c => c.owner === "enemy6");
    if (!current) return 0;

    // 嘗試朝目標靠近
    const possibleMoves = [...cells.values()].filter(c =>
        c.terrain !== "mountain" && isAdjacentToEnemy6(c)
    );

    if (possibleMoves.length === 0) return 0;

    // 選擇距離目標最近的土地
    let target = possibleMoves.reduce((a, b) => 
        distance(b, enemy6TargetCell) < distance(a, enemy6TargetCell) ? b : a
    );

    // 移動 → 新土地繼承舊土地等級
    target.owned = true;
    target.owner = "enemy6";
    if (nu === 3){target.level = current.level+1;nu=0;}
    else{target.level = current.level;nu++;}
    target.isBarrack = current.isBarrack;
    target.barrackLevel = current.barrackLevel;
    target.costModifier = current.costModifier;

    // 原土地變無主
    current.owner = null;
    current.owned = false;
    current.level = 1;
    current.isBarrack = false;
    current.barrackLevel = 0;
    current.costModifier = 0;

    // 如果到達目標 → 清除鎖定
    if (target === enemy6TargetCell) {
        enemy6TargetCell = null;
    }
}

// 計算距離
function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}