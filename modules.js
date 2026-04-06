/**
 * Módulo de Geração 3D (Paramétrico), Orçamento (BOM) e Plano de Corte (Nesting)
 */
window.ModulesEngine = {
    pecasCorte: [], // Armazena todas as peças físicas para o plano de corte

    materiais: {
        'branco': new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 }),
        'amadeirado': new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.6 }),
        'vidro': new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0 })
    },

    // --- BIBLIOTECA DE MÓDULOS REAIS ---
    criarBlocoFisico: (w, h, d, px, py, pz, material, rotY = 0, nomePeca = "Peça") => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(px, py, pz);
        mesh.rotation.y = rotY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Registrar para o Plano de Corte (Desconsidera peças muito pequenas ou ferragens)
        if (material !== window.ModulesEngine.materiais.vidro) {
            // Converte para mm para o otimizador
            if (w < 0.02) window.ModulesEngine.pecasCorte.push({ w: Math.round(h*1000), h: Math.round(d*1000), label: nomePeca });
            else if (h < 0.02) window.ModulesEngine.pecasCorte.push({ w: Math.round(w*1000), h: Math.round(d*1000), label: nomePeca });
            else window.ModulesEngine.pecasCorte.push({ w: Math.round(w*1000), h: Math.round(h*1000), label: nomePeca });
        }
        return mesh;
    },

    moduloBalcaoBase: (dados) => {
        const g = new THREE.Group();
        const esp = 0.018; // 18mm MDF
        const { largura: w, altura: h, profundidade: d } = dados;
        const wM = w/1000, hM = h/1000, dM = d/1000;
        const mat = window.ModulesEngine.materiais[dados.material];

        g.add(window.ModulesEngine.criarBlocoFisico(wM, esp, dM, 0, esp/2, 0, mat, 0, "Base")); // Base
        g.add(window.ModulesEngine.criarBlocoFisico(wM, esp, dM+0.05, 0, hM, 0, mat, 0, "Tampo")); // Tampo
        g.add(window.ModulesEngine.criarBlocoFisico(esp, hM, dM, -wM/2+esp/2, hM/2, 0, mat, 0, "Lat Esq")); // Lat Esq
        g.add(window.ModulesEngine.criarBlocoFisico(esp, hM, dM, wM/2-esp/2, hM/2, 0, mat, 0, "Lat Dir")); // Lat Dir
        g.add(window.ModulesEngine.criarBlocoFisico(wM-esp*2, hM-esp*2, 0.006, 0, hM/2, -dM/2+0.003, mat, 0, "Fundo")); // Fundo
        
        // Portas Interativas (Simulação visual)
        const portaMat = window.ModulesEngine.materiais['branco'];
        g.add(window.ModulesEngine.criarBlocoFisico(wM/2 - 0.01, hM - 0.1, esp, -wM/4, hM/2 - 0.04, dM/2, portaMat, 0, "Porta"));
        g.add(window.ModulesEngine.criarBlocoFisico(wM/2 - 0.01, hM - 0.1, esp, wM/4, hM/2 - 0.04, dM/2, portaMat, 0, "Porta"));
        
        g.userData = dados; return g;
    },

    moduloCantoCurvo: (dados) => {
        const g = new THREE.Group();
        const { largura: w, altura: h } = dados;
        const r = w/1000, hM = h/1000, esp = 0.018;
        const mat = window.ModulesEngine.materiais[dados.material];
        
        // Extrusão de shape para móvel orgânico
        const shape = new THREE.Shape();
        shape.moveTo(0,0); shape.lineTo(r,0);
        shape.quadraticCurveTo(r, r, 0, r); shape.lineTo(0,0);
        
        const geoTampo = new THREE.ExtrudeGeometry(shape, { depth: esp, bevelEnabled: false });
        geoTampo.rotateX(Math.PI/2);
        const tampo = new THREE.Mesh(geoTampo, mat); tampo.position.set(-r/2, hM, r/2);
        g.add(tampo);
        
        const base = new THREE.Mesh(geoTampo, mat); base.position.set(-r/2, esp, r/2);
        g.add(base);

        window.ModulesEngine.pecasCorte.push({ w: Math.round(r*1000), h: Math.round(r*1000), label: "Tampo Curvo" });
        window.ModulesEngine.pecasCorte.push({ w: Math.round(r*1000), h: Math.round(r*1000), label: "Base Curva" });

        g.userData = dados; return g;
    },

    gerarProjeto: (modulosConfig) => {
        window.ModulesEngine.pecasCorte = []; // Reseta
        const rootGroup = new THREE.Group();
        modulosConfig.forEach((mod) => {
            let objeto3D;
            if (mod.tipo === 'moduloCantoCurvo') objeto3D = window.ModulesEngine.moduloCantoCurvo(mod);
            else objeto3D = window.ModulesEngine.moduloBalcaoBase(mod); // Fallback e base
            
            objeto3D.position.set(mod.posX/1000, mod.posY/1000, mod.posZ/1000);
            rootGroup.add(objeto3D);
        });
        return rootGroup;
    },

    // --- ALGORITMO DE PLANO DE CORTE (BIN PACKING SIMPLIFICADO) ---
    gerarPlanoCorteSVG: () => {
        const chapaW = 2750; const chapaH = 1850;
        let parts = [...window.ModulesEngine.pecasCorte].sort((a, b) => (b.w * b.h) - (a.w * a.h)); // Ordena por área (maior primeiro)
        let boards = [];

        parts.forEach(p => {
            let placed = false;
            for (let b of boards) {
                let rects = window.ModulesEngine.encontrarEspacos(b);
                for (let r of rects) {
                    if (r.w >= p.w && r.h >= p.h) { b.parts.push({ x: r.x, y: r.y, w: p.w, h: p.h, label: p.label }); placed = true; break; } 
                    else if (r.w >= p.h && r.h >= p.w) { b.parts.push({ x: r.x, y: r.y, w: p.h, h: p.w, label: p.label }); placed = true; break; } // Rotaciona
                }
                if (placed) break;
            }
            if (!placed) {
                boards.push({ w: chapaW, h: chapaH, parts: [{ x: 0, y: 0, w: p.w, h: p.h, label: p.label }] });
            }
        });

        return window.ModulesEngine.renderizarSVG(boards, chapaW, chapaH);
    },

    encontrarEspacos: (board) => {
        // Algoritmo simplificado de divisão de área livre (Guillotine-like)
        let free = [{x:0, y:0, w:board.w, h:board.h}];
        for(let p of board.parts) {
            let nextFree = [];
            for(let f of free) {
                if (p.x >= f.x + f.w || p.x + p.w <= f.x || p.y >= f.y + f.h || p.y + p.h <= f.y) { nextFree.push(f); } else {
                    if (p.x > f.x) nextFree.push({x: f.x, y: f.y, w: p.x - f.x, h: f.h});
                    if (p.x + p.w < f.x + f.w) nextFree.push({x: p.x + p.w, y: f.y, w: f.x + f.w - (p.x + p.w), h: f.h});
                    if (p.y > f.y) nextFree.push({x: f.x, y: f.y, w: f.w, h: p.y - f.y});
                    if (p.y + p.h < f.y + f.h) nextFree.push({x: f.x, y: p.y + p.h, w: f.w, h: f.y + f.h - (p.y + p.h)});
                }
            } free = nextFree;
        } return free.sort((a,b) => (b.w*b.h) - (a.w*a.h));
    },

    renderizarSVG: (boards, cw, ch) => {
        let scale = 0.1;
        let html = `<h4>Chapas Necessárias: ${boards.length} (MDF ${cw}x${ch}mm)</h4><div style="display:flex; flex-wrap:wrap; gap:20px;">`;
        boards.forEach((b) => {
            html += `<svg width="${b.w * scale}" height="${b.h * scale}" style="border:2px solid #333; background:#e5e5e5;">`;
            b.parts.forEach(p => {
                html += `<rect x="${p.x * scale}" y="${p.y * scale}" width="${p.w * scale}" height="${p.h * scale}" fill="#DDA15E" stroke="#fff" stroke-width="1" />`;
                html += `<text x="${(p.x + p.w/2) * scale}" y="${(p.y + p.h/2) * scale}" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">${p.w}x${p.h}</text>`;
            });
            html += `</svg>`;
        });
        html += `</div>`;
        return html;
    }
};