let enemy2UpgradeableLand = [];

// ----------------- 確保敵方2周圍土地生成 -----------------
function ensureEnemy2Vicinity(radius = 3) {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy2");
    for (const cell of enemyCells) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                ensureCell(cell.x + dx, cell.y + dy);
            }
        }
    }
}

// ----------------- 判斷是否鄰近敵方2已擁有土地 -----------------
function isAdjacentToEnemy2(cell){
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    return dirs.some(d => {
        const key = `${cell.x + d[0]},${cell.y + d[1]}`;
        return cells.has(key) && cells.get(key).owner === "enemy2";
    });
}

// ----------------- 更新可升級土地列表 -----------------
function updateEnemy2UpgradeableLand() {
    // 1️⃣ 移除不再符合條件的（包含 LV1）
    enemy2UpgradeableLand = enemy2UpgradeableLand.filter(c =>
        c.owner === "enemy2" &&
        !c.isBarrack &&
        c.level < 10 &&
        c.level > 1 // 移除 LV1
    );

    // 2️⃣ 候補池（允許 LV1 重新加入）
    const allNonLV10Land = [...cells.values()].filter(c =>
        c.owner === "enemy2" &&
        !c.isBarrack &&
        c.level < 10 &&
        !enemy2UpgradeableLand.includes(c)
    );

    // 3️⃣ 最大可升級數量（包含 LV1）
    const enemy2Cells = [...cells.values()].filter(c => c.owner === "enemy2" && !c.isBarrack);
    const numNonLV10Land = enemy2Cells.filter(c => c.level < 10).length; 
    const maxUpgradeable = Math.floor(numNonLV10Land / 4);

    // 4️⃣ 補充土地
    const remainingSlots = maxUpgradeable - enemy2UpgradeableLand.length;
    if (allNonLV10Land.length > 0 && remainingSlots > 0) {
        allNonLV10Land.sort((b, a) => distanceToNearestEnemy(a) - distanceToNearestEnemy(b)); 
        enemy2UpgradeableLand.push(...allNonLV10Land.slice(0, remainingSlots));
    }
}

// ----------------- 計算距離最近敵人土地 -----------------
function distanceToNearestEnemy(cell) {
    const enemy2Cells = [...cells.values()].filter(c => c.owner && c.owner !== "enemy2");
    if (enemy2Cells.length === 0) return Infinity;

    let minDist = Infinity;
    for (const e of enemy2Cells) {
        const dx = e.x - cell.x;
        const dy = e.y - cell.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) minDist = dist;
    }
    return minDist;
}

// ----------------- 選擇行動 (AI2) -----------------
function chooseEnemy2Action() {
    const enemy2Cells = [...cells.values()].filter(c => c.owner === "enemy2");
    const enemy2Land = enemy2Cells.filter(c => !c.isBarrack);
    const enemy2Barracks = enemy2Cells.filter(c => c.isBarrack);

    // 非我方且非兵營土地可攻擊
    const attackTargets = [...cells.values()].filter(c => 
        c.owner && c.owner !== "enemy2" && !c.isBarrack && isAdjacentToEnemy(c)
    );

    // 最高等級非LV10土地
    const maxLevelNonLV10 = Math.max(
        0,
        ...enemy2Land.filter(c => c.level < 10).map(c => c.level)
    );

    // ------------------- 優先條件 -------------------
    // 1️⃣ 攻擊
    if (enemy2Army >= 50 && attackTargets.length > 0) {
        enemy2Attack();
    }

    // 2️⃣ 升級兵營
    if (enemy2Barracks.some(b => b.barrackLevel < 10) && enemy2Resources > 100 && enemy2Special > 20) {
       enemy2UpgradeBarrack();
    }

    // 3️⃣ 建造兵營
    const numBarracks = enemy2Barracks.length;
    const numLV10Land = enemy2Land.filter(c => c.level === 10).length;
    if (numBarracks * 3 < numLV10Land && enemy2Special > 10) {
        enemy2BuildBarrack();
    }

    // 4️⃣ 升級土地
    const numNonLV10Land = enemy2Land.filter(c => c.level < 10).length;
    if (numLV10Land * 4 < numNonLV10Land && enemy2Resources > upgradeCosts[maxLevelNonLV10 - 1]) {
        enemy2UpgradeLand();
    }

    // 5️⃣ 購買土地
    if (enemy2Resources >= 10) {
        enemy2BuyLand();
    }
}

// ----------------- 敵方2產資源 -----------------
function enemy2Produce() {
    let gain = 0;
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy2");

    for (const cell of enemyCells) {
        if (cell.isBarrack) {
            const cost = barrackCost[cell.barrackLevel];
            if (enemy2Resources >= cost) {
                enemy2Resources -= cost;
                enemy2Army += barrackProd[cell.barrackLevel];
            }
        } else {
            const prod = getProduction(cell, "enemy2");
            enemy2Resources += prod;
            gain += prod; // 累計本回合產量收益
            if (cell.level >= 5) enemy2Special += (cell.level-4);
        }
    }
    return gain;
}

// ----------------- 升級土地 -----------------
function enemy2UpgradeLand() {
    updateEnemy2UpgradeableLand();

    for (const cell of enemy2UpgradeableLand) {
        if (cell.level < 10) {
            const cost = upgradeCosts[cell.level - 1];
            if (enemy2Resources >= cost) {
                enemy2Resources -= cost;
                cell.level++;
                return;
            }
        }
    }
}

// ----------------- 升級兵營 -----------------
function enemy2UpgradeBarrack() {
    const enemy2Cells = [...cells.values()].filter(c => c.owner === "enemy2" && c.isBarrack);

    for (const cell of enemy2Cells) {
        if (cell.barrackLevel < 10 && enemy2Resources >= 100 && enemy2Special >= 20) { 
            enemy2Resources -= 100;
            enemy2Special -= 20;
            cell.barrackLevel++;
            return;
        }
    }
}

// ----------------- 建造兵營 -----------------
function enemy2BuildBarrack() {
    const enemy2Cells = [...cells.values()].filter(c => c.owner === "enemy2" && !c.isBarrack && c.level >= 5);

    for (const cell of enemy2Cells) {
        if (!cell.isBarrack && enemy2Special >= 10) {
            const beforlevel = cell.level;
            enemy2Special -= 10;
            cell.isBarrack = true;
            cell.barrackLevel = (beforlevel-4);
            return;
        }
    }
}

// ----------------- 敵方2購地 -----------------
function enemy2BuyLand() {
    const possibleBuy = [...cells.values()].filter(c => 
        !c.owned && c.terrain !== 'mountain' && isAdjacentToEnemy2(c)
    );

    if (possibleBuy.length > 0) {
        const target = possibleBuy[Math.floor(Math.random() * possibleBuy.length)];
        const cost = getCost(target);
        if (enemy2Resources >= cost) {
            enemy2Resources -= cost;
            target.owned = true;
            target.owner = "enemy2";
            target.level = 1;
            return;
        }
    }
    return 0;
}

// ----------------- 敵方2攻擊 -----------------
function enemy2Attack() {
    const targets = [...cells.values()].filter(c => 
        c.owner && c.owner !== "enemy2" && isAdjacentToEnemy2(c)
    );
    if (targets.length === 0) return 0;

    function getPriority(cell) {
        if (cell.isBarrack) {
            return cell.barrackLevel+5; 
        } else {
            switch (cell.level) {
                case 2: return 1;
                case 3: return 1;
                case 4: return 1;
                case 1: return 2;
                case 5: return 1;
                default: return 6;
            }
        }
    }

    targets.sort((a, b) => getPriority(a) - getPriority(b));

    const target = targets[0];

    const required = target.isAltar
            ? (target.altarLevel * 100)
            : target.isBarrack
                ? (target.barrackLevel * 100)
                : (target.level * 10);

    if (enemy2Army >= required) {
        enemy2Army -= required;

        target.owner = null;
        target.owned = false;
        target.level = 1;
        target.isBarrack = false;
        target.barrackLevel = 0;
        target.costModifier = 0;
    }
}