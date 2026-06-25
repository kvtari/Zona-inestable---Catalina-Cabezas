import * as THREE from 'three';

const container = document.getElementById('contenedor-ruleta-3d');
if (container) {
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFEFBF2); // Cream background
    
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
    
    // Official Palette Hex values: A6DDE5, F5BEBF, 8C2041, EDE9DD
    const COLORS = {
        crema: 0xEDE9DD,       // #EDE9DD
        rosa: 0xF5BEBF,        // #F5BEBF
        celeste: 0xA6DDE5,     // #A6DDE5
        vino: 0x8C2041,        // #8C2041
        outlineGris: 0xD6D0CA, // Architectural outline style
        plywoodSide: 0x5C2D1F, // Dark plywood edge
    };
    
    // -------------------------------------------------------------
    // 1. DIBUJAR LA RULETA EN 2D EN HD (CanvasTexture 2048x2048)
    // -------------------------------------------------------------
    function createRouletteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');
        
        const cx = 1024;
        const cy = 1024;
        
        // Fondo crema
        ctx.fillStyle = '#FEFBF2';
        ctx.fillRect(0, 0, 2048, 2048);
        
        // Círculo exterior (Celeste #A6DDE5)
        ctx.beginPath();
        ctx.arc(cx, cy, 980, 0, Math.PI * 2);
        ctx.fillStyle = '#A6DDE5';
        ctx.fill();
        ctx.strokeStyle = '#8C2041';
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Líneas diagonales divisorias del círculo exterior (a 45°, 135°, 225°, 315°)
        const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
        ctx.strokeStyle = '#8C2041';
        ctx.lineWidth = 8;
        angles.forEach(a => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * 980, cy + Math.sin(a) * 980);
            ctx.stroke();
        });
        
        // DIBUJAR CAÑAS VECTORIALES (Fidelidad HD)
        // CAÑA TOP (Horizontal, esfera crema)
        ctx.fillStyle = '#8C2041';
        ctx.fillRect(640, 220, 120, 40); // Mango
        ctx.fillStyle = '#EDE9DD';
        ctx.fillRect(760, 234, 640, 12); // Vara
        ctx.strokeStyle = '#8C2041';
        ctx.lineWidth = 8;
        ctx.strokeRect(760, 234, 640, 12);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(1380, 228, 20, 24); // Conector
        ctx.beginPath(); // Hilo
        ctx.moveTo(1400, 240);
        ctx.lineTo(1400, 340);
        ctx.stroke();
        ctx.beginPath(); // Esfera crema
        ctx.arc(1400, 340, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#EDE9DD';
        ctx.fill();
        ctx.stroke();
 
        // CAÑA BOTTOM (Horizontal, esfera vino)
        ctx.fillStyle = '#8C2041';
        ctx.fillRect(640, 1788, 120, 40);
        ctx.fillStyle = '#EDE9DD';
        ctx.fillRect(760, 1802, 640, 12);
        ctx.strokeRect(760, 1802, 640, 12);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(1380, 1796, 20, 24);
        ctx.beginPath(); // Hilo
        ctx.moveTo(1400, 1808);
        ctx.lineTo(1400, 1708);
        ctx.stroke();
        ctx.beginPath(); // Esfera vino
        ctx.arc(1400, 1708, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#8C2041';
        ctx.fill();
        ctx.stroke();
 
        // CAÑA LEFT (Vertical, esfera crema)
        ctx.fillStyle = '#8C2041';
        ctx.fillRect(220, 1160, 40, 120);
        ctx.fillStyle = '#EDE9DD';
        ctx.fillRect(234, 760, 12, 400);
        ctx.strokeRect(234, 760, 12, 400);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(228, 740, 24, 20);
        ctx.beginPath(); // Hilo
        ctx.moveTo(240, 750);
        ctx.lineTo(340, 750);
        ctx.stroke();
        ctx.beginPath(); // Esfera crema
        ctx.arc(340, 750, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#EDE9DD';
        ctx.fill();
        ctx.stroke();
 
        // CAÑA RIGHT (Vertical, esfera vino)
        ctx.fillStyle = '#8C2041';
        ctx.fillRect(1788, 1160, 40, 120);
        ctx.fillStyle = '#EDE9DD';
        ctx.fillRect(1802, 760, 12, 400);
        ctx.strokeRect(1802, 760, 12, 400);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(1796, 740, 24, 20);
        ctx.beginPath(); // Hilo
        ctx.moveTo(1808, 750);
        ctx.lineTo(1708, 750);
        ctx.stroke();
        ctx.beginPath(); // Esfera vino
        ctx.arc(1708, 750, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#8C2041';
        ctx.fill();
        ctx.stroke();
        
        // Círculo interior (Rosa #F5BEBF)
        ctx.beginPath();
        ctx.arc(cx, cy, 660, 0, Math.PI * 2);
        ctx.fillStyle = '#F5BEBF';
        ctx.fill();
        ctx.strokeStyle = '#8C2041';
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Líneas divisoria del círculo interior (Horizontal y Vertical)
        ctx.strokeStyle = '#8C2041';
        ctx.lineWidth = 8;
        ctx.beginPath(); // Vertical
        ctx.moveTo(cx, cy - 660);
        ctx.lineTo(cx, cy + 660);
        ctx.stroke();
        ctx.beginPath(); // Horizontal
        ctx.moveTo(cx - 660, cy);
        ctx.lineTo(cx + 660, cy);
        ctx.stroke();
        
        // DIBUJAR MANOS VECTORIALES REDISEÑADAS EN HD
        drawHand(ctx, 760, 520, 1.3, -Math.PI / 12);  // Top-Left (Solo mano izquierda)
        drawPointingHand(ctx, 1280, 520, 1.25, 0);   // Top-Right (Jugador derecha escoge)
        drawHand(ctx, 1280, 1180, 1.3, Math.PI / 12); // Bottom-Right (Solo mano derecha)
        // Bottom-Left (Ambas manos)
        drawHand(ctx, 660, 1180, 1.15, -Math.PI / 12);
        drawHand(ctx, 860, 1180, 1.15, Math.PI / 12);
        
        // TEXTOS EN ALTA DEFINICIÓN
        ctx.fillStyle = '#8C2041';
        ctx.font = "bold 44px 'Rubik', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Top-Left sector text
        ctx.fillText("SOLO MANO", 760, 720);
        ctx.fillText("IZQUIERDA", 760, 770);
        
        // Top-Right sector text
        ctx.fillText("JUGADOR A TU", 1280, 720);
        ctx.fillText("DERECHA ESCOGE", 1280, 770);
        
        // Bottom-Right sector text
        ctx.fillText("SOLO MANO", 1280, 1380);
        ctx.fillText("DERECHA", 1280, 1430);
        
        // Bottom-Left sector text
        ctx.fillText("AMBAS", 760, 1380);
        ctx.fillText("MANOS", 760, 1430);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    // Dibujo de manos estilizadas y curvas vectoriales
    function drawHand(ctx, x, y, scale, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale * 1.8, scale * 1.8);
        
        ctx.beginPath();
        ctx.fillStyle = '#EDE9DD'; // Crema
        ctx.strokeStyle = '#8C2041'; // Vino
        ctx.lineWidth = 4.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Muñeca izquierda
        ctx.moveTo(-15, 30);
        ctx.bezierCurveTo(-17, 20, -22, 10, -22, 5);
        
        // Dedos redondeados
        ctx.bezierCurveTo(-23, -12, -18, -12, -18, 5); // Meñique
        ctx.bezierCurveTo(-18, -20, -13, -20, -13, 5); // Anular
        ctx.bezierCurveTo(-13, -24, -8, -24, -8, 5);   // Medio
        ctx.bezierCurveTo(-8, -18, -3, -18, -3, 8);    // Índice
        
        // Pulgar
        ctx.bezierCurveTo(2, 5, 8, -2, 13, -2);
        ctx.bezierCurveTo(17, -2, 17, 4, 11, 10);
        
        // Muñeca derecha
        ctx.bezierCurveTo(9, 20, 10, 25, 10, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Mano apuntando vectorial
    function drawPointingHand(ctx, x, y, scale, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale * 1.8, scale * 1.8);
        
        ctx.beginPath();
        ctx.fillStyle = '#EDE9DD'; // Crema
        ctx.strokeStyle = '#8C2041'; // Vino
        ctx.lineWidth = 4.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Muñeca abajo
        ctx.moveTo(-25, 12);
        ctx.bezierCurveTo(-25, 20, -18, 20, -10, 20);
        
        // Dedos doblados
        ctx.bezierCurveTo(-2, 20, 2, 20, 2, 12); // Meñique
        ctx.bezierCurveTo(2, 6, -2, 6, -2, 12);
        
        ctx.bezierCurveTo(-2, 12, 2, 12, 2, 4);  // Anular
        ctx.bezierCurveTo(2, -2, -2, -2, -2, 4);
        
        ctx.bezierCurveTo(-2, 4, 2, 4, 2, -4);   // Medio
        ctx.bezierCurveTo(2, -10, -2, -10, -2, -4);
        
        // Índice extendido
        ctx.lineTo(25, -4);
        ctx.bezierCurveTo(32, -4, 32, -12, 25, -12);
        ctx.lineTo(-10, -12);
        
        // Pulgar doblado arriba
        ctx.bezierCurveTo(-8, -12, -4, -12, -4, -7);
        ctx.bezierCurveTo(-4, -2, -10, -2, -15, -2);
        
        ctx.lineTo(-25, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // -------------------------------------------------------------
    // 2. CONSTRUCCIÓN 3D DE LA RULETA EN THREE.JS
    // -------------------------------------------------------------
    const canvasTexture = createRouletteTexture();
    canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.generateMipmaps = true;
    canvasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    canvasTexture.needsUpdate = true;
    
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
    
    // Grupos anidados: autoRotationGroup (gira solo) > interactionGroup (arrastre)
    const autoRotationGroup = new THREE.Group();
    scene.add(autoRotationGroup);

    const interactionGroup = new THREE.Group();
    autoRotationGroup.add(interactionGroup);
    
    // Plato de la ruleta (Cilindro plano)
    const baseGeom = new THREE.CylinderGeometry(10.5, 10.5, 0.4, 64);
    
    // Texturas del plato: canto madera marrón, tapa superior Canvas, tapa inferior Crema
    const sideMaterial = new THREE.MeshBasicMaterial({ color: COLORS.plywoodSide });
    const topMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const bottomMaterial = new THREE.MeshBasicMaterial({ color: COLORS.crema });
    
    const cylinderMaterials = [sideMaterial, topMaterial, bottomMaterial];
    
    const baseMesh = new THREE.Mesh(baseGeom, cylinderMaterials);
    const baseEdges = new THREE.EdgesGeometry(baseGeom);
    const baseLines = new THREE.LineSegments(
        baseEdges,
        new THREE.LineBasicMaterial({ color: COLORS.vino, linewidth: 2 })
    );
    baseMesh.add(baseLines);
    interactionGroup.add(baseMesh);
    
    // Eje central
    const spindleGeom = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 32);
    const spindle = createVectorMesh(spindleGeom, COLORS.vino, COLORS.outlineGris);
    spindle.position.y = 1.0;
    interactionGroup.add(spindle);
    
    // Arandelas de metal
    const washer1Geom = new THREE.CylinderGeometry(0.8, 0.8, 0.12, 32);
    const washer1 = createVectorMesh(washer1Geom, COLORS.grisMetal, COLORS.outlineGris);
    washer1.position.y = 0.26;
    interactionGroup.add(washer1);
    
    const washer2Geom = new THREE.CylinderGeometry(0.8, 0.8, 0.12, 32);
    const washer2 = createVectorMesh(washer2Geom, COLORS.grisMetal, COLORS.outlineGris);
    washer2.position.y = 0.86;
    interactionGroup.add(washer2);
    
    const capGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 32);
    const cap = createVectorMesh(capGeom, COLORS.grisMetal, COLORS.outlineGris);
    cap.position.y = 1.45;
    interactionGroup.add(cap);
    
    const screwGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const screw = createVectorMesh(screwGeom, COLORS.vino, COLORS.outlineGris);
    screw.position.y = 1.7;
    interactionGroup.add(screw);
    
    // -------------------------------------------------------------
    // 3. MODELADO DE LAS AGUJAS / AZAS COAXIALES 3D
    // -------------------------------------------------------------
    // Aguja Larga (Apunta a cañas en el círculo exterior)
    const longNeedleShape = new THREE.Shape();
    longNeedleShape.absarc(0, 0, 0.9, 0, Math.PI * 2, false);
    longNeedleShape.moveTo(0, 0.6);
    longNeedleShape.quadraticCurveTo(2.5, 0.5, 8.5, 0); // punta
    longNeedleShape.quadraticCurveTo(2.5, -0.5, 0, -0.6);
    longNeedleShape.quadraticCurveTo(-1.2, -0.5, -1.6, 0); // contrapeso
    longNeedleShape.quadraticCurveTo(-1.2, 0.5, 0, 0.6);
    
    const longExtrudeGeom = new THREE.ExtrudeGeometry(longNeedleShape, { depth: 0.25, bevelEnabled: false });
    const longNeedle = createVectorMesh(longExtrudeGeom, COLORS.vino, COLORS.outlineGris);
    longNeedle.rotation.x = -Math.PI / 2;
    longNeedle.position.y = 0.45;
    interactionGroup.add(longNeedle);
    
    // Aguja Corta (Apunta a manos en el círculo interior)
    const shortNeedleShape = new THREE.Shape();
    shortNeedleShape.absarc(0, 0, 0.9, 0, Math.PI * 2, false);
    shortNeedleShape.moveTo(0, 0.6);
    shortNeedleShape.quadraticCurveTo(2.0, 0.5, 5.5, 0); // punta corta
    shortNeedleShape.quadraticCurveTo(2.0, -0.5, 0, -0.6);
    shortNeedleShape.quadraticCurveTo(-1.2, -0.5, -1.6, 0);
    shortNeedleShape.quadraticCurveTo(-1.2, 0.5, 0, 0.6);
    
    const shortExtrudeGeom = new THREE.ExtrudeGeometry(shortNeedleShape, { depth: 0.25, bevelEnabled: false });
    const shortNeedle = createVectorMesh(shortExtrudeGeom, COLORS.vino, COLORS.outlineGris);
    shortNeedle.rotation.x = -Math.PI / 2;
    shortNeedle.position.y = 1.05;
    interactionGroup.add(shortNeedle);
    
    // Ajustes y escala
    interactionGroup.scale.set(0.9, 0.9, 0.9);

    const baseRotationX = -Math.PI / 8;
    const baseRotationY = Math.PI / 6;
    const baseRotationZ = 0;

    interactionGroup.rotation.x = baseRotationX;
    interactionGroup.rotation.y = baseRotationY;
    interactionGroup.rotation.z = baseRotationZ;
    
    longNeedle.rotation.z = Math.PI / 4;
    shortNeedle.rotation.z = -Math.PI / 3;
    
    // -------------------------------------------------------------
    // 4. ANIMACIÓN DE GIRO DE LAS AGUJAS (GSAP)
    // -------------------------------------------------------------
    let isSpinning = false;
    
    function spinRoulette() {
        if (isSpinning) return;
        isSpinning = true;
        
        const spinsLong = 6 + Math.random() * 6;
        const spinsShort = 6 + Math.random() * 6;
        
        const targetLong = longNeedle.rotation.z + spinsLong * Math.PI * 2;
        const targetShort = shortNeedle.rotation.z - spinsShort * Math.PI * 2;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(longNeedle.rotation, {
                z: targetLong,
                duration: 3.5 + Math.random() * 1.5,
                ease: "power4.out",
                onComplete: () => {
                    isSpinning = false;
                }
            });
            
            gsap.to(shortNeedle.rotation, {
                z: targetShort,
                duration: 3.0 + Math.random() * 1.0,
                ease: "power4.out"
            });
        } else {
            longNeedle.rotation.z = targetLong;
            shortNeedle.rotation.z = targetShort;
            isSpinning = false;
        }
    }
    
    // -------------------------------------------------------------
    // 5. INTERACCIONES DEL MOUSE (Arrastre y Raycast)
    // -------------------------------------------------------------
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let downX = 0, downY = 0, downTime = 0;
    let returnTween = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

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
    
    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const upX = e.clientX;
        const upY = e.clientY;
        const distance = Math.sqrt((upX - downX) ** 2 + (upY - downY) ** 2);
        const duration = Date.now() - downTime;
        
        if (distance < 5 && duration < 300) {
            const rect = container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([baseMesh, longNeedle, shortNeedle, spindle], true);
            
            if (intersects.length > 0) {
                spinRoulette();
            }
        }

        // Return tween
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
    });
    
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
        if (!isDragging) {
            autoRotationGroup.rotation.y += 0.005; // Idle Y rotation
        }
        renderer.render(scene, camera);
    }
    animate();
}
