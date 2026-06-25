import * as THREE from 'three';

// ==========================================
// 1. OBTENEMOS EL CONTENEDOR (El recuadro de la galería)
// ==========================================
const container = document.getElementById('contenedor-base-3d');
let width = container.clientWidth;
let height = container.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFEFBF2); 

const aspect = width / height;
const frustumSize = 25; 

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

// ==========================================
// 2. MATERIALES FIJOS (NUEVA PALETA)
// ==========================================
const COLOR_RELLENO = 0xEDE9DD;
const COLOR_BORDE = 0xD6D0CA;

const materialCaras = new THREE.MeshBasicMaterial({
    color: COLOR_RELLENO,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const materialAristas = new THREE.LineBasicMaterial({ 
    color: COLOR_BORDE,
    linewidth: 2 
});

// ==========================================
// 3. GENERADORES GEOMÉTRICOS PROCEDURALES
// ==========================================
function createCircleShape(radius) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return shape;
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

function crearCapa(shape, depth, yPos) {
    const geometry = new THREE.ExtrudeGeometry(shape, { 
        depth: depth, 
        bevelEnabled: false,
        curveSegments: 64 
    });
    
    const mesh = new THREE.Mesh(geometry, materialCaras);
    
    const edges = new THREE.EdgesGeometry(geometry, 30);
    const lines = new THREE.LineSegments(edges, materialAristas);
    mesh.add(lines);

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = yPos;
    
    return mesh;
}

// ==========================================
// 4. CONSTRUCCIÓN EXACTA DE LA PIEZA
// ==========================================
const baseZocaloGroup = new THREE.Group();

const RADIO_EXTERIOR = 10;
const RADIO_HEXAGONO = 3.2;
const RADIO_PALITO = 1.2; 

const GROSOR_CIRCULO = 0.6;
const GROSOR_HEXAGONO = 0.4;

const circleShape = createCircleShape(RADIO_EXTERIOR);
const hexShape = createPolygon(RADIO_HEXAGONO, 6, Math.PI / 2, false);
const squareHole = createPolygon(RADIO_PALITO, 4, Math.PI / 2, true); 
hexShape.holes.push(squareHole);

const capaCirculo = crearCapa(circleShape, GROSOR_CIRCULO, - (GROSOR_CIRCULO / 2)); 
baseZocaloGroup.add(capaCirculo);

const capaHexagonoSuperior = crearCapa(hexShape, GROSOR_HEXAGONO, (GROSOR_CIRCULO / 2)); 
baseZocaloGroup.add(capaHexagonoSuperior);

// Grupos anidados: autoRotationGroup (gira solo) > interactionGroup (arrastre)
const autoRotationGroup = new THREE.Group();
scene.add(autoRotationGroup);

const interactionGroup = new THREE.Group();
interactionGroup.add(baseZocaloGroup);
autoRotationGroup.add(interactionGroup);

interactionGroup.scale.set(0.8, 0.8, 0.8);

const baseRotationX = -Math.PI / 8;
const baseRotationY = Math.PI / 6;
const baseRotationZ = 0;

interactionGroup.rotation.x = baseRotationX;
interactionGroup.rotation.y = baseRotationY;
interactionGroup.rotation.z = baseRotationZ;

// ==========================================
// 5. INTERACCIÓN Y RETORNO GSAP
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
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
        
        // Evitar giros excesivos
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

// ==========================================
// 6. RENDER LOOP Y AJUSTE DE TAMAÑO
// ==========================================
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
        autoRotationGroup.rotation.y += 0.005; // Rotación automática suave
    }
    renderer.render(scene, camera);
}

animate();