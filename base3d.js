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
// Ángulo para apreciar que ahora es plano por debajo y tiene volumen por arriba
camera.position.set(20, 25, 20); 
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height); // Usamos el ancho del contenedor
renderer.shadowMap.enabled = false; 

// IMPORTANTE: Lo metemos al contenedor, no al body
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

const interactionGroup = new THREE.Group();
interactionGroup.add(baseZocaloGroup);

// Escalo un poquitín la pieza para que respire bien dentro del contenedor
interactionGroup.scale.set(0.8, 0.8, 0.8);

scene.add(interactionGroup);

// ==========================================
// 5. INTERACCIÓN (Mapeada al contenedor)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Ahora escuchamos el clic solo dentro del contenedor de la galería
container.addEventListener('mousedown', (e) => {
    const rect = container.getBoundingClientRect();
    // Coordenadas calculadas respecto al cuadro, no a la pantalla
    mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([interactionGroup], true);
    
    if (intersects.length > 0) isDragging = true;
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

// ==========================================
// 6. RENDER LOOP
// ==========================================
window.addEventListener('resize', () => {
    width = container.clientWidth;
    height = container.clientHeight;
    const aspect = width / height;
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