// ----------------- 記憶 & 權重 -----------------
const memoryWindow = 5; 
const actionMemory = {
    upgradeLand1: [], upgradeLand2: [], upgradeLand3: [], upgradeLand4: [],
    upgradeBarrack1: [], upgradeBarrack2: [], upgradeBarrack3: [], upgradeBarrack4: [],
    buildBarrack: [],
    buyLand: [],
    attack: [],
    idle: []
};
const weights = {
    upgradeLand1: 1, upgradeLand2: 1, upgradeLand3: 1, upgradeLand4: 1,
    upgradeBarrack1: 1, upgradeBarrack2: 1, upgradeBarrack3: 1, upgradeBarrack4: 1,
    buildBarrack: 1,
    buyLand: 1,
    attack: 1,
    idle: 1
};

const actions = [
    "upgradeLand1","upgradeLand2","upgradeLand3","upgradeLand4",
    "upgradeBarrack1","upgradeBarrack2","upgradeBarrack3","upgradeBarrack4",
    "buildBarrack","buyLand","attack","idle"
];

// ----------------- 行動序列收益 -----------------
let maxSequenceLength = 3; // 最大序列長度
const sequenceMemory = {};  // 記錄不同序列收益
const sequenceWindow = 5;   // 每個序列只保留最近5次收益
let recentActions = [];

function ensureSequence(seq) {
    if (!sequenceMemory[seq]) sequenceMemory[seq] = [];
}

function recordSequenceGain(action, gain) {
    recentActions.push(action);
    if (recentActions.length > maxSequenceLength) recentActions.shift();

    for (let len = 2; len <= recentActions.length; len++) {
        const seq = recentActions.slice(-len).join(",");
        ensureSequence(seq);
        sequenceMemory[seq].push(gain);
        if (sequenceMemory[seq].length > sequenceWindow)
            sequenceMemory[seq].shift();
    }
}


// ----------------- 確保敵方周圍土地生成 -----------------
function ensureEnemyVicinity(radius = 3) {
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy");
    for (const cell of enemyCells) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                ensureCell(cell.x + dx, cell.y + dy);
            }
        }
    }
}

// ----------------- 選擇行動 -----------------
function chooseEnemyAction() {
    // 計算每個行動的序列加權
    const seqBonus = {};
    for (const a of actions) {
        let bestSeqBonus = 0;

        for (let len = 1; len <= maxSequenceLength; len++) {
            const seq = [...recentActions.slice(-len + 1), a].join(",");
            if (sequenceMemory[seq] && sequenceMemory[seq].length) {
                const avg = sequenceMemory[seq].reduce((x, y) => x + y, 0) / sequenceMemory[seq].length;
                bestSeqBonus = Math.max(bestSeqBonus, avg * Math.pow(0.7, len - 1)); // 長序列衰減
            }
        }

        seqBonus[a] = bestSeqBonus * 0.1; // 調整比例
    }

    // 計算總權重加序列加成
    let weightedSum = 0;
    const weightedActions = {};
    for (const a of actions) {
        const w = weights[a] + (seqBonus[a] || 0);
        weightedActions[a] = w;
        weightedSum += w;
    }

    // 隨機選擇行動
    let r = Math.random() * weightedSum;
    for (const a of actions) {
        if (r < weightedActions[a]) return a;
        r -= weightedActions[a];
    }

    return "idle"; // 保險 fallback
}
// ----------------- 調整序列長度 -----------------
function adjustSequenceLength() {
    const flatMemory = Object.values(actionMemory).flat();
    const avgGain = flatMemory.reduce((a,b)=>a+b,0) / (flatMemory.length || 1);

    if (avgGain < 5 && maxSequenceLength < 5) maxSequenceLength++;
    else if (avgGain > 15 && maxSequenceLength > 2) maxSequenceLength--;
}

// ----------------- 更新權重（穩定版） -----------------
function updateWeightsAfterProduce(action, gain) {
    // 記錄單行動收益
    actionMemory[action].push(gain);
    if (actionMemory[action].length > memoryWindow) actionMemory[action].shift();

    // 計算滑動平均收益
    const avgGain = actionMemory[action].reduce((a,b)=>a+b,0) / actionMemory[action].length;

    // 舊權重
    const oldWeight = weights[action];

    // 新權重：滑動增量平滑 + 限制增幅
    const targetWeight = 1 + avgGain * 0.05;       // 降低單回合增幅
    weights[action] = oldWeight * 0.9 + targetWeight * 0.1;

    // 限制權重範圍
    weights[action] = Math.min(Math.max(weights[action], 0.1), 5);

    // 記錄行動序列收益
    recordSequenceGain(action, gain);
}

// ----------------- 執行敵方行動 -----------------
function performEnemyAction(action) {
    let result;

    switch(action) {
        case "upgradeLand1": result = enemyUpgradeLand(1); break;
        case "upgradeLand2": result = enemyUpgradeLand(2); break;
        case "upgradeLand3": result = enemyUpgradeLand(3); break;
        case "upgradeLand4": result = enemyUpgradeLand(4); break;
        case "upgradeBarrack1": result = enemyUpgradeBarrack(1); break;
        case "upgradeBarrack2": result = enemyUpgradeBarrack(2); break;
        case "upgradeBarrack3": result = enemyUpgradeBarrack(3); break;
        case "upgradeBarrack4": result = enemyUpgradeBarrack(4); break;
        case "buildBarrack": result = enemyBuildBarrack(); break;
        case "buyLand": result = enemyBuyLand(); break;
        case "attack": result = enemyAttack(); break;
        case "idle": result = { gain: 0.1, spentResources: 0 }; break;
    }

    recentEnemyActions.push({ action, gain: result.gain, spentResources: result.spentResources });
}

// ----------------- 敵方行動 -----------------
function enemyProduce() {
    let gain = 0;
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy");

    for (const cell of enemyCells) {
        if (cell.isBarrack) {
            const cost = barrackCost[cell.barrackLevel];
            if (enemyResources >= cost) {
                enemyResources -= cost;
                enemyArmy += barrackProd[cell.barrackLevel];

                gain += (barrackProd[cell.barrackLevel] * 10) - cost;
            }
        } else {
            const prod = getProduction(cell, "enemy");
            enemyResources += prod;
            gain += prod;
            if (cell.level === 5) enemySpecial += 1;
        }
    }
    return gain;
}

// ----------------- 升級土地 -----------------
function enemyUpgradeLand(targetLevel) {
    let gain = 0;
    let spentResources = 0;
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy" && !c.isBarrack && c.level === targetLevel);

    for (const cell of enemyCells) {
        const cost = upgradeCosts[cell.level - 1];
        if (enemyResources >= cost) {
            enemyResources -= cost;
            cell.level++;
            gain += 1;
            spentResources += cost;
        }
    }

    return { gain, spentResources };
}

// ----------------- 升級兵營 -----------------
function enemyUpgradeBarrack(targetLevel) {
    let gain = 0;
    let spentResources = 0;
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy" && c.isBarrack && c.barrackLevel === targetLevel);

    for (const cell of enemyCells) {
        if (enemyResources >= 100 && enemySpecial >= 20) {
            enemyResources -= 100;
            enemySpecial -= 20;
            cell.barrackLevel++;
            gain += 1;
            spentResources += 100 + 20 * 10;
        }
    }

    return { gain, spentResources };
}

// ----------------- 建造兵營 -----------------
function enemyBuildBarrack() {
    let gain = 0;
    let spentResources = 0;
    const enemyCells = [...cells.values()].filter(c => c.owner === "enemy" && !c.isBarrack && c.level === 5);

    for (const cell of enemyCells) {
        if (!cell.isBarrack && enemySpecial >= 10) {
            enemySpecial -= 10;
            cell.isBarrack = true;
            cell.barrackLevel = 1;
            gain += 1;
            spentResources += 10 * 1; // 一個特殊資源視為 10 物資
        }
    }

    return { gain, spentResources };
}

// ----------------- 買地 -----------------
function enemyBuyLand() {
    const possibleBuy = [...cells.values()].filter(c => 
        !c.owned && c.terrain !== 'mountain' && isAdjacentToEnemy(c)
    );

    let gain = 0;
    let spentResources = 0;

    if (possibleBuy.length > 0) {
        const target = possibleBuy[Math.floor(Math.random() * possibleBuy.length)];
        const cost = getCost(target);
        if (enemyResources >= cost) {
            enemyResources -= cost;
            target.owned = true;
            target.owner = "enemy";
            target.level = 1;
            gain += 1;
            spentResources += cost;
        }
    }

    return { gain, spentResources };
}

// ----------------- 攻擊 -----------------
function enemyAttack() {
    const targets = [...cells.values()].filter(c => 
        c.owner && c.owner !== "enemy" //&& isAdjacentToEnemy(c)
    );
    if (targets.length === 0) return { gain: 0, spentResources: 0 };

    const target = targets[Math.floor(Math.random() * targets.length)];
    const required = target.isAltar
            ? (target.altarLevel * 100)
            : target.isBarrack
                ? (target.barrackLevel * 100)
                : (target.level * 10);

    if (enemyArmy >= required) {
        enemyArmy -= required;
        const gain = target.isBarrack ? target.barrackLevel * 5 : target.level * 3;
        const spentResources = required;

        atomic(target,3);

        return { gain, spentResources };
    }

    return { gain: 0, spentResources: 0 };
}

function atomic(centerCell, radius = 1) {
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const key = `${centerCell.x + dx},${centerCell.y + dy}`;
            if (cells.has(key)) {
                const target = cells.get(key);
                if (target.owner !== "enemy6") {
                    target.owner = null;
                    target.owned = false;
                    target.level = 1;
                    target.isBarrack = false;
                    target.barrackLevel = 0;
                    target.costModifier = 0;
                }
            }
        }
    }
}

// ----------------- 判斷是否鄰近敵方已擁有土地 -----------------
function isAdjacentToEnemy(cell, radius = 1) {
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx === 0 && dy === 0) continue;

            const key = `${cell.x + dx},${cell.y + dy}`;
            if (cells.has(key) && cells.get(key).owner === "enemy") {
                return true;
            }
        }
    }
    return false;
}