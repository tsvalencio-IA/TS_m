/**
 * Controlador Principal da Aplicação
 * Gerencia a Cena Three.js, Eventos de UI e Interações.
 */
window.App = {
    scene: null, camera: null, renderer: null, controls: null, dragControl: null,
    raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(),
    mode: 'orbit', draggedObject: null, dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    projetoAtual: [], cenaRoot: null,

    init: () => {
        const container = document.getElementById('canvas-container');
        window.App.scene = new THREE.Scene();
        window.App.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(5, 10, 5); dirLight.castShadow = true;
        window.App.scene.add(dirLight);

        window.App.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        window.App.camera.position.set(4, 4, 6);

        window.App.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('cad-canvas'), alpha: true, antialias: true });
        window.App.renderer.setSize(container.clientWidth, container.clientHeight);
        window.App.renderer.shadowMap.enabled = true;

        window.App.controls = new THREE.OrbitControls(window.App.camera, window.App.renderer.domElement);
        window.App.cenaRoot = new THREE.Group();
        window.App.scene.add(window.App.cenaRoot);

        // Grade de referência (Chão)
        const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
        window.App.scene.add(gridHelper);

        window.addEventListener('resize', window.App.onResize);
        
        // Eventos de Interação AR / Mouse
        const cv = window.App.renderer.domElement;
        cv.addEventListener('pointerdown', window.App.onPointerDown);
        cv.addEventListener('pointermove', window.App.onPointerMove);
        cv.addEventListener('pointerup', window.App.onPointerUp);

        // Imagem de Fundo (AR Viewer)
        document.getElementById('fotoAmbiente').addEventListener('change', window.App.carregarImagemFundo);

        window.App.animate();
        console.log("Sistema Iniciado com Sucesso.");
    },

    setMode: (mode) => {
        window.App.mode = mode;
        document.getElementById('btnOrbit').classList.toggle('active', mode === 'orbit');
        document.getElementById('btnMove').classList.toggle('active', mode === 'move');
        window.App.controls.enabled = (mode === 'orbit');
    },

    gerarViaTexto: () => {
        const txt = document.getElementById('textoProjeto').value;
        if (!txt) return alert("Descreva o ambiente primeiro!");
        
        window.App.projetoAtual = window.InterpreterEngine.interpretarTexto(txt);
        window.App.renderizarProjeto();
    },

    renderizarProjeto: () => {
        // Limpa a cena atual
        while(window.App.cenaRoot.children.length > 0){ 
            window.App.cenaRoot.remove(window.App.cenaRoot.children[0]); 
        }
        
        const moveis3D = window.ModulesEngine.gerarProjeto(window.App.projetoAtual);
        window.App.cenaRoot.add(moveis3D);
    },

    gerarProducao: () => {
        if (window.ModulesEngine.pecasCorte.length === 0) return alert("Gere um projeto primeiro!");
        const svgHtml = window.ModulesEngine.gerarPlanoCorteSVG();
        document.getElementById('cutPlanResult').innerHTML = svgHtml;
    },

    carregarImagemFundo: async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const url = URL.createObjectURL(file);
        document.getElementById('canvas-container').style.backgroundImage = `url(${url})`;
        document.getElementById('canvas-container').style.backgroundSize = 'cover';
        document.getElementById('canvas-container').style.backgroundPosition = 'center';

        // Aciona o OpenCV local para estimativa (Simulação no log por segurança de thread)
        const img = new Image(); img.src = url;
        img.onload = async () => {
            const limites = await window.CVEngine.analisarAmbiente(img);
            console.log("Limites detectados localmente:", limites);
        };
    },

    // --- INTERAÇÕES DO USUÁRIO (ARRASTAR E SOLTAR) ---
    onPointerDown: (e) => {
        if (window.App.mode !== 'move') return;
        window.App.atualizarMouse(e);
        window.App.raycaster.setFromCamera(window.App.mouse, window.App.camera);
        const intersects = window.App.raycaster.intersectObjects(window.App.cenaRoot.children, true);
        
        if (intersects.length > 0) {
            window.App.controls.enabled = false;
            let obj = intersects[0].object;
            while(obj.parent && obj.parent !== window.App.cenaRoot) obj = obj.parent;
            window.App.draggedObject = obj;
        }
    },

    onPointerMove: (e) => {
        if (!window.App.draggedObject || window.App.mode !== 'move') return;
        window.App.atualizarMouse(e);
        window.App.raycaster.setFromCamera(window.App.mouse, window.App.camera);
        
        const intersection = new THREE.Vector3();
        window.App.raycaster.ray.intersectPlane(window.App.dragPlane, intersection);
        if (intersection) {
            // Lógica de snapping simples: trava nas bordas do grid
            const snap = 0.5; // 500mm
            intersection.x = Math.round(intersection.x / snap) * snap;
            intersection.z = Math.round(intersection.z / snap) * snap;
            
            window.App.draggedObject.position.set(intersection.x, window.App.draggedObject.position.y, intersection.z);
        }
    },

    onPointerUp: () => {
        window.App.draggedObject = null;
        if (window.App.mode === 'orbit') window.App.controls.enabled = true;
    },

    atualizarMouse: (e) => {
        const rect = window.App.renderer.domElement.getBoundingClientRect();
        window.App.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        window.App.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    },

    onResize: () => {
        const container = document.getElementById('canvas-container');
        window.App.camera.aspect = container.clientWidth / container.clientHeight;
        window.App.camera.updateProjectionMatrix();
        window.App.renderer.setSize(container.clientWidth, container.clientHeight);
    },

    animate: () => {
        requestAnimationFrame(window.App.animate);
        window.App.controls.update();
        window.App.renderer.render(window.App.scene, window.App.camera);
    },

    ui: {
        exportProject: () => {
            if (window.App.projetoAtual.length === 0) return alert("Crie um projeto primeiro!");
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.App.projetoAtual, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", "projeto_producao.json");
            dl.click();
        }
    }
};

window.addEventListener('DOMContentLoaded', window.App.init);