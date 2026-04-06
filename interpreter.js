/**
 * Módulo de Processamento de Linguagem Natural Local
 * Extrai intenções e medidas do texto para gerar o JSON do projeto.
 */
window.InterpreterEngine = {
    interpretarTexto: (texto) => {
        const modulosGerados = [];
        const regexDimensoes = /(\d+)\s*(?:x|por|by)\s*(\d+)(?:\s*(?:x|por|by)\s*(\d+))?/gi;
        const textoMin = texto.toLowerCase();

        // Dicionário de mapeamento local
        const regras = [
            { chaves: ['balcão', 'balcao', 'caixa'], tipo: 'balcaoBase' },
            { chaves: ['curvo', 'redondo'], tipo: 'moduloCantoCurvo' },
            { chaves: ['aéreo', 'aereo', 'armário', 'armario'], tipo: 'moduloAereo' },
            { chaves: ['prateleira', 'nicho'], tipo: 'prateleiraInclinada' },
            { chaves: ['mesa', 'atendimento'], tipo: 'criarMesaReal' }
        ];

        // 1. Identificar módulos solicitados
        let tipoEncontrado = 'balcaoBase'; // default
        for (const regra of regras) {
            if (regra.chaves.some(chave => textoMin.includes(chave))) {
                tipoEncontrado = regra.tipo;
                break;
            }
        }

        // 2. Extrair medidas (Largura x Altura x Profundidade)
        let medidas = { w: 1000, h: 900, d: 500 }; // Medidas padrão (mm)
        let match;
        if ((match = regexDimensoes.exec(texto)) !== null) {
            medidas.w = parseInt(match[1]);
            medidas.h = parseInt(match[2]);
            if (match[3]) medidas.d = parseInt(match[3]);
        }

        // 3. Montar Objeto Estruturado
        modulosGerados.push({
            id: 'mod_' + Date.now(),
            tipo: tipoEncontrado,
            largura: medidas.w,
            altura: medidas.h,
            profundidade: medidas.d,
            material: textoMin.includes('branco') ? 'branco' : 'amadeirado',
            posX: 0, posY: 0, posZ: 0
        });

        return modulosGerados;
    }
};