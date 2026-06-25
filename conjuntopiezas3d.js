import * as THREE from 'three';

// ==========================================
// 1. CONFIGURACIÓN BASE Y ESTÉTICA DIÁFANA
// ==========================================

const container = document.getElementById('contenedor-conjunto-piezas-3d');

if (container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFEFBF2); 

    let aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 18; 

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
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // ==========================================
    // 2. SISTEMA DE COLORES SINCRONIZADOS
    // ==========================================

    const faceColors = [
        new THREE.Color(0xEDE9DD), // Crema
        new THREE.Color(0xA6DDE5), // Celeste
        new THREE.Color(0x8C2041), // Vino
        new THREE.Color(0xF5BEBF)  // Rosa
    ];

    const edgeColors = [
        new THREE.Color(0xD6D0CA),
        new THREE.Color(0x7E9EA5),
        new THREE.Color(0x5A3942),
        new THREE.Color(0xB88E8F)
    ];

    const materialCaras = new THREE.MeshBasicMaterial({ 
        color: faceColors[0], 
        polygonOffset: true, 
        polygonOffsetFactor: 1, 
        polygonOffsetUnits: 1 
    });
    const materialAristas = new THREE.LineBasicMaterial({ 
        color: edgeColors[0] 
    });

    // ==========================================
    // 3. CONSTRUCCIÓN DE LAS PIEZAS
    // ==========================================

    const ANCHO = 2.5;
    const PROFUNDIDAD = 2.5;
    const ALTURA = 7.5; 

    function crearPiezaNormal() {
        const geometry = new THREE.BoxGeometry(ANCHO, ALTURA, PROFUNDIDAD);
        const mesh = new THREE.Mesh(geometry, materialCaras);
        const edges = new THREE.EdgesGeometry(geometry);
        const lineSegments = new THREE.LineSegments(edges, materialAristas);
        mesh.add(lineSegments);
        return mesh;
    }

    const R_BASE = 1.6;  
    const R_TOP = 0.55;   
    const H_BASE = 5.8;  
    const H_TECHO = 1.7;
    const SEGMENTOS = 4;

    function crearAristasEspecial(geometry) {
        const edges = new THREE.EdgesGeometry(geometry);
        return new THREE.LineSegments(edges, materialAristas);
    }

    const grupoBaseEspecial = new THREE.Group();

    const geoBase = new THREE.CylinderGeometry(R_BASE, R_BASE, H_BASE, SEGMENTOS);
    const meshBase = new THREE.Mesh(geoBase, materialCaras);
    meshBase.add(crearAristasEspecial(geoBase));
    meshBase.position.y = H_BASE / 2;
    grupoBaseEspecial.add(meshBase);

    const geoTecho = new THREE.CylinderGeometry(R_TOP, R_BASE, H_TECHO, SEGMENTOS);
    const meshTecho = new THREE.Mesh(geoTecho, materialCaras);
    meshTecho.add(crearAristasEspecial(geoTecho));
    meshTecho.position.y = H_BASE + (H_TECHO / 2);
    grupoBaseEspecial.add(meshTecho);

    const geoCaraSup = new THREE.CylinderGeometry(R_TOP, R_TOP, 0.02, SEGMENTOS);
    const meshCaraSup = new THREE.Mesh(geoCaraSup, materialCaras);
    meshCaraSup.add(crearAristasEspecial(geoCaraSup));
    meshCaraSup.position.y = H_BASE + H_TECHO;
    grupoBaseEspecial.add(meshCaraSup);

    grupoBaseEspecial.position.y = -(H_BASE + H_TECHO) / 2;

    // Posicionamiento con grupos anidados para rotación Y individual + arrastre libre
    const separacion = 2.8; 

    const autoRotationNormal = new THREE.Group();
    autoRotationNormal.position.set(-separacion, 0, separacion);
    scene.add(autoRotationNormal);

    const autoRotationEspecial = new THREE.Group();
    autoRotationEspecial.position.set(separacion, 0, -separacion);
    scene.add(autoRotationEspecial);

    const grupoNormal = new THREE.Group();
    grupoNormal.add(crearPiezaNormal());
    autoRotationNormal.add(grupoNormal);

    const grupoEspecial = new THREE.Group();
    grupoEspecial.add(grupoBaseEspecial);
    autoRotationEspecial.add(grupoEspecial);

    const baseRotationX = 0;
    const baseRotationY = Math.PI / 4;
    const baseRotationZ = 0;

    grupoNormal.rotation.y = baseRotationY;
    grupoEspecial.rotation.y = baseRotationY;

    // ==========================================
    // 4. INTERACCIÓN (RAYCASTER INDEPENDIENTE)
    // ==========================================

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let draggedPiece = null; 
    let previousMousePosition = { x: 0, y: 0 };
    let returnTweenNormal = null;
    let returnTweenEspecial = null;

    function normalizeAngle(angle, target) {
        while (angle < target - Math.PI) angle += Math.PI * 2;
        while (angle > target + Math.PI) angle -= Math.PI * 2;
        return angle;
    }

    container.addEventListener('mousedown', (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([grupoNormal, grupoEspecial], true);
        
        if (intersects.length > 0) {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            let object = intersects[0].object;
            // Subimos por el parent hasta encontrar grupoNormal o grupoEspecial
            while (object.parent && object.parent !== autoRotationNormal && object.parent !== autoRotationEspecial) {
                object = object.parent;
            }
            draggedPiece = object;

            // Matamos los tweens del elemento seleccionado
            if (draggedPiece === grupoNormal && returnTweenNormal) {
                returnTweenNormal.kill();
                returnTweenNormal = null;
            } else if (draggedPiece === grupoEspecial && returnTweenEspecial) {
                returnTweenEspecial.kill();
                returnTweenEspecial = null;
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging && draggedPiece) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            draggedPiece.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaMove.y * 0.01);
            draggedPiece.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaMove.x * 0.01);
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    function handleMouseUp() {
        if (isDragging && draggedPiece) {
            const piece = draggedPiece;
            isDragging = false;
            draggedPiece = null;
            
            piece.rotation.x = normalizeAngle(piece.rotation.x, baseRotationX);
            piece.rotation.y = normalizeAngle(piece.rotation.y, baseRotationY);
            piece.rotation.z = normalizeAngle(piece.rotation.z, baseRotationZ);
            
            const tween = gsap.to(piece.rotation, {
                x: baseRotationX,
                y: baseRotationY,
                z: baseRotationZ,
                duration: 1.2,
                ease: "power2.out",
                onComplete: () => {
                    if (piece === grupoNormal) returnTweenNormal = null;
                    if (piece === grupoEspecial) returnTweenEspecial = null;
                }
            });
            
            if (piece === grupoNormal) returnTweenNormal = tween;
            if (piece === grupoEspecial) returnTweenEspecial = tween;
        }
    }

    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    // ==========================================
    // 5. ANIMACIÓN SINCRONIZADA (MAYOR VELOCIDAD)
    // ==========================================

    window.addEventListener('resize', () => {
        aspect = container.clientWidth / container.clientHeight;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    const clock = new THREE.Clock();

    // Aceleramos los tiempos del ciclo cromático
    const solidDuration = 2.0; // Duración en color sólido (antes 5.0)
    const blendDuration = 1.5; // Duración de la transición (antes 3.0)
    const phaseDuration = solidDuration + blendDuration; 

    let timeAccumulator = 0;
    let currentColorIndex = 0;
    let nextColorIndex = 1;

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        // Rotación Y automática individual en el grupo exterior
        if (!isDragging || draggedPiece !== grupoNormal) {
            autoRotationNormal.rotation.y += 0.005;
        }
        if (!isDragging || draggedPiece !== grupoEspecial) {
            autoRotationEspecial.rotation.y += 0.005;
        }

        // Actualizamos el tiempo global
        timeAccumulator += delta;

        if (timeAccumulator >= phaseDuration) {
            timeAccumulator -= phaseDuration;
            currentColorIndex = nextColorIndex;
            nextColorIndex = (nextColorIndex + 1) % faceColors.length;
        }

        let lerpFactor = 0;
        if (timeAccumulator > solidDuration) {
            let t = (timeAccumulator - solidDuration) / blendDuration;
            lerpFactor = t * t * (3 - 2 * t);
        }

        // Lerp simultáneo del material compartido
        materialCaras.color.lerpColors(faceColors[currentColorIndex], faceColors[nextColorIndex], lerpFactor);
        materialAristas.color.lerpColors(edgeColors[currentColorIndex], edgeColors[nextColorIndex], lerpFactor);

        renderer.render(scene, camera);
    }

    animate();
}