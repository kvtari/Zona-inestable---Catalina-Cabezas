import * as THREE from 'three';

const container = document.getElementById('contenedor-canas-3d');
if (container) {
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFEFBF2); // Crema background
    
    let aspect = width / height;
    const frustumSize = 25;
    
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        -100, 1000
    );
    camera.position.set(20, 20, 20); // Isometric view
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    
    // Aesthetic Material setup
    const COLORS = {
        crema: 0xEDE9DD,
        vino: 0xD6D0CA,  // Outlines
        dorado: 0xD4A257, // Rod shaft yellow/gold
        grisMetal: 0xC0C0C0, // Grey joints
        blanco: 0xFFFFFF,
        negro: 0x2A2A2A
    };
    
    function createVectorMesh(geometry, fillHex, borderHex) {
        const material = new THREE.MeshBasicMaterial({
            color: fillHex,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });
        const mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.EdgesGeometry(geometry);
        const lines = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: borderHex, linewidth: 2 })
        );
        mesh.add(lines);
        return mesh;
    }
    
    // Grupos para la Caña 1 (Esfera blanca, arriba)
    const autoRotationRod1 = new THREE.Group();
    autoRotationRod1.position.set(-1, 5.5, 0); // Posición Y subida de 3.5 a 5.5
    scene.add(autoRotationRod1);

    const interactionRod1 = new THREE.Group();
    autoRotationRod1.add(interactionRod1);

    // Grupos para la Caña 2 (Esfera negra, abajo)
    const autoRotationRod2 = new THREE.Group();
    autoRotationRod2.position.set(-1, -1.5, 0); // Posición Y subida de -3.5 a -1.5
    scene.add(autoRotationRod2);

    const interactionRod2 = new THREE.Group();
    autoRotationRod2.add(interactionRod2);
    
    // Helper function to build a rod
    function buildRod(isWhiteSphere) {
        const rod = {};
        rod.group = new THREE.Group();
        rod.extended = false;
        
        // Base / Handle (stays static inside the rod group)
        const baseGeom = new THREE.BoxGeometry(6, 0.6, 0.6);
        const baseMesh = createVectorMesh(baseGeom, COLORS.dorado, COLORS.vino);
        baseMesh.position.x = -4; // centered relative to origin
        rod.group.add(baseMesh);
        
        // Joint 1 (grey sleeve on the end of the base)
        const joint1Geom = new THREE.BoxGeometry(0.8, 0.7, 0.7);
        const joint1 = createVectorMesh(joint1Geom, COLORS.grisMetal, COLORS.vino);
        joint1.position.x = -1.4;
        rod.group.add(joint1);
        
        // Middle Group (slides out of base)
        rod.middleGroup = new THREE.Group();
        rod.middleGroup.position.x = -6.5; // retracted initially
        rod.group.add(rod.middleGroup);
        
        const middleGeom = new THREE.BoxGeometry(5.5, 0.45, 0.45);
        const middleMesh = createVectorMesh(middleGeom, COLORS.dorado, COLORS.vino);
        middleMesh.position.x = 2.75;
        rod.middleGroup.add(middleMesh);
        
        // Joint 2 (grey sleeve on middle segment)
        const joint2Geom = new THREE.BoxGeometry(0.6, 0.55, 0.55);
        const joint2 = createVectorMesh(joint2Geom, COLORS.grisMetal, COLORS.vino);
        joint2.position.x = 5.1;
        rod.middleGroup.add(joint2);
        
        // Inner Group (slides out of middle segment)
        rod.innerGroup = new THREE.Group();
        rod.innerGroup.position.x = 0.2; // retracted initially
        rod.middleGroup.add(rod.innerGroup);
        
        const innerGeom = new THREE.BoxGeometry(5.2, 0.3, 0.3);
        const innerMesh = createVectorMesh(innerGeom, COLORS.dorado, COLORS.vino);
        innerMesh.position.x = 2.6;
        rod.innerGroup.add(innerMesh);
        
        // End Cap
        const capGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const capMesh = createVectorMesh(capGeom, COLORS.grisMetal, COLORS.vino);
        capMesh.position.x = 5.0;
        rod.innerGroup.add(capMesh);
        
        // Thread (vertical line hanging from cap)
        const threadGeom = new THREE.BoxGeometry(0.06, 4.5, 0.06);
        const thread = createVectorMesh(threadGeom, COLORS.vino, COLORS.vino); // subtle outline, grey fill
        thread.position.set(5.0, -2.25, 0); // hangs down
        rod.innerGroup.add(thread);
        
        // Weight sphere hanging at the end
        const sphereGeom = new THREE.SphereGeometry(0.7, 16, 16);
        const sphereColor = isWhiteSphere ? COLORS.blanco : 0x1A1A1A;
        const sphereBorder = isWhiteSphere ? COLORS.vino : 0x1A1A1A;
        const sphere = createVectorMesh(sphereGeom, sphereColor, sphereBorder);
        sphere.position.set(5.0, -4.5 - 0.7, 0); // hangs from the bottom of the thread
        rod.innerGroup.add(sphere);
        
        return rod;
    }
    
    // Create the two rods
    const rod1 = buildRod(true);  // White sphere
    const rod2 = buildRod(false); // Black sphere
    
    // Position rods in scene (centered in their parent groups)
    rod1.group.position.set(0, 0, 0);
    rod2.group.position.set(0, 0, 0);
    
    // Rotate them slightly for better isometric depth rendering
    rod1.group.rotation.y = -Math.PI / 12;
    rod2.group.rotation.y = -Math.PI / 12;
    
    interactionRod1.add(rod1.group);
    interactionRod2.add(rod2.group);
    
    // Scale slightly for good framing
    interactionRod1.scale.set(1.2, 1.2, 1.2);
    interactionRod2.scale.set(1.2, 1.2, 1.2);
    
    function setRodState(rod, extend, duration = 0.8) {
        const targetMiddleX = extend ? -1.2 : -6.5;
        const targetInnerX = extend ? 5.0 : 0.2;
        
        if (duration === 0) {
            rod.middleGroup.position.x = targetMiddleX;
            rod.innerGroup.position.x = targetInnerX;
        } else {
            if (typeof gsap !== 'undefined') {
                gsap.to(rod.middleGroup.position, {
                    x: targetMiddleX,
                    duration: duration,
                    ease: "power2.inOut"
                });
                gsap.to(rod.innerGroup.position, {
                    x: targetInnerX,
                    duration: duration,
                    ease: "power2.inOut"
                });
            } else {
                rod.middleGroup.position.x = targetMiddleX;
                rod.innerGroup.position.x = targetInnerX;
            }
        }
        rod.extended = extend;
    }
    
    // Set initial state: White rod (rod1) starts extended, black rod (rod2) starts retracted
    setRodState(rod1, true, 0);  // instant
    setRodState(rod2, false, 0); // instant
    
    // Drag Rotation & Raycasting Click Logic
    let isDragging = false;
    let draggedRod = null; // Guardará la caña arrastrada (rod1 o rod2)
    let draggedGroup = null; // Guardará el grupo de interacción arrastrado (interactionRod1 o interactionRod2)
    let previousMousePosition = { x: 0, y: 0 };
    let downX = 0, downY = 0, downTime = 0;
    let returnTweenRod1 = null;
    let returnTweenRod2 = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const baseRotationX = 0;
    const baseRotationY = 0;
    const baseRotationZ = 0;

    function normalizeAngle(angle, target) {
        while (angle < target - Math.PI) angle += Math.PI * 2;
        while (angle > target + Math.PI) angle -= Math.PI * 2;
        return angle;
    }
    
    container.addEventListener('mousedown', (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
        
        downX = e.clientX;
        downY = e.clientY;
        downTime = Date.now();
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([interactionRod1, interactionRod2], true);
        
        if (intersects.length > 0) {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // Determinar qué caña fue clicada
            let current = intersects[0].object;
            while (current) {
                if (current === rod1.group) {
                    draggedRod = rod1;
                    draggedGroup = interactionRod1;
                    break;
                }
                if (current === rod2.group) {
                    draggedRod = rod2;
                    draggedGroup = interactionRod2;
                    break;
                }
                current = current.parent;
            }
            
            // Matar los tweens de retorno de la caña seleccionada
            if (draggedGroup === interactionRod1 && returnTweenRod1) {
                returnTweenRod1.kill();
                returnTweenRod1 = null;
            } else if (draggedGroup === interactionRod2 && returnTweenRod2) {
                returnTweenRod2.kill();
                returnTweenRod2 = null;
            }
        }
    });
    
    window.addEventListener('mousemove', (e) => {
        if (isDragging && draggedGroup) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            // Rotar solo la caña seleccionada
            draggedGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaMove.y * 0.01);
            draggedGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaMove.x * 0.01);
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const upX = e.clientX;
        const upY = e.clientY;
        const distance = Math.sqrt((upX - downX) ** 2 + (upY - downY) ** 2);
        const duration = Date.now() - downTime;
        
        // Clic rápido para extender/contraer
        if (distance < 5 && duration < 300) {
            if (draggedRod) {
                setRodState(draggedRod, !draggedRod.extended);
            }
        }

        // Retornar suavemente el grupo que estaba siendo arrastrado
        if (draggedGroup) {
            const group = draggedGroup;
            group.rotation.x = normalizeAngle(group.rotation.x, baseRotationX);
            group.rotation.y = normalizeAngle(group.rotation.y, baseRotationY);
            group.rotation.z = normalizeAngle(group.rotation.z, baseRotationZ);
            
            const tween = gsap.to(group.rotation, {
                x: baseRotationX,
                y: baseRotationY,
                z: baseRotationZ,
                duration: 1.2,
                ease: "power2.out",
                onComplete: () => {
                    if (group === interactionRod1) returnTweenRod1 = null;
                    if (group === interactionRod2) returnTweenRod2 = null;
                }
            });
            
            if (group === interactionRod1) returnTweenRod1 = tween;
            if (group === interactionRod2) returnTweenRod2 = tween;
        }

        draggedRod = null;
        draggedGroup = null;
    });
    
    // Window Resize Adjustments
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        const aspect = width / height;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotación Y automática individual en el grupo exterior
        if (!isDragging || draggedGroup !== interactionRod1) {
            autoRotationRod1.rotation.y += 0.005;
        }
        if (!isDragging || draggedGroup !== interactionRod2) {
            autoRotationRod2.rotation.y += 0.005;
        }
        
        renderer.render(scene, camera);
    }
    animate();
}
