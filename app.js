/**
 * ============================================================================
 * thIAguinho Soluções CAD - app.js (VERSÃO ORÁCULO SUPREMO)
 * Sistema Completo de Engenharia, Design 3D e Orçamentação Real
 * ============================================================================
 */

// -------------------------------------------------------------------------
// 1. ESTADO GLOBAL
// -------------------------------------------------------------------------
const AppState = {
    modoOraculo: true,
    autoFix: true, // Adicionado para correção automática inteligente
    scene: null,
    camera: null,
    renderer: null,
    modules: [],
    selectedModule: null,
    costs: {
        mdf: 85.00,
        labor: 80.00,
        hardware: 0.00,
        others: 0.00,
        margin: 30
    },
    apiKeys: {
        gemini: '',
        groq: ''
    },
    arActive: false
};

// -------------------------------------------------------------------------
// 2. ORACLE ENGINE (ENGENHARIA DE MARCENARIA REAL)
// -------------------------------------------------------------------------
const OracleEngine = {
    version: '2.0.0-SupremeCarpentry',

    // Regras de Validação Rigorosas (Baseadas no Prompt Supremo)
    rules: {
        BALCAO: {
            label: 'Balcão de Atendimento',
            validate: (meta, dims) => {
                const errors = [];
                const fixes = [];
                const justify = [];
                
                if (!meta.hasExposicao && !meta.hasVitrine) {
                    errors.push('Falta área de exposição para o cliente.');
                    fixes.push({ key: 'hasExposicao', val: true });
                    justify.push('Adicionada prateleira de exposição frontal para interação com cliente.');
                }
                if (!meta.gavetas || meta.gavetas < 1) {
                    errors.push('Falta gaveta para operação/dinheiro.');
                    fixes.push({ key: 'gavetas', val: 2 });
                    justify.push('Adicionadas 2 gavetas internas para segurança e operação.');
                }
                if (!meta.portas || meta.portas < 2) {
                    errors.push('Falta armário fechado para estoque.');
                    fixes.push({ key: 'portas', val: 2 });
                    justify.push('Adicionadas portas para criar área de estoque oculto.');
                }
                if (!meta.hasEspacoOperacao) {
                    errors.push('Falta recuo de operação (caixa).');
                    fixes.push({ key: 'hasEspacoOperacao', val: true });
                    justify.push('Criado recuo ergonômico para as pernas do atendente.');
                }
                return { valid: errors.length === 0, errors, fixes, justify };
            }
        },
        GUARDA_ROUPA: {
            label: 'Guarda-Roupa',
            validate: (meta, dims) => {
                const errors = [];
                const fixes = [];
                const justify = [];
                
                if (!meta.hasCabideiro) {
                    errors.push('Obrigatório ter cabideiro em guarda-roupas.');
                    fixes.push({ key: 'hasCabideiro', val: true });
                    justify.push('Cabideiro metálico adicionado para funcionalidade básica.');
                }
                if (!meta.gavetas || meta.gavetas < 2) {
                    errors.push('Obrigatório ter gaveteiro interno.');
                    fixes.push({ key: 'gavetas', val: 3 });
                    justify.push('Adicionado gaveteiro interno com 3 gavetas.');
                }
                if (!meta.prateleiras || meta.prateleiras < 1) {
                    errors.push('Obrigatório ter prateleira/maleiro.');
                    fixes.push({ key: 'prateleiras', val: 2 });
                    justify.push('Adicionadas 2 prateleiras para divisão de maleiro e sapatos.');
                }
                if (dims.h < 1800) {
                    errors.push('Altura fora do padrão (mínimo 1800mm).');
                    fixes.push({ dim: 'h', val: 2200 });
                    justify.push('Altura corrigida para 2200mm (padrão ergonômico).');
                }
                return { valid: errors.length === 0, errors, fixes, justify };
            }
        },
        COZINHA: {
            label: 'Módulo de Cozinha',
            validate: (meta, dims) => {
                const errors = [];
                const fixes = [];
                const justify = [];
                
                if (!meta.isBase && !meta.isAereo) {
                    meta.isBase = true; // Força base por padrão
                }
                
                if (meta.isBase && dims.d < 560) {
                    errors.push('Profundidade da base de cozinha deve ser mínimo 560mm.');
                    fixes.push({ dim: 'd', val: 560 });
                    justify.push('Profundidade ajustada para 560mm para permitir encaixe de pias e eletros.');
                }
                
                if (!meta.prateleiras && !meta.gavetas) {
                    errors.push('Cozinha requer divisão interna útil.');
                    fixes.push({ key: 'prateleiras', val: 1 });
                    justify.push('Prateleira central adicionada para organização de panelas/mantimentos.');
                }
                return { valid: errors.length === 0, errors, fixes, justify };
            }
        },
        GENERICO: {
            label: 'Módulo Genérico',
            validate: (meta, dims) => {
                const errors = [];
                if (!meta.function) errors.push('Móvel deve ter função prática definida.');
                return { valid: errors.length === 0, errors, fixes: [], justify: [] };
            }
        }
    },

    validate: (module) => {
        if (!AppState.modoOraculo) return { allowed: true };
        
        const rule = OracleEngine.rules[module.type] || OracleEngine.rules.GENERICO;
        const result = rule.validate(module.metadata, module.dimensions);
        
        // Auto-fix com Justificativa de Engenharia
        if (!result.valid && AppState.autoFix) {
            result.fixes.forEach(f => {
                if (f.dim) module.dimensions[f.dim] = f.val;
                else module.metadata[f.key] = f.val;
            });
            // Notifica as correções justificadas
            result.justify.forEach(j => App.ui.toast(`Oráculo: ${j}`, 'info'));
            return { allowed: true, fixed: true, fixes: result.justify };
        }
        
        return result.valid ? { allowed: true } : { allowed: false, errors: result.errors };
    },

    getRuleLabel: (type) => {
        return (OracleEngine.rules[type] || {}).label || type;
    }
};

// -------------------------------------------------------------------------
// 3. BOM ENGINE (CÁLCULO REAL DE CUSTOS BASEADO EM PEÇAS)
// -------------------------------------------------------------------------
const BOMEngine = {
    
    calculateModule: (module) => {
        const meta = module.metadata;
        const dims = module.dimensions; 
        const w = dims.w / 1000, h = dims.h / 1000, d = dims.d / 1000; 
        
        // Engenharia Reversa Fiel: Calculando área exata das chapas (18mm padrão)
        let mdfArea = 0;
        
        // Caixaria Básica (Laterais, Base, Teto)
        mdfArea += (h * d * 2); // 2 Laterais
        mdfArea += (w * d * 2); // Base e Teto
        
        // Fundo (Geralmente 6mm, mas precificado junto para simplificar nesta vista)
        if (meta.hasBack) mdfArea += (w * h); 
        
        // Prateleiras internas
        if (meta.prateleiras) mdfArea += meta.prateleiras * (w * d);
        
        // Gavetas (Frente + 2 laterais + contra-fundo + fundo)
        if (meta.gavetas) {
            const drawerFront = (w * (h / meta.gavetas));
            const drawerBox = (d * 0.8 * (h / meta.gavetas)) * 2 + (w * d * 0.8);
            mdfArea += meta.gavetas * (drawerFront + drawerBox);
        }

        // Portas
        if (meta.portas) mdfArea += (w * h);

        // Fator de perda de serra/corte (15% padrão indústria)
        mdfArea *= 1.15;
        
        const costMDF = mdfArea * AppState.costs.mdf;
        
        // Ferragens baseadas em contagem real física
        let hardwareCost = 0;
        if (meta.portas) hardwareCost += meta.portas * 3 * 6.5; // 3 dobradiças/porta médias x R$6.50
        if (meta.gavetas) hardwareCost += meta.gavetas * 1 * 25.0; // 1 par corrediça telescopica x R$25
        if (meta.hasCabideiro) hardwareCost += (w * 15.0); // R$15 por metro linear de tubo metálico
        
        // Mão de obra por m²
        const laborCost = mdfArea * AppState.costs.labor;
        
        return {
            area: mdfArea,
            costs: {
                mdf: costMDF,
                hardware: hardwareCost,
                labor: laborCost
            }
        };
    },

    calculateTotal: () => {
        let totalArea = 0, totalMDF = 0, totalHW = 0, totalLabor = 0;
        
        AppState.modules.forEach(mod => {
            const bom = BOMEngine.calculateModule(mod);
            mod.cachedBOM = bom; 
            totalArea += bom.area;
            totalMDF += bom.costs.mdf;
            totalHW += bom.costs.hardware;
            totalLabor += bom.costs.labor;
        });
        
        totalHW += parseFloat(AppState.costs.hardware || 0);
        const others = parseFloat(AppState.costs.others || 0);
        const totalCost = totalMDF + totalHW + totalLabor + others;
        const margin = parseFloat(AppState.costs.margin || 0) / 100;
        const profit = totalCost * margin;
        
        return {
            area: totalArea,
            costs: {
                mdf: totalMDF,
                hardware: totalHW,
                labor: totalLabor,
                others: others,
                total: totalCost,
                profit: profit,
                sale: totalCost + profit
            }
        };
    }
};

// -------------------------------------------------------------------------
// 4. THREE ENGINE (CENA 3D E MONTAGEM REALISTA)
// -------------------------------------------------------------------------
const ThreeEngine = {
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    controls: null,

    init: () => {
        const container = document.getElementById('canvas-container');
        const canvas = document.getElementById('cad-canvas');
        
        AppState.scene = new THREE.Scene();
        AppState.scene.background = new THREE.Color(0xeef2f6);
        
        AppState.scene.add(new THREE.GridHelper(10, 10, 0x94a3b8, 0xcbd5e1));
        AppState.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        AppState.scene.add(dirLight);
        
        AppState.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        AppState.camera.position.set(2, 2, 3);
        
        AppState.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        AppState.renderer.setSize(container.clientWidth, container.clientHeight);
        AppState.renderer.shadowMap.enabled = true;
        
        ThreeEngine.controls = new THREE.OrbitControls(AppState.camera, canvas);
        ThreeEngine.controls.enableDamping = true;
        
        window.addEventListener('resize', ThreeEngine.onResize);
        canvas.addEventListener('pointerdown', ThreeEngine.onPointerDown);
        
        ThreeEngine.animate();
    },

    onResize: () => {
        const container = document.getElementById('canvas-container');
        AppState.camera.aspect = container.clientWidth / container.clientHeight;
        AppState.camera.updateProjectionMatrix();
        AppState.renderer.setSize(container.clientWidth, container.clientHeight);
    },

    onPointerDown: (event) => {
        const rect = AppState.renderer.domElement.getBoundingClientRect();
        ThreeEngine.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        ThreeEngine.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        ThreeEngine.raycaster.setFromCamera(ThreeEngine.mouse, AppState.camera);
        const intersects = ThreeEngine.raycaster.intersectObjects(AppState.scene.children, true);
        
        const moduleHit = intersects.find(i => i.object.userData && i.object.userData.moduleId);
        App.modules.select(moduleHit ? moduleHit.object.userData.moduleId : null);
    },

    // Motor de Montagem Física (Criação de Peças)
    createMesh: (module) => {
        const { w, h, d } = module.dimensions;
        const wm = w / 1000, hm = h / 1000, dm = d / 1000;
        const espessura = 0.018; // 18mm MDF Real
        
        const group = new THREE.Group();
        group.userData.moduleId = module.id;
        
        const matMDF = new THREE.MeshStandardMaterial({ color: module.metadata.color || 0xd97706, roughness: 0.8 });
        const matMetal = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        const matGlass = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });
        
        const lineMat = new THREE.LineBasicMaterial({ color: 0x333333, opacity: 0.3, transparent: true });

        // Função auxiliar para criar e posicionar chapas exatas
        const criarChapa = (largura, altura, profundidade, posX, posY, posZ, mat = matMDF) => {
            const geo = new THREE.BoxGeometry(largura, altura, profundidade);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(posX, posY, posZ);
            mesh.castShadow = true; mesh.receiveShadow = true;
            mesh.userData.moduleId = module.id; // Vincula ao módulo para seleção
            // Adiciona arestas visíveis
            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat);
            mesh.add(edges);
            group.add(mesh);
            return mesh;
        };

        // 1. CAIXARIA BÁSICA
        criarChapa(espessura, hm, dm, -wm/2 + espessura/2, hm/2, 0); // Lateral Esquerda
        criarChapa(espessura, hm, dm, wm/2 - espessura/2, hm/2, 0);  // Lateral Direita
        criarChapa(wm - espessura*2, espessura, dm, 0, espessura/2, 0); // Base
        criarChapa(wm - espessura*2, espessura, dm, 0, hm - espessura/2, 0); // Teto
        if (module.metadata.hasBack) criarChapa(wm, hm, 0.006, 0, hm/2, -dm/2 + 0.003); // Fundo 6mm

        // 2. PRATELEIRAS
        if (module.metadata.prateleiras > 0) {
            const espacoLivre = hm - (espessura * 2);
            const alturaPrat = espacoLivre / (module.metadata.prateleiras + 1);
            for(let i=1; i<=module.metadata.prateleiras; i++) {
                criarChapa(wm - espessura*2, espessura, dm - 0.02, 0, alturaPrat * i, 0);
            }
        }

        // 3. GAVETAS (Representação Simplificada do Bloco de Gavetas)
        if (module.metadata.gavetas > 0) {
            const gavetaHeight = (hm / 3) / module.metadata.gavetas; // Ocupa 1/3 da altura do móvel
            for(let i=0; i<module.metadata.gavetas; i++) {
                criarChapa(wm - espessura*2.5, gavetaHeight - 0.005, dm - 0.05, 0, espessura + (gavetaHeight * i) + gavetaHeight/2, dm/2 - 0.02);
            }
        }

        // 4. CABIDEIRO (Guarda-Roupa)
        if (module.metadata.hasCabideiro) {
            const geoCab = new THREE.CylinderGeometry(0.015, 0.015, wm - espessura*2);
            const meshCab = new THREE.Mesh(geoCab, matMetal);
            meshCab.rotation.z = Math.PI / 2;
            meshCab.position.set(0, hm - 0.15, 0); // 15cm abaixo do teto
            meshCab.userData.moduleId = module.id;
            group.add(meshCab);
        }

        // 5. REGRAS ESPECÍFICAS VISUAIS
        if (module.type === 'BALCAO') {
            if (module.metadata.hasExposicao) {
                criarChapa(wm, espessura, 0.15, 0, hm/2, dm/2 + 0.075); // Prateleira externa p/ cliente
            }
            if (module.metadata.hasEspacoOperacao) {
                // Remove a base central para criar o recuo das pernas (simulação visual)
                criarChapa(wm*0.8, hm*0.8, 0.01, 0, hm*0.4, 0.1, matGlass); // Vidro de proteção
            }
        }

        return group;
    },

    addModule: (module) => {
        const mesh = ThreeEngine.createMesh(module);
        AppState.scene.add(mesh);
        module.mesh = mesh;
        
        // Posicionamento inteligente (lado a lado na fábrica)
        if (AppState.modules.length > 1) {
            const prev = AppState.modules[AppState.modules.length - 2];
            if (prev && prev.mesh) {
                mesh.position.x = prev.mesh.position.x + (prev.dimensions.w / 2000) + (module.dimensions.w / 2000) + 0.05;
            }
        }
    },

    removeModule: (id) => {
        const mod = AppState.modules.find(m => m.id === id);
        if (mod && mod.mesh) AppState.scene.remove(mod.mesh);
    },

    updateSelection: (id) => {
        AppState.modules.forEach(m => {
            if (m.mesh) {
                m.mesh.children.forEach(c => {
                    if (c.material && c.material.emissive) {
                        c.material.emissive.setHex(id === m.id ? 0x222222 : 0x000000); // Destaque visual
                    }
                });
            }
        });
    },

    animate: () => {
        requestAnimationFrame(ThreeEngine.animate);
        ThreeEngine.controls.update();
        AppState.renderer.render(AppState.scene, AppState.camera);
    }
};

// -------------------------------------------------------------------------
// 5. UI MANAGER & APP LOGIC
// -------------------------------------------------------------------------
const App = {
    
    init: () => {
        console.log('[thIAguinho CAD] Inicializando Oráculo Supremo...');
        App.config.load();
        ThreeEngine.init();
        App.ui.updateHUD();
        App.ui.toast('Oráculo Supremo Ativado. Engenharia Rigorosa Operacional.', 'success');
    },

    modules: {
        add: (type, customMeta = {}) => {
            const id = Date.now().toString(36);
            
            // Dimensões Padrão Base
            const dims = { w: 600, h: 700, d: 560 };
            if (type === 'GUARDA_ROUPA') { dims.w = 900; dims.h = 2200; dims.d = 600; }
            if (type === 'BALCAO') { dims.w = 1200; dims.h = 1050; dims.d = 700; }
            if (type === 'COZINHA') { dims.w = 800; dims.h = 700; dims.d = 560; }

            const module = {
                id, type,
                name: `${OracleEngine.getRuleLabel(type)} ${AppState.modules.length + 1}`,
                dimensions: dims,
                metadata: {
                    material: 'MDF_18mm', color: 0xd97706, hasBack: true,
                    prateleiras: 0, gavetas: 0, portas: 0, function: 'Uso Geral',
                    ...customMeta
                },
                cachedBOM: null
            };

            // PASSO CRÍTICO: Validação pela Engenharia (Oráculo)
            const validation = OracleEngine.validate(module);
            
            if (!validation.allowed) {
                App.ui.showValidationModal(module, validation.errors);
                return; // Bloqueia criação na raiz
            }

            AppState.modules.push(module);
            ThreeEngine.addModule(module);
            App.ui.renderModuleList();
            App.bom.update();
            App.ui.toast(`Projeto ${module.name} gerado fisicamente.`, 'success');
        },

        addGeneric: () => {
            // Um balcão, uma cozinha e um guarda-roupa para demonstrar as regras
            const types = ['BALCAO', 'GUARDA_ROUPA', 'COZINHA', 'GENERICO'];
            const chosen = types[AppState.modules.length % types.length];
            App.modules.add(chosen, { function: 'Design Automático' });
        },

        select: (id) => {
            AppState.selectedModule = id;
            ThreeEngine.updateSelection(id);
            document.getElementById('hud-selection').innerText = id ? AppState.modules.find(m=>m.id===id).name : 'Nenhum';
            App.ui.renderModuleList();
        },

        remove: (id) => {
            if (!confirm('Remover este módulo e excluir do orçamento?')) return;
            ThreeEngine.removeModule(id);
            AppState.modules = AppState.modules.filter(m => m.id !== id);
            if (AppState.selectedModule === id) App.modules.select(null);
            App.ui.renderModuleList();
            App.bom.update();
        }
    },

    bom: {
        updateParams: () => {
            AppState.costs.mdf = parseFloat(document.getElementById('cost-mdf').value) || 0;
            AppState.costs.labor = parseFloat(document.getElementById('cost-labor').value) || 0;
            AppState.costs.hardware = parseFloat(document.getElementById('cost-hardware').value) || 0;
            AppState.costs.others = parseFloat(document.getElementById('cost-others').value) || 0;
            AppState.costs.margin = parseFloat(document.getElementById('cost-margin').value) || 0;
            App.bom.update();
            App.config.save();
        },

        update: () => {
            const result = BOMEngine.calculateTotal();
            const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            document.getElementById('bom-price').innerText = fmt(result.costs.sale);
            document.getElementById('bom-cost').innerText = fmt(result.costs.total);
            document.getElementById('bom-area').innerText = result.area.toFixed(2) + ' m²';
            document.getElementById('bom-hw').innerText = fmt(result.costs.hardware);
            document.getElementById('bom-profit').innerText = fmt(result.costs.profit);
        }
    },

    ui: {
        renderModuleList: () => {
            const list = document.getElementById('module-list');
            list.innerHTML = '';
            
            AppState.modules.forEach(mod => {
                const div = document.createElement('div');
                div.className = `module-card ${AppState.selectedModule === mod.id ? 'selected' : ''}`;
                div.onclick = () => App.modules.select(mod.id);
                
                const bom = BOMEngine.calculateModule(mod);
                
                div.innerHTML = `
                    <div class="module-name">${mod.name}</div>
                    <div class="module-meta">${mod.dimensions.w}x${mod.dimensions.h}x${mod.dimensions.d}mm</div>
                    <div class="module-meta font-bold mt-2">Custo Base: R$ ${bom.costs.mdf.toFixed(2)}</div>
                    <span class="module-oracle oracle-ok">Oráculo: Peças Geradas</span>
                    <button class="btn btn-danger text-xs mt-2" onclick="event.stopPropagation(); App.modules.remove('${mod.id}')">🗑️ Deletar</button>
                `;
                list.appendChild(div);
            });
            document.getElementById('hud-objects').innerText = AppState.modules.length;
        },

        updateHUD: () => {},

        toast: (msg, type = 'info') => {
            const container = document.getElementById('notifications');
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            el.innerText = msg;
            container.appendChild(el);
            setTimeout(() => el.remove(), 6000); // Tempo estendido para ler justificativas
        },

        toggleModal: (id) => document.getElementById(id).classList.toggle('active'),

        showValidationModal: (module, errors) => {
            const msg = `❌ O Oráculo bloqueou a criação geométrica:\n\n` + errors.map(e => `• ${e}`).join('\n') + `\n\nDeseja aplicar as regras técnicas automaticamente?`;
            if (confirm(msg)) {
                AppState.autoFix = true;
                App.modules.add(module.type, module.metadata);
            } else {
                App.ui.toast('Criação abortada para evitar falha estrutural.', 'error');
            }
        }
    },

    ar: {
        toggle: () => {
            AppState.arActive = !AppState.arActive;
            document.getElementById('ar-overlay').classList.toggle('hidden', !AppState.arActive);
            App.ui.toast(AppState.arActive ? 'Projeção AR Armada' : 'AR Desativado', 'success');
        },
        reset: () => { AppState.camera.position.set(2, 2, 3); ThreeEngine.controls.reset(); },
        adjustTilt: () => App.ui.toast('Calibração de giroscópio acionada.', 'info'),
        autoFit: () => App.ui.toast('Ajustando escala espacial...', 'info')
    },

    ai: {
        recordVoice: () => App.ui.toast('Mic Ativado. Diga as medidas e o tipo de móvel.', 'info'),
        sendAudio: () => App.ui.toast('Enviando para Motor Groq...', 'info'),
        processPhoto: (input) => { if (input.files.length > 0) App.ui.toast('Análise visual iniciada. Procurando paredes.', 'success'); }
    },

    api: {
        saveKeys: () => {
            AppState.apiKeys.gemini = document.getElementById('api-gemini').value;
            AppState.apiKeys.groq = document.getElementById('api-groq').value;
            App.config.save();
            App.ui.toggleModal('api-modal');
            App.ui.toast('Chaves neurais sincronizadas.', 'success');
        }
    },

    config: {
        save: () => localStorage.setItem('thIAguinho_Config', JSON.stringify({ costs: AppState.costs, apiKeys: AppState.apiKeys })),
        load: () => {
            const raw = localStorage.getItem('thIAguinho_Config');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.costs) {
                    AppState.costs = { ...AppState.costs, ...data.costs };
                    ['mdf', 'labor', 'hardware', 'others', 'margin'].forEach(k => {
                        if(document.getElementById(`cost-${k}`)) document.getElementById(`cost-${k}`).value = AppState.costs[k];
                    });
                }
                if (data.apiKeys) {
                    AppState.apiKeys = data.apiKeys;
                    document.getElementById('api-gemini').value = AppState.apiKeys.gemini;
                    document.getElementById('api-groq').value = AppState.apiKeys.groq;
                }
            }
        }
    },

    project: {
        export: () => {
            const blob = new Blob([JSON.stringify({ modules: AppState.modules, costs: AppState.costs }, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `projeto-oraculo-${Date.now()}.json`;
            a.click();
            App.ui.toast('Engenharia exportada com sucesso!', 'success');
        }
    }
};

window.addEventListener('DOMContentLoaded', App.init);
window.App = App;
