window.InterpreterEngine = {
    toggleRecording: async () => {
        if (!window.AppState.apiKeys.groq) { window.App.ui.toggleModal('modalSettings'); return window.App.ui.toast("Configure a chave Groq Whisper."); }
        const btn = document.getElementById('btnRecord');
        if (window.AppState.mediaRecorder && window.AppState.mediaRecorder.state !== "inactive") {
            window.AppState.mediaRecorder.stop(); btn.classList.remove('recording'); btn.innerHTML = "<i class='fas fa-microphone'></i> Gravar Voz";
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                window.AppState.mediaRecorder = new MediaRecorder(stream);
                window.AppState.mediaRecorder.ondataavailable = e => window.AppState.audioChunks.push(e.data);
                window.AppState.mediaRecorder.onstop = () => window.InterpreterEngine.processAudioBlob(new Blob(window.AppState.audioChunks, { type: 'audio/webm' }));
                window.AppState.audioChunks = []; window.AppState.mediaRecorder.start();
                btn.classList.add('recording'); btn.innerHTML = "<i class='fas fa-stop'></i> Escutando...";
            } catch(e) { window.App.ui.toast("Microfone negado."); }
        }
    },
    uploadAudio: (input) => { if(input.files[0]) window.InterpreterEngine.processAudioBlob(input.files[0]); },
    processAudioBlob: async (blob) => {
        window.App.ui.showLoader("Transcrevendo com Whisper...");
        const fd = new FormData(); fd.append("file", new File([blob], "audio.webm")); fd.append("model", "whisper-large-v3");
        try {
            const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { "Authorization": `Bearer ${window.AppState.apiKeys.groq}` }, body: fd });
            const data = await res.json();
            if (data.text) { window.AppState.transcricaoAtual = data.text; document.getElementById('transcriptionText').innerText = `"${data.text}"`; window.App.ui.toast("Transcrito."); }
        } catch(e) { window.App.ui.toast("Erro Whisper."); } finally { window.App.ui.hideLoader(); }
    },
    generateWithOracle: async () => {
        const txt = document.getElementById('textoAdicional').value.toLowerCase();
        window.App.ui.showLoader("Oráculo: Projetando...");
        
        setTimeout(async () => {
            let interceptado = false; let baseModules = []; let modsIntercept = [];
            // Interceptadores Gourmet / Varejo Estendido
            if (txt.includes('gourmet') || txt.includes('churrasqueira')) {
                baseModules = [
                    { tipo: "churrasqueira_tijolo", nome: "Churrasqueira Refratária", largura: 1200, altura: 2800, profundidade: 700, material: "tijolo_refratario" },
                    { tipo: "balcao_concreto", nome: "Bancada Apoio", largura: 2500, altura: 920, profundidade: 600, material: "concreto_aparente", portas: 4, layoutInterno: "apenas_portas", materiaisCustomizados: {frentes:{porta_0:'madeira_deck',porta_1:'madeira_deck',porta_2:'madeira_deck',porta_3:'madeira_deck'}} },
                    { tipo: "mesa_macica", nome: "Mesa Maciça Externa", largura: 2200, altura: 750, profundidade: 1000, material: "madeira_deck", tampoVidro: false },
                    { tipo: "pergolado_metalico", nome: "Pergolado Principal", largura: 3500, altura: 2600, profundidade: 2500, material: "metal_pergolado", tampoVidro: true },
                    { tipo: "deck_madeira", nome: "Deck de Base", largura: 4000, altura: 150, profundidade: 3000, material: "madeira_deck", ripadoFrontal: true },
                    { tipo: "jardim_vertical", nome: "Jardim Fundo", largura: 3000, altura: 2800, profundidade: 150, material: "folhagem" }
                ];
                modsIntercept = window.LayoutEngine.calculate(window.AppState.roomWidth, window.AppState.roomDepth, baseModules); interceptado = true;
            } else if (txt.includes('mercadão') || txt.includes('otica')) {
                baseModules = [
                    { tipo: "parede_otica", nome: "Expositor Esq", largura: 2000, altura: 2400, profundidade: 450, material: "mdf_branco_diamante", gavetas: 3 },
                    { tipo: "parede_otica", nome: "Expositor Dir", largura: 2000, altura: 2400, profundidade: 450, material: "mdf_branco_diamante", gavetas: 3 },
                    { tipo: "balcao_mercadao", nome: "Caixa", largura: 2000, altura: 1100, profundidade: 500, material: "mdf_vermelho_mercadao", portas: 4 },
                    { tipo: "mesa_atendimento_mercadao", nome: "Atendimento", largura: 1200, altura: 750, profundidade: 700, material: "mdf_azul_mercadao" }
                ];
                modsIntercept = window.LayoutEngine.calculate(window.AppState.roomWidth, window.AppState.roomDepth, baseModules); interceptado = true;
            }

            if (interceptado) {
                window.AppState.modules = []; modsIntercept.forEach(m => window.App.modules.add(m.tipo, m)); 
                window.App.ui.fecharHUDs(); window.App.ui.hideLoader(); window.App.storage.save();
                return window.App.ui.toast("Projeto Realista Gerado!");
            }

            const key = window.AppState.apiKeys.gemini;
            if(!key) { window.App.ui.hideLoader(); window.App.ui.toggleModal('modalSettings'); return window.App.ui.toast("Chave Gemini ausente!"); }
            if(!window.AppState.imagemFundoBase64 && !window.AppState.transcricaoAtual && !txt) { window.App.ui.hideLoader(); return window.App.ui.toast("Forneça foto ou texto."); }

            try {
                const prompt = `Gere a estrutura 3D. Use APENAS: 'churrasqueira_tijolo', 'balcao_concreto', 'mesa_macica', 'deck_madeira', 'pergolado_metalico', 'jardim_vertical', 'parede_otica', 'balcao_mercadao'. 
Materiais: 'tijolo_refratario', 'concreto_aparente', 'madeira_deck', 'metal_pergolado', 'folhagem', 'mdf_vermelho_mercadao', 'mdf_branco_diamante'.
TEXTO: "${window.AppState.transcricaoAtual} ${txt}"
Retorne JSON LIMPO: {"modulos": [{"tipo": "churrasqueira_tijolo", "nome": "Churrasqueira", "largura": 1200, "altura": 2800, "profundidade": 700, "material": "tijolo_refratario", "posX": 0, "posY": 0, "posZ": -1000, "rotY": 0}]}`;
                const parts = [{ text: prompt }]; if (window.AppState.imagemFundoBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: window.AppState.imagemFundoBase64 } });
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
                const data = await res.json(); if(data.error) throw new Error(data.error.message);
                const jsonStr = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim(); const json = JSON.parse(jsonStr);
                
                if (json.modulos) {
                    window.AppState.modules = []; const modsFisicos = window.LayoutEngine.calculate(window.AppState.roomWidth, window.AppState.roomDepth, json.modulos);
                    modsFisicos.forEach(m => window.App.modules.add(m.tipo, m));
                    window.App.ui.fecharHUDs(); window.App.ui.toast("IA Geometria Concluída!"); window.App.storage.save();
                }
            } catch(e) { window.App.ui.toast("Erro IA."); } finally { window.App.ui.hideLoader(); }
        }, 500);
    }
};
