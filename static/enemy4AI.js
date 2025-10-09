let enemy4UpgradeableLand = [];

// ----------------- 確保敵方4周圍土地生成 -----------------
function ensureEnemy4Vicinity(radius = 3) {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy4");
    for (const cell of enemyCells) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                ensureCell(cell.x + dx, cell.y + dy);
            }
        }
    }
}

// ----------------- 判斷是否鄰近敵方4已擁有土地 -----------------
function isAdjacentToEnemy4(cell){
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    return dirs.some(d => {
        const key = `${cell.x + d[0]},${cell.y + d[1]}`;
        return cells.has(key) && cells.get(key).owner === "enemy4";
    });
}

// ----------------- 更新可升級土地列表 -----------------
function updateEnemy4UpgradeableLand() {
    // 1️⃣ 移除不再符合條件的（包含 LV1）
    enemy4UpgradeableLand = enemy4UpgradeableLand.filter(c =>
        c.owner === "enemy4" &&
        !c.isBarrack &&
        c.level < 5 &&
        c.level > 1 // 移除 LV1
    );

    // 2️⃣ 候補池（允許 LV1 重新加入）
    const allNonLV5Land = [...cells.values()].filter(c =>
        c.owner === "enemy4" &&
        !c.isBarrack &&
        c.level < 5 &&
        !enemy4UpgradeableLand.includes(c)
    );

    // 3️⃣ 最大可升級數量（包含 LV1）
    const enemy4Cells = [...cells.values()].filter(c => c.owner === "enemy4" && !c.isBarrack);
    const numNonLV5Land = enemy4Cells.filter(c => c.level < 5).length; 
    const maxUpgradeable = Math.floor(numNonLV5Land / 4);

    // 4️⃣ 補充土地
    const remainingSlots = maxUpgradeable - enemy4UpgradeableLand.length;
    if (allNonLV5Land.length > 0 && remainingSlots > 0) {
        allNonLV5Land.sort((a, b) => distanceToNearestEnemy(a) - distanceToNearestEnemy(b));
        enemy4UpgradeableLand.push(...allNonLV5Land.slice(0, remainingSlots));
    }
}

// ----------------- 計算距離最近敵人土地 -----------------
function distanceToNearestEnemy(cell) {
    const enemy4Cells = [...cells.values()].filter(c => c.owner && c.owner !== "enemy4");
    if (enemy4Cells.length === 0) return Infinity;

    let minDist = Infinity;
    for (const e of enemy4Cells) {
        const dx = e.x - cell.x;
        const dy = e.y - cell.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) minDist = dist;
    }
    return minDist;
}

// ----------------- 選擇行動 (AI4) -----------------
function chooseEnemy4Action() {
    const enemy4Cells = [...cells.values()].filter(c => c.owner === "enemy4");
    const enemy4Land = enemy4Cells.filter(c => !c.isBarrack);
    const enemy4Barracks = enemy4Cells.filter(c => c.isBarrack);

    // 非我方且非兵營土地可攻擊
    const attackTargets = [...cells.values()].filter(c => 
        c.owner && c.owner !== "enemy4" && !c.isBarrack && isAdjacentToEnemy(c)
    );

    // 最高等級非LV5土地
    const maxLevelNonLV5 = Math.max(
        0,
        ...enemy4Land.filter(c => c.level < 5).map(c => c.level)
    );

    // ------------------- 優先條件 -------------------
    // 1️⃣ 攻擊
    if (enemy4Army >= 50 && attackTargets.length > 0) {
        enemy4Attack();
    }

    // 2️⃣ 升級兵營
    if (enemy4Barracks.some(b => b.barrackLevel < 5) && enemy4Resources > 100 && enemy4Special > 20) {
       enemy4UpgradeBarrack();
    }

    // 3️⃣ 建造兵營
    const numBarracks = enemy4Barracks.length;
    const numLV5Land = enemy4Land.filter(c => c.level === 5).length;
    if (numBarracks * 3 < numLV5Land && enemy4Special > 10) {
        enemy4BuildBarrack();
    }

    // 4️⃣ 升級土地
    const numNonLV5Land = enemy4Land.filter(c => c.level < 5).length;
    if (numLV5Land * 4 < numNonLV5Land && enemy4Resources > upgradeCosts[maxLevelNonLV5 - 1]) {
        enemy4UpgradeLand();
    }

    // 5️⃣ 購買土地
    if (enemy4Resources >= 10) {
        enemy4BuyLand();
    }
}

// ----------------- 敵方4產資源 -----------------
function enemy4Produce() {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy4");

    for (const cell of enemyCells) {
        if (cell.isBarrack) {
            const cost = barrackCost[cell.barrackLevel];
            if (enemy4Resources >= cost) {
                enemy4Resources -= cost;
                enemy4Army += barrackProd[cell.barrackLevel];
            }
        } else {
            const prod = getProduction(cell, "enemy4");
            enemy4Resources += prod;
            if (cell.level === 5) enemy4Special += 1;
        }
    }
}

// ----------------- 升級土地 -----------------
function enemy4UpgradeLand() {
    updateEnemy4UpgradeableLand();

    for (const cell of enemy4UpgradeableLand) {
        if (cell.level < 5) {
            const cost = upgradeCosts[cell.level - 1];
            if (enemy4Resources >= cost) {
                enemy4Resources -= cost;
                cell.level++;
                return;
            }
        }
    }
}

// ----------------- 升級兵營 -----------------
function enemy4UpgradeBarrack() {
    const enemy4Cells = [...cells.values()].filter(c => c.owner === "enemy4" && c.isBarrack);

    for (const cell of enemy4Cells) {
        if (cell.barrackLevel < 5 && enemy4Resources >= 100 && enemy4Special >= 20) { 
            enemy4Resources -= 100;
            enemy4Special -= 20;
            cell.barrackLevel++;
            return;
        }
    }
}

// ----------------- 建造兵營 -----------------
function enemy4BuildBarrack() {
    const enemy4Cells = [...cells.values()].filter(c => c.owner === "enemy4" && !c.isBarrack && c.level === 5);

    for (const cell of enemy4Cells) {
        if (!cell.isBarrack && enemy4Special >= 10) {
            enemy4Special -= 10;
            cell.isBarrack = true;
            cell.barrackLevel = 1;
            return;
        }
    }
}

// ----------------- 敵方4購地 -----------------
function enemy4BuyLand() {
    const possibleBuy = [...cells.values()].filter(c => 
        !c.owned && c.terrain !== 'mountain' && isAdjacentToEnemy4(c)
    );

    if (possibleBuy.length > 0) {
        // 🔹 按距離最近敵人排序
        possibleBuy.sort((a, b) => distanceToNearestEnemy(a) - distanceToNearestEnemy(b));

        // 先取最靠近敵人的土地，如果有多塊一樣近，從中隨機挑一個
        const minDist = distanceToNearestEnemy(possibleBuy[0]);
        const bestChoices = possibleBuy.filter(c => distanceToNearestEnemy(c) === minDist);

        const target = bestChoices[Math.floor(Math.random() * bestChoices.length)];
        const cost = getCost(target);

        if (enemy4Resources >= cost) {
            enemy4Resources -= cost;
            target.owned = true;
            target.owner = "enemy4";
            target.level = 1;
            return ;
        }
    }
}

// ----------------- 敵方4攻擊 -----------------
function enemy4Attack() {
    const targets = [...cells.values()].filter(c => 
        c.owner && c.owner !== "enemy4" && isAdjacentToEnemy4(c)
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

    if (enemy4Army >= required) {
        enemy4Army -= required;

        target.owner = null;
        target.owned = false;
        target.level = 1;
        target.isBarrack = false;
        target.barrackLevel = 0;
        target.costModifier = 0;
    }
}