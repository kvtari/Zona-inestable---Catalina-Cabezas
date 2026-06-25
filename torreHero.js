import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    const container3D = document.getElementById('contenedor-torre-3d');

    if (container3D) {
        const scene = new THREE.Scene();
        scene.background = null; 

        let width = container3D.clientWidth;
        let height = container3D.clientHeight;
        let aspect = width / height;
        
        const frustumSize = 45; 

        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2, 
            frustumSize / 2, frustumSize / -2, 
            -100, 1000
        );
        camera.position.set(30, 12, 30);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = false; 
        container3D.appendChild(renderer.domElement);

        const COLORS = {
            pink: 0xF5BEBF, cream: 0xEDE9DD, whiteBase: 0xFAFAFA,
            wood: 0xE6C280, outline: 0x97676D, wine: 0xD6D0CA
        };

        function createVectorMesh(shapeOrGeo, isShape, extrudeSettings, colorHex, lineColor = COLORS.wine) {
            let geometry = isShape ? new THREE.ExtrudeGeometry(shapeOrGeo, extrudeSettings) : shapeOrGeo;
            const material = new THREE.MeshBasicMaterial({ color: colorHex, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
            const mesh = new THREE.Mesh(geometry, material);
            // Usamos un umbral de 15 grados en formas extruidas para ocultar las facetas verticales del cilindro base
            const edges = new THREE.EdgesGeometry(geometry, isShape ? 15 : 30);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 }) );
            mesh.add(line);
            return mesh;
        }

        function createPolygon(radius, sides, offsetAngle = 0, isHole = false) {
            const pathOrShape = isHole ? new THREE.Path() : new THREE.Shape();
            for (let i = 0; i < sides; i++) {
                const a = offsetAngle + (i / sides) * Math.PI * 2;
                const x = Math.cos(a) * radius;
                const y = Math.sin(a) * radius;
                if (i === 0) pathOrShape.moveTo(x, y);
                else pathOrShape.lineTo(x, y);
            }
            pathOrShape.closePath();
            return pathOrShape;
        }

        function createShapeFromVertices(vertices) {
            const shape = new THREE.Shape();
            shape.moveTo(vertices[0][0], vertices[0][1]);
            for (let i = 1; i < vertices.length; i++) {
                shape.lineTo(vertices[i][0], vertices[i][1]);
            }
            return shape;
        }

        function getPolygonVertices(sides, radius, offsetAngle = 0) {
            const vertices = [];
            for (let i = 0; i < sides; i++) {
                const angle = offsetAngle + (i / sides) * Math.PI * 2;
                vertices.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
            }
            return vertices;
        }

        // --- CONSTRUCCIÓN ---
        const baseGroup = new THREE.Group();
        const circleShape = new THREE.Shape();
        circleShape.absarc(0, 0, 10, 0, Math.PI * 2, false);
        const meshCirculo = createVectorMesh(circleShape, true, { depth: 0.6, bevelEnabled: false, curveSegments: 64 }, COLORS.cream);
        meshCirculo.position.z = 0; 
        baseGroup.add(meshCirculo);

        const hexBaseShape = createPolygon(3.2, 6, Math.PI / 2, false);
        const squareHole = createPolygon(1.414, 4, Math.PI / 4, true); // 2.0 x 2.0 square hole
        hexBaseShape.holes.push(squareHole);

        const meshHexBase = createVectorMesh(hexBaseShape, true, { depth: 0.4, bevelEnabled: false }, COLORS.cream);
        meshHexBase.position.z = 0.6; 
        baseGroup.add(meshHexBase);
        baseGroup.rotation.x = -Math.PI / 2;

        const heightPilar = 18;
        const pilarGeometry = new THREE.BoxGeometry(2.0, heightPilar, 2.0);
        const pilarMesh = createVectorMesh(pilarGeometry, false, null, COLORS.wood, COLORS.outline);

        const plataformaGroup = new THREE.Group();
        const hexVertices = getPolygonVertices(6, 10, Math.PI / 6); 
        const cellSize = (10 * Math.sqrt(3)) / 6; 

        const basePlatShape = createShapeFromVertices(hexVertices);
        const basePlatMesh = createVectorMesh(basePlatShape, true, { depth: 0.4, bevelEnabled: false }, COLORS.pink, COLORS.outline);
        basePlatMesh.position.z = -0.2; 
        plataformaGroup.add(basePlatMesh);

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

        function buildDameroFace(zPos, isFlipped) {
            const faceGroup = new THREE.Group();
            for (let i = -4; i <= 4; i++) {
                for (let j = -4; j <= 4; j++) {
                    const isPink = Math.abs(i + j) % 2 !== 0;
                    const color = isPink ? COLORS.pink : COLORS.cream;
                    const x0 = i * cellSize;
                    const y0 = j * cellSize;
                    const cellPoly = [ [x0, y0], [x0 + cellSize, y0], [x0 + cellSize, y0 + cellSize], [x0, y0 + cellSize] ];
                    const clippedPoly = clipPolygon(cellPoly, hexVertices);

                    if (clippedPoly.length > 2) {
                        const shape = createShapeFromVertices(clippedPoly);
                        const mesh = createVectorMesh(shape, true, { depth: 0.05, bevelEnabled: false }, color, COLORS.outline);
                        mesh.position.z = 0; 
                        faceGroup.add(mesh);
                    }
                }
            }
            const centerRaisedShape = createShapeFromVertices(getPolygonVertices(6, 2.7, Math.PI / 6));
            const centerSquareHole = createPolygon(1.414, 4, Math.PI / 4, true); // Agujero cuadrado en el medio para pasar el pilar
            centerRaisedShape.holes.push(centerSquareHole);
            
            const centerRaisedMesh = createVectorMesh(centerRaisedShape, true, { depth: 0.10, bevelEnabled: false }, COLORS.cream, COLORS.outline);
            centerRaisedMesh.position.z = 0.05; 
            faceGroup.add(centerRaisedMesh);

            faceGroup.position.z = zPos;
            if (isFlipped) faceGroup.rotation.x = Math.PI; 
            plataformaGroup.add(faceGroup);
        }

        buildDameroFace(0.2, false); 
        buildDameroFace(-0.2, true); 
        plataformaGroup.rotation.x = -Math.PI / 2; 

        // --- ENSAMBLAJE ---
        const interactionGroup = new THREE.Group();
        
        baseGroup.scale.set(0.75, 0.75, 1);
        baseGroup.position.set(0, 0, 0); 
        
        plataformaGroup.scale.set(1.05, 1.05, 1);
        
        pilarMesh.position.set(0, 1.0 + (heightPilar / 2), 0); 
        plataformaGroup.position.set(0, 1.0 + heightPilar + 0.2, 0); 

        const piezas = [baseGroup, pilarMesh, plataformaGroup];
        
        // ==========================================
        // VECTORES EXTREMOS PARA SALIR DE LA PANTALLA
        // ==========================================
        baseGroup.userData.chaosPos = { x: -160, y: -140, z: 120 };
        baseGroup.userData.chaosRot = { x: Math.PI * 6.5, y: -Math.PI * 5.5, z: Math.PI * 3.5 };

        pilarMesh.userData.chaosPos = { x: 220, y: -20, z: -180 };
        pilarMesh.userData.chaosRot = { x: -Math.PI * 9.0, y: Math.PI * 7.5, z: Math.PI * 6.0 };

        plataformaGroup.userData.chaosPos = { x: -150, y: 220, z: -150 };
        plataformaGroup.userData.chaosRot = { x: Math.PI * 7.5, y: -Math.PI * 8.5, z: Math.PI * 7.0 };

        piezas.forEach(pieza => {
            pieza.userData.posOriginal = { x: pieza.position.x, y: pieza.position.y, z: pieza.position.z };
            pieza.userData.rotOriginal = { x: pieza.rotation.x, y: pieza.rotation.y, z: pieza.rotation.z };
            interactionGroup.add(pieza);
        });

        interactionGroup.position.y = -9.5; 
        interactionGroup.rotation.y = Math.PI / 4; 
        
        // Posicionar en la mitad derecha en escritorio y centrar en móvil
        if (window.innerWidth > 768) {
            interactionGroup.position.x = 11;
            interactionGroup.position.z = -11;
        } else {
            interactionGroup.position.x = 0;
            interactionGroup.position.z = 0;
        }
        
        scene.add(interactionGroup);

        // ==========================================
        // CONTROLADOR DE SCROLL CON GSAP
        // ==========================================
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#slide-hero",
                    start: "top top",
                    end: "+=1600",
                    pin: true,
                    scrub: 1.5,
                    anticipatePin: 1
                }
            });

            piezas.forEach(pieza => {
                const origPos = pieza.userData.posOriginal;
                const chaosPos = pieza.userData.chaosPos;
                const origRot = pieza.userData.rotOriginal;
                const chaosRot = pieza.userData.chaosRot;

                // Animación de desarme coordinada
                tl.to(pieza.position, {
                    x: origPos.x + chaosPos.x,
                    y: origPos.y + chaosPos.y,
                    z: origPos.z + chaosPos.z,
                    ease: "none"
                }, 0);

                tl.to(pieza.rotation, {
                    x: origRot.x + chaosRot.x,
                    y: origRot.y + chaosRot.y,
                    z: origRot.z + chaosRot.z,
                    ease: "none"
                }, 0);
            });
        }

        window.addEventListener('resize', () => {
            width = container3D.clientWidth;
            height = container3D.clientHeight;
            aspect = width / height;
            camera.left = frustumSize * aspect / -2;
            camera.right = frustumSize * aspect / 2;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Actualizar la posición de la torre según el nuevo tamaño de pantalla
            if (window.innerWidth > 768) {
                interactionGroup.position.x = 11;
                interactionGroup.position.z = -11;
            } else {
                interactionGroup.position.x = 0;
                interactionGroup.position.z = 0;
            }
        });

        function animate() {
            requestAnimationFrame(animate);
            if (window.scrollY < 5) {
                interactionGroup.rotation.y += 0.002;
            }
            renderer.render(scene, camera);
        }
        animate();
    }
});
