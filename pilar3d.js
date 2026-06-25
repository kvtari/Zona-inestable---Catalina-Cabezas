import * as THREE from 'three';

// 1. OBTENEMOS EL CONTENEDOR DEL PILAR
const container = document.getElementById('contenedor-pilar-3d');

if (container) {
    const scene = new THREE.Scene();
    const COLORS = {
        cafecito: 0xD4A257, // Color cafecito de las cañas
        vino: 0xD6D0CA,
        fondo: 0xFEFBF2
    };
    scene.background = new THREE.Color(COLORS.fondo);

    let width = container.clientWidth;
    let height = container.clientHeight;
    let aspect = width / height;
    
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false; 
    
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
    const pilarMesh = createVectorMesh(pilarGeometry, COLORS.cafecito);

    // Grupos aninados: autoRotationGroup (gira solo) > interactionGroup (arrastre)
    const autoRotationGroup = new THREE.Group();
    scene.add(autoRotationGroup);

    const interactionGroup = new THREE.Group();
    interactionGroup.add(pilarMesh);
    autoRotationGroup.add(interactionGroup);

    const baseRotationX = -Math.PI / 8;
    const baseRotationY = Math.PI / 6;
    const baseRotationZ = 0;

    interactionGroup.rotation.x = baseRotationX;
    interactionGroup.rotation.y = baseRotationY;
    interactionGroup.rotation.z = baseRotationZ;

    interactionGroup.scale.set(0.9, 0.9, 0.9);

    // ==========================================
    // INTERACCIÓN ADAPTADA Y RETORNO GSAP
    // ==========================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let returnTween = null;

    function normalizeAngle(angle, target) {
        while (angle < target - Math.PI) angle += Math.PI * 2;
        while (angle > target + Math.PI) angle -= Math.PI * 2;
        return angle;
    }

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        if (returnTween) {
            returnTween.kill();
            returnTween = null;
        }
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

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            
            // Normalizar ángulos actuales para evitar rotaciones excesivas al volver
            interactionGroup.rotation.x = normalizeAngle(interactionGroup.rotation.x, baseRotationX);
            interactionGroup.rotation.y = normalizeAngle(interactionGroup.rotation.y, baseRotationY);
            interactionGroup.rotation.z = normalizeAngle(interactionGroup.rotation.z, baseRotationZ);

            returnTween = gsap.to(interactionGroup.rotation, {
                x: baseRotationX,
                y: baseRotationY,
                z: baseRotationZ,
                duration: 1.2,
                ease: "power2.out",
                onComplete: () => {
                    returnTween = null;
                }
            });
        }
    });

    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        aspect = width / height;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    function animate() {
        requestAnimationFrame(animate);
        if (!isDragging) {
            autoRotationGroup.rotation.y += 0.005; // Rotación automática suave
        }
        renderer.render(scene, camera);
    }
    animate();
}