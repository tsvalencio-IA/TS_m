window.App = {
    storage: {
        save: () => {
            const data = { modules: window.AppState.modules, roomW: window.AppState.roomWidth, roomD: window.AppState.roomDepth, bgImage: window.AppState.imagemFundoURL };
            try { localStorage.setItem('cad_pro_save', JSON.stringify(data)); } catch(e) { data.bgImage = null; localStorage.setItem('cad_pro_save', JSON.stringify(data)); }
        },
        load: () => {
            const saved = localStorage.getItem('cad_pro_save');
            if (saved) {
                const data = JSON.parse(saved); if (data.modules) window.AppState.modules = data.modules;
                if (data.roomW) { window.AppState.roomWidth = data.roomW; document.getElementById('roomW').value = data.roomW; }
                if (data.roomD) { window.AppState.roomDepth = data.roomD; document.getElementById('roomD').value = data.roomD; }
                if (data.bgImage) { window.AppState.imagemFundoURL = data.bgImage; window.AppState.imagemFundoBase64 = data.bgImage.split(',')[1]; const im = document.getElementById('imagePreview'); if(im) { im.src = data.bgImage; document.getElementById('imgPreviewContainer').style.display = 'block'; } }
            }
        }
    },
    
    init: () => { 
        window.App.config.load(); window.ThreeEngine.init(); window.App.storage.load();
        if(window.AppState.modules.length === 0) { window.App.modules.add('churrasqueira_tijolo', { nome: "Churrasqueira Master", largura: 1200, altura: 2800, profundidade: 700, portas: 0, gavetas: 0, material: 'tijolo_refratario', posY: 0 }); } 
        else { window.ThreeEngine.rebuildScene(); window.App.ui.renderList(); }
        window.App.ui.toast("Motor Gráfico ACES Iniciado.", "success"); 
    },
    
    processGlobalPhoto: (input) => { 
        if (input.files && input.files[0]) { window.CVEngine.processarImagemUpload(input); } 
    },

    ui: {
        toggleModal: (id) => { const m = document.getElementById(id); if(m) m.style.display = (m.style.display === 'flex') ? 'none' : 'flex'; },
        abrirHUD: (id) => { document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); },
        fecharHUDs: () => { document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active')); },
        fecharEditor: () => { document.getElementById('floatingEditor').classList.remove('active'); window.App.modules.select(null); },
        toast: (msg, type = 'info') => { const t = document.getElementById('toast'); document.getElementById('toastMessage').innerText = msg; t.className = `show ${type}`; setTimeout(() => t.className = '', 3500); },
        showLoader: (msg) => { document.getElementById('statusText').innerText = msg; document.getElementById('statusOverlay').style.display = 'flex'; }, 
        hideLoader: () => { document.getElementById('statusOverlay').style.display = 'none'; },
        renderList: () => { const c = document.getElementById('listaModulosContainer'); if (!c) return; c.innerHTML = ''; window.AppState.modules.forEach(m => { const d = document.createElement('div'); d.className = `module-card ${window.AppState.selectedModule===m.id?'selected':''}`; d.onclick = () => { window.App.modules.select(m.id); window.App.ui.fecharHUDs(); window.App.ui.openLiveEditor(m.id); }; d.innerHTML = `<h4>${m.nome}</h4><p>${m.largura}x${m.altura}x${m.profundidade}mm - Mat: ${window.MatDefs[m.material]?.label||'Padrão'}</p>`; c.appendChild(d); }); },
        openLiveEditor: (id) => {
            const m = window.AppState.modules.find(x => x.id === id); if (!m) return; 
            const elId = document.getElementById('eId'); if (elId) elId.value = m.id;
            const props = ['tipo','formato','layoutInterno','dobradicaLado','material','abertura','largura','altura','profundidade','retornoL','portas','gavetas','prateleiras','prateleirasExternas','compW','compH','posX','posY','posZ','rotY'];
            const keys = ['eT','eFormato','eLayoutInt','eDobradica','eMat','eA','eL','eAl','eP','eRetL','ePo','eG','ePr','ePratExt','eCompW','eCompH','ePx','ePy','ePz','eRy'];
            keys.forEach((k, i) => { const el = document.getElementById(k); if (el) el.value = m[props[i]] !== undefined ? m[props[i]] : (['eT','eFormato','eLayoutInt','eDobradica','eMat','eA'].includes(k) ? '' : 0); });
            const chkR = document.getElementById('eRipado'); if (chkR) chkR.checked = m.ripadoFrontal; const chkV = document.getElementById('eVidro'); if (chkV) chkV.checked = m.tampoVidro; const chkInternas = document.getElementById('eFrentesInternas'); if (chkInternas) chkInternas.checked = m.frentesInternas;
            
            const custContainer = document.getElementById('customFrentesContainer');
            if (custContainer) {
                custContainer.innerHTML = ''; let html = '';
                const addF = (key, label) => { const w = m.medidasCustomizadas?.[key]?.w || ''; const h = m.medidasCustomizadas?.[key]?.h || ''; const mat = m.materiaisCustomizados?.frentes?.[key] || ''; let opts = `<option value="">-- Padrão --</option>`; Object.keys(window.MatDefs).forEach(k => { opts += `<option value="${k}" ${mat===k?'selected':''}>${window.MatDefs[k].label}</option>`; }); html += `<div style="margin-bottom:10px; padding:10px; background:#fff; border:1px solid #ccc; border-radius:4px;"><div style="font-size:0.8rem; margin-bottom:8px; font-weight:800;">${label}</div><div style="display:flex; gap:10px; margin-bottom:8px;"><input type="number" id="cW_${key}" placeholder="L(mm)" value="${w}" style="flex:1;" onchange="window.App.ui.syncCustom('${key}')"><input type="number" id="cH_${key}" placeholder="A(mm)" value="${h}" style="flex:1;" onchange="window.App.ui.syncCustom('${key}')"></div><select id="cM_${key}" style="width:100%;" onchange="window.App.ui.syncCustom('${key}')">${opts}</select></div>`; };
                for (let i = 0; i < m.gavetas; i++) addF(`gaveta_${i}`, `Gaveta ${i+1}`); for (let i = 0; i < m.portas; i++) addF(`porta_${i}`, `Porta ${i+1}`); if (m.layoutInterno === 'ilha_dupla') { for (let i = 0; i < m.portas; i++) addF(`porta_tras_${i}`, `Porta Traseira ${i+1}`); }
                html += `<div style="font-weight:900; font-size:0.85rem; margin:15px 0 10px 0; padding-top:15px;">CORES CAIXARIA</div>`;
                ['teto', 'base', 'lateralEsq', 'lateralDir', 'fundo'].forEach(p => { const pMat = m.materiaisCustomizados?.estrutura?.[p] || ''; let opts = `<option value="">-- Padrão --</option>`; Object.keys(window.MatDefs).forEach(k => opts += `<option value="${k}" ${pMat===k?'selected':''}>${window.MatDefs[k].label}</option>`); html += `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="font-size:0.8rem; font-weight:700;">${p}</span><select id="cE_${p}" style="width:160px;" onchange="window.App.ui.syncCustomStruct('${p}')">${opts}</select></div>`; }); 
                custContainer.innerHTML = html;
            } document.getElementById('floatingEditor').classList.add('active');
        },
        syncCustom: (key) => { const eId = document.getElementById('eId'); if (!eId) return; const m = window.AppState.modules.find(x => x.id === eId.value); if (!m) return; if (!m.medidasCustomizadas) m.medidasCustomizadas = {}; if (!m.materiaisCustomizados) m.materiaisCustomizados = { frentes:{}, estrutura:{} }; const w = parseFloat(document.getElementById(`cW_${key}`).value)||0; const h = parseFloat(document.getElementById(`cH_${key}`).value)||0; const mat = document.getElementById(`cM_${key}`).value; if (w > 0 || h > 0) m.medidasCustomizadas[key] = { w, h }; else delete m.medidasCustomizadas[key]; if (mat) m.materiaisCustomizados.frentes[key] = mat; else delete m.materiaisCustomizados.frentes[key]; window.App.modules.refreshAll(); window.App.storage.save(); },
        syncCustomStruct: (p) => { const eId = document.getElementById('eId'); if (!eId) return; const m = window.AppState.modules.find(x => x.id === eId.value); if (!m) return; if (!m.materiaisCustomizados) m.materiaisCustomizados = { frentes:{}, estrutura:{} }; const mat = document.getElementById(`cE_${p}`).value; if (mat) m.materiaisCustomizados.estrutura[p] = mat; else delete m.materiaisCustomizados.estrutura[p]; window.App.modules.refreshAll(); window.App.storage.save(); },
        syncToState: () => {
            const eId = document.getElementById('eId'); if (!eId) return; const m = window.AppState.modules.find(x => x.id === eId.value); if (!m) return;
            const props = ['tipo','formato','layoutInterno','dobradicaLado','material','abertura','largura','altura','profundidade','retornoL','portas','gavetas','prateleiras','prateleirasExternas','compW','compH','posX','posY','posZ','rotY'];
            const keys = ['eT','eFormato','eLayoutInt','eDobradica','eMat','eA','eL','eAl','eP','eRetL','ePo','eG','ePr','ePratExt','eCompW','eCompH','ePx','ePy','ePz','eRy'];
            keys.forEach((k, i) => { const el = document.getElementById(k); if (el) m[props[i]] = ['eT','eFormato','eLayoutInt','eDobradica','eMat','eA'].includes(k) ? el.value : parseFloat(el.value)||0; });
            m.ripadoFrontal = document.getElementById('eRipado')?.checked; m.tampoVidro = document.getElementById('eVidro')?.checked; m.frentesInternas = document.getElementById('eFrentesInternas')?.checked;
            window.OracleEngine.validateAndFix(m); window.App.modules.refreshAll(); window.App.ui.openLiveEditor(m.id); window.App.storage.save();
        },
        syncToStateNoRebuild: () => { const eId = document.getElementById('eId'); if (!eId) return; const m = window.AppState.modules.find(x => x.id === eId.value); if (!m) return; if(document.getElementById('ePx')) document.getElementById('ePx').value = m.posX; if(document.getElementById('ePz')) document.getElementById('ePz').value = m.posZ; if(document.getElementById('eRy')) document.getElementById('eRy').value = m.rotY; window.App.storage.save(); }
    },
    api: { saveKeys: () => { window.AppState.apiKeys.gemini = document.getElementById('api-gemini').value.trim(); window.AppState.apiKeys.groq = document.getElementById('api-groq').value.trim(); window.App.config.save(); window.App.ui.toggleModal('modalSettings'); window.App.ui.toast("Salvo com sucesso!"); } },
    modules: {
        add: (tipo, o = {}) => { const id = Date.now().toString(); const mod = { id, tipo, nome: window.OracleEngine.rules[tipo]?.label || "Móvel", largura: 1000, altura: 800, profundidade: 500, material: 'amadeirado_padrao', abertura: 'giro', formato: 'reto', portas: 2, gavetas: 0, prateleiras: 1, prateleirasExternas: 0, layoutInterno: 'apenas_portas', dobradicaLado: 'esq', ripadoFrontal: false, tampoVidro: false, compW: 0, compH: 0, compStates: {}, frentesInternas: false, materiaisCustomizados: { frentes: {}, estrutura: {} }, medidasCustomizadas: {}, posX: 0, posY: 0, posZ: 0, rotY: 0, removedParts: [], ...o }; window.OracleEngine.validateAndFix(mod); window.AppState.modules.push(mod); window.App.modules.select(id); window.App.modules.refreshAll(); window.App.storage.save(); },
        addGeneric: () => { window.App.ui.fecharHUDs(); window.App.modules.add('balcao_concreto'); },
        select: (id) => { window.AppState.selectedModule = id; window.ThreeEngine.highlightSelection(id); window.App.ui.renderList(); if (id && document.getElementById('floatingEditor').classList.contains('active')) { window.App.ui.openLiveEditor(id); } },
        removeCurrent: () => { let id = window.AppState.selectedModule || document.getElementById('eId')?.value; if (!id) return; window.AppState.modules = window.AppState.modules.filter(m => m.id !== id); window.App.modules.select(null); window.App.ui.fecharEditor(); window.App.modules.refreshAll(); window.App.ui.toast("Removido!"); window.App.storage.save(); },
        refreshAll: () => { window.ThreeEngine.rebuildScene(); window.BOMEngine.update(); window.App.ui.renderList(); },
        exportarProjeto: () => { const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.AppState.modules, null, 2)); a.download = "projeto.json"; a.click(); },
        gerarPlanoCorte: () => { window.CutPlanEngine.generate(); window.App.ui.toast("Plano Gerado!"); }
    },
    ar: {
        setModoCamera: (m) => { window.AppState.tool = m; document.getElementById('btnOrbit').className = `tool-btn ${m==='orbit'?'active':''}`; document.getElementById('btnMove').className = `tool-btn ${m==='move'?'active':''}`; document.getElementById('btnAddComp').className = `tool-btn ${m==='add_comp'?'active':''}`; document.getElementById('btnRemComp').className = `tool-btn eraser ${m==='remove_part'?'active':''}`; },
        setModoInteracao: (m) => { window.AppState.modoInteracao = m; document.getElementById('sw-peca').className = `switch-btn ${m==='peca'?'active':''}`; document.getElementById('sw-projeto').className = `switch-btn ${m==='projeto'?'active':''}`; },
        syncRoomBounds: () => { window.AppState.roomWidth = parseFloat(document.getElementById('roomW').value)||5000; window.AppState.roomDepth = parseFloat(document.getElementById('roomD').value)||6000; window.ThreeEngine.rebuildScene(); window.App.storage.save(); },
        toggleAR: () => { window.AppState.arActive = !window.AppState.arActive; const c = document.getElementById('canvas-container'); const txt = document.getElementById('arBtnText'); if (window.AppState.arActive) { if(window.AppState.imagemFundoURL) { c.style.backgroundImage = `url(${window.AppState.imagemFundoURL})`; c.style.backgroundSize = 'cover'; c.style.backgroundPosition = 'center'; if (txt) txt.innerText = 'Desativar Fundo'; window.ThreeEngine.rebuildScene(); } else { document.getElementById('fotoFundoAR').click(); } } else { c.style.background = 'radial-gradient(circle, #e0e0e0 0%, #9e9e9e 100%)'; c.style.backgroundImage = 'none'; if (txt) txt.innerText = 'Ativar Fundo Real'; window.ThreeEngine.rebuildScene(); } },
        applyTransform: () => { const s = parseFloat(document.getElementById('camScale').value); window.ThreeEngine.rootNode.scale.set(s,s,s); window.ThreeEngine.rootNode.rotation.x = parseFloat(document.getElementById('camRotX').value); window.ThreeEngine.rootNode.rotation.y = parseFloat(document.getElementById('camRotY').value); window.ThreeEngine.rootNode.position.y = parseFloat(document.getElementById('camPosY').value); },
        resetAR: () => { window.ThreeEngine.rootNode.rotation.set(0,0,0); window.ThreeEngine.rootNode.position.set(0,0,0); window.ThreeEngine.rootNode.scale.set(1,1,1); document.getElementById('camScale').value = 1; document.getElementById('camRotX').value = 0; document.getElementById('camRotY').value = 0; document.getElementById('camPosY').value = 0; },
        enterPrintMode: () => { window.App.ui.fecharHUDs(); window.App.ui.fecharEditor(); ['mainHeader','mainSignature','mainControls','toolModeContainer'].forEach(id => document.getElementById(id).classList.add('hide-for-print')); document.getElementById('btnExitPrint').style.display='block'; window.ThreeEngine.controls.enableRotate=false; window.ThreeEngine.controls.enablePan=false; window.ThreeEngine.controls.enableZoom=false; },
        exitPrintMode: () => { ['mainHeader','mainSignature','mainControls','toolModeContainer'].forEach(id => document.getElementById(id).classList.remove('hide-for-print')); document.getElementById('btnExitPrint').style.display='none'; window.ThreeEngine.controls.enableRotate=true; window.ThreeEngine.controls.enablePan=true; window.ThreeEngine.controls.enableZoom=true; }
    }
};

window.App.config = { save: () => { localStorage.setItem('ak_gemini_cad', window.AppState.apiKeys.gemini); localStorage.setItem('ak_groq_cad', window.AppState.apiKeys.groq); }, load: () => { const eG = document.getElementById('api-gemini'); if (eG) eG.value = window.AppState.apiKeys.gemini; const eQ = document.getElementById('api-groq'); if (eQ) eQ.value = window.AppState.apiKeys.groq; } };
window.addEventListener('DOMContentLoaded', window.App.init);
