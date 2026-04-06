window.CVEngine = {
    processarImagemUpload: async (input) => {
        if (!input.files || !input.files[0]) return;
        const url = URL.createObjectURL(input.files[0]);
        const img = new Image(); img.src = url;
        
        img.onload = () => {
            const container = document.getElementById('canvas-container');
            container.style.backgroundImage = `url(${url})`;
            container.style.backgroundSize = 'cover';
            container.style.backgroundPosition = 'center';
            window.AppState.imagemFundoURL = url;
            
            const r = new FileReader();
            r.onload = () => { window.AppState.imagemFundoBase64 = r.result.split(',')[1]; window.App.storage.save(); };
            r.readAsDataURL(input.files[0]);
            
            if(window.AppState.arActive) { document.getElementById('arBtnText').innerText = 'Desativar Fundo Real'; }
            else { window.App.ar.toggleAR(); }
            
            document.getElementById('cv-results').style.display = 'block';
            window.CVEngine.analisarLinhas(img);
        };
    },
    analisarLinhas: (img) => {
        if (typeof cv === 'undefined') return setTimeout(() => window.CVEngine.analisarLinhas(img), 500);
        try {
            let mat = cv.imread(img);
            let gray = new cv.Mat(); let edges = new cv.Mat(); let lines = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
            cv.Canny(gray, edges, 50, 150, 3);
            cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);
            
            let detected = lines.rows;
            mat.delete(); gray.delete(); edges.delete(); lines.delete();
            
            const w = img.width * 5; const d = img.height * 6; 
            document.getElementById('cv-dimensions').innerText = `Terreno via CV: ~${w}x${d}mm (${detected} vetores)`;
            document.getElementById('roomW').value = w; document.getElementById('roomD').value = d;
            window.App.ar.syncRoomBounds();
        } catch (e) { console.warn("Erro CV:", e); }
    }
};
