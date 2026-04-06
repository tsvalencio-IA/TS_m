window.MatDefs = {
    'concreto_aparente': { color: 0x888888, roughness: 0.8, metalness: 0.1, label: "Concreto Aparente", mult: 1.2 },
    'madeira_deck': { color: 0x6b4226, roughness: 0.9, metalness: 0.0, label: "Madeira Cumaru (Deck/Mesa)", mult: 1.8 },
    'tijolo_refratario': { color: 0x4a3227, roughness: 0.95, metalness: 0.0, label: "Tijolo Refratário Escuro", mult: 1.5 },
    'metal_pergolado': { color: 0x1a1a1a, roughness: 0.3, metalness: 0.8, label: "Metalon Preto Fosco", mult: 2.0 },
    'folhagem': { color: 0x2d4c1e, roughness: 1.0, metalness: 0.0, label: "Jardim Vertical Viva", mult: 1.0 },
    'amadeirado_padrao': { color: 0x8B5A2B, roughness: 0.6, metalness: 0.1, label: "Amadeirado Padrão", mult: 1.0 },
    'amadeirado_claro': { color: 0xD2B48C, roughness: 0.5, metalness: 0.1, label: "MDF Madeira Clara", mult: 1.2 }, 
    'mdf_branco_diamante': { color: 0xFFFFFF, roughness: 0.1, metalness: 0.3, label: "MDF Branco Diamante", mult: 1.4 },
    'mdf_preto_tx': { color: 0x222222, roughness: 0.8, metalness: 0.05, label: "MDF Preto TX / Nero", mult: 1.0 },
    'mdf_azul_mercadao': { color: 0x1E88E5, roughness: 0.3, metalness: 0.1, label: "MDF Azul Comercial", mult: 1.1 },
    'mdf_vermelho_mercadao': { color: 0xE3000F, roughness: 0.2, metalness: 0.1, label: "MDF Vermelho Brilho", mult: 1.2 }, 
    'misto': { color: 0xFAFAFA, frontColor: 0x8B5A2B, roughness: 0.6, metalness: 0.1, label: "Misto (Branco/Madeira)", mult: 1.1 },
    'vidro_incolor': { color: 0xffffff, roughness: 0.0, metalness: 0.1, transmission: 0.95, ior: 1.5, thickness: 0.02, transparent: true, opacity: 1, label: "Vidro Incolor", mult: 2.5 },
    'vidro_reflecta': { color: 0xA08A75, roughness: 0.1, metalness: 0.8, transmission: 0.5, ior: 1.5, thickness: 0.02, transparent: true, opacity: 1, label: "Vidro Reflecta", mult: 2.5 },
    'tecido_linho_cinza': { color: 0x9E9E9E, roughness: 1.0, metalness: 0.0, label: "Tecido Linho", mult: 1.2 },
    'led': { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5, label: "Fita LED" },
    'rodape': { color: 0x222222, roughness: 0.8, metalness: 0.1, label: "Rodapé Preto" }
};

window.OracleEngine = {
    rules: {
        churrasqueira_tijolo: {label: 'Churrasqueira Refratária'}, deck_madeira: {label: 'Deck Madeira'},
        pergolado_metalico: {label: 'Pergolado Metálico'}, jardim_vertical: {label: 'Painel Jardim Vertical'},
        balcao_concreto: {label: 'Balcão Base/Concreto'}, mesa_macica: {label: 'Mesa Maciça Gourmet'},
        armario: { label: 'Armário/Aéreo' }, balcao: { label: 'Balcão Reto' }, guarda_roupa: { label: 'Guarda-Roupa' },
        mesa: { label: 'Mesa Padrão' }, painel_tv: { label: 'Painel TV' }, cadeira: { label: 'Cadeira' }, 
        sofa: { label: 'Sofá' }, porta_avulsa: { label: 'Porta Solo' }, gaveta_avulsa: { label: 'Gaveta Solo' },
        expositor_oculos_inclinado: { label: 'Expositor Óculos Premium' }, parede_otica: { label: 'Parede Mercadão' },
        totem_iluminado_otica: { label: 'Totem Iluminado' }, balcao_mercadao: { label: 'Balcão Caixa' }, mesa_atendimento_mercadao: { label: 'Mesa Atendimento' },
        expositor_degraus: { label: 'Expositor Degraus Fini' }, balcao_curvo: { label: 'Balcão Curvo' }
    },
    validateAndFix: (mod) => {
        if(!window.AppState.modoOraculo) return; let fixes = [];
        if(mod.tipo === 'mesa' && mod.altura > 1100 && mod.formato !== 'dobravel') fixes.push({k:'altura', v:750, msg:'Mesa ajustada'});
        if(mod.tipo === 'painel_tv' && mod.profundidade > 300) fixes.push({k:'profundidade', v:100, msg:'Painel afinado'});
        if(mod.formato.includes('L_') && mod.retornoL < 400) fixes.push({k:'retornoL',v:1000,msg:'Braço L ajustado'});
        fixes.forEach(f => { mod[f.k] = f.v; window.App.ui.toast(`Oráculo: ${f.msg}`); });
    }
};

window.BOMEngine = {
    calculateModule: (mod) => {
        const w = mod.largura/1000, h = mod.altura/1000, d = mod.profundidade/1000;
        let area = (w*h*d)*2; let hwCusto = (mod.gavetas*25) + (mod.portas*15); let laborMult = 1.0;
        let matKey = mod.material; let pMult = window.MatDefs[matKey] ? window.MatDefs[matKey].mult : 1.0;
        if(mod.tipo.includes('churras') || mod.tipo.includes('pergolado')) laborMult = 2.5;
        let matCusto = area * (window.AppState.costs.mdf * pMult);
        return { area: area * 1.15, hardwareCost: hwCusto, laborMult, customMatCostTotal: matCusto * 1.15, counts: { dobradicas: mod.portas*2, corredicas: mod.gavetas, trilhos: 0, pistoes: 0 } };
    },
    update: () => {
        let tArea = 0, tHWDyn = 0, tLaborDyn = 0, tHWFix = parseFloat(window.AppState.costs.hardware), totalMatsCost = 0; 
        window.AppState.modules.forEach(m => { const b = window.BOMEngine.calculateModule(m); tArea += b.area; tHWDyn += b.hardwareCost; tLaborDyn += (b.area * window.AppState.costs.labor * b.laborMult); totalMatsCost += b.customMatCostTotal; });
        const cTotal = totalMatsCost + tHWFix + tHWDyn + tLaborDyn; const profit = cTotal * (window.AppState.costs.margin / 100);
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('bom-price').innerText = fmt(cTotal + profit); document.getElementById('bom-area').innerText = tArea.toFixed(2) + ' m²'; document.getElementById('bom-mat').innerText = fmt(totalMatsCost + tHWFix + tHWDyn); document.getElementById('bom-mobra').innerText = fmt(tLaborDyn); document.getElementById('bom-profit').innerText = fmt(profit); document.getElementById('bom-hw-cost').innerText = fmt(tHWDyn);
    },
    updateParams: () => { window.AppState.costs.mdf = parseFloat(document.getElementById('cost-mdf').value)||120; window.AppState.costs.labor = parseFloat(document.getElementById('cost-labor').value)||95; window.AppState.costs.hardware = parseFloat(document.getElementById('cost-hardware').value)||0; window.AppState.costs.margin = parseFloat(document.getElementById('cost-margin').value)||50; window.BOMEngine.update(); window.App.storage.save(); }
};

window.CutPlanEngine = {
    boardW: 2750, boardH: 1850,
    generate: () => {
        const parts = [...window.AppState.cutParts].sort((a, b) => (b.w * b.h) - (a.w * a.h));
        const boards = []; let currentBoard = { x: 0, y: 0, w: 2750, h: 1850, parts: [] }; boards.push(currentBoard);
        parts.forEach(p => {
            let placed = false;
            for(let b of boards) {
                let rects = window.CutPlanEngine.findFreeRects(b);
                for(let r of rects) {
                    if (r.w >= p.w && r.h >= p.h) { b.parts.push({ x: r.x, y: r.y, w: p.w, h: p.h, label: p.label }); placed = true; break; } 
                    else if (r.w >= p.h && r.h >= p.w) { b.parts.push({ x: r.x, y: r.y, w: p.h, h: p.w, label: p.label }); placed = true; break; }
                } if(placed) break;
            }
            if(!placed) { let newBoard = { x: 0, y: 0, w: 2750, h: 1850, parts: [{ x: 0, y: 0, w: p.w, h: p.h, label: p.label }] }; boards.push(newBoard); }
        });
        window.CutPlanEngine.render(boards);
    },
    findFreeRects: (board) => {
        let free = [{x:0, y:0, w:board.w, h:board.h}];
        for(let p of board.parts) {
            let nextFree = [];
            for(let f of free) {
                if (p.x >= f.x + f.w || p.x + p.w <= f.x || p.y >= f.y + f.h || p.y + p.h <= f.y) nextFree.push(f);
                else {
                    if (p.x > f.x) nextFree.push({x: f.x, y: f.y, w: p.x - f.x, h: f.h});
                    if (p.x + p.w < f.x + f.w) nextFree.push({x: p.x + p.w, y: f.y, w: f.x + f.w - (p.x + p.w), h: f.h});
                    if (p.y > f.y) nextFree.push({x: f.x, y: f.y, w: f.w, h: p.y - f.y});
                    if (p.y + p.h < f.y + f.h) nextFree.push({x: f.x, y: p.y + p.h, w: f.w, h: f.y + f.h - (p.y + p.h)});
                }
            } free = nextFree;
        } return free.sort((a,b) => (b.w*b.h) - (a.w*a.h));
    },
    render: (boards) => {
        const container = document.getElementById('cutPlanContainer'); container.innerHTML = `<h4>Chapas: ${boards.length}</h4>`; const scale = 0.1;
        boards.forEach((b) => {
            let div = document.createElement('div'); div.className = 'cut-board'; div.style.width = (b.w * scale) + 'px'; div.style.height = (b.h * scale) + 'px';
            b.parts.forEach(p => { let pDiv = document.createElement('div'); pDiv.style.position = 'absolute'; pDiv.style.background = '#D4AF37'; pDiv.style.border = '1px solid #fff'; pDiv.style.fontSize = '8px'; pDiv.style.color = '#fff'; pDiv.style.left = (p.x * scale) + 'px'; pDiv.style.top = (p.y * scale) + 'px'; pDiv.style.width = (p.w * scale) + 'px'; pDiv.style.height = (p.h * scale) + 'px'; pDiv.innerText = `${p.w}x${p.h}`; div.appendChild(pDiv); });
            container.appendChild(div);
        }); window.AppState.currentBoards = boards; container.style.display = 'block';
    }
};

window.ExportEngine = {
    exportDXF: () => {
        if(!window.AppState.currentBoards || window.AppState.currentBoards.length === 0) return window.App.ui.toast("Gere o Plano de Corte primeiro.");
        let dxf = `0\nSECTION\n2\nENTITIES\n`;
        window.AppState.currentBoards.forEach((b, i) => {
            let oX = i * (window.CutPlanEngine.boardW + 500);
            b.parts.forEach(p => { let x1 = oX + p.x, y1 = p.y, x2 = oX + p.x + p.w, y2 = p.y + p.h; dxf += `0\nLWPOLYLINE\n8\nCorte\n90\n4\n70\n1\n10\n${x1}\n20\n${y1}\n10\n${x2}\n20\n${y1}\n10\n${x2}\n20\n${y2}\n10\n${x1}\n20\n${y2}\n`; });
        }); dxf += `0\nENDSEC\n0\nEOF\n`;
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([dxf], {type: "text/plain"})); a.download = "projeto_corte.dxf"; a.click();
    }
};

window.LayoutEngine = {
    calculate: (rW, rD, reqMods) => {
        let placed = []; let zEsq = 0; let zDir = 0; let zCentro = 0; 
        reqMods.forEach(mod => {
            let w = mod.largura || 1000; let d = mod.profundidade || 500;
            if (mod.tipo === 'parede_otica' || mod.nome.includes('Expositor') || mod.tipo === 'armario') {
                let goLeft = mod.nome.includes('Esq'); if (!mod.nome.includes('Dir') && !goLeft) goLeft = (zEsq <= zDir);
                if (goLeft) { mod.posX = -(rW / 2) + (d / 2); mod.posZ = -(rD / 2) + zEsq + (w / 2) + 500; mod.rotY = 90; zEsq += w + 100; } 
                else { mod.posX = (rW / 2) - (d / 2); mod.posZ = -(rD / 2) + zDir + (w / 2) + 500; mod.rotY = -90; zDir += w + 100; }
            } else if (mod.tipo.includes('centro') || mod.tipo.includes('pergolado') || mod.nome.includes('Mesa') || mod.tipo === 'deck_madeira' || mod.tipo === 'jardim_vertical') {
                 mod.posX = 0; 
                 if(mod.tipo === 'jardim_vertical' || mod.tipo === 'churrasqueira_tijolo') { mod.posZ = -(rD / 2) + (d/2); mod.rotY = 0; } 
                 else { mod.posZ = -(rD / 2) + zCentro + (d / 2) + 1500; zCentro += d + 1000; mod.rotY = 0; }
            } else if (mod.tipo === 'balcao' || mod.tipo === 'balcao_concreto' || mod.tipo === 'balcao_mercadao') { mod.posX = 0; mod.posZ = -(rD / 2) + 1200; mod.rotY = 0; }
            else { mod.posX = 0; mod.posZ = 0; mod.rotY = 0; }
            placed.push(mod);
        }); return placed;
    }
};

window.ThreeEngine = {
    scene: null, camera: null, renderer: null, controls: null, rootNode: null, dragPlane: null, raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2(), pDown: {x:0,y:0}, dragObj: null,
    init: () => {
        const c = document.getElementById('canvas-container'); const cv = document.getElementById('cad-canvas');
        window.ThreeEngine.scene = new THREE.Scene();
        window.ThreeEngine.scene.add(new THREE.AmbientLight(0xffffff, 0.8)); 
        const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(10, 20, 10); dl.castShadow = true; dl.shadow.mapSize.width = 2048; dl.shadow.mapSize.height = 2048; window.ThreeEngine.scene.add(dl);
        const dl2 = new THREE.DirectionalLight(0xffffff, 0.4); dl2.position.set(-10, 10, -10); window.ThreeEngine.scene.add(dl2);
        window.ThreeEngine.camera = new THREE.PerspectiveCamera(45, c.clientWidth / c.clientHeight, 0.1, 1000); window.ThreeEngine.camera.position.set(4, 5, 8);
        
        window.ThreeEngine.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); 
        window.ThreeEngine.renderer.setClearColor(0x000000, 0); window.ThreeEngine.renderer.setSize(c.clientWidth, c.clientHeight); window.ThreeEngine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        window.ThreeEngine.renderer.shadowMap.enabled = true; window.ThreeEngine.renderer.outputEncoding = THREE.sRGBEncoding; window.ThreeEngine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        
        const pmremGen = new THREE.PMREMGenerator( window.ThreeEngine.renderer ); window.ThreeEngine.scene.environment = pmremGen.fromScene( new THREE.RoomEnvironment(), 0.04 ).texture;

        const renderScene = new THREE.RenderPass( window.ThreeEngine.scene, window.ThreeEngine.camera );
        const bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( c.clientWidth, c.clientHeight ), 0.8, 0.4, 0.85 );
        window.ThreeEngine.composer = new THREE.EffectComposer( window.ThreeEngine.renderer ); window.ThreeEngine.composer.addPass( renderScene ); window.ThreeEngine.composer.addPass( bloomPass );

        window.ThreeEngine.controls = new THREE.OrbitControls(window.ThreeEngine.camera, cv); window.ThreeEngine.controls.enableDamping = true;
        window.ThreeEngine.rootNode = new THREE.Group(); window.ThreeEngine.scene.add(window.ThreeEngine.rootNode); window.ThreeEngine.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        
        cv.addEventListener('pointerdown', window.ThreeEngine.onPtrDown); cv.addEventListener('pointermove', window.ThreeEngine.onPtrMove); cv.addEventListener('pointerup', window.ThreeEngine.onPtrUp);
        window.addEventListener('resize', () => { window.ThreeEngine.camera.aspect = c.clientWidth / c.clientHeight; window.ThreeEngine.camera.updateProjectionMatrix(); window.ThreeEngine.renderer.setSize(c.clientWidth, c.clientHeight); window.ThreeEngine.composer.setSize(c.clientWidth, c.clientHeight); });
        window.ThreeEngine.animate();
    },
    getPtr: (e) => { const rect = window.ThreeEngine.renderer.domElement.getBoundingClientRect(); let cX = e.clientX || (e.touches && e.touches[0].clientX); let cY = e.clientY || (e.touches && e.touches[0].clientY); window.ThreeEngine.pointer.x = ((cX - rect.left) / rect.width) * 2 - 1; window.ThreeEngine.pointer.y = -((cY - rect.top) / rect.height) * 2 + 1; return {x: cX, y: cY}; },
    onPtrDown: (e) => {
        const pos = window.ThreeEngine.getPtr(e); window.ThreeEngine.pDown = pos; window.ThreeEngine.isDown = true;
        window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera);
        if (window.AppState.arActive && window.AppState.modoInteracao === 'projeto') { window.ThreeEngine.dragPlane.constant = -window.ThreeEngine.rootNode.position.y; const hit = new THREE.Vector3(); window.ThreeEngine.raycaster.ray.intersectPlane(window.ThreeEngine.dragPlane, hit); if (hit) { window.ThreeEngine.controls.enabled = false; window.ThreeEngine.dragObj = { type: 'root', offset: hit.clone().sub(window.ThreeEngine.rootNode.position) }; } return; }
        const hits = window.ThreeEngine.raycaster.intersectObjects(window.ThreeEngine.rootNode.children, true);
        if (hits.length > 0) {
            let obj = hits[0].object; if(obj.userData.type && obj.userData.type.includes('wall')) return; if (obj.type === 'LineSegments') obj = obj.parent; while (obj && !obj.userData.isRootModule && obj.parent) obj = obj.parent;
            if (obj && obj.userData.isRootModule) {
                window.App.modules.select(obj.userData.id);
                if (window.AppState.tool === 'move' || (window.AppState.arActive && window.AppState.modoInteracao === 'peca')) { window.ThreeEngine.controls.enabled = false; window.ThreeEngine.dragPlane.constant = -obj.position.y; const hit = new THREE.Vector3(); window.ThreeEngine.raycaster.ray.intersectPlane(window.ThreeEngine.dragPlane, hit); if (hit) window.ThreeEngine.dragObj = { obj: obj, offset: hit.clone().sub(obj.position) }; }
                window.ThreeEngine.pressTimer = setTimeout(() => { if (window.ThreeEngine.isDown && !window.ThreeEngine.dragObj) { window.ThreeEngine.isLongPress = true; window.App.ui.openLiveEditor(obj.userData.id); } }, 500);
            }
        } else window.App.modules.select(null);
    },
    onPtrMove: (e) => {
        if (!window.ThreeEngine.isDown) return; let cX = e.clientX || (e.touches && e.touches[0].clientX); let cY = e.clientY || (e.touches && e.touches[0].clientY);
        if (Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) > 15) { clearTimeout(window.ThreeEngine.pressTimer); window.ThreeEngine.isLongPress = false; }
        if (window.ThreeEngine.dragObj && (window.AppState.tool === 'move' || window.AppState.arActive)) {
            window.ThreeEngine.getPtr(e); window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); 
            if (window.ThreeEngine.dragObj.type === 'root') { const hit = new THREE.Vector3(); window.ThreeEngine.raycaster.ray.intersectPlane(window.ThreeEngine.dragPlane, hit); if(hit) { const nP = hit.clone().sub(window.ThreeEngine.dragObj.offset); window.ThreeEngine.rootNode.position.x = nP.x; window.ThreeEngine.rootNode.position.z = nP.z; } } 
            else { 
                const m = window.AppState.modules.find(x => x.id === window.ThreeEngine.dragObj.obj.userData.id); 
                if (m) {
                    const hit = new THREE.Vector3(); window.ThreeEngine.raycaster.ray.intersectPlane(window.ThreeEngine.dragPlane, hit);
                    if(hit) { let tX = hit.x - window.ThreeEngine.dragObj.offset.x; let tZ = hit.z - window.ThreeEngine.dragObj.offset.z; let rY = m.rotY || 0; const rW2 = window.AppState.roomWidth / 2000; const rD2 = window.AppState.roomDepth / 2000; const hW = (m.largura||1000)/2000; const hD = (m.profundidade||500)/2000; const snap = 0.4; if (Math.abs((tZ - hD) - (-rD2)) < snap) { tZ = -rD2 + hD; rY = 0; } else if (Math.abs((tX - hW) - (-rW2)) < snap) { tX = -rW2 + hW; rY = -90; } else if (Math.abs((tX + hW) - (rW2)) < snap) { tX = rW2 - hW; rY = 90; } window.ThreeEngine.dragObj.obj.position.set(tX, m.posY/1000||0, tZ); window.ThreeEngine.dragObj.obj.rotation.y = THREE.MathUtils.degToRad(rY); m.rotY = rY; m.posX = tX * 1000; m.posZ = tZ * 1000; window.App.ui.syncToStateNoRebuild(); }
                }
            }
        }
    },
    onPtrUp: (e) => {
        window.ThreeEngine.isDown = false; window.ThreeEngine.controls.enabled = true; clearTimeout(window.ThreeEngine.pressTimer);
        if (window.ThreeEngine.dragObj) { window.ThreeEngine.dragObj = null; window.App.storage.save(); return; } if (window.ThreeEngine.isLongPress) { window.ThreeEngine.isLongPress = false; return; } 
        let cX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX); let cY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
        if (window.AppState.tool === 'remove_part' && Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) < 15) {
            window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); const hits = window.ThreeEngine.raycaster.intersectObjects(window.ThreeEngine.rootNode.children, true);
            if (hits.length > 0) { let tgt = hits[0].object; if(tgt.userData.type && tgt.userData.type.includes('wall')) return; if(tgt.type === 'LineSegments') tgt = tgt.parent; let mg = tgt; while(mg && !mg.userData.isRootModule) mg = mg.parent; if (mg && tgt.userData.partKey) { const mod = window.AppState.modules.find(m => m.id === mg.userData.id); if (mod && !mod.removedParts?.includes(tgt.userData.partKey)) { if(!mod.removedParts) mod.removedParts = []; mod.removedParts.push(tgt.userData.partKey); window.App.modules.refreshAll(); window.App.ui.toast(`Peça ocultada`, 'warning'); window.App.storage.save(); } } } return;
        }
        if (window.AppState.tool === 'add_comp' && Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) < 15) {
            window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); const hits = window.ThreeEngine.raycaster.intersectObject(window.ThreeEngine.floorCollider);
            if (hits.length > 0) { window.App.modules.add('porta_avulsa', { posX: hits[0].point.x * 1000, posY: hits[0].point.y * 1000, posZ: hits[0].point.z * 1000, largura: 400, altura: 600 }); window.App.ui.toast("Item Inserido!"); } return;
        }
        if (!window.AppState.arActive && window.AppState.tool === 'orbit' && Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) < 15) {
            window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); const hits = window.ThreeEngine.raycaster.intersectObjects(window.ThreeEngine.rootNode.children, true); let anim = null;
            for (let h of hits) { let curr = h.object; if(curr.userData.type && curr.userData.type.includes('wall')) continue; if (curr.type === 'LineSegments') curr = curr.parent; while (curr) { if (curr.userData && curr.userData.isAnimatable) { anim = curr; break; } curr = curr.parent; } if (anim) break; }
            if (anim) { anim.userData.isOpen = !anim.userData.isOpen; const mod = window.AppState.modules.find(m => m.id === anim.userData.modId); if (mod) mod.compStates[anim.userData.compKey] = anim.userData.isOpen; window.AppState.animacoesAtivas = window.AppState.animacoesAtivas.filter(a => a.obj !== anim); window.AppState.animacoesAtivas.push({ obj: anim, type: anim.userData.type, target: anim.userData.isOpen }); window.App.storage.save(); }
        }
    },
    animate: () => {
        requestAnimationFrame(window.ThreeEngine.animate);
        for (let i = window.AppState.animacoesAtivas.length - 1; i >= 0; i--) {
            const a = window.AppState.animacoesAtivas[i]; const o = a.obj; const s = 0.15; 
            if (a.type === 'door_hinge') { const t = a.target ? (Math.PI / 1.6 * (o.userData.hinge === 'left' ? -1 : 1) * (o.userData.zDir || 1)) : 0; o.rotation.y += (t - o.rotation.y) * s; if (Math.abs(o.rotation.y - t) < 0.01) { o.rotation.y = t; window.AppState.animacoesAtivas.splice(i, 1); } } 
            else if (a.type === 'door_flap') { const t = a.target ? (-Math.PI / 2.2 * (o.userData.zDir || 1)) : 0; o.rotation.x += (t - o.rotation.x) * s; if (Math.abs(o.rotation.x - t) < 0.01) { o.rotation.x = t; window.AppState.animacoesAtivas.splice(i, 1); } } 
            else if (a.type === 'door_slide') { const t = a.target ? (o.userData.baseX + o.userData.travelX) : o.userData.baseX; o.position.x += (t - o.position.x) * s; if (Math.abs(o.position.x - t) < 0.001) { o.position.x = t; window.AppState.animacoesAtivas.splice(i, 1); } } 
            else if (a.type === 'drawer') { const t = a.target ? (o.userData.baseZ + o.userData.depth * 0.8 * (o.userData.zDir || 1)) : o.userData.baseZ; o.position.z += (t - o.position.z) * s; if (Math.abs(o.position.z - t) < 0.001) { o.position.z = t; window.AppState.animacoesAtivas.splice(i, 1); } }
        } window.ThreeEngine.controls.update(); window.ThreeEngine.composer.render();
    },
    highlightSelection: (id) => { window.ThreeEngine.rootNode.children.forEach(mg => { if(mg.userData.isRootModule) { const isS = (mg.userData.id === id); mg.traverse(c => { if (c.isMesh && c.material && !c.material.transparent && c.material !== window.MatDefs.led.material && c.material.emissive) c.material.emissive.setHex(isS ? 0x333333 : 0x000000); }); } }); },
    rebuildScene: () => {
        while(window.ThreeEngine.rootNode.children.length > 0) window.ThreeEngine.rootNode.remove(window.ThreeEngine.rootNode.children[0]); window.AppState.animacoesAtivas = []; window.AppState.cutParts = []; 
        const rW = window.AppState.roomWidth / 1000; const rD = window.AppState.roomDepth / 1000; const rH = 3; const cMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
        window.ThreeEngine.floorCollider = new THREE.Mesh(new THREE.PlaneGeometry(rW*3, rD*3), cMat); window.ThreeEngine.floorCollider.rotation.x = -Math.PI/2; window.ThreeEngine.floorCollider.userData.type = 'floor'; window.ThreeEngine.rootNode.add(window.ThreeEngine.floorCollider);
        if (window.AppState.arActive) { const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(rW, rH, rD)); window.ThreeEngine.roomWireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1976D2, linewidth: 2 })); window.ThreeEngine.roomWireframe.position.set(0, rH/2, 0); window.ThreeEngine.rootNode.add(window.ThreeEngine.roomWireframe); }

        window.AppState.modules.forEach(mod => {
            const g = new THREE.Group(); g.userData = { id: mod.id, isRootModule: true }; if (!mod.removedParts) mod.removedParts = []; if (!mod.compStates) mod.compStates = {};
            const w = mod.largura / 1000; const h = mod.altura / 1000; const d = mod.profundidade / 1000; const rL = (mod.retornoL || 0) / 1000; const esp = 0.018; const folga = 0.003; 
            
            const getMatReal = (key) => { let def = window.MatDefs[key] || window.MatDefs.amadeirado_padrao; if(key.includes('vidro')) return new THREE.MeshPhysicalMaterial(def); return new THREE.MeshStandardMaterial(def); };
            const matCorpo = getMatReal(mod.material); const matFrente = mod.material === 'misto' ? new THREE.MeshStandardMaterial({...window.MatDefs['amadeirado_padrao'], color: window.MatDefs['amadeirado_padrao'].frontColor}) : matCorpo;
            const edgeMat = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.15, depthTest: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
            const activeMat = (window.AppState.selectedModule === mod.id) ? new THREE.MeshStandardMaterial({...matCorpo, emissive: 0x333333 }) : matCorpo;
            const activeMatFront = (window.AppState.selectedModule === mod.id) ? new THREE.MeshStandardMaterial({...matCorpo, emissive: 0x333333 }) : matFrente;

            const getMat = (pKey, defMat) => { if(mod.materiaisCustomizados?.estrutura?.[pKey]) { const m = new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.estrutura[pKey]]); if(window.AppState.selectedModule === mod.id) m.emissive.setHex(0x333333); return m; } return defMat; };
            const matTeto = getMat('teto', activeMat); const matBase = getMat('base', activeMat); const matEsq = getMat('lateralEsq', activeMat); const matDir = getMat('lateralDir', activeMat); const matFundo = getMat('fundo', activeMat);

            const criarGeo = (geo, px, py, pz, cMat, pKey) => { if (pKey && mod.removedParts.includes(pKey)) return null; const m = new THREE.Mesh(geo, cMat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; if(pKey) m.userData.partKey = pKey; if(cMat.type !== 'MeshPhysicalMaterial' && !cMat.emissive) { const lines = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat); lines.raycast = () => {}; m.add(lines); } g.add(m); return m; };
            const criarBloco = (gw, gh, gd, px, py, pz, cMat, pKey) => { if (pKey && mod.removedParts.includes(pKey)) return null; if (cMat === activeMat && cMat.type !== 'MeshPhysicalMaterial') { if (gw < 0.02) window.AppState.cutParts.push({w: Math.round(gh*1000), h: Math.round(gd*1000), label: 'Estrutura'}); else if (gh < 0.02) window.AppState.cutParts.push({w: Math.round(gw*1000), h: Math.round(gd*1000), label: 'Estrutura'}); else if (gd < 0.02) window.AppState.cutParts.push({w: Math.round(gw*1000), h: Math.round(gh*1000), label: 'Estrutura'}); } return criarGeo(new THREE.BoxGeometry(gw, gh, gd), px, py, pz, cMat, pKey); };

            const drawInteractiveFronte = (gP, isD, wF, hF, dF, px, py, pz, cM, ab, isL, zD, tX, cK) => {
                if (mod.removedParts.includes(cK)) return; const grp = new THREE.Group(); const type = isD ? 'drawer' : (ab === 'correr' ? 'door_slide' : (ab === 'basculante' ? 'door_flap' : 'door_hinge'));
                const isOpen = mod.compStates[cK] || false; grp.userData = { isAnimatable: true, type, isOpen, modId: mod.id, compKey: cK, zDir: zD, depth: dF, baseZ: pz, travelX: tX, baseX: px, hinge: isL ? 'left' : 'right', partKey: cK };
                const pM = new THREE.Mesh(new THREE.BoxGeometry(wF - folga, hF - folga, esp), cM); pM.castShadow = true; pM.userData.partKey = cK; pM.add(new THREE.LineSegments(new THREE.EdgesGeometry(pM.geometry), edgeMat));
                if (isD) { grp.position.set(px, py, isOpen ? (pz + dF * 0.8 * zD) : pz); grp.add(pM); } 
                else { if (ab === 'correr') { grp.position.set(isOpen ? px + tX : px, py, pz); grp.add(pM); } else if (ab === 'basculante') { grp.position.set(px, py + hF/2, pz); pM.position.y = -hF/2; if (isOpen) grp.rotation.x = -Math.PI / 2.2 * zD; grp.add(pM); } else { grp.position.set(px + (isL ? -wF/2 : wF/2), py, pz); pM.position.x = isL ? wF/2 : -wF/2; const pux = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.15, 0.02), new THREE.MeshStandardMaterial({color:0x888, metalness:1})); pux.position.set(isL ? wF/2 - 0.04 : -wF/2 + 0.04, 0, 0.015 * zD); pM.add(pux); if (isOpen) grp.rotation.y = (Math.PI / 1.6 * (isL ? -1 : 1) * zD); grp.add(pM); } }
                gP.add(grp); window.AppState.cutParts.push({w: Math.round(wF*1000), h: Math.round(hF*1000), label: isD ? 'Gaveta' : 'Porta'});
            };

            const fillStorage = (bW, bH, bD, bX, bY, bZ, p, gav, lay, ab, dbL, zD, pG) => {
                let sY = bY - bH/2, sX = bX - bW/2; let hP = bH, hG = bH, wP = bW, wG = bW; let syP = sY, syG = sY, sxP = sX, sxG = sX;
                const fW = mod.compW > 0 ? (mod.compW/1000) : 0; const fH = mod.compH > 0 ? (mod.compH/1000) : 0;
                if (gav > 0 && p > 0) { if (lay === 'top_drawers') { hG = bH*0.25; hP = bH*0.75; syP = sY; syG = sY + hP; } else if (lay === 'bottom_drawers') { hG = bH*0.25; hP = bH*0.75; syG = sY; syP = sY + hG; } else if (lay === 'left_drawers') { wG = bW*0.35; wP = bW*0.65; sxG = sX; sxP = sX + wG; } else if (lay === 'right_drawers') { wP = bW*0.65; wG = bW*0.35; sxP = sX; sxG = sX + wP; } }
                if (gav > 0 && lay !== 'apenas_portas') { let cY = syG; for (let i = 0; i < gav; i++) { const gK = `gaveta_${i}`; const cGW = mod.medidasCustomizadas?.[gK]?.w ? (mod.medidasCustomizadas[gK].w/1000) : (fW || wG); const cGH = mod.medidasCustomizadas?.[gK]?.h ? (mod.medidasCustomizadas[gK].h/1000) : (fH || (hG / gav)); const mG = mod.materiaisCustomizados?.frentes?.[gK] ? new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.frentes[gK]]) : activeMatFront; drawInteractiveFronte(pG, true, cGW, cGH, bD, sxG + cGW/2, cY + cGH/2, bZ, mG, '', false, zD, 0, gK); cY += cGH; } }
                if (p > 0 && lay !== 'apenas_gavetas') { let cX = sxP; for (let i = 0; i < p; i++) { const pK = `porta_${i}`; const cPW = mod.medidasCustomizadas?.[pK]?.w ? (mod.medidasCustomizadas[pK].w/1000) : (fW || (wP / p)); const cPH = mod.medidasCustomizadas?.[pK]?.h ? (mod.medidasCustomizadas[pK].h/1000) : (fH || hP); let isL = (i % 2 === 0); if (p === 1) isL = (dbL === 'esq'); let tX = (i % 2 === 0) ? cPW * 0.95 : -cPW * 0.95; let dZ = bZ + (ab === 'correr' ? ((i % 2 === 0 ? 0.01 : 0.035) * zD) : 0); const mP = mod.materiaisCustomizados?.frentes?.[pK] ? new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.frentes[pK]]) : activeMatFront; drawInteractiveFronte(pG, false, cPW, cPH, bD, cX + cPW/2, syP + cPH/2, dZ, mP, ab, isL, zD, tX, pK); cX += cPW; } }
            };

            // == LÓGICA GOURMET / VAREJO ==
            if (mod.tipo === 'churrasqueira_tijolo') {
                criarBloco(w, h*0.35, d, 0, h*0.175, 0, matBase, "base_ch");
                criarBloco(w, h*0.25, d*0.8, 0, h*0.475, -d*0.1, matFundo, "fogo_f");
                criarBloco(0.1, h*0.25, d*0.8, -w/2+0.05, h*0.475, -d*0.1, matEsq, "fogo_e");
                criarBloco(0.1, h*0.25, d*0.8, w/2-0.05, h*0.475, -d*0.1, matDir, "fogo_d");
                criarBloco(w, h*0.4, d*0.5, 0, h*0.8, -d*0.25, matTeto, "chamine");
                const grid = new THREE.Mesh(new THREE.BoxGeometry(w-0.1, 0.02, d*0.6), getMatReal('metal_preto')); grid.position.set(0, h*0.45, -d*0.1); g.add(grid);
            }
            else if (mod.tipo === 'pergolado_metalico') {
                criarBloco(0.1, h, 0.1, -w/2+0.05, h/2, -d/2+0.05, matCorpo, "p1"); criarBloco(0.1, h, 0.1, w/2-0.05, h/2, -d/2+0.05, matCorpo, "p2");
                criarBloco(0.1, h, 0.1, -w/2+0.05, h/2, d/2-0.05, matCorpo, "p3"); criarBloco(0.1, h, 0.1, w/2-0.05, h/2, d/2-0.05, matCorpo, "p4");
                const numVigas = Math.max(3, Math.floor(d / 0.4));
                for(let i=0; i<numVigas; i++){ criarBloco(w+0.2, 0.15, 0.05, 0, h+0.075, -d/2 + (d/numVigas)*i, matCorpo, `vg_${i}`); }
                if(mod.tampoVidro) criarBloco(w+0.2, 0.02, d+0.2, 0, h+0.16, 0, getMatReal('vidro_incolor'), "vidro_top");
            }
            else if (mod.tipo === 'deck_madeira') {
                criarBloco(w, h, d, 0, h/2, 0, matCorpo, "deck_base");
                if (mod.ripadoFrontal) {
                    const qty = Math.floor(w / 0.1); for (let r = 0; r < qty; r++) { criarGeo(new THREE.BoxGeometry(0.09, 0.01, d), -w/2 + r*0.1 + 0.045, h+0.005, 0, activeMatFront, `ripa_d_${r}`); }
                }
            }
            else if (mod.tipo === 'jardim_vertical') {
                criarBloco(w, h, d, 0, h/2, 0, matBase, "caixa_jardim");
                criarBloco(w-0.04, h-0.04, d+0.02, 0, h/2, 0.01, getMatReal('folhagem'), "folhas");
            }
            else if (mod.tipo === 'mesa_macica') {
                criarBloco(w, 0.08, d, 0, h-0.04, 0, matCorpo, "tampo");
                criarBloco(0.15, h-0.08, d*0.6, -w/2+0.2, (h-0.08)/2, 0, matBase, "pe_e");
                criarBloco(0.15, h-0.08, d*0.6, w/2-0.2, (h-0.08)/2, 0, matBase, "pe_d");
            }
            else if (mod.tipo === 'balcao_concreto' || mod.tipo === 'balcao_mercadao') {
                criarBloco(w, esp, d, 0, esp/2, 0, matBase, "base"); criarBloco(w, 0.04, d+0.05, 0, h-0.02, 0, matTeto, "tampo");
                criarBloco(esp, h-0.04, d, -w/2+esp/2, h/2, 0, matEsq, "latE"); criarBloco(esp, h-0.04, d, w/2-esp/2, h/2, 0, matDir, "latD");
                fillStorage(w-esp*2, h-esp*2-0.04, d, 0, h/2-0.02, d/2, mod.portas, mod.gavetas, mod.layoutInterno, mod.abertura, mod.dobradicaLado, 1, g);
            }
            else if (mod.tipo === 'parede_otica') {
                criarBloco(w, h, 0.05, 0, h/2, -d/2+0.025, matFundo, "fundo"); const bH = h*0.3; criarBloco(w, bH, d-0.05, 0, bH/2, 0.025, matBase, "bgav");
                fillStorage(w, bH, d-0.05, 0, bH/2, d/2, 0, mod.gavetas||3, 'apenas_gavetas', '', '', 1, g);
                const s = new THREE.Shape(); s.moveTo(-d/2,0); s.lineTo(d/2,0); s.lineTo(-d/2,0.2); const geom = new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:false}); geom.center(); const mw = new THREE.Mesh(geom, getMatReal('mdf_vermelho_mercadao')); mw.position.set(0, bH+0.1, 0); mw.rotation.y = Math.PI/2; g.add(mw);
                for(let i=1; i<=5; i++) { criarBloco(w-0.1, 0.01, d-0.15, 0, bH+0.2+((h*0.85-bH-0.2)/6)*i, -0.05, getMatReal('vidro_incolor'), `prat_${i}`); }
            }
            else {
                // Fallback Armario/Genérico
                criarBloco(w, esp, d, 0, esp/2, 0, matBase, "base"); criarBloco(w, esp, d, 0, h-esp/2, 0, matTeto, "teto");
                criarBloco(esp, h-esp*2, d, -w/2+esp/2, h/2, 0, matEsq, "latE"); criarBloco(esp, h-esp*2, d, w/2-esp/2, h/2, 0, matDir, "latD");
                criarBloco(w-esp*2, h-esp*2, 0.006, 0, h/2, -d/2+0.003, matFundo, "fundo");
                fillStorage(w-esp*2, h-esp*2, d, 0, h/2, d/2, mod.portas, mod.gavetas, mod.layoutInterno, mod.abertura, mod.dobradicaLado, 1, g);
            }

            g.position.set(mod.posX/1000||0, mod.posY/1000||0, mod.posZ/1000||0); g.rotation.y = THREE.MathUtils.degToRad(mod.rotY || 0);
            window.ThreeEngine.rootNode.add(g);
        });
    }
};
