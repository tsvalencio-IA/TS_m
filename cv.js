/**
 * Módulo de Visão Computacional (OpenCV.js)
 * Analisa a imagem para detectar as linhas do ambiente e estimar a perspectiva.
 */
window.CVEngine = {
    analisarAmbiente: async (imageElement) => {
        return new Promise((resolve, reject) => {
            if (typeof cv === 'undefined') {
                console.warn("OpenCV.js não carregado. Retornando dimensões padrão.");
                return resolve({ w: 5000, d: 5000, linhasPerspectiva: [] });
            }
            try {
                // 1. Carrega a imagem no OpenCV
                let mat = cv.imread(imageElement);
                let gray = new cv.Mat();
                let edges = new cv.Mat();
                let lines = new cv.Mat();
                
                // 2. Pré-processamento
                cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
                cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
                
                // 3. Detecção de Bordas (Canny)
                cv.Canny(gray, edges, 50, 150, 3);
                
                // 4. Transformada de Hough para encontrar retas principais (paredes/chão)
                cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);
                
                let detectedLines = [];
                for (let i = 0; i < lines.rows; ++i) {
                    let p = lines.data32S;
                    detectedLines.push({ x1: p[i*4], y1: p[i*4+1], x2: p[i*4+2], y2: p[i*4+3] });
                }

                // 5. Limpeza de memória do WASM
                mat.delete(); gray.delete(); edges.delete(); lines.delete();
                
                console.log("Linhas detectadas via OpenCV:", detectedLines.length);
                
                // Retorna as dimensões estimadas baseadas na proporção da imagem (Simplificação para Web)
                // Num ambiente real, cruzaríamos as linhas convergentes para achar o ponto de fuga.
                resolve({
                    w: imageElement.width * 5, // Escala estimada
                    d: imageElement.height * 5,
                    linhasPerspectiva: detectedLines
                });
            } catch (error) {
                console.error("Erro no CV Engine:", error);
                resolve({ w: 5000, d: 5000, linhasPerspectiva: [] });
            }
        });
    }
};