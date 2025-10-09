const gridWrapper = document.getElementById('gridWrapper');
const grid = document.getElementById('grid');
const resourcesDisplay = document.getElementById('resources');
const produceTimerDisplay = document.getElementById('produceTimer');
const eventTimerDisplay = document.getElementById('eventTimer');
const tooltip = document.getElementById('tooltip');
const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');
const specialDisplay = document.getElementById('specialResources');

let resources = 10;
let scale = 1;
let cellSize = 50;
let offsetX = 0;
let offsetY = 0;
let dragStart = null;
let specialResources = 0;
let army = 0;
let recentEnemyActions = [];
let gamespeed = 1;

// 兵營產兵與消耗數據
const barrackProd = [0,5,10,10,15,15,20,20,25,25,30]; 
const barrackCost = [0,100,95,90,85,80,75,70,65,60,55]; 

// Map<"x,y", cellData>
let cells = new Map();

// 初始玩家格子 0,0
const playerStart = ensureCell(0,0);
playerStart.owner = "player";
playerStart.owned = true;
playerStart.level = 1;

// 回傳 Promise 的 playTimeFlow
(function(){
  window.playTimeFlow = function playTimeFlow(opts = {}) {
    return new Promise((resolve) => {
      const cfg = Object.assign({
        holdBlackMs: 200,
        revealMs: 300,
        flowMs: 4200,
        collapseMs: 700,
        fadeOutMs: 300,
        particleCount: 320,
        maxRadiusFactor: 1.0,
        baseRotationSpeed: 0.0009,
        speedMultiplier: 1.0,
        intensity: 1.0,
        trailFade: 0.12,
        colorShift: 140
      }, opts);

      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = 2147483647;
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const originalBodyFilter = document.body.style.filter || "";

      function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
        ctx.setTransform(dpr,0,0,dpr,0,0);
        maxRadius = Math.min(window.innerWidth, window.innerHeight) * cfg.maxRadiusFactor;
      }
      let maxRadius = Math.min(window.innerWidth, window.innerHeight) * cfg.maxRadiusFactor;
      resize();
      window.addEventListener('resize', resize);

      const particles = [];
      for (let i=0;i<cfg.particleCount;i++){
        particles.push({
          angle: Math.random() * Math.PI * 2,
          baseR: Math.random() * maxRadius,
          z: 0.06 + Math.random() * 1.5,
          vz: (Math.random() - 0.5) * 0.0012,
          size: 0.6 + Math.random()*4.0,
          hue: (180 + Math.random()*cfg.colorShift) % 360,
          prevX: null, prevY: null,
          speedBias: 0.6 + Math.random()*1.6
        });
      }

      const startT = performance.now();
      const timelineTotal = cfg.holdBlackMs + cfg.revealMs + cfg.flowMs + cfg.collapseMs + cfg.fadeOutMs;

      function easeInOutCubic(x){ return x<0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; }
      function easeOutQuad(x){ return 1 - (1-x)*(1-x); }
      function easeInQuad(x){ return x*x; }
      function lerp(a,b,t){ return a + (b-a)*t; }

      function overlayAlphaAt(t) {
        if (t < cfg.holdBlackMs) return 1;
        if (t < cfg.holdBlackMs + cfg.revealMs) {
          const p = (t - cfg.holdBlackMs) / cfg.revealMs;
          return 1 - easeOutQuad(p);
        }
        if (t < cfg.holdBlackMs + cfg.revealMs + cfg.flowMs + cfg.collapseMs) return 0;
        const p = (t - (cfg.holdBlackMs + cfg.revealMs + cfg.flowMs + cfg.collapseMs)) / cfg.fadeOutMs;
        return Math.min(1, easeInQuad(p));
      }

      let lastNow = startT;
      let rotation = 0;
      let raf;

      function loop(now){
        const dt = Math.max(1, now - lastNow);
        lastNow = now;
        const elapsed = now - startT;
        const overlayA = overlayAlphaAt(elapsed);

        // trail backing (full black background requested)
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(0,0,0,${cfg.trailFade})`;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.restore();

        const w = window.innerWidth, h = window.innerHeight;
        const cx = w/2, cy = h/2;

        const collapseStart = cfg.holdBlackMs + cfg.revealMs + cfg.flowMs;
        let collapseP = 0;
        if (elapsed > collapseStart) {
          collapseP = Math.min(1, (elapsed - collapseStart) / cfg.collapseMs);
          collapseP = easeInOutCubic(collapseP);
        }

        const flowPhaseStart = startT + cfg.holdBlackMs + cfg.revealMs;
        let flowProgress = 0;
        if (elapsed > cfg.holdBlackMs + cfg.revealMs) {
          flowProgress = Math.min(1, (elapsed - (cfg.holdBlackMs + cfg.revealMs)) / Math.max(1, cfg.flowMs));
        }

        const zoomOsc = 1 + 0.12 * Math.sin((now)/600) * cfg.intensity * cfg.speedMultiplier;
        const zoomDrift = 1 + 0.4 * (Math.sin(now/2100) * 0.5 + Math.cos(now/1700)*0.25) * cfg.intensity * cfg.speedMultiplier * (1 - collapseP);
        const globalZoom = lerp(1, zoomDrift*zoomOsc, flowProgress*0.9);
        const panX = Math.sin(now/3100) * 30 * cfg.intensity * (1 - collapseP);
        const panY = Math.cos(now/2700) * 18 * cfg.intensity * (1 - collapseP);

        const bodyEffect = 0.06 * (1 - collapseP);
        document.body.style.filter = `contrast(${1+bodyEffect}) saturate(${1+bodyEffect})`;

        rotation += cfg.baseRotationSpeed * dt * cfg.speedMultiplier * cfg.intensity;

        ctx.save();
        ctx.translate(cx + panX, cy + panY);
        ctx.scale(globalZoom, globalZoom);
        ctx.rotate(rotation);
        ctx.globalCompositeOperation = 'lighter';

        for (let p of particles) {
          p.z += p.vz * dt * cfg.speedMultiplier * (0.4 + 0.6 * cfg.intensity);
          if (p.z < 0.05) p.z = 1.5;
          if (p.z > 1.6) p.z = 0.06;

          p.angle += (0.00008 + 0.00025 * (p.size/4)) * (Math.sin((now + p.baseR)/1200) * 0.9) * cfg.speedMultiplier;

          let depthScale = (1 / (p.z + 0.08));
          let screenR = p.baseR * (0.25 + depthScale * 0.7);

          const directionalFactor = Math.sin((now/800) + p.baseR*0.002 + p.hue)*0.5;
          screenR += directionalFactor * 0.7 * cfg.intensity * p.speedBias * (50 * cfg.speedMultiplier) * 0.001;

          if (collapseP > 0) {
            screenR *= (1 - collapseP);
          }

          const ang = p.angle;
          const x = Math.cos(ang) * screenR;
          const y = Math.sin(ang) * screenR;

          const prevX = p.prevX === null ? x : p.prevX;
          const prevY = p.prevY === null ? y : p.prevY;
          const dx = x - prevX;
          const dy = y - prevY;
          const tailAlpha = Math.max(0.05, Math.min(0.7, 0.55 * (1/(p.z+0.2)) * cfg.intensity));
          ctx.strokeStyle = `hsla(${p.hue},86%,62%,${tailAlpha})`;
          ctx.lineWidth = Math.max(0.7, p.size * (0.4 + (1/(p.z+0.2))*0.6));
          ctx.beginPath();
          ctx.moveTo(x - dx*0.35, y - dy*0.35);
          ctx.lineTo(x, y);
          ctx.stroke();

          const coreR = Math.max(0.5, p.size * (0.55 + (1/(p.z+0.2))*0.85) * (1 - collapseP*0.9));
          const grad = ctx.createRadialGradient(x, y, 0, x, y, coreR * 6);
          const dotAlpha = Math.max(0.25, Math.min(1, (1/(p.z+0.2))*0.6 * (1 - collapseP*0.9)));
          grad.addColorStop(0, `hsla(${p.hue},92%,72%,${dotAlpha})`);
          grad.addColorStop(0.35, `hsla(${p.hue},80%,48%,${dotAlpha*0.45})`);
          grad.addColorStop(1, `rgba(0,0,0,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, coreR*1.8, 0, Math.PI*2);
          ctx.fill();

          p.prevX = lerp(prevX, x, 0.45);
          p.prevY = lerp(prevY, y, 0.45);
        }

        ctx.restore();

        if (collapseP > 0) {
          const glowR = 12 + collapseP * Math.max(w,h) * 0.45;
          const glowAlpha = Math.min(1, 0.95 * collapseP);
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
          g.addColorStop(0, `rgba(255,255,255,${glowAlpha})`);
          g.addColorStop(0.35, `rgba(210,230,255,${glowAlpha*0.6})`);
          g.addColorStop(1, `rgba(0,0,0,0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, glowR, 0, Math.PI*2);
          ctx.fill();
        }

        if (overlayA > 0) {
          ctx.fillStyle = `rgba(0,0,0,${overlayA})`;
          ctx.fillRect(0,0,canvas.width,canvas.height);
        }

        if (elapsed < timelineTotal) {
          raf = requestAnimationFrame(loop);
        } else {
          // final white flash and cleanup
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.fillStyle = 'white';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          // restore body filter then remove canvas shortly after
          document.body.style.filter = originalBodyFilter;
          setTimeout(()=>{
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            window.removeEventListener('resize', resize);
            resolve(); // <-- Promise resolves here when animation fully cleaned up
          }, 120);
        }
      } // end loop

      raf = requestAnimationFrame(loop);
    }); // end Promise
  };
})();

async function bigbang(options = {}){
  await playTimeFlow();
  const defaults = {
        resources: 10,
        specialResources: 0,
        army: 0,
        enemy5Resources:10,
        enemy5Special:0,
        starts: []
    };

    produceTimer = 5;
    lastTotalGain = 0;
    investmentTimer = 60;

    const cfg = Object.assign({}, defaults, options);

    cells.clear();
    for (const [key, div] of visibleCells) {        
            div.remove();
            visibleCells.delete(key);
    }

    if (typeof resources !== "undefined") resources = cfg.resources;
    if (typeof specialResources !== "undefined") specialResources = cfg.specialResources;
    if (typeof army !== "undefined") army = cfg.army;
    if (typeof enemy5Resources !== "undefined") enemy5Resources = cfg.enemy5Resources;
    if (typeof enemy5Special !== "undefined") enemy5Special = cfg.enemy5Special;

    const enemyNames = ["enemy", "enemy2", "enemy3", "enemy4", "enemy5", "enemy6"];

    const enemies = ["enemy", "enemy2", "enemy3", "enemy4", "enemy6"];
    for (const name of enemies) {
        window[`${name}Resources`] = 10;
        window[`${name}Special`] = 0;
        window[`${name}Army`] = 0;
    }

    if (typeof actionMemory !== 'undefined') {
        for (const k of Object.keys(actionMemory)) actionMemory[k] = [];
    }
    if (typeof weights !== 'undefined') {
        for (const k of Object.keys(weights)) weights[k] = 1;
    }
    if (typeof sequenceMemory !== 'undefined') {
        for (const k of Object.keys(sequenceMemory)) delete sequenceMemory[k];
    }
    if (typeof recentEnemyActions !== 'undefined') recentEnemyActions.length = 0;
    if (typeof lastTotalGain !== 'undefined') lastTotalGain = 0;

    if (typeof enemy4UpgradeableLand !== 'undefined') enemy4UpgradeableLand = [];
    if (typeof enemy6TargetCell !== 'undefined') enemy6TargetCell = null;

    if (typeof ensureCell === "function") {
        const playerStart = ensureCell(0, 0);
        playerStart.owner = "player";
        playerStart.owned = true;
        playerStart.level = 1;
        playerStart.isBarrack = false;
        playerStart.barrackLevel = 0;

        const usedCells = new Set([`${playerStart.x},${playerStart.y}`]);

        for (const enemy of enemyNames) {
            let cell = getRandomStartCell(enemy);

            while (usedCells.has(`${cell.x},${cell.y}`)) {
                cell = getRandomStartCell(enemy);
            }
            usedCells.add(`${cell.x},${cell.y}`);
        }
    } else {
        console.warn("resetMap: ensureCell() not found");
    }

    renderGrid();
    updateResources();
}

// ----------------- 核心功能 -----------------
// 生成地形
function generateTerrain(excludeMountain=false){
    const r = Math.random();
    if(r < 0.6) return 'plain';
    if(r < 0.8) return 'forest';
    if(r < 0.95) return 'river';
    return excludeMountain ? 'plain' : 'mountain';
}

// 計算土地購買或升級成本
// 升級費用對應 Lv1→Lv2 ~ Lv4→Lv5
const upgradeCosts = [20, 50, 120, 300, 500, 500, 500, 500, 500];

function getCost(cell){
    if(cell.owned){
        // 升級土地
        if(cell.level >= 5) return 0; // Lv5 已達上限，不能再升級
        return upgradeCosts[cell.level - 1]; // cell.level 從 1 開始
    }

    // 購買土地成本
    switch(cell.terrain){
        case 'plain':  return 10;
        case 'forest': return 25;
        case 'river':  return 10;
        default:       return 1000; // 山地不可購買，可額外在 interactCell 判斷
    }
}


// 計算每個格子產量，包括河流加成
function getProduction(cell, owner=null){
    // owner=null 表示計算所有擁有土地的產量
    if(!cell.owned || cell.isBarrack) return 0; // 兵營不產物資
    if(owner && cell.owner !== owner) return 0; // 若指定 owner，不屬於該 owner 的土地不產物資

    let base = 0;
    if(cell.terrain === 'plain') base = 1;
    else if(cell.terrain === 'forest') base = 2;
    else if(cell.terrain === 'river') base = 1;

    // 河流加成
    let riverBonus = 0;
    for(const c of cells.values()){
        if(c.terrain === 'river'){
            const dx = Math.abs(c.x - cell.x);
            const dy = Math.abs(c.y - cell.y);
            if(dx <= 1 && dy <= 1) riverBonus += 1;
        }
    }

    return (1 + riverBonus) * base * cell.level;
}

// 生成格子
function ensureCell(x, y) {
    const key = `${x},${y}`;
    if (!cells.has(key)) {
        // 座標 (0,0) 與 (100,100) 強制為平原
        const forcePlain = (x === 0 && y === 0) || (x === 100 && y === 100);

        cells.set(key, {
            x,
            y,
            terrain: generateTerrain(forcePlain),
            owned: false,
            level: 1,
            costModifier: 0,
            isBarrack: false,
            isAltar: false,
            barrackLevel: 0,
            altarLevel: 0,
            owner: null
        });
    }
    return cells.get(key);
}

function getRandomStartCell(ownerName) {
    let cell;
    while (true) {
        const x = Math.floor(Math.random() * 21) - 10; // -10 ~ 10
        const y = Math.floor(Math.random() * 21) - 10; // -10 ~ 10

        cell = ensureCell(x, y);

        // 確保不是山地且還沒被佔領
        if (cell.terrain !== "mountain" && !cell.owned) {
            break;
        }
    }

    cell.owner = ownerName;
    cell.owned = true;
    cell.level = 1;
    return cell;
}

// ----------------- 虛擬渲染 -----------------
let visibleCells = new Map();

function renderGrid() {
    const radius = 15;

    const newVisibleKeys = new Set();

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = Math.floor(-offsetX / cellSize) + dx;
            const y = Math.floor(offsetY / cellSize) + dy;
            const key = `${x},${y}`;
            newVisibleKeys.add(key);

            const cell = ensureCell(x, y);
            let div = visibleCells.get(key);

            if (!div) {
                div = document.createElement('div');
                div.classList.add('cell');
                div.dataset.key = key;

                div.addEventListener('click', () => interactCell(cell));
                div.addEventListener('mousemove', (e) => showTooltip(e, cell));
                div.addEventListener('mouseleave', () => tooltip.style.display = 'none');

                grid.appendChild(div);
                visibleCells.set(key, div);
            }

            // 更新格子樣式
            div.className = 'cell'; // 重置
            if (!cell.isBarrack) {
                if (cell.terrain === 'forest') div.classList.add('forest');
                else if (cell.terrain === 'river') div.classList.add('river');
                else if (cell.terrain === 'mountain') div.classList.add('mountain');
            }

            if (cell.owner === 'player') div.classList.add('owned');
            else if (cell.owner === 'enemy') div.classList.add('enemy');
            else if (cell.owner === 'enemy2') div.classList.add('enemy2');
            else if (cell.owner === 'enemy3') div.classList.add('enemy3');
            else if (cell.owner === 'enemy4') div.classList.add('enemy4');
            else if (cell.owner === 'enemy5') div.classList.add('enemy5');
            else if (cell.owner === 'enemy6') div.classList.add('enemy6');

            if (cell.isBarrack) {
                if (cell.owner === 'player') div.classList.add('barrack');
                else if (cell.owner === 'enemy') div.classList.add('enemyBarrack');
                else if (cell.owner === 'enemy2') div.classList.add('enemy2Barrack');
                else if (cell.owner === 'enemy3') div.classList.add('enemy3Barrack');
                else if (cell.owner === 'enemy4') div.classList.add('enemy4Barrack');
                else if (cell.owner === 'enemy5') div.classList.add('enemy5Barrack');
                else if (cell.owner === 'enemy6') div.classList.add('enemy6Barrack');
                div.textContent = `兵營 Lv${cell.barrackLevel}`;
            } else if (cell.isAltar) {
                if (cell.owner === 'player') div.classList.add('altar');
                else if (cell.owner === 'enemy') div.classList.add('enemyAltar');
                else if (cell.owner === 'enemy2') div.classList.add('enemy2Altar');
                else if (cell.owner === 'enemy3') div.classList.add('enemy3Altar');
                else if (cell.owner === 'enemy4') div.classList.add('enemy4Altar');
                else if (cell.owner === 'enemy5') div.classList.add('enemy5Altar');
                else if (cell.owner === 'enemy6') div.classList.add('enemy6Altar');
                div.textContent = `祭壇 Lv${cell.altarLevel}`;
            } else if (cell.owner) {
                div.textContent = `Lv${cell.level}`;
            } else {
                div.textContent = '';
            }

            div.style.left = (cell.x * cellSize + offsetX) + 'px';
            div.style.top = (-cell.y * cellSize + offsetY) + 'px';
        }
    }

    // 移除不再可見的格子
    for (const [key, div] of visibleCells) {
        if (!newVisibleKeys.has(key)) {
            div.remove();
            visibleCells.delete(key);
        }
    }

    renderMinimap();
    grid.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function interactCell(cell){
    // 玩家攻擊敵方土地（enemy 或 enemy2）
    if(cell.owner && cell.owner !== 'player'){
        if(!isAdjacent(cell)){
            alert('只能攻擊相鄰土地！');
            return;
        }

        const required = cell.isAltar
                ? (cell.altarLevel * 100)
                : cell.isBarrack
                    ? (cell.barrackLevel * 100)
                    : (cell.level * 10);

        if(army >= required){
            army -= required;
            // 重置土地
            cell.owner = null;
            cell.owned = false;
            cell.level = 1;
            cell.isBarrack = false;
            cell.barrackLevel = 0;
            cell.costModifier = 0;
            updateResources();
            renderGrid();
        } else {
            alert(`兵力不足！需要 ${required} 兵力`);
        }
        return; // 已處理攻擊
    }

    // 升級兵營
    if(cell.isBarrack){
        if(cell.barrackLevel < 5){
            if(resources >= 100 && specialResources >= 20){
                resources -= 100;
                specialResources -= 20;
                cell.barrackLevel++;
            } else {
                alert("升級兵營需要 100 物資 + 20 特殊物資！");
            }
        } else {
            alert("兵營已達最高等級 Lv5！");
        }
    }
    //升級祭壇
    else if(cell.isAltar){
        if(cell.altarLevel < 10){
            if(resources >= 1000 && specialResources >= 100){
                if(confirm("是否祭祀？(消耗 1000 物資 + 100 特殊物資)")){
                    resources -= 1000;
                    specialResources -= 100;
                    cell.altarLevel++;
                    updateResources();
                    renderGrid();
                }
                if(cell.altarLevel === 10){
                    bigbang({resources:resources,specialResources:specialResources,army:army});
                }
                return;
            } else {
                alert("需要 1000 物資 + 100 特殊物資才能進行祭祀！");
            }
            return;
        } 
        return;
    }
    // 升級玩家土地或轉換為兵營
    else if(cell.owned){
        if(cell.level >= 5){
            if(specialResources >= 10){
                if(confirm("是否要將此 Lv5 土地轉換為兵營？(消耗 10 特殊物資)")){
                    specialResources -= 10;
                    cell.isBarrack = true;
                    cell.barrackLevel = 1;
                    updateResources();
                    renderGrid();
                    return;
                }
            } else {
                alert("需要 10 特殊物資才能轉換為兵營！");
            }
            return;
        }

        const cost = upgradeCosts[cell.level - 1];
        if(resources >= cost){
            resources -= cost;
            cell.level++;
        } else {
            alert(`物資不足！升級 Lv${cell.level} 需要 ${cost} 物資`);
        }
    } 
    // 購買玩家土地
    else {
        const cost = getCost(cell);
        if(!isAdjacent(cell)){ 
            alert('只能購買相鄰土地'); 
            return; 
        }
        if(cell.terrain === 'mountain'){
            if(resources >= 1000 && specialResources >= 100){
                if(confirm("是否要建造祭壇?")){
                    resources -= 1000;
                    specialResources -= 100;
                    cell.owned = true;
                    cell.owner = 'player';
                    cell.isAltar = true;
                    cell.altarLevel = 1;
                    updateResources();
                    renderGrid();
                    return;
                }
                return;
            }else {
                alert("需要 1000 物資 + 100 特殊物資才能建造祭壇！");
                return;
            }
        }
        if(resources >= cost){
            resources -= cost;
            cell.owned = true;
            cell.level = 1;
            cell.owner = 'player';
        } else {
            alert('物資不足，無法購買土地！');
        }
    }

    updateResources();
    renderGrid();
}

function isAdjacent(cell){
    const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    return dirs.some(d=>{
        const key = `${cell.x+d[0]},${cell.y+d[1]}`;
        return cells.has(key) && cells.get(key).owner === "player"; // ✅ 只算玩家自己的土地
    });
}

function showTooltip(e,cell){
    tooltip.style.display='block';
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top  = e.pageY + 10 + 'px';

    if(cell.isBarrack){
        tooltip.innerHTML = `
            座標: (${cell.x},${cell.y})<br>
            建築: 兵營 Lv${cell.barrackLevel}<br>
            產兵: ${barrackProd[cell.barrackLevel]}<br>
            消耗物資: ${barrackCost[cell.barrackLevel]}<br>
        `;
    }else if(cell.isAltar){
        tooltip.innerHTML = `
            座標: (${cell.x},${cell.y})<br>
            建築: 祭壇 Lv${cell.altarLevel}<br>
            擁有者:${cell.owner}
        `;
    } else {
        tooltip.innerHTML = `
            座標: (${cell.x},${cell.y})<br>
            地形: ${cell.terrain}<br>
            擁有: ${cell.owned}<br>
            等級: ${cell.level}<br>
            產量: ${getProduction(cell)}<br>
            購買成本: ${getCost(cell)}<br>
            ${cell.level === 5 ? 'Lv5 特殊物資產量: 1' : ''}
        `;
    }
}

function updateResources(){
    resourcesDisplay.textContent = resources;
    specialDisplay.textContent = specialResources;
    document.getElementById("army").textContent = army;
}

// ----------------- 滑動 & 縮放 -----------------
gridWrapper.addEventListener('mousedown',e=>{ dragStart={x:e.clientX, y:e.clientY}; gridWrapper.style.cursor='grabbing'; });
window.addEventListener('mouseup',()=>{ dragStart=null; gridWrapper.style.cursor='grab'; });
window.addEventListener('mousemove',e=>{
    if(dragStart){
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        offsetX += dx; offsetY += dy;
        dragStart={x:e.clientX, y:e.clientY};
        renderGrid();
    }
});
gridWrapper.addEventListener('wheel', e=>{
    e.preventDefault();
    scale *= e.deltaY < 0 ? 1.1 : 0.9;
    scale = Math.min(Math.max(scale,0.5),3);
    grid.style.transform = `scale(${scale})`;
});

// ----------------- 小地圖 -----------------
const centerX = -offsetX / cellSize;
const centerY = offsetY / cellSize;

function renderMinimap(){
    minimapCtx.clearRect(0,0,minimap.width,minimap.height);
    const scaleMini = 3;

    const centerX = -offsetX / cellSize;
    const centerY = offsetY / cellSize;

    for(const cell of cells.values()){
        const mx = minimap.width/2 + (cell.x - centerX) * scaleMini;
        const my = minimap.height/2 - (cell.y - centerY) * scaleMini;

        if(cell.owner === "player"){
            minimapCtx.fillStyle = 'gold';
            minimapCtx.fillRect(mx, my, 3, 3);
        } else if(cell.owner === "enemy"){
            minimapCtx.fillStyle = 'red';
            minimapCtx.fillRect(mx, my, 3, 3);
        } else if(cell.owner === "enemy2"){
            minimapCtx.fillStyle = 'purple';
            minimapCtx.fillRect(mx, my, 3, 3);
        } else if(cell.owner === "enemy3"){
            minimapCtx.fillStyle = 'lightgreen';
            minimapCtx.fillRect(mx, my, 3, 3);
        } else if(cell.owner === "enemy4"){
            minimapCtx.fillStyle = "#000000";
            minimapCtx.fillRect(mx, my, 3, 3);
        } else if(cell.owner === "enemy5"){
            minimapCtx.fillStyle = "#ffc0cb";
            minimapCtx.fillRect(mx, my, 3, 3);
        } else if(cell.owner === "enemy6"){
            minimapCtx.fillStyle = 'orange';
            minimapCtx.fillRect(mx, my, 3, 3);
        }
    }

    // 畫出紅色矩形 = 當前可視區域
    const viewWidth  = gridWrapper.clientWidth  / cellSize * scaleMini / scale / 2;
    const viewHeight = gridWrapper.clientHeight / cellSize * scaleMini / scale;
    minimapCtx.strokeStyle = 'red';
    minimapCtx.strokeRect(minimap.width/2 - viewWidth/2, minimap.height/2 - viewHeight/2, viewWidth, viewHeight);
}

// ----------------- 暫停 -----------------
let isPaused = false;

document.getElementById("pauseBtn").addEventListener("click", () => {
    isPaused = !isPaused;
    document.getElementById("pauseBtn").textContent = isPaused ? "繼續" : "⏸ 暫停";
});

// ----------------- 產物資 & 兵力生產 -----------------
let produceTimer = 5;
let lastTotalGain = 0; // 記錄上一次的 totalGain

setInterval(() => {
    if (isPaused) return;

    produceTimer--;

    if (produceTimer <= 0) {
        produceTimerDisplay.textContent = 5;
    } else {
        produceTimerDisplay.textContent = produceTimer;
    }
    

    if (produceTimer <= 0) {
        enemy2Produce();
        enemy3Produce();
        enemy4Produce();
        enemy5Produce();
        enemy6Produce();

        // 1️⃣ 計算本回合總收益
        const totalGain = enemyProduce();

        // 2️⃣ 計算增量收益
        let deltaGain = totalGain - lastTotalGain;
        lastTotalGain = totalGain;

        // 3️⃣ 分配增量收益給最近的所有敵方行動
        if (recentEnemyActions.length > 0) {
            const grouped = {};
            let totalBaseGain = 0; // 所有即時收益總和

            // 🔹 按 action 分組，並計算花費資源總和
            for (const entry of recentEnemyActions) {
                if (!grouped[entry.action]) grouped[entry.action] = { count: 0, baseGain: 0, totalSpent: 0 };
                grouped[entry.action].count++;
                grouped[entry.action].baseGain += entry.gain;
                grouped[entry.action].totalSpent += entry.spentResources || 0;
                totalBaseGain += entry.gain;
            }

            const allZero = totalBaseGain <= 0;
            const report = [`[權重更新報告] 增量收益: ${deltaGain}`];

            for (const [action, info] of Object.entries(grouped)) {
                let distributedGain;
                if (allZero) {
                    distributedGain = deltaGain / recentEnemyActions.length * info.count;
                } else {
                    const ratio = info.baseGain / totalBaseGain;
                    distributedGain = deltaGain * ratio;
                }

                const adjustedGain = distributedGain * (10 / (info.totalSpent + 10));

                updateWeightsAfterProduce(action, adjustedGain);
                recordSequenceGain(action, adjustedGain);

                /* 只顯示即時收益總和大於 0 的行動
                if (info.baseGain > 0) {
                    report.push(
                        `  行動: ${action}, 次數: ${info.count}, ` +
                        `即時收益總和: ${info.baseGain.toFixed(2)}, ` +
                        `調整後收益: ${adjustedGain.toFixed(2)}, ` +
                        `新權重: ${weights[action].toFixed(2)}`
                    );
                }*/
            }

            //console.log(report.join("\n"));
            recentEnemyActions.length = 0; // 清空
        }

        // 4️⃣ player 產資
        let total = 0;
        let special = 0;
        for (const c of cells.values()) {
            if (c.owner !== "player") continue;

            if (c.isBarrack) {
                const cost = barrackCost[c.barrackLevel];
                if (resources >= cost) {
                    resources -= cost;
                    army += barrackProd[c.barrackLevel];
                }
            } else {
                total += getProduction(c, "player");
                if (c.level === 5) special += 1;
            }
        }
        resources += total;
        specialResources += special;
        updateResources();

        produceTimer = 5;
    }
}, 1000/gamespeed);

let investmentTimer = 60; // 每60秒觸發一次
setInterval(() => {
    if (isPaused) return;

    investmentTimer--;
    eventTimerDisplay.textContent = investmentTimer;

    if (investmentTimer <= 0) {
        // 玩家資源不足，不觸發
        if (resources <= 0) {
            console.log("玩家沒有資源，投資事件跳過");
        } else {
            triggerInvestmentEvent();
        }
        investmentTimer = 60;
    }
}, 1000);

function triggerInvestmentEvent() {
    const invest = confirm(`💹 投資機會！你擁有 ${resources} 物資，可選擇投入任意數量。是否投資？`);
    if (!invest) {
        alert("你選擇不投資，保持安全。");
        return;
    }

    let amount = parseInt(prompt(`請輸入要投入的物資量（1 ~ ${resources}）`));
    if (isNaN(amount) || amount < 1 || amount > resources) {
        alert("輸入無效，取消投資。");
        return;
    }

    resources -= amount;

    // 使用常態分布生成投資倍率
    const mean = 0;   // 平均值：無盈虧
    const stdDev = 1; // 標準差：波動幅度
    let multiplier = randomNormal(mean, stdDev);

    // 限制倍率範圍 -5 ~ +5
    multiplier = Math.max(-5, Math.min(5, multiplier));

    const result = Math.floor(amount * multiplier);
    resources += amount + result;

    if (result >= 0) {
        alert(`🎉 投資結果：獲得 ${result} 物資，總共回收 ${amount + result} 物資`);
    } else {
        alert(`💀 投資結果：虧損 ${-result} 物資，總共回收 ${amount + result} 物資`);
    }

    updateResources();
}

// ----------------- 常態分布隨機函數 -----------------
function randomNormal(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // 0 會無法取對數
    while(v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}


// ----------------- 敵方狀態 -----------------
window.enemyResources = 10;    // 敵方資源（內部使用，不顯示）
window.enemySpecial = 0;       // 敵方特殊物資
window.enemyArmy = 0;          // 敵方兵力

// 在初始座標 100,100 放置敵方土地
const enemyStart  = getRandomStartCell("enemy");

// ----------------- 敵方主迴圈 -----------------
setInterval(() => {
    if (isPaused) return;

    ensureEnemyVicinity(3);

    const action = chooseEnemyAction();

    performEnemyAction(action); // 只做動作，不計算收益

    adjustSequenceLength();

    renderGrid();
    updateResources();
}, 250/gamespeed);





// ----------------- 敵方2狀態 -----------------
window.enemy2Resources = 10;    // 敵方2資源
window.enemy2Special = 0;       // 敵方2特殊物資
window.enemy2Army = 0;          // 敵方2兵力

// 在初始座標 100,100 放置敵方2土地
const enemy2Start = getRandomStartCell("enemy2");

// ----------------- 定時觸發 (AI2) -----------------
setInterval(() => {
    ensureEnemy2Vicinity(3);
    
    chooseEnemy2Action();

    renderGrid();
    updateResources();
}, 250/gamespeed);




// ----------------- 敵方3狀態 -----------------
window.enemy3Resources = 10;
window.enemy3Special = 0;
window.enemy3Army = 0;

const enemy3Start = getRandomStartCell("enemy3");

// ----------------- 定時觸發 (AI3) -----------------
setInterval(() => {
    ensureEnemy3Vicinity(3);
    
    enemy3BuyLand();

    renderGrid();
    updateResources();
}, 250/gamespeed);



// ----------------- 敵方4狀態 -----------------
window.enemy4Resources = 10;
window.enemy4Special = 0;
window.enemy4Army = 0;

const enemy4Start = getRandomStartCell("enemy4");

// ----------------- 定時觸發 (AI4) -----------------
setInterval(() => {
    ensureEnemy4Vicinity(3);
    
    chooseEnemy4Action();

    renderGrid();
    updateResources();
}, 250/gamespeed);




// ----------------- 敵方5狀態 -----------------
window.enemy5Resources = 10;
window.enemy5Special = 0;

const enemy5Start = getRandomStartCell("enemy5");

// ----------------- 定時觸發 (AI5) -----------------
setInterval(() => {
    ensureEnemy5Vicinity(3);
    
    enemy5Attack();

    renderGrid();
    updateResources();
}, 250/gamespeed);




// ----------------- 敵方6狀態 -----------------
window.enemy6Resources = 10;
window.enemy6Special = 0;
window.enemy6Army = 0;

const enemy6Start = getRandomStartCell("enemy6");

// ----------------- 定時觸發 (AI6) -----------------
setInterval(() => {
    ensureEnemy6Vicinity(3);
    
    enemy6BuyLand();

    renderGrid();
    updateResources();
}, 250/gamespeed*20);

// ----------------- 初始渲染 -----------------
renderGrid();
updateResources();