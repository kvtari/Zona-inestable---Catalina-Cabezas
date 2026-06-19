import * as THREE from 'three';

// 1. OBTENEMOS EL CONTENEDOR DEL PILAR
const container = document.getElementById('contenedor-pilar-3d');

if (container) {
    const scene = new THREE.Scene();
    const COLORS = {
        crema: 0xE9E6D5,
        vino: 0xD6D0CA,
        fondo: 0xFEFBF2
    };
    scene.background = new THREE.Color(COLORS.fondo);

    // En lugar de window.innerWidth, usamos el tamaño del cuadrito
    let width = container.clientWidth;
    let height = container.clientHeight;
    let aspect = width / height;
    
    // Frustum ajustado para encuadrar la pieza en el recuadro pequeño
    const frustumSize = 25; 

    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, 
        frustumSize * aspect / 2, 
        frustumSize / 2, 
        frustumSize / -2, 
        -100, 1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = false; 
    
    // Metemos el canvas dentro del div nuevo, NO en el body
    container.appendChild(renderer.domElement);

    function createVectorMesh(geometry, colorHex) {
        const material = new THREE.MeshBasicMaterial({ 
            color: colorHex,
            polygonOffset: true,
            polygonOffsetFactor: 1, 
            polygonOffsetUnits: 1
        });
        
        const mesh = new THREE.Mesh(geometry, material);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges, 
            new THREE.LineBasicMaterial({ color: COLORS.vino, linewidth: 2 }) 
        );
        mesh.add(line);

        return mesh;
    }

    const widthPilar = 3;
    const heightPilar = 18;
    const depthPilar = 3;

    const pilarGeometry = new THREE.BoxGeometry(widthPilar, heightPilar, depthPilar);
    const pilarMesh = createVectorMesh(pilarGeometry, COLORS.crema);

    const interactionGroup = new THREE.Group();
    interactionGroup.add(pilarMesh);
    scene.add(interactionGroup);

    interactionGroup.rotation.x = -Math.PI / 8;
    interactionGroup.rotation.y = Math.PI / 6;

    // Puedes cambiar este valor (1.2) si quieres que el pilar se vea más grande o más chico
    interactionGroup.scale.set(0.9, 0.9, 0.9);

    // ==========================================
    // INTERACCIÓN ADAPTADA AL CONTENEDOR CHICO
    // ==========================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            interactionGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaMove.y * 0.01);
            interactionGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaMove.x * 0.01);
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => isDragging = false);

    // Si ajustan el tamaño de la ventana, el cuadrito se recalcula
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        aspect = width / height;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}