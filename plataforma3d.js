import * as THREE from 'three';

// 1. OBTENEMOS EL CONTENEDOR DE LA GALERÍA
const container = document.getElementById('contenedor-plataforma-3d');

if (container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFEFBF2); 

    let width = container.clientWidth;
    let height = container.clientHeight;
    let aspect = width / height;
    
    const frustumSize = 35; 

    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, 
        frustumSize * aspect / 2, 
        frustumSize / 2, 
        frustumSize / -2, 
        -100, 1000
    );
    camera.position.set(20, 25, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false; 
    
    container.appendChild(renderer.domElement);

    const COLORS = {
        pink: 0xF5BEBF,
        cream: 0xEDE9DD,
        outline: 0x97676D 
    };

    function createVectorMesh(shape, extrudeSettings, colorHex, hasOutline = true) {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshBasicMaterial({ 
            color: colorHex,
            polygonOffset: true,
            polygonOffsetFactor: 1, 
            polygonOffsetUnits: 1
        });
        
        const mesh = new THREE.Mesh(geometry, material);

        if (hasOutline) {
            const edges = new THREE.EdgesGeometry(geometry, 1);
            const line = new THREE.LineSegments(
                edges, 
                new THREE.LineBasicMaterial({ color: COLORS.outline, linewidth: 2 }) 
            );
            mesh.add(line);
        }
        return mesh;
    }

    // Grupos anidados: autoRotationGroup (rotación Y) > boardGroup (arrastre/rotación libre)
    const autoRotationGroup = new THREE.Group();
    scene.add(autoRotationGroup);

    const boardGroup = new THREE.Group();
    autoRotationGroup.add(boardGroup);

    function getPolygonVertices(sides, radius, offsetAngle = 0) {
        const vertices = [];
        for (let i = 0; i < sides; i++) {
            const angle = offsetAngle + (i / sides) * Math.PI * 2;
            vertices.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
        }
        return vertices;
    }

    function createShapeFromVertices(vertices) {
        const shape = new THREE.Shape();
        shape.moveTo(vertices[0][0], vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) {
            shape.lineTo(vertices[i][0], vertices[i][1]);
        }
        return shape;
    }

    function clipPolygon(subjectPolygon, clipPolygon) {
        let outputList = subjectPolygon;
        for (let i = 0; i < clipPolygon.length; i++) {
            const clipEdge = [clipPolygon[i], clipPolygon[(i + 1) % clipPolygon.length]];
            const inputList = outputList;
            outputList = [];
            if (inputList.length === 0) break;
            
            let S = inputList[inputList.length - 1];
            for (let j = 0; j < inputList.length; j++) {
                const E = inputList[j];
                const isInside = (pt) => {
                    const ax = clipEdge[0][0], ay = clipEdge[0][1];
                    const bx = clipEdge[1][0], by = clipEdge[1][1];
                    const cx = pt[0], cy = pt[1];
                    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) >= 0;
                };

                if (isInside(E)) {
                    if (!isInside(S)) outputList.push(lineIntersection(S, E, clipEdge[0], clipEdge[1]));
                    outputList.push(E);
                } else if (isInside(S)) {
                    outputList.push(lineIntersection(S, E, clipEdge[0], clipEdge[1]));
                }
                S = E;
            }
        }
        return outputList;
    }

    function lineIntersection(p1, p2, p3, p4) {
        const den = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
        if (Math.abs(den) < 1e-8) return p1; 
        const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / den;
        return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
    }

    const R = 10; 
    const hexVertices = getPolygonVertices(6, R, Math.PI / 6); 
    const totalHeight = R * Math.sqrt(3);
    const cellSize = totalHeight / 6; 

    function buildFace(zPos, isFlipped) {
        const faceGroup = new THREE.Group();

        for (let i = -4; i <= 4; i++) {
            for (let j = -4; j <= 4; j++) {
                const isPink = Math.abs(i + j) % 2 !== 0;
                const color = isPink ? COLORS.pink : COLORS.cream;

                const x0 = i * cellSize;
                const y0 = j * cellSize;
                const cellPoly = [
                    [x0, y0], [x0 + cellSize, y0], 
                    [x0 + cellSize, y0 + cellSize], [x0, y0 + cellSize]
                ];

                const clippedPoly = clipPolygon(cellPoly, hexVertices);

                if (clippedPoly.length > 2) {
                    const shape = createShapeFromVertices(clippedPoly);
                    const mesh = createVectorMesh(shape, { depth: 0.05, bevelEnabled: false }, color, false);
                    mesh.position.z = 0; 
                    faceGroup.add(mesh);
                }
            }
        }

        const centerBaseShape = createShapeFromVertices(getPolygonVertices(6, 3.5, Math.PI / 6));
        const centerBaseMesh = createVectorMesh(centerBaseShape, { depth: 0.05, bevelEnabled: false }, COLORS.cream, false);
        centerBaseMesh.position.z = 0.05; 
        faceGroup.add(centerBaseMesh);

        const centerRaisedShape = createShapeFromVertices(getPolygonVertices(6, 2.7, Math.PI / 6));
        const holeSize = 2.0; 
        const holePath = new THREE.Path();
        holePath.moveTo(-holeSize/2, holeSize/2);
        holePath.lineTo(holeSize/2, holeSize/2);
        holePath.lineTo(holeSize/2, -holeSize/2);
        holePath.lineTo(-holeSize/2, -holeSize/2);
        holePath.lineTo(-holeSize/2, holeSize/2);
        centerRaisedShape.holes.push(holePath);

        const centerRaisedMesh = createVectorMesh(centerRaisedShape, { depth: 0.10, bevelEnabled: false }, COLORS.cream, true);
        centerRaisedMesh.position.z = 0.10; 
        faceGroup.add(centerRaisedMesh);

        faceGroup.position.z = zPos;
        if (isFlipped) {
            faceGroup.rotation.x = Math.PI; 
        }
        boardGroup.add(faceGroup);
    }

    const baseShape = createShapeFromVertices(hexVertices);
    const baseMesh = createVectorMesh(baseShape, { depth: 0.4, bevelEnabled: false }, COLORS.pink, true);
    baseMesh.position.z = -0.2; 
    boardGroup.add(baseMesh);

    buildFace(0.2, false); 
    buildFace(-0.2, true); 

    const baseRotationX = -Math.PI / 2.5;
    const baseRotationY = 0;
    const baseRotationZ = -Math.PI / 8;

    boardGroup.rotation.x = baseRotationX;
    boardGroup.rotation.y = baseRotationY;
    boardGroup.rotation.z = baseRotationZ;
    
    boardGroup.scale.set(1.5, 1.5, 1.5);

    // ==========================================
    // INTERACCIÓN Y RETORNO GSAP
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
            boardGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaMove.y * 0.01);
            boardGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaMove.x * 0.01);
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            
            // Evitar giros innecesarios
            boardGroup.rotation.x = normalizeAngle(boardGroup.rotation.x, baseRotationX);
            boardGroup.rotation.y = normalizeAngle(boardGroup.rotation.y, baseRotationY);
            boardGroup.rotation.z = normalizeAngle(boardGroup.rotation.z, baseRotationZ);

            returnTween = gsap.to(boardGroup.rotation, {
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
            autoRotationGroup.rotation.y += 0.005; // Rotación automática
        }
        renderer.render(scene, camera);
    }
    animate();
}