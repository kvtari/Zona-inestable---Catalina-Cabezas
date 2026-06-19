gsap.registerPlugin(ScrollTrigger);
const { Engine, Render, Runner, Bodies, Composite, Events, Body, Mouse, MouseConstraint, Constraint, Vector } = Matter;

const engine = Engine.create();
const world = engine.world;

const render = Render.create({
    element: document.getElementById('escenario-interactivo'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#8C2041' 
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// ------------------------------------------------------------------
// 0. MUROS Y VARIABLES DE ESTADO
// ------------------------------------------------------------------
const grosor = 100;
const w = window.innerWidth;
const h = window.innerHeight;

// El techo invisible está en -50
const piso = Bodies.rectangle(w / 2, h + grosor/2, w + 200, grosor, { isStatic: true });
const techo = Bodies.rectangle(w / 2, -grosor/2, w + 200, grosor, { isStatic: true });
const muroIzq = Bodies.rectangle(-grosor/2, h / 2, grosor, h * 2, { isStatic: true });
const muroDer = Bodies.rectangle(w + grosor/2, h / 2, grosor, h * 2, { isStatic: true });

[piso, techo, muroIzq, muroDer].forEach(m => m.render.visible = false);
Composite.add(world, [piso, techo, muroIzq, muroDer]);

let estadoFase = 0; // 0 = Armado | 1 = Tensión Scroll | 2 = Bola Activa
let conexionesHexagono = []; 
let globalProgress = 0;
let cursorObjetivo = { x: w / 2, y: h / 2 }; 

// ------------------------------------------------------------------
// 1. LA BOLA DE INTERVENCIÓN
// ------------------------------------------------------------------
// Nace como "fantasma" (isSensor: true) fuera de la pantalla (-300)
const bolaIntervencion = Bodies.circle(w / 2, -300, 25, {
    density: 1.5, 
    frictionAir: 0.03, 
    restitution: 0.2, 
    isSensor: true, 
    render: { visible: false } 
});

const cuerdaBola = Constraint.create({
    pointA: { x: w / 2, y: -300 }, 
    bodyB: bolaIntervencion,
    stiffness: 0.015, 
    damping: 0.05,
    render: { visible: false } 
});
Composite.add(world, [bolaIntervencion, cuerdaBola]);

// ------------------------------------------------------------------
// 2. GEOMETRÍA: EL HEXÁGONO
// ------------------------------------------------------------------
const cx = window.innerWidth / 2;
const cy = window.innerHeight / 2 - 50;
const R = 130; 
const T = 20;  
const A = R * (Math.sqrt(3) / 2); 

const metas = [
    { id: 'top', x: cx, y: cy - A, angulo: 0, color: '#A6DDE5' }, 
    { id: 'topDer', x: cx + 0.75 * R, y: cy - A / 2, angulo: Math.PI / 3, color: '#FEFBF2' }, 
    { id: 'botDer', x: cx + 0.75 * R, y: cy + A / 2, angulo: -Math.PI / 3, color: '#F5BEBF' }, 
    { id: 'bot', x: cx, y: cy + A, angulo: 0, color: '#A6DDE5' }, 
    { id: 'botIzq', x: cx - 0.75 * R, y: cy + A / 2, angulo: Math.PI / 3, color: '#FEFBF2' }, 
    { id: 'topIzq', x: cx - 0.75 * R, y: cy - A / 2, angulo: -Math.PI / 3, color: '#F5BEBF' } 
];

const fantasmas = metas.map(meta => {
    return Bodies.rectangle(meta.x, meta.y, R, T, { 
        isStatic: true, isSensor: true, angle: meta.angulo,
        render: { fillStyle: meta.color, opacity: 0.3 } 
    });
});
Composite.add(world, fantasmas);

const piezasReales = metas.map((meta, index) => {
    const startX = (w * 0.2) + (index * ((w * 0.6) / 5)); 
    const startY = window.innerHeight - 100;
    
    const body = Bodies.rectangle(startX, startY, R, T, {
        friction: 0.8, frictionAir: 0.08, restitution: 0, density: 0.05,
        angle: meta.angulo, inertia: Infinity, 
        render: { fillStyle: meta.color }
    });
    Body.setAngle(body, meta.angulo);
    return body;
});
Composite.add(world, piezasReales);

// ------------------------------------------------------------------
// 3. MOUSE Y FASE DE ARMADO (ACTO 1)
// ------------------------------------------------------------------
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(world, mouseConstraint);
render.mouse = mouse;

let tiempoLatido = 0;

Events.on(engine, 'afterUpdate', () => {
    if (estadoFase === 0) {
        let piezasAlineadas = 0;
        piezasReales.forEach((pieza, i) => {
            const estaAgarrada = mouseConstraint.body === pieza;
            const dist = Vector.magnitude(Vector.sub(pieza.position, { x: metas[i].x, y: metas[i].y }));

            if (dist < 40 && !estaAgarrada) {
                Body.setPosition(pieza, { x: metas[i].x, y: metas[i].y });
                Body.setVelocity(pieza, { x: 0, y: 0 }); 
                piezasAlineadas++;
            }
        });
        if (piezasAlineadas === 6) lograrEstabilidad();
    }
});

function lograrEstabilidad() {
    estadoFase = 1; 
    fantasmas.forEach(f => f.render.opacity = 0);
    Composite.remove(world, mouseConstraint); 

    piezasReales.forEach((pieza, i) => {
        Body.setStatic(pieza, true); // Indestructibles por ahora
        
        const anclaje = Constraint.create({
            pointA: { x: metas[i].x, y: metas[i].y },
            bodyB: pieza,
            pointB: { x: 0, y: 0 },
            stiffness: 1, 
            length: 0,
            render: { visible: false }
        });
        
        conexionesHexagono.push({ body: pieza, constraint: anclaje });
        Composite.add(world, anclaje);
    });

    setTimeout(() => {
        document.body.classList.remove("bloqueado");
        document.documentElement.classList.remove("bloqueado");
        ScrollTrigger.refresh();
    }, 500);
}

// ------------------------------------------------------------------
// 4. EL SCROLL (TENSIÓN) Y LA CAÑA
// ------------------------------------------------------------------
ScrollTrigger.create({
    trigger: ".scroll-spacer",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
        if (estadoFase < 1) return; 
        globalProgress = self.progress; 
        
        const uiTitle = document.getElementById("titulo-estado");
        if (uiTitle) uiTitle.style.opacity = Math.max(0, 0.2 - (globalProgress * 0.5));

        // EXACTAMENTE AL FINAL DEL SCROLL
        if (globalProgress >= 0.99 && estadoFase === 1) {
            activarBola();
        } 
        else if (globalProgress < 0.98 && estadoFase === 2) {
            desactivarBola();
        }
    }
});

Events.on(engine, 'beforeUpdate', () => {
    if (estadoFase === 0) {
        tiempoLatido += 0.05;
        fantasmas.forEach(f => f.render.opacity = 0.15 + Math.abs(Math.sin(tiempoLatido)) * 0.4);
    } 
    else if (estadoFase >= 1) {
        // TEMBLOR
        const shake = globalProgress * 3.5; 
        
        piezasReales.forEach((pieza, i) => {
            const tieneAnclaje = conexionesHexagono.find(c => c.body === pieza && c.constraint !== null);
            if (tieneAnclaje) {
                Body.setPosition(pieza, {
                    x: metas[i].x + (Math.random() - 0.5) * shake,
                    y: metas[i].y + (Math.random() - 0.5) * shake
                });
                Body.setAngle(pieza, metas[i].angulo);
            }
        });

        // MOVIMIENTO DE LA BOLA 
        if (estadoFase === 2) {
            cursorObjetivo.x += (mouse.position.x - cursorObjetivo.x) * 0.03;
            cursorObjetivo.y += (mouse.position.y - cursorObjetivo.y) * 0.03;
        } else {
            // Se retira al techo
            cursorObjetivo.x += (w / 2 - cursorObjetivo.x) * 0.05;
            cursorObjetivo.y += (-300 - cursorObjetivo.y) * 0.05;
        }
        
        cuerdaBola.pointA = { x: cursorObjetivo.x, y: cursorObjetivo.y };
    }
});

// ------------------------------------------------------------------
// 5. LIBERACIÓN Y DESTRUCCIÓN
// ------------------------------------------------------------------
function activarBola() {
    estadoFase = 2;
    
    // ¡EL TRUCO! Teletransportamos la bola un poquito abajo del techo
    // antes de volverla un objeto sólido, así no se queda atrapada.
    Body.setPosition(bolaIntervencion, { x: w / 2, y: 50 });
    Body.setVelocity(bolaIntervencion, { x: 0, y: 0 }); // Frenamos cualquier inercia
    cursorObjetivo = { x: w / 2, y: 50 };

    bolaIntervencion.isSensor = false; // Se vuelve física y cae
    
    // Quitamos la cualidad estática a las piezas que sigan vivas
    piezasReales.forEach((pieza) => {
        const tieneAnclaje = conexionesHexagono.find(c => c.body === pieza && c.constraint !== null);
        if (tieneAnclaje) {
            Body.setStatic(pieza, false);
            Body.setInertia(pieza, pieza.mass * 10);
        }
    });
}

function desactivarBola() {
    estadoFase = 1;
    bolaIntervencion.isSensor = true; // Fantasma de nuevo para subir sin chocar
    
    piezasReales.forEach((pieza) => {
        const tieneAnclaje = conexionesHexagono.find(c => c.body === pieza && c.constraint !== null);
        if (tieneAnclaje) {
            Body.setStatic(pieza, true);
        }
    });
}

// IMPACTO FÍSICO
Events.on(engine, 'collisionStart', (event) => {
    if (estadoFase !== 2) return;

    event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        if ((bodyA === bolaIntervencion && piezasReales.includes(bodyB)) || 
            (bodyB === bolaIntervencion && piezasReales.includes(bodyA))) {
            
            const piezaGolpeada = bodyA === bolaIntervencion ? bodyB : bodyA;
            const velocidadImpacto = Vector.magnitude(bolaIntervencion.velocity);

            // Si el golpe es intencional
            if (velocidadImpacto > 2.5) {
                const indice = conexionesHexagono.findIndex(c => c.body === piezaGolpeada);
                
                if (indice !== -1 && conexionesHexagono[indice].constraint !== null) {
                    Composite.remove(world, conexionesHexagono[indice].constraint);
                    conexionesHexagono[indice].constraint = null; 
                    
                    Body.applyForce(piezaGolpeada, piezaGolpeada.position, {
                        x: bolaIntervencion.velocity.x * 0.015,
                        y: bolaIntervencion.velocity.y * 0.015
                    });
                }
            }
        }
    });
});

// ------------------------------------------------------------------
// 6. RENDERIZADO VISUAL
// ------------------------------------------------------------------
Events.on(render, 'afterRender', () => {
    if (estadoFase < 1) return; 
    
    const ctx = render.context;
    
    ctx.save();
    // Hilo
    ctx.beginPath();
    ctx.moveTo(cursorObjetivo.x, cursorObjetivo.y);
    ctx.lineTo(bolaIntervencion.position.x, bolaIntervencion.position.y);
    ctx.strokeStyle = "rgba(166, 221, 229, 0.5)"; 
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bola
    ctx.beginPath();
    ctx.arc(bolaIntervencion.position.x, bolaIntervencion.position.y, 25, 0, 2 * Math.PI);
    
    let grad = ctx.createRadialGradient(
        bolaIntervencion.position.x - 5, bolaIntervencion.position.y - 5, 2,
        bolaIntervencion.position.x, bolaIntervencion.position.y, 25
    );
    grad.addColorStop(0, '#FEFBF2'); 
    grad.addColorStop(0.5, '#A6DDE5'); 
    grad.addColorStop(1, '#8C2041'); 
    
    ctx.fillStyle = grad;
    ctx.fill();
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FEFBF2'; 
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(bolaIntervencion.position.x - 5, bolaIntervencion.position.y - 5, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#FEFBF2";
    ctx.fill();
    ctx.restore();
});