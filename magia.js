// ==========================================
// 1. MOTOR DEL CIELO (Nubes Volumétricas)
// ==========================================
const skyCanvasNode = document.getElementById('skyCanvas');
if (skyCanvasNode) {
    const skyCtx = skyCanvasNode.getContext('2d', { alpha: false }); 
    
    let skyW, skyH;
    let cloudsArr = [];
    let paperTex;
    let lastSkyTime = 0;

    function generatePaperTexture() {
        const size = 256;
        const texCanvas = document.createElement('canvas');
        texCanvas.width = size; texCanvas.height = size;
        const tCtx = texCanvas.getContext('2d');
        const imgData = tCtx.createImageData(size, size);
        
        for (let i = 0; i < imgData.data.length; i += 4) {
            const val = 150 + Math.random() * 105; 
            imgData.data[i] = val;
            imgData.data[i+1] = val;
            imgData.data[i+2] = val;
            imgData.data[i+3] = 2 + Math.random() * 3; 
        }
        tCtx.putImageData(imgData, 0, 0);
        return texCanvas;
    }

    function drawSoftPuff(context, x, y, radius, maxOpacity) {
        const grad = context.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${maxOpacity})`);
        grad.addColorStop(0.3, `rgba(255, 255, 255, ${maxOpacity * 0.8})`);
        grad.addColorStop(0.7, `rgba(255, 255, 255, ${maxOpacity * 0.3})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        context.fillStyle = grad;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    function generateCloudStamp(cloudWidth) {
        const cloudHeight = cloudWidth * 0.55; 
        const stampCanvas = document.createElement('canvas');
        stampCanvas.width = cloudWidth;
        stampCanvas.height = cloudHeight;
        const sCtx = stampCanvas.getContext('2d');

        const centerX = cloudWidth / 2;
        const centerY = cloudHeight / 2;

        for(let i = 0; i < 40; i++) {
            const offsetX = (Math.random() - 0.5) * (cloudWidth * 0.7);
            const offsetY = (Math.random() - 0.5) * (cloudHeight * 0.4);
            const distRatioX = 1 - (Math.abs(offsetX) / (cloudWidth / 2));
            const radius = (cloudHeight * 0.15) + (Math.random() * cloudHeight * 0.25) * distRatioX;
            const opacity = 0.05 + Math.random() * 0.2; 
            drawSoftPuff(sCtx, centerX + offsetX, centerY + offsetY, radius, opacity);
        }

        for(let i = 0; i < 15; i++) {
            const offsetX = (Math.random() - 0.5) * (cloudWidth * 0.25);
            const offsetY = (Math.random() - 0.5) * (cloudHeight * 0.15);
            const radius = (cloudHeight * 0.15) + (Math.random() * cloudHeight * 0.2);
            const opacity = 0.5 + Math.random() * 0.5; 
            drawSoftPuff(sCtx, centerX + offsetX, centerY + offsetY, radius, opacity);
        }

        for(let i = 0; i < 8; i++) {
            const offsetX = (Math.random() - 0.5) * (cloudWidth * 0.85);
            const offsetY = (Math.random() - 0.5) * (cloudHeight * 0.6);
            const radius = cloudHeight * 0.05 + Math.random() * cloudHeight * 0.08;
            const opacity = 0.1 + Math.random() * 0.3;
            drawSoftPuff(sCtx, centerX + offsetX, centerY + offsetY, radius, opacity);
        }
        return stampCanvas;
    }

    const cloudStamps = { deep: [], mid: [], top: [] };

    function initAssets() {
        paperTex = generatePaperTexture();
        for(let i=0; i<4; i++) cloudStamps.deep.push(generateCloudStamp(300));
        for(let i=0; i<4; i++) cloudStamps.mid.push(generateCloudStamp(500));
        for(let i=0; i<4; i++) cloudStamps.top.push(generateCloudStamp(800));
    }

    class Cloud {
        constructor(layerType) {
            this.layerType = layerType;
            this.reset(true);
        }

        reset(randomizePosition = false) {
            let stamps, speedMultiplier, baseOpacity;
            
            if (this.layerType === 'deep') {
                stamps = cloudStamps.deep; speedMultiplier = 0.2; baseOpacity = 0.35; 
            } else if (this.layerType === 'mid') {
                stamps = cloudStamps.mid; speedMultiplier = 0.5; baseOpacity = 0.65;
            } else {
                stamps = cloudStamps.top; speedMultiplier = 0.9; baseOpacity = 1.0; 
            }

            this.stamp = stamps[Math.floor(Math.random() * stamps.length)];
            this.width = this.stamp.width;
            this.height = this.stamp.height;
            this.baseOpacity = baseOpacity;
            
            if (randomizePosition) {
                this.x = Math.random() * (skyW + this.width * 2) - this.width;
                this.y = Math.random() * (skyH + this.height * 2) - this.height;
            } else {
                if (Math.random() > 0.5) {
                    this.x = Math.random() * skyW;
                    this.y = skyH + this.height;
                } else {
                    this.x = skyW + this.width;
                    this.y = Math.random() * skyH;
                }
            }

            const baseWind = 25; 
            this.vx = (-baseWind * 0.8 - Math.random() * 10) * speedMultiplier;
            this.vy = (-baseWind * 0.4 - Math.random() * 5) * speedMultiplier; 
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.x < -this.width || this.y < -this.height) {
                this.reset(false);
            }
        }

        draw(ctx) {
            ctx.globalAlpha = this.baseOpacity;
            ctx.drawImage(this.stamp, this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1.0;
        }
    }

    function resizeSky() {
        skyW = skyCanvasNode.width = window.innerWidth;
        skyH = skyCanvasNode.height = window.innerHeight;
        cloudsArr = [];
        const area = skyW * skyH;
        const densityBase = 1920 * 1080;
        const ratio = Math.max(0.5, area / densityBase);

        for(let i=0; i<15 * ratio; i++) cloudsArr.push(new Cloud('deep'));
        for(let i=0; i<12 * ratio; i++) cloudsArr.push(new Cloud('mid'));
        for(let i=0; i<8 * ratio; i++) cloudsArr.push(new Cloud('top'));
    }

    function renderSky(time) {
        const dt = Math.min((time - lastSkyTime) / 1000, 0.1); 
        lastSkyTime = time;

        skyCtx.fillStyle = '#C5E0E9';
        skyCtx.fillRect(0, 0, skyW, skyH);

        const sortedClouds = [...cloudsArr].sort((a, b) => {
            const order = { 'deep': 1, 'mid': 2, 'top': 3 };
            return order[a.layerType] - order[b.layerType];
        });

        for (let cloud of sortedClouds) {
            cloud.update(dt); 
            cloud.draw(skyCtx);
        }

        skyCtx.globalCompositeOperation = 'overlay';
        for (let x = 0; x < skyW; x += paperTex.width) {
            for (let y = 0; y < skyH; y += paperTex.height) {
                skyCtx.drawImage(paperTex, x, y);
            }
        }
        skyCtx.globalCompositeOperation = 'source-over';

        requestAnimationFrame(renderSky);
    }

    window.addEventListener('resize', resizeSky);
    initAssets();
    resizeSky();
    requestAnimationFrame((t) => {
        lastSkyTime = t;
        renderSky(t);
    });
}


// ==========================================
// 2. CONFIGURACIÓN DEL JUEGO Y FÍSICAS
// ==========================================
const { Engine, Render, Runner, Bodies, Composite, Body, Events, Vertices } = Matter;
const engine = Engine.create();
const world = engine.world;

engine.gravity.y = 0; 
engine.gravity.x = 0;

const render = Render.create({
    element: document.getElementById('canvas-container'),
    engine: engine,
    options: { 
        width: 800,   
        height: 600,  
        wireframes: false, 
        background: 'transparent' 
    }
});

let casillas = []; 
let playerPieces = []; 
let cuerposTemblando = []; 
let cuerposCayendo = []; 
let turnoActual = 0;
const maxTurnos = 10;
let estado = 'COLOCAR'; 
let rotacionAcumulada = 0; 

const uiInstrucciones = document.getElementById('instrucciones');
const btnAzar = document.getElementById('trigger');
const canvasContainer = document.getElementById('canvas-container');
const ruletaOverlay = document.getElementById('ruleta-overlay');
const ruletaInner = document.getElementById('ruleta-inner');

// CONSTRUCTOR DE LA RULETA
function crearRuletaVectorial() {
    let svgHTML = `
    <svg viewBox="-55 -55 110 110" id="ruleta-grafica" style="width: 100%; height: 100%; transition: transform 3s cubic-bezier(0.2, 0.8, 0.1, 1); border-radius: 50%;">
        <circle cx="0" cy="0" r="53" fill="#BDD4DA" stroke="#8C2041" stroke-width="0.3"/>
        <circle cx="0" cy="0" r="45" fill="none" stroke="#8C2041" stroke-width="0.5"/>
    `;

    const datos = [
        { valor: 1, color: '#F4EFE6', textColor: '#8C2041' }, 
        { valor: 2, color: '#EAA8A9', textColor: '#8C2041' }, 
        { valor: 1, color: '#F4EFE6', textColor: '#8C2041' }, 
        { valor: 2, color: '#EAA8A9', textColor: '#8C2041' }, 
        { valor: 1, color: '#F4EFE6', textColor: '#8C2041' }, 
        { valor: 3, color: '#8C2041', textColor: '#F4EFE6' }  
    ];

    datos.forEach((d, i) => {
        svgHTML += `
        <g transform="rotate(${i * 60})">
            <path d="M 0 0 L -22.5 -38.97 A 45 45 0 0 1 22.5 -38.97 Z" fill="${d.color}" stroke="#8C2041" stroke-width="0.3"/>
            <text x="0" y="-26" text-anchor="middle" dominant-baseline="central" fill="${d.textColor}" font-size="16" font-family="'Bebas Neue', sans-serif" letter-spacing="1">${d.valor}</text>
        </g>
        `;
    });

    svgHTML += `</svg>`;
    
    if(ruletaInner) {
        ruletaInner.innerHTML = svgHTML;
    }
}

crearRuletaVectorial();

// LA GEOMETRÍA: Matriz Entrelazada
const cols = 8;
const rows = 4;
const w = 55;  
const h = 95;  
const gap = 3; 

const startX = 400 - (cols * w) / 2 + w / 2;
const startY = 320 - (rows * h) / 2 + h / 2;

const scaleX = (w - gap) / w;
const scaleY = (h - gap) / h;

for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
        if ((j === 0 && i === 0) || (j === 0 && i === 7) || (j === 3 && i === 0) || (j === 3 && i === 7)) continue;

        let px = startX + i * w;
        let py = startY + j * h;
        let colorActual = (i + j) % 2 !== 0 ? '#F5BEBF' : '#EDE9DD';
        let opc = { isStatic: true, isSensor: true, render: { fillStyle: colorActual } };
        let body;

        if ((j === 0 && i === 1) || (j === 1 && i === 0)) {
            body = Bodies.fromVertices(px + w/6, py + h/6, [[{x: 0, y: h}, {x: w, y: h}, {x: w, y: 0}]], opc);
            Body.scale(body, scaleX, scaleY);
        } else if ((j === 0 && i === 6) || (j === 1 && i === 7)) {
            body = Bodies.fromVertices(px - w/6, py + h/6, [[{x: 0, y: 0}, {x: 0, y: h}, {x: w, y: h}]], opc);
            Body.scale(body, scaleX, scaleY);
        } else if ((j === 2 && i === 0) || (j === 3 && i === 1)) {
            body = Bodies.fromVertices(px + w/6, py - h/6, [[{x: 0, y: 0}, {x: w, y: h}, {x: w, y: 0}]], opc);
            Body.scale(body, scaleX, scaleY);
        } else if ((j === 2 && i === 7) || (j === 3 && i === 6)) {
            body = Bodies.fromVertices(px - w/6, py - h/6, [[{x: 0, y: 0}, {x: 0, y: h}, {x: w, y: 0}]], opc);
            Body.scale(body, scaleX, scaleY);
        } else {
            body = Bodies.rectangle(px, py, w - gap, h - gap, opc);
        }

        casillas.push(body);
        Composite.add(world, body);
    }
}

Render.run(render);
Runner.run(Runner.create(), engine);

// Interacción
canvasContainer.addEventListener('click', (evento) => {
    if (estado !== 'COLOCAR') return; 

    const rect = canvasContainer.getBoundingClientRect();
    const x = evento.clientX - rect.left;
    const y = evento.clientY - rect.top;

    let piece = Bodies.rectangle(x, y, 40, 40, {
        render: { fillStyle: '#8C2041' },
        frictionAir: 0.1 
    });
    
    playerPieces.push(piece);
    Composite.add(world, piece);

    estado = 'AZAR';
    uiInstrucciones.innerText = `Pieza ${turnoActual + 1}/${maxTurnos} asegurada. Presiona el botón.`;
    uiInstrucciones.style.color = '#1a2f36'; 
    btnAzar.disabled = false;
});

// SECUENCIA AZAR
btnAzar.addEventListener('click', () => {
    if (estado !== 'AZAR') return;
    
    estado = 'GIRANDO'; 
    btnAzar.disabled = true;
    uiInstrucciones.innerText = "...";

    ruletaOverlay.classList.add('activa');

    const opcionesRuleta = [1, 2, 1, 2, 1, 3];
    const indiceElegido = Math.floor(Math.random() * opcionesRuleta.length);
    const resultadoRuleta = opcionesRuleta[indiceElegido];

    const anguloDestino = (indiceElegido * 60); 
    rotacionAcumulada += 1800; 
    const rotacionFinal = rotacionAcumulada - anguloDestino; 

    const svgRuleta = document.getElementById('ruleta-grafica');
    svgRuleta.style.transform = `rotate(${rotacionFinal}deg)`;

    setTimeout(() => {
        ruletaOverlay.classList.remove('activa');

        setTimeout(() => {
            for (let i = 0; i < resultadoRuleta; i++) {
                if (casillas.length > 0) {
                    const randomIndex = Math.floor(Math.random() * casillas.length);
                    const selectedSquare = casillas.splice(randomIndex, 1)[0]; 
                    
                    Body.setStatic(selectedSquare, false);
                    cuerposTemblando.push(selectedSquare);

                    playerPieces.forEach(pieza => {
                        if (Vertices.contains(selectedSquare.vertices, pieza.position)) {
                            if (!cuerposTemblando.includes(pieza) && !cuerposCayendo.includes(pieza)) {
                                cuerposTemblando.push(pieza); 
                            }
                        }
                    });
                }
            }

            uiInstrucciones.innerText = `¡CRAC! La estructura cede...`;
            uiInstrucciones.style.color = '#d9534f'; 

            setTimeout(() => {
                cuerposTemblando.forEach(c => cuerposCayendo.push(c));
                cuerposTemblando = []; 

                turnoActual++;

                if (turnoActual >= maxTurnos) {
                    estado = 'FIN';
                    btnAzar.disabled = true;
                    uiInstrucciones.innerText = `El Azar destruyó ${resultadoRuleta}. Evaluando inestabilidad...`;
                    uiInstrucciones.style.color = '#1a2f36';
                    setTimeout(evaluarVictoria, 2500); 
                } else {
                    estado = 'COLOCAR';
                    btnAzar.disabled = true;
                    uiInstrucciones.innerText = `El Azar destruyó ${resultadoRuleta}. Fase ${turnoActual + 1}: Asienta otra pieza.`;
                    uiInstrucciones.style.color = '#8C2041';
                }
            }, 1000); 
        }, 500); 
    }, 3000); 
});

// ANIMACIÓN FÍSICAS
Events.on(engine, 'beforeUpdate', () => {
    for (let i = 0; i < cuerposTemblando.length; i++) {
        let cuerpo = cuerposTemblando[i];
        Body.setPosition(cuerpo, {
            x: cuerpo.position.x + (Math.random() - 0.5) * 1.5,
            y: cuerpo.position.y + (Math.random() - 0.5) * 1.5
        });
        Body.setAngle(cuerpo, cuerpo.angle + (Math.random() - 0.5) * 0.05);
    }

    for (let i = cuerposCayendo.length - 1; i >= 0; i--) {
        let cuerpo = cuerposCayendo[i];
        Body.scale(cuerpo, 0.92, 0.92); 
        if (cuerpo.area < 10) {
            Composite.remove(world, cuerpo);
            cuerposCayendo.splice(i, 1);
        }
    }
});

// RESOLUCIÓN
function evaluarVictoria() {
    let piezasVivas = playerPieces.filter(p => p.area > 50);
    
    if (piezasVivas.length >= 6) {
        uiInstrucciones.innerText = `ESTRUCTURA ESTABLE. Mantuviste ${piezasVivas.length} piezas intactas.`;
        uiInstrucciones.style.color = '#1a2f36'; 
    } else {
        uiInstrucciones.innerText = `COLAPSO TOTAL. Solo quedaron ${piezasVivas.length} piezas. El vacío reclama todo.`;
        uiInstrucciones.style.color = '#8C2041'; 
        
        let condenados = [];
        casillas.forEach(c => condenados.push(c));
        casillas = []; 
        
        playerPieces.forEach(p => {
            if (!cuerposCayendo.includes(p) && !cuerposTemblando.includes(p)) {
                condenados.push(p);
            }
        });

        condenados.forEach(cuerpo => {
            Body.setStatic(cuerpo, false);
            cuerposTemblando.push(cuerpo);
        });

        setTimeout(() => {
            cuerposTemblando.forEach(c => cuerposCayendo.push(c));
            cuerposTemblando = []; 
        }, 1500);
    }
}