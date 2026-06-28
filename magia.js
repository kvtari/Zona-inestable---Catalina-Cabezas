/* ══════════════════════════════════════════
   ZONA INESTABLE — paraprobar.js
   Simulador de Plataforma Única de Balanceo (Figma Style)
   ══════════════════════════════════════════ */

(function () {
  // --- SINTETIZADOR DE SONIDO (WEB AUDIO API) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Sonido de lanzamiento / drop (whoosh corto)
  function playSoundDrop() {
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Sonido de impacto / aterrizaje (wood clack/thud)
  function playSoundLand(weight) {
    try {
      initAudio();
      if (!audioCtx) return;
      const currentTime = audioCtx.currentTime;
      const gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);
      
      const volume = Math.min(0.35, 0.08 + weight * 0.1);
      const duration = Math.min(0.28, 0.09 + weight * 0.07);
      const baseFreq = Math.max(85, 190 - weight * 45); 
      
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, currentTime + duration);
      oscGain.gain.setValueAtTime(volume, currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      
      // Ruido sordo del choque inicial
      const bufferSize = audioCtx.sampleRate * 0.015;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(volume * 0.7, currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.015);
      
      if (weight >= 1.0) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, currentTime);
        noiseNode.connect(filter);
        filter.connect(noiseGain);
      } else {
        noiseNode.connect(noiseGain);
      }
      
      noiseGain.connect(gainNode);
      
      osc.start(currentTime);
      osc.stop(currentTime + duration);
      noiseNode.start(currentTime);
      noiseNode.stop(currentTime + 0.015);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Sonido de crujido (wood creaking)
  let lastCreakTime = 0;
  function playSoundCreak(intensity) {
    try {
      initAudio();
      if (!audioCtx) return;
      const now = Date.now();
      if (now - lastCreakTime < 320 / intensity) return;
      lastCreakTime = now;
      
      const currentTime = audioCtx.currentTime;
      const clicks = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < clicks; i++) {
        const delay = i * 0.038 + Math.random() * 0.015;
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'sine';
        const freq = 550 + Math.random() * 700;
        osc.frequency.setValueAtTime(freq, currentTime + delay);
        
        const vol = 0.012 + intensity * 0.025;
        oscGain.gain.setValueAtTime(vol, currentTime + delay);
        oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + delay + 0.018);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start(currentTime + delay);
        osc.stop(currentTime + delay + 0.025);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Sonido de colapso de la torre
  function playSoundCollapse() {
    try {
      initAudio();
      if (!audioCtx) return;
      const currentTime = audioCtx.currentTime;
      const duration = 1.8;
      
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.022 * white)) / 1.022;
        lastOut = data[i];
        data[i] *= 3.8; 
      }
      
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.32, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, currentTime);
      filter.frequency.exponentialRampToValueAtTime(70, currentTime + duration);
      
      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      noiseNode.start(currentTime);
      noiseNode.stop(currentTime + duration);
      
      // Impactos extra de derrumbe
      for (let i = 0; i < 5; i++) {
        const delay = i * 0.28 + Math.random() * 0.12;
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(70 + Math.random() * 90, currentTime + delay);
        oscGain.gain.setValueAtTime(0.22 - i * 0.035, currentTime + delay);
        oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + delay + 0.25);
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start(currentTime + delay);
        osc.stop(currentTime + delay + 0.25);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Configuración de Canvas y Contexto
  const canvas = document.getElementById('tower-canvas');
  const ctx = canvas.getContext('2d');

  // Constantes de Proyección Isométrica
  const cos30 = Math.cos(Math.PI / 6);
  const sinProj = 0.23; // Ángulo de inclinación aplanado (estilo foto)

  // Dimensiones del Tablero
  const R_PLATFORM = 360; // Radio del hexágono de la plataforma (mucho más grande)
  const PLATFORM_THICKNESS = 16; // Grosor 3D de la plataforma
  const PLATFORM_BASE_Z = 200; // Altura de la plataforma sobre el suelo

  // Estado Global del Juego
  let G = {
    turno: 1,
    piezasAsentadas: 0,
    estado: 'Estable', // 'Estable', 'Inestable', 'Crítico', 'Colapso'
    condicionActiva: null,
    vientoX: 0,
    vientoY: 0,
    vibracionActiva: false,
    
    // Plataforma única
    platform: {
      z: PLATFORM_BASE_Z,
      swayX: 0,
      swayY: 0,
      tiltX: 0,
      tiltY: 0,
      color: '#FFFFFF',
      sideColor: '#D1CAB6',
      pieces: []
    },
    
    activePiece: null,
    pieceState: 'aiming', // 'aiming', 'falling', 'settled', 'collapsed'
    juegoTerminado: false,
    
    // Métricas de estabilidad
    deviation: 0,
    maxDeviation: 55, // Límite de balanceo para el colapso
    stabilityPercent: 0,
    cameraAngle: 0 // Ángulo horizontal de la cámara para rotación 3D
  };

  // Listas de animación
  let particles = [];
  let windLines = [];
  let fallingOffPieces = [];
  let cameraShake = 0;

  // Variables para la animación de colapso
  let collapsePlatform = null;
  let collapsePieces = [];
  let collapseFrame = 0;

  // Mouse
  let mouseX = 0;
  let mouseY = 0;

  /* ── MATEMÁTICAS DE PROYECCIÓN ── */

  // Proyecta coordenadas 3D (x, y, z) a pantalla 2D con rotación de cámara
  function isoProject(x, y, z) {
    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1));
    const centerY = canvas.height / (window.devicePixelRatio || 1) * 0.90;
    
    // Rotar coordenadas (x, y) en el plano horizontal según el ángulo de la cámara
    const cosA = Math.cos(G.cameraAngle || 0);
    const sinA = Math.sin(G.cameraAngle || 0);
    const rx = x * cosA - y * sinA;
    const ry = x * sinA + y * cosA;
    
    const sx = centerX + (rx - ry) * cos30;
    const sy = centerY + (rx + ry) * sinProj - z;
    return { x: sx, y: sy };
  }

  // Convierte coordenadas de pantalla 2D a coordenadas del plano horizontal en 3D (a una altura z dada)
  function screenToIso(mx, my, z) {
    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1));
    const centerY = canvas.height / (window.devicePixelRatio || 1) * 0.90;
    const dx = mx - centerX;
    const dy = my - centerY + z;
    
    // Obtener coordenadas en el plano isométrico rotado
    const rx = 0.5 * (dx / cos30 + dy / sinProj);
    const ry = 0.5 * (dy / sinProj - dx / cos30);
    
    // Aplicar rotación inversa para volver a coordenadas de mundo
    const cosA = Math.cos(-(G.cameraAngle || 0));
    const sinA = Math.sin(-(G.cameraAngle || 0));
    const px = rx * cosA - ry * sinA;
    const py = rx * sinA + ry * cosA;
    
    return { x: px, y: py };
  }

  // Calcula la profundidad (distancia a la cámara) de una pieza para el ordenamiento de renderizado (Painter's Algorithm)
  function getPieceDepth(p, isSettled) {
    const cosA = Math.cos(G.cameraAngle || 0);
    const sinA = Math.sin(G.cameraAngle || 0);
    const plat = G.platform;
    
    const tiltX = (plat.visualTiltX !== undefined) ? plat.visualTiltX : plat.tiltX;
    const tiltY = (plat.visualTiltY !== undefined) ? plat.visualTiltY : plat.tiltY;
    const swayX = (plat.visualSwayX !== undefined) ? plat.visualSwayX : plat.swayX;
    const swayY = (plat.visualSwayY !== undefined) ? plat.visualSwayY : plat.swayY;
    
    let wx, wy, wz;
    if (isSettled) {
      wx = swayX + p.x;
      wy = swayY + p.y;
      wz = plat.z - (p.x * tiltX + p.y * tiltY) + (p.zOffset || 0);
    } else {
      wx = p.x;
      wy = p.y;
      wz = p.z;
    }
    
    // Rotar coordenadas (wx, wy) en plano horizontal según ángulo de cámara
    const rx = wx * cosA - wy * sinA;
    const ry = wx * sinA + wy * cosA;
    // Usar el centro vertical de la pieza en Z
    const rz = wz + (p.height || 68) / 2;
    
    // Ecuación de profundidad del Painter's Algorithm para proyección paralela
    return rx + ry + 2 * sinProj * rz;
  }

  // Detecta si un punto (px, py) está dentro del hexágono regular de la plataforma
  function isPointInHexagon(px, py, cx, cy, R) {
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    
    const dist1 = dy;
    const dist2 = 0.866025 * dx + 0.5 * dy;
    const dist3 = Math.abs(-0.866025 * (px - cx) + 0.5 * (py - cy));
    
    const limit = R * 0.866025; // R * cos(30°)
    return dist1 <= limit && dist2 <= limit && dist3 <= limit;
  }

  // Propaga de forma recursiva los desplazamientos horizontales a los hijos apilados
  function propagateDisplacement(parentPiece, dx, dy) {
    const plat = G.platform;
    plat.pieces.forEach(p => {
      if (p.parentGroupId === parentPiece.id) {
        p.x += dx;
        p.y += dy;
        propagateDisplacement(p, dx, dy);
      }
    });
  }

  // Resuelve las colisiones horizontales de las columnas en la plataforma
  function resolverColisionesCirculos() {
    const plat = G.platform;
    const maxIterations = 15;
    const baseColRad = 28; // Radio base de columnas actualizado
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let resolvedAny = false;
      for (let i = 0; i < plat.pieces.length; i++) {
        const a = plat.pieces[i];
        const radA = baseColRad * a.size;
        
        for (let j = i + 1; j < plat.pieces.length; j++) {
          const b = plat.pieces[j];
          const radB = baseColRad * b.size;
          
          // Chocan si se solapan en su rango de altura Z
          const verticalOverlap = Math.max(a.zOffset, b.zOffset) < Math.min(a.zOffset + a.height, b.zOffset + b.height);
          
          if (verticalOverlap) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = radA + radB;
            
            if (dist < minDist) {
              const overlap = minDist - dist;
              const angle = dist > 0.01 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
              
              const totalW = a.weight + b.weight;
              const factorA = b.weight / totalW;
              const factorB = a.weight / totalW;
              
              const pushX = Math.cos(angle) * overlap;
              const pushY = Math.sin(angle) * overlap;
              
              const dispAx = -pushX * factorA;
              const dispAy = -pushY * factorA;
              const dispBx = pushX * factorB;
              const dispBy = pushY * factorB;
              
              a.x += dispAx;
              a.y += dispAy;
              propagateDisplacement(a, dispAx, dispAy);
              
              b.x += dispBx;
              b.y += dispBy;
              propagateDisplacement(b, dispBx, dispBy);
              
              resolvedAny = true;
            }
          }
        }
      }
      if (!resolvedAny) break;
    }
  }

  // Calcula la altura real de aterrizaje Z (plataforma o parte superior de otra pieza)
  function getLandingZ(wx, wy) {
    const plat = G.platform;
    const baseColRad = 28; // Radio base de columnas actualizado
    const lx = wx - plat.swayX;
    const ly = wy - plat.swayY;
    
    // Altura inicial es la de la plataforma inclinada en ese punto
    let targetZ = plat.z - (lx * plat.tiltX + ly * plat.tiltY);
    let landingOnPiece = null;
    
    plat.pieces.forEach(p => {
      const dx = lx - p.x;
      const dy = ly - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const radA = baseColRad * G.activePiece.size;
      const radB = baseColRad * p.size;
      
      if (dist < radA + radB) {
        const pTopZ = plat.z - (p.x * plat.tiltX + p.y * plat.tiltY) + p.height + p.zOffset;
        if (pTopZ > targetZ) {
          targetZ = pTopZ;
          landingOnPiece = p;
        }
      }
    });
    
    return { z: targetZ, piece: landingOnPiece };
  }

  // Genera un objeto de columna cayéndose al vacío
  function triggerFall(p, startZ) {
    G.fallingOffPieces.push({
      x: G.platform.swayX + p.x,
      y: G.platform.swayY + p.y,
      z: startZ,
      vz: 1.2,
      vx: (Math.random() - 0.5) * 4 + G.platform.tiltX * 55,
      vy: (Math.random() - 0.5) * 4 + G.platform.tiltY * 55,
      angle: p.angle,
      color: p.color,
      size: p.size,
      radius: p.radius || (28 * p.size),
      height: p.height || (88 * p.size),
      shapeType: p.shapeType,
      vertices: p.vertices,
      vRot: (Math.random() - 0.5) * 0.08,
      centerOffset: p.centerOffset || { x: 0, y: 0 }
    });
  }

  // Hace caer una pieza y a todos sus descendientes en cascada
  function makePieceFall(p) {
    const plat = G.platform;
    const currentZ = plat.z - (p.x * plat.tiltX + p.y * plat.tiltY) + p.zOffset;
    
    triggerFall(p, currentZ);
    
    const idx = plat.pieces.indexOf(p);
    if (idx !== -1) {
      plat.pieces.splice(idx, 1);
    }
    
    for (let i = plat.pieces.length - 1; i >= 0; i--) {
      const child = plat.pieces[i];
      if (child.parentGroupId === p.id) {
        makePieceFall(child);
      }
    }
  }

  /* ── CREACIÓN DE PIEZAS VERTICALES ── */

  // Genera la base de la pieza vertical (polígono de apoyo de pie)
  function generarVerticesPieza(shapeType, size) {
    const vertices = [];
    const baseRadius = 28 * size;
    // Base cuadrada regular de 4 vértices
    for (let i = 0; i < 4; i++) {
      const angle = (i * 2 * Math.PI) / 4 + Math.PI / 4;
      vertices.push({
        x: baseRadius * Math.cos(angle),
        y: baseRadius * Math.sin(angle)
      });
    }
    return vertices;
  }

  // Lista de hermosos colores coherentes con el mockup de Figma
  const COLORES_FIGMA = [
    '#EDE9DD', // Crema
    '#A6DDE5', // Celeste
    '#8C2041', // Vino
    '#F5BEBF'  // Rosa
  ];

  /* ── SISTEMA DE CONDICIONES ── */

  const CONDICIONES = [
    {
      id: 'peso',
      name: 'Masa Alterada',
      badgeClass: 'b-peso',
      desc: 'La pieza entrante altera su peso.',
      apply: (p) => {
        const val = Math.random() < 0.5 ? 1.0 : 0.3;
        p.weight = val;
        p.weightLabel = val === 1.0 ? 'PESO: 1.0 (Punta Pesada)' : 'PESO: 0.3 (Liviana Media)';
        if (val === 1.0) {
          p.shapeType = 'especial';
          p.vertices = generarVerticesPieza('especial', p.size);
        } else {
          p.shapeType = 'normal';
          p.vertices = generarVerticesPieza('normal', p.size);
        }
        
        const desc = document.getElementById('cond-desc');
        if (desc) {
          if (val === 1.0) {
            desc.textContent = 'Pieza en punta pesada (Peso: 1.0)';
          } else {
            desc.textContent = 'Pieza liviana media (Peso: 0.3)';
          }
        }
      }
    },
    {
      id: 'tamano',
      name: 'Dimensión Distorsionada',
      badgeClass: 'b-tamaño',
      desc: 'La pieza entrante altera su tamaño.',
      apply: (p) => {
        const val = Math.random() < 0.5 ? 2.0 : 0.4;
        p.size = val;
        p.weight = val === 2.0 ? 2.0 : 0.1;
        p.weightLabel = val === 2.0 ? 'TAMAÑO: Grande (2.0x) | PESO: 2.0 (Pesada Grande)' : 'TAMAÑO: Pequeño (0.4x) | PESO: 0.1 (Liviana Chica)';
        p.vertices = generarVerticesPieza(p.shapeType, p.size);
        
        const desc = document.getElementById('cond-desc');
        if (desc) {
          if (val === 2.0) {
            desc.textContent = 'Pieza pesada grande (Peso: 2.0)';
          } else {
            desc.textContent = 'Pieza pequeña liviana (Peso: 0.1)';
          }
        }
      }
    }
  ];

  function aplicarCondicionAleatoria() {
    const cond = CONDICIONES[Math.floor(Math.random() * CONDICIONES.length)];
    G.condicionActiva = cond;
    
    G.vientoX = 0;
    G.vientoY = 0;
    G.vibracionActiva = false;
    
    const badge = document.getElementById('cond-badge');
    const desc = document.getElementById('cond-desc');
    
    if (badge) {
      badge.textContent = cond.name;
      badge.className = `cond-badge ${cond.badgeClass}`;
    }
    if (desc) {
      desc.textContent = cond.desc;
    }
  }

  function spawnPieza() {
    aplicarCondicionAleatoria();
    
    const randomColor = COLORES_FIGMA[Math.floor(Math.random() * COLORES_FIGMA.length)];
    const shapeType = 'normal';
    
    const piece = {
      x: 0,
      y: 0,
      z: PLATFORM_BASE_Z + 240, // Altura en el aire dinámica
      angle: 0,
      weight: 1.0,
      size: 1.0,
      shapeType: shapeType,
      color: randomColor,
      centerOffset: { x: 0, y: 0 },
      rotates: false,
      rotationSpeed: 0,
      hasInertia: false,
      vertices: [],
      weightLabel: 'PESO: 1.0 (Normal)'
    };
    
    piece.vertices = generarVerticesPieza(piece.shapeType, 1.0);
    
    if (G.condicionActiva) {
      G.condicionActiva.apply(piece);
    }
    
    // Inicializar propiedades de física 3D y apilamiento
    piece.id = Math.random().toString(36).substr(2, 9);
    piece.radius = 28 * piece.size;
    piece.height = 88 * piece.size;
    piece.zOffset = 0;
    piece.zLevel = 0;
    piece.parentGroupId = null;
    
    G.activePiece = piece;
    G.pieceState = 'aiming';
  }

  /* ── CÁLCULO FÍSICO Y EQUILIBRIO (SINGLE PLATFORM) ── */

  function recalcularFisica() {
    let torqueX = 0;
    let torqueY = 0;
    let piecesWeight = 0;
    
    // Calcular torque total sobre la plataforma única
    G.platform.pieces.forEach(p => {
      torqueX += p.weight * p.x;
      torqueY += p.weight * p.y;
      piecesWeight += p.weight;
    });
    
    const M_PLATFORM = 8.0; // Masa propia de la plataforma
    const totalWeight = M_PLATFORM + piecesWeight;
    
    // Centro de Masa
    const comX = torqueX / totalWeight;
    const comY = torqueY / totalWeight;
    const comDist = Math.sqrt(comX * comX + comY * comY);
    
    // Desequilibrio total (distancia al origen)
    G.deviation = comDist;
    const stabilityPercent = Math.min(100, (comDist / G.maxDeviation) * 100);
    G.stabilityPercent = stabilityPercent;
    
    // El torque/CM mueve horizontalmente la plataforma y la inclina
    const swaySensitivity = 1.35;
    const tiltSensitivity = 0.004;
    
    G.platform.swayX = comX * swaySensitivity;
    G.platform.swayY = comY * swaySensitivity;
    
    G.platform.tiltX = comX * tiltSensitivity;
    G.platform.tiltY = comY * tiltSensitivity;
    
    // Inicializar propiedades visuales a sus valores físicos por defecto
    if (!G.wobbleTime || stabilityPercent <= 50) {
      G.platform.visualTiltX = G.platform.tiltX;
      G.platform.visualTiltY = G.platform.tiltY;
      G.platform.visualSwayX = G.platform.swayX;
      G.platform.visualSwayY = G.platform.swayY;
    }
    
    // Actualizar barras de estado
    const fill = document.getElementById('stability-fill');
    const badge = document.getElementById('stability-badge');
    const devEl = document.getElementById('stability-dev');
    
    if (fill) fill.style.width = `${stabilityPercent}%`;
    
    if (stabilityPercent < 30) {
      G.estado = 'Estable';
      if (badge) {
        badge.textContent = 'Estable';
        badge.className = 'stability-badge estable';
      }
      if (fill) fill.style.backgroundColor = '#2d5c3a';
    } else if (stabilityPercent < 70) {
      G.estado = 'Inestable';
      if (badge) {
        badge.textContent = 'Inestable';
        badge.className = 'stability-badge inestable';
      }
      if (fill) fill.style.backgroundColor = '#5a4215';
    } else {
      G.estado = 'Crítico';
      if (badge) {
        badge.textContent = 'Crítico';
        badge.className = 'stability-badge critico';
      }
      if (fill) fill.style.backgroundColor = '#8C2041';
    }
    
    if (devEl) {
      devEl.textContent = `${comDist.toFixed(1)} px`;
    }
    
    const stateHdr = document.getElementById('system-state');
    if (stateHdr) {
      stateHdr.textContent = G.estado;
      stateHdr.style.color = G.estado === 'Crítico' ? '#8C2041' : (G.estado === 'Inestable' ? '#5a4215' : '#52ABB8');
    }
    
    // Colapso por vuelco total
    if (stabilityPercent >= 100 && !G.juegoTerminado) {
      triggerCollapse();
    }
  }

  /* ── VISUALIZACIÓN DE EVENTOS EN PANELES ── */

  function logEvent(text, level = 'info') {
    const logList = document.getElementById('log-list');
    if (!logList) return;
    
    const entry = document.createElement('div');
    entry.className = `log-e ${level === 'alert' ? 'alert' : ''}`;
    
    const turnSpan = document.createElement('span');
    turnSpan.className = 'log-t';
    turnSpan.textContent = G.turno;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'log-txt';
    textSpan.textContent = text;
    
    entry.appendChild(turnSpan);
    entry.appendChild(textSpan);
    
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;
  }

  /* ── EFECTOS DE IMPACTO Y PARTICULAS ── */

  function spawnImpactParticles(x, y, z, color, count = 18) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        z: z,
        vx: (Math.random() - 0.5) * (count >= 30 ? 11 : (count > 18 ? 8 : 5)),
        vy: (Math.random() - 0.5) * (count >= 30 ? 11 : (count > 18 ? 8 : 5)),
        vz: 2.0 + Math.random() * (count >= 30 ? 9.0 : (count > 18 ? 6.5 : 3.5)),
        color: color,
        life: 1.0,
        decay: (count >= 30 ? 0.011 : (count > 18 ? 0.015 : 0.02)) + Math.random() * 0.03
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.vz -= 0.16;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles(ctx) {
    particles.forEach(p => {
      const screenPos = isoProject(p.x, p.y, p.z);
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 2.5 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  /* ── EFECTOS DE CORRIENTES DE VIENTO ── */

  function updateWind() {
    if (Math.abs(G.vientoX) > 0 || Math.abs(G.vientoY) > 0) {
      if (windLines.length < 10 && Math.random() < 0.2) {
        windLines.push({
          x: (Math.random() - 0.5) * 300 - G.vientoX * 45,
          y: (Math.random() - 0.5) * 300 - G.vientoY * 45,
          z: 100 + Math.random() * 260,
          length: 25 + Math.random() * 35
        });
      }
    }
    
    for (let i = windLines.length - 1; i >= 0; i--) {
      const wl = windLines[i];
      wl.x += G.vientoX * 1.5;
      wl.y += G.vientoY * 1.5;
      if (Math.abs(wl.x) > 350 || Math.abs(wl.y) > 350) {
        windLines.splice(i, 1);
      }
    }
  }

  function drawWind(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.0;
    windLines.forEach(wl => {
      const pStart = isoProject(wl.x, wl.y, wl.z);
      const pEnd = isoProject(wl.x - G.vientoX * 4, wl.y - G.vientoY * 4, wl.z);
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    });
  }

  /* ── RENDERIZADO DE LA PLATAFORMA ÚNICA (CHECKERBOARD CONCENTRIC) ── */

  function drawPlatform(ctx, plat = G.platform) {
    const tiltX = (plat.visualTiltX !== undefined) ? plat.visualTiltX : plat.tiltX;
    const tiltY = (plat.visualTiltY !== undefined) ? plat.visualTiltY : plat.tiltY;
    const swayX = (plat.visualSwayX !== undefined) ? plat.visualSwayX : plat.swayX;
    const swayY = (plat.visualSwayY !== undefined) ? plat.visualSwayY : plat.swayY;

    const centerWorld = { x: swayX, y: swayY };
    
    // Radios concéntricos para la cuadrícula
    const radii = [0, R_PLATFORM * 0.32, R_PLATFORM * 0.68, R_PLATFORM];
    const rot = plat.rotation || 0;
    
    // 1. Dibujar caras laterales 3D (espesor de la plataforma)
    // Para ello, obtenemos los 6 vértices exteriores
    const extVertices = [];
    const extBottomVertices = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + rot;
      const lx = R_PLATFORM * Math.cos(angle);
      const ly = R_PLATFORM * Math.sin(angle);
      const wx = centerWorld.x + lx;
      const wy = centerWorld.y + ly;
      const wz = plat.z - (lx * tiltX + ly * tiltY);
      
      extVertices.push({ x: wx, y: wy, z: wz });
      extBottomVertices.push({ x: wx, y: wy, z: wz - PLATFORM_THICKNESS });
    }
    
    const projectedExt = extVertices.map(v => isoProject(v.x, v.y, v.z));
    const projectedExtBottom = extBottomVertices.map(v => isoProject(v.x, v.y, v.z - PLATFORM_THICKNESS));
    
    // Pintar los laterales de atrás hacia adelante
    const sides = [];
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      const avgY = (projectedExt[i].y + projectedExt[next].y) / 2;
      sides.push({ i, next, avgY });
    }
    sides.sort((a, b) => a.avgY - b.avgY);
    
    sides.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(projectedExt[s.i].x, projectedExt[s.i].y);
      ctx.lineTo(projectedExt[s.next].x, projectedExt[s.next].y);
      ctx.lineTo(projectedExtBottom[s.next].x, projectedExtBottom[s.next].y);
      ctx.lineTo(projectedExtBottom[s.i].x, projectedExtBottom[s.i].y);
      ctx.closePath();
      ctx.fillStyle = plat.sideColor;
      ctx.fill();
      
      const shade = 0.25 * Math.sin((s.i * Math.PI) / 3 + rot);
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, shade)})`;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(140, 32, 65, 0.12)';
      ctx.stroke();
    });

    // 2. Dibujar la superficie superior con la grilla checkerboard rectangular recortada
    ctx.save();
    
    // Crear el camino de recorte del hexágono
    ctx.beginPath();
    ctx.moveTo(projectedExt[0].x, projectedExt[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(projectedExt[i].x, projectedExt[i].y);
    }
    ctx.closePath();
    ctx.clip();
    
    // Parámetros de la grilla checkerboard rectangular de 7x6
    const R = R_PLATFORM;
    const W = R * 0.866025; // R * cos(30)
    
    const rows = 7;
    const cols = 6;
    
    const dx = (2 * R) / rows;
    const dy = (2 * W) / cols;
    
    for (let r = 0; r < rows; r++) {
      const xStart = -R + r * dx;
      const xEnd = -R + (r + 1) * dx;
      
      for (let c = 0; c < cols; c++) {
        const yStart = -W + c * dy;
        const yEnd = -W + (c + 1) * dy;
        
        // Puntos locales del rectángulo
        const pLoc = [
          { x: xStart, y: yStart },
          { x: xEnd, y: yStart },
          { x: xEnd, y: yEnd },
          { x: xStart, y: yEnd }
        ];
        
        // Rotar localmente si la plataforma rota (rot)
        const proj = pLoc.map(p => {
          const rx = p.x * Math.cos(rot) - p.y * Math.sin(rot);
          const ry = p.x * Math.sin(rot) + p.y * Math.cos(rot);
          const wx = centerWorld.x + rx;
          const wy = centerWorld.y + ry;
          const wz = plat.z - (rx * tiltX + ry * tiltY);
          return isoProject(wx, wy, wz);
        });
        
        // Determinar color de la grilla checkerboard (el patrón alterna)
        const isPink = (r + c) % 2 === 0;
        
        ctx.beginPath();
        ctx.moveTo(proj[0].x, proj[0].y);
        ctx.lineTo(proj[1].x, proj[1].y);
        ctx.lineTo(proj[2].x, proj[2].y);
        ctx.lineTo(proj[3].x, proj[3].y);
        ctx.closePath();
        
        ctx.fillStyle = isPink ? '#F5BEBF' : '#EDE9DD'; // Colores oficiales Figma: Rosa y Crema
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(140, 32, 65, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    // Contorno exterior grueso de la plataforma
    ctx.beginPath();
    ctx.moveTo(projectedExt[0].x, projectedExt[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(projectedExt[i].x, projectedExt[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#8C2041'; // Borde oficial frambuesa
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  // Dibuja una pieza de pie (Columna Vertical 3D)
  function drawPiece(ctx, p, isSettled = true, isGhost = false) {
    const H_PIECE = p.height || (88 * p.size); // Altura dinámica de la pieza
    const plat = G.platform;
    
    const tiltX = (plat.visualTiltX !== undefined) ? plat.visualTiltX : plat.tiltX;
    const tiltY = (plat.visualTiltY !== undefined) ? plat.visualTiltY : plat.tiltY;
    const swayX = (plat.visualSwayX !== undefined) ? plat.visualSwayX : plat.swayX;
    const swayY = (plat.visualSwayY !== undefined) ? plat.visualSwayY : plat.swayY;
    
    const cosR = Math.cos(p.angle);
    const sinR = Math.sin(p.angle);
    
    // Determinar Z-base y centro absoluto
    let wx_center, wy_center, wz_base;
    if (isSettled) {
      wx_center = swayX + p.x;
      wy_center = swayY + p.y;
      wz_base = plat.z - (p.x * tiltX + p.y * tiltY) + (p.zOffset || 0);
    } else {
      wx_center = p.x;
      wy_center = p.y;
      wz_base = p.z;
    }
    
    if (p.shapeType === 'especial') {
      // 3 capas de vértices: base (z=wz_base), medio (z=wz_base + H_PIECE*0.77), tope (z=wz_base + H_PIECE)
      const bottomVertices = [];
      const midVertices = [];
      const topVertices = [];
      
      p.vertices.forEach(v => {
        let rx = v.x * cosR - v.y * sinR;
        let ry = v.x * sinR + v.y * cosR;
        const ox = p.centerOffset ? p.centerOffset.x : 0;
        const oy = p.centerOffset ? p.centerOffset.y : 0;
        rx += ox;
        ry += oy;
        
        bottomVertices.push({ x: wx_center + rx, y: wy_center + ry, z: wz_base });
        midVertices.push({ x: wx_center + rx, y: wy_center + ry, z: wz_base + H_PIECE * 0.77 });
        topVertices.push({ x: wx_center + rx * 0.35, y: wy_center + ry * 0.35, z: wz_base + H_PIECE });
      });
      
      const projBottom = bottomVertices.map(v => isoProject(v.x, v.y, v.z));
      const projMid = midVertices.map(v => isoProject(v.x, v.y, v.z));
      const projTop = topVertices.map(v => isoProject(v.x, v.y, v.z));
      
      // Dibujar la base (cubo principal inferior, 4 caras)
      const sidesOrder = [];
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        const avgY = (projMid[i].y + projMid[next].y) / 2;
        sidesOrder.push({ i, next, avgY });
      }
      sidesOrder.sort((a, b) => a.avgY - b.avgY);
      
      sidesOrder.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(projMid[s.i].x, projMid[s.i].y);
        ctx.lineTo(projMid[s.next].x, projMid[s.next].y);
        ctx.lineTo(projBottom[s.next].x, projBottom[s.next].y);
        ctx.lineTo(projBottom[s.i].x, projBottom[s.i].y);
        ctx.closePath();
        ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.08)' : p.color;
        ctx.fill();
        const shade = isGhost ? 0 : (0.28 * Math.sin((s.i * Math.PI) / 2));
        if (shade > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
          ctx.fill();
        }
        ctx.strokeStyle = isGhost ? 'rgba(140, 32, 65, 0.25)' : '#1A1110';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      
      // Dibujar la corona piramidal superior (caras de mid a top)
      sidesOrder.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(projTop[s.i].x, projTop[s.i].y);
        ctx.lineTo(projTop[s.next].x, projTop[s.next].y);
        ctx.lineTo(projMid[s.next].x, projMid[s.next].y);
        ctx.lineTo(projMid[s.i].x, projMid[s.i].y);
        ctx.closePath();
        ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.08)' : p.color;
        ctx.fill();
        const shade = isGhost ? 0 : (0.28 * Math.sin((s.i * Math.PI) / 2) + 0.05);
        if (shade > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
          ctx.fill();
        }
        ctx.strokeStyle = isGhost ? 'rgba(140, 32, 65, 0.25)' : '#1A1110';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      
      // Tapa superior
      ctx.beginPath();
      ctx.moveTo(projTop[0].x, projTop[0].y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(projTop[i].x, projTop[i].y);
      }
      ctx.closePath();
      
      if (isGhost) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(140, 32, 65, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#1A1110';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
      
    } else {
      // normal: prisma de 4 caras regular
      const bottomVertices = [];
      const topVertices = [];
      
      p.vertices.forEach(v => {
        let rx = v.x * cosR - v.y * sinR;
        let ry = v.x * sinR + v.y * cosR;
        const ox = p.centerOffset ? p.centerOffset.x : 0;
        const oy = p.centerOffset ? p.centerOffset.y : 0;
        rx += ox;
        ry += oy;
        
        bottomVertices.push({ x: wx_center + rx, y: wy_center + ry, z: wz_base });
        topVertices.push({ x: wx_center + rx, y: wy_center + ry, z: wz_base + H_PIECE });
      });
      
      const projBottom = bottomVertices.map(v => isoProject(v.x, v.y, v.z));
      const projTop = topVertices.map(v => isoProject(v.x, v.y, v.z));
      
      const sidesOrder = [];
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        const avgY = (projTop[i].y + projTop[next].y) / 2;
        sidesOrder.push({ i, next, avgY });
      }
      sidesOrder.sort((a, b) => a.avgY - b.avgY);
      
      sidesOrder.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(projTop[s.i].x, projTop[s.i].y);
        ctx.lineTo(projTop[s.next].x, projTop[s.next].y);
        ctx.lineTo(projBottom[s.next].x, projBottom[s.next].y);
        ctx.lineTo(projBottom[s.i].x, projBottom[s.i].y);
        ctx.closePath();
        ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.08)' : p.color;
        ctx.fill();
        const shade = isGhost ? 0 : (0.28 * Math.sin((s.i * Math.PI) / 2));
        if (shade > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
          ctx.fill();
        }
        ctx.strokeStyle = isGhost ? 'rgba(140, 32, 65, 0.25)' : '#1A1110';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      
      // Tapa superior
      ctx.beginPath();
      ctx.moveTo(projTop[0].x, projTop[0].y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(projTop[i].x, projTop[i].y);
      }
      ctx.closePath();
      
      if (isGhost) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(140, 32, 65, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#1A1110';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }
    
    // Si la gravedad está desplazada, marcar la cruz en la tapa superior
    if (!isGhost && p.centerOffset && (p.centerOffset.x !== 0 || p.centerOffset.y !== 0)) {
      const wzTop = wz_base + H_PIECE;
      const cgProj = isoProject(wx_center, wy_center, wzTop + 2);
      ctx.strokeStyle = '#8C2041';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cgProj.x - 5, cgProj.y);
      ctx.lineTo(cgProj.x + 5, cgProj.y);
      ctx.moveTo(cgProj.x, cgProj.y - 5);
      ctx.lineTo(cgProj.x, cgProj.y + 5);
      ctx.stroke();
    }
  }

  // Función auxiliar de compatibilidad para navegadores que no admiten roundRect
  function drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  // Dibuja los deslizadores/indicadores de inclinación laterales (Figma Style)
  function drawSideSliders(ctx) {
    const margin = 26;
    const barW = 10;
    const barH = 260;
    
    const centerY = canvas.height / (2 * (window.devicePixelRatio || 1));
    const startY = centerY - barH / 2;
    
    // 1. Slider Izquierdo (Oscuro - Inclinación X / Pitch)
    const leftX = margin;
    // Fondo del slider
    ctx.beginPath();
    drawRoundRect(ctx, leftX, startY, barW, barH, 5);
    ctx.fillStyle = '#1A1110'; // Color oscuro
    ctx.fill();
    
    // Marcador móvil izquierdo
    // Mapeo de la inclinación en X
    const tiltPctX = Math.max(-1, Math.min(1, G.platform.tiltX / 0.22));
    const leftMarkerY = centerY + (tiltPctX * (barH / 2 - 15));
    ctx.beginPath();
    drawRoundRect(ctx, leftX - 3, leftMarkerY - 10, barW + 6, 20, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#8C2041';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // 2. Slider Derecho (Blanco - Inclinación Y / Roll)
    const rightX = canvas.width / (window.devicePixelRatio || 1) - margin - barW;
    ctx.beginPath();
    drawRoundRect(ctx, rightX, startY, barW, barH, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 32, 65, 0.15)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Marcador móvil derecho
    const tiltPctY = Math.max(-1, Math.min(1, G.platform.tiltY / 0.22));
    const rightMarkerY = centerY + (tiltPctY * (barH / 2 - 15));
    ctx.beginPath();
    drawRoundRect(ctx, rightX - 3, rightMarkerY - 10, barW + 6, 20, 3);
    ctx.fillStyle = '#8C2041'; // Frambuesa
    ctx.fill();
  }

  // Dibuja la escena y todos los elementos
  function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    // Efecto sismo / sacudida
    if (cameraShake > 0.08) {
      const shakeX = (Math.random() - 0.5) * cameraShake;
      const shakeY = (Math.random() - 0.5) * cameraShake;
      ctx.translate(shakeX, shakeY);
    }
    
    const plat = G.platform;
    
    const tiltX = (plat.visualTiltX !== undefined) ? plat.visualTiltX : plat.tiltX;
    const tiltY = (plat.visualTiltY !== undefined) ? plat.visualTiltY : plat.tiltY;
    const swayX = (plat.visualSwayX !== undefined) ? plat.visualSwayX : plat.swayX;
    const swayY = (plat.visualSwayY !== undefined) ? plat.visualSwayY : plat.swayY;
    
    // 1. Dibujar el anclaje / base en el suelo (Z = 0) - ELIMINADO para ocultar el final del pilar
    
    // 2. Dibujar el pilar central (Prisma 3D vertical largo que se extiende fuera de la pantalla)
    const R_PILLAR = 18;
    const zEnd = plat.z - PLATFORM_THICKNESS;
    
    const topPillar = [
      { x: swayX + R_PILLAR, y: swayY + R_PILLAR, z: zEnd },
      { x: swayX - R_PILLAR, y: swayY + R_PILLAR, z: zEnd },
      { x: swayX - R_PILLAR, y: swayY - R_PILLAR, z: zEnd },
      { x: swayX + R_PILLAR, y: swayY - R_PILLAR, z: zEnd }
    ];
    const bottomPillar = [
      { x: R_PILLAR, y: R_PILLAR, z: -400 },
      { x: -R_PILLAR, y: R_PILLAR, z: -400 },
      { x: -R_PILLAR, y: -R_PILLAR, z: -400 },
      { x: R_PILLAR, y: -R_PILLAR, z: -400 }
    ];
    
    const projTopP = topPillar.map(v => isoProject(v.x, v.y, v.z));
    const projBotP = bottomPillar.map(v => isoProject(v.x, v.y, v.z));
    
    const pillarSides = [];
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      const avgY = (projTopP[i].y + projTopP[next].y) / 2;
      pillarSides.push({ i, next, avgY });
    }
    pillarSides.sort((a, b) => a.avgY - b.avgY);
    
    pillarSides.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(projTopP[s.i].x, projTopP[s.i].y);
      ctx.lineTo(projTopP[s.next].x, projTopP[s.next].y);
      ctx.lineTo(projBotP[s.next].x, projBotP[s.next].y);
      ctx.lineTo(projBotP[s.i].x, projBotP[s.i].y);
      ctx.closePath();
      ctx.fillStyle = '#D7C49E'; // Color madera clara de la foto
      ctx.fill();
      
      const shade = 0.3 * Math.sin((s.i * Math.PI) / 2) + 0.1;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, shade)})`;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(140, 32, 65, 0.15)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    });
    
    // 3. Dibujar la Plataforma Única
    drawPlatform(ctx);
    
    // 3.5 Dibujar la línea de puntería discontinua ANTES de las piezas
    // para que las piezas que queden en el frente la tapen de forma realista
    if (G.activePiece && !G.juegoTerminado && G.pieceState === 'aiming') {
      const localX = G.activePiece.x - swayX;
      const localY = G.activePiece.y - swayY;
      const shadowZ = plat.z - (localX * tiltX + localY * tiltY);
      const centerProj = isoProject(G.activePiece.x, G.activePiece.y, shadowZ);
      const pieceProj = isoProject(G.activePiece.x, G.activePiece.y, G.activePiece.z);
      
      ctx.beginPath();
      ctx.moveTo(pieceProj.x, pieceProj.y);
      ctx.lineTo(centerProj.x, centerProj.y);
      ctx.strokeStyle = 'rgba(140, 32, 65, 0.35)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // 4. Recolectar todos los elementos renderizables en la escena 3D
    const renderItems = [];
    
    // 4.1 Piezas asentadas en la plataforma
    plat.pieces.forEach(p => {
      renderItems.push({
        piece: p,
        isSettled: true,
        isGhost: false,
        depth: getPieceDepth(p, true)
      });
    });
    
    // 4.2 Piezas cayéndose al vacío
    G.fallingOffPieces.forEach(p => {
      renderItems.push({
        piece: p,
        isSettled: false,
        isGhost: false,
        depth: getPieceDepth(p, false)
      });
    });
    
    // 4.3 Pieza activa y su fantasma de puntería
    if (G.activePiece && !G.juegoTerminado) {
      if (G.pieceState === 'aiming') {
        const localX = G.activePiece.x - swayX;
        const localY = G.activePiece.y - swayY;
        const shadowZ = plat.z - (localX * tiltX + localY * tiltY);
        const ghostPiece = { ...G.activePiece, x: localX, y: localY, z: shadowZ };
        renderItems.push({
          piece: ghostPiece,
          isSettled: true,
          isGhost: true,
          depth: getPieceDepth(ghostPiece, true)
        });
      }
      
      renderItems.push({
        piece: G.activePiece,
        isSettled: false,
        isGhost: false,
        depth: getPieceDepth(G.activePiece, false)
      });
    }
    
    // 5. Ordenar todos los elementos en base a su profundidad 3D real (de atrás hacia adelante)
    renderItems.sort((a, b) => a.depth - b.depth);
    
    // 6. Dibujar cada elemento en el orden de profundidad resultante
    renderItems.forEach(item => {
      drawPiece(ctx, item.piece, item.isSettled, item.isGhost);
    });
    
    // 6. Dibujar partículas y viento
    drawParticles(ctx);
    drawWind(ctx);
    
    ctx.restore();
    
    // 7. Dibujar los sliders laterales (no afectados por sacudidas de cámara) - ELIMINADO
  }

  // Dibuja el colapso explosivo de la plataforma única
  function drawCollapseScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 0. Dibujar el pilar central de pie (estático en el origen)
    const R_PILLAR = 18;
    const zEnd = PLATFORM_BASE_Z - PLATFORM_THICKNESS;
    
    const topPillar = [
      { x: R_PILLAR, y: R_PILLAR, z: zEnd },
      { x: -R_PILLAR, y: R_PILLAR, z: zEnd },
      { x: -R_PILLAR, y: -R_PILLAR, z: zEnd },
      { x: R_PILLAR, y: -R_PILLAR, z: zEnd }
    ];
    const bottomPillar = [
      { x: R_PILLAR, y: R_PILLAR, z: -400 },
      { x: -R_PILLAR, y: R_PILLAR, z: -400 },
      { x: -R_PILLAR, y: -R_PILLAR, z: -400 },
      { x: R_PILLAR, y: -R_PILLAR, z: -400 }
    ];
    
    const projTopP = topPillar.map(v => isoProject(v.x, v.y, v.z));
    const projBotP = bottomPillar.map(v => isoProject(v.x, v.y, v.z));
    
    const pillarSides = [];
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      const avgY = (projTopP[i].y + projTopP[next].y) / 2;
      pillarSides.push({ i, next, avgY });
    }
    pillarSides.sort((a, b) => a.avgY - b.avgY);
    
    pillarSides.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(projTopP[s.i].x, projTopP[s.i].y);
      ctx.lineTo(projTopP[s.next].x, projTopP[s.next].y);
      ctx.lineTo(projBotP[s.next].x, projBotP[s.next].y);
      ctx.lineTo(projBotP[s.i].x, projBotP[s.i].y);
      ctx.closePath();
      ctx.fillStyle = '#D7C49E'; // Color madera clara del pilar
      ctx.fill();
      
      const shade = 0.3 * Math.sin((s.i * Math.PI) / 2) + 0.1;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, shade)})`;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(140, 32, 65, 0.15)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    });
    
    // 1. Dibujar la plataforma inclinándose y cayendo (con su diseño cuadriculado completo)
    const plat = collapsePlatform;
    if (plat) {
      drawPlatform(ctx, plat);
    }
    
    // 2. Dibujar todas las columnas saliendo despedidas y rotando (ordenadas por profundidad)
    const sortedCollapsePieces = [...collapsePieces].sort((a, b) => {
      const depthA = getPieceDepth(a, false);
      const depthB = getPieceDepth(b, false);
      return depthA - depthB;
    });
    sortedCollapsePieces.forEach(p => {
      drawPiece(ctx, p, false, false);
    });
    
    // Partículas
    drawParticles(ctx);
    
    // Sliders - ELIMINADO
  }

  /* ── BUCLE DE JUEGO Y ACTUALIZACIÓN ── */

  function update() {
    if (!G.juegoTerminado) {
      if (G.stabilityPercent > 50) {
        // Tambaleo visual gradual (crece linealmente de 0 a 1 a partir de 50% de inestabilidad)
        const wobbleIntensity = (G.stabilityPercent - 50) / 50; 
        G.wobbleTime = (G.wobbleTime || 0) + 0.35; // Frecuencia del tambaleo
        
        const maxWobbleAngle = 0.015; // Ángulo máximo de oscilación visual (~0.85 grados)
        const maxWobbleSway = 4.0; // Desplazamiento máximo en px
        
        G.platform.visualTiltX = G.platform.tiltX + Math.sin(G.wobbleTime) * maxWobbleAngle * wobbleIntensity;
        G.platform.visualTiltY = G.platform.tiltY + Math.cos(G.wobbleTime * 1.3) * maxWobbleAngle * wobbleIntensity;
        G.platform.visualSwayX = G.platform.swayX + Math.sin(G.wobbleTime) * maxWobbleSway * wobbleIntensity;
        G.platform.visualSwayY = G.platform.swayY + Math.cos(G.wobbleTime * 1.3) * maxWobbleSway * wobbleIntensity;
        
        playSoundCreak(wobbleIntensity);
      } else {
        G.platform.visualTiltX = G.platform.tiltX;
        G.platform.visualTiltY = G.platform.tiltY;
        G.platform.visualSwayX = G.platform.swayX;
        G.platform.visualSwayY = G.platform.swayY;
        G.wobbleTime = 0;
      }
    } else {
      if (collapsePlatform) {
        collapsePlatform.visualTiltX = collapsePlatform.tiltX;
        collapsePlatform.visualTiltY = collapsePlatform.tiltY;
        collapsePlatform.visualSwayX = collapsePlatform.swayX;
        collapsePlatform.visualSwayY = collapsePlatform.swayY;
      }
    }

    if (G.juegoTerminado) {
      if (G.pieceState === 'collapsed') {
        // Simular caída física de colapso
        if (collapsePlatform) {
          collapsePlatform.swayX += collapsePlatform.vx;
          collapsePlatform.swayY += collapsePlatform.vy;
          collapsePlatform.z += collapsePlatform.vz;
          collapsePlatform.vz -= 0.35; // Gravedad
          collapsePlatform.tiltX += collapsePlatform.vRotX;
          collapsePlatform.tiltY += collapsePlatform.vRotY;
          collapsePlatform.rotation += 0.01;
        }
        
        collapsePieces.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vz -= 0.35;
          p.angle += p.vRot;
        });
        
        updateParticles();
        collapseFrame++;
        
        if (collapseFrame >= 90) {
          const modal = document.getElementById('collapse-modal');
          if (modal) modal.classList.remove('oculto');
          
          const fPieces = document.getElementById('final-pieces');
          const fTurns = document.getElementById('final-turns');
          if (fPieces) fPieces.textContent = G.piezasAsentadas;
          if (fTurns) fTurns.textContent = G.turno;
          
          const canvasEl = document.getElementById('tower-canvas');
          if (canvasEl) canvasEl.classList.remove('vibrando-tablero');
        }
      }
      return;
    }
    
    updateWind();
    
    if (G.vibracionActiva) {
      cameraShake = 3.0;
    } else {
      cameraShake *= 0.85;
    }
    
    const plat = G.platform;
    if (G.pieceState === 'assembling') {
      // Caída de la plataforma sobre el pilar
      const targetZ = PLATFORM_BASE_Z;
      const fallSpeed = 12.0;
      plat.z -= fallSpeed;
      if (plat.z <= targetZ) {
        plat.z = targetZ;
        // Impacto y destellos contra el pilar
        spawnImpactParticles(0, 0, targetZ - 12, '#D1CAB6', 40);
        playSoundLand(2.5); // Sonido de impacto pesado para el ensamblado
        cameraShake = 20.0;
        plat.bounceZ = -20.0;
        G.pieceState = 'settled';
        logEvent('Plataforma ensamblada sobre el pilar.', 'info');
        setTimeout(() => {
          spawnPieza();
        }, 700);
      }
    } else {
      if (plat.bounceZ) {
        plat.bounceZ *= -0.75;
        if (Math.abs(plat.bounceZ) < 0.15) plat.bounceZ = 0;
        plat.z = PLATFORM_BASE_Z + plat.bounceZ;
      } else {
        plat.z = PLATFORM_BASE_Z;
      }
    }
    
    updateParticles();
    
    if (G.activePiece) {
      if (G.pieceState === 'aiming') {
        const target = screenToIso(mouseX, mouseY, G.activePiece.z);
        
        // Limitar distancia de puntería relativa al centro oscilante de la plataforma
        const localTargetX = target.x - plat.swayX;
        const localTargetY = target.y - plat.swayY;
        const dist = Math.sqrt(localTargetX * localTargetX + localTargetY * localTargetY);
        
        let targetX = target.x;
        let targetY = target.y;
        if (dist > R_PLATFORM - 12) {
          targetX = plat.swayX + (localTargetX / dist) * (R_PLATFORM - 12);
          targetY = plat.swayY + (localTargetY / dist) * (R_PLATFORM - 12);
        }
        
        // Interpolación para desplazamiento suave
        G.activePiece.x += (targetX - G.activePiece.x) * 0.16;
        G.activePiece.y += (targetY - G.activePiece.y) * 0.16;
        
      } else if (G.pieceState === 'falling') {
        let fallSpeed = 4.5;
        if (G.activePiece.weight === 0.1) {
          fallSpeed = 2.5; // Pieza pequeña liviana (1.60 s a 60 FPS)
        } else if (G.activePiece.weight === 0.3) {
          fallSpeed = 3.08; // Pieza liviana media (1.30 s a 60 FPS)
        } else if (G.activePiece.weight === 1.0 && G.activePiece.shapeType === 'especial') {
          fallSpeed = 6.45; // Pieza mediana en punta (0.62 s a 60 FPS)
        } else if (G.activePiece.weight === 2.0) {
          fallSpeed = 7.14; // Pieza pesada grande (0.56 s a 60 FPS)
        }
        G.activePiece.z -= fallSpeed; // Velocidad de descenso
        
        // Viento
        G.activePiece.x += G.vientoX * 0.25;
        G.activePiece.y += G.vientoY * 0.25;
        
        // Rotación
        if (G.activePiece.rotates) {
          G.activePiece.angle += G.activePiece.rotationSpeed;
        }
        
        // Evitar que la pieza activa atraviese lateralmente a otras piezas (especialmente gigantes)
        plat.pieces.forEach(p => {
          const dx = G.activePiece.x - (plat.swayX + p.x);
          const dy = G.activePiece.y - (plat.swayY + p.y);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radA = G.activePiece.radius;
          const radB = p.radius;
          const minDist = radA + radB;
          
          if (dist < minDist) {
            // Verificar si hay solapamiento vertical real
            const pTopZ = plat.z - (p.x * plat.tiltX + p.y * plat.tiltY) + p.height + p.zOffset;
            const pBotZ = plat.z - (p.x * plat.tiltX + p.y * plat.tiltY) + p.zOffset;
            
            // Si la pieza activa se solapa verticalmente con el rango del bloque asentado
            if (G.activePiece.z < pTopZ && G.activePiece.z + G.activePiece.height > pBotZ) {
              const angle = Math.atan2(dy, dx);
              const pushDist = minDist - dist + 1.0; // 1px de holgura extra
              G.activePiece.x += Math.cos(angle) * pushDist;
              G.activePiece.y += Math.sin(angle) * pushDist;
            }
          }
        });
        
        // Comprobar colisión
        const landingInfo = getLandingZ(G.activePiece.x, G.activePiece.y);
        const targetZ = landingInfo.z;
        
        if (G.activePiece.z <= targetZ + 5 && G.activePiece.z >= targetZ - 18) {
          if (isPointInHexagon(G.activePiece.x, G.activePiece.y, plat.swayX, plat.swayY, R_PLATFORM)) {
            // ¡ASENTADA CON ÉXITO!
            const parent = landingInfo.piece;
            let lx = G.activePiece.x - plat.swayX;
            let ly = G.activePiece.y - plat.swayY;
            let zOffset = 0;
            let zLevel = 0;
            let parentGroupId = null;
            
            if (parent) {
              const dx = lx - parent.x;
              const dy = ly - parent.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < 14) {
                // APILADO EXACTO: snaps to parent
                lx = parent.x;
                ly = parent.y;
                zOffset = parent.zOffset + parent.height;
                zLevel = parent.zLevel + 1;
                parentGroupId = parent.id;
                logEvent(`Pieza apilada en nivel ${zLevel}.`, 'info');
              } else {
                // RESBALÓN: empujar horizontalmente y seguir cayendo
                const angle = Math.atan2(ly - parent.y, lx - parent.x);
                G.activePiece.x += Math.cos(angle) * 5.0;
                G.activePiece.y += Math.sin(angle) * 5.0;
                logEvent('La pieza resbala por el borde...', 'info');
                return; // Detenemos el asentamiento en este frame
              }
            } else {
              logEvent(`Pieza asentada en plataforma.`, 'info');
            }
            
            const landedPiece = {
              id: G.activePiece.id,
              x: lx,
              y: ly,
              weight: G.activePiece.weight,
              size: G.activePiece.size,
              radius: G.activePiece.radius,
              height: G.activePiece.height,
              shapeType: G.activePiece.shapeType,
              color: G.activePiece.color,
              angle: G.activePiece.angle,
              centerOffset: { ...G.activePiece.centerOffset },
              vertices: G.activePiece.vertices,
              zOffset: zOffset,
              zLevel: zLevel,
              parentGroupId: parentGroupId
            };
            
            if (G.activePiece.hasInertia) {
              const slideForce = 5200;
              landedPiece.slideTargetX = landedPiece.x + plat.tiltX * slideForce;
              landedPiece.slideTargetY = landedPiece.y + plat.tiltY * slideForce;
              landedPiece.isSliding = true;
              landedPiece.slideProgress = 0;
            }
            
            plat.pieces.push(landedPiece);
            playSoundLand(G.activePiece.weight);
            
            if (G.activePiece.weight >= 2.0 || G.activePiece.shapeType === 'especial') {
              spawnImpactParticles(G.activePiece.x, G.activePiece.y, targetZ, G.activePiece.color, 50);
              cameraShake = 24.0;
              plat.bounceZ = -24.0;
              plat.z = PLATFORM_BASE_Z + plat.bounceZ;
              logEvent('¡IMPACTO PESADO! La plataforma tiembla.', 'alert');
            } else if (G.activePiece.weight <= 0.3) {
              spawnImpactParticles(G.activePiece.x, G.activePiece.y, targetZ, G.activePiece.color, 6);
              cameraShake = 1.5;
            } else {
              spawnImpactParticles(G.activePiece.x, G.activePiece.y, targetZ, G.activePiece.color);
              cameraShake = 7.0;
            }
            
            G.piezasAsentadas++;
            const pcEl = document.getElementById('pieces-count');
            if (pcEl) pcEl.textContent = G.piezasAsentadas;
            
            G.activePiece = null;
            G.pieceState = 'settled';
            
            recalcularFisica();
            resolverColisionesCirculos();
            
            if (!G.juegoTerminado) {
              G.turno++;
              const turnEl = document.getElementById('n-turno');
              if (turnEl) turnEl.textContent = G.turno;
              
              setTimeout(spawnPieza, 700);
            }
          }
        }
        
        // Caída al vacío de la pieza activa
        if (G.activePiece && G.activePiece.z < 40) {
          logEvent('Pieza perdida en el vacío.', 'alert');
          spawnImpactParticles(G.activePiece.x, G.activePiece.y, 0, '#8C2041');
          
          G.activePiece = null;
          G.pieceState = 'settled';
          
          G.turno++;
          const turnEl = document.getElementById('n-turno');
          if (turnEl) turnEl.textContent = G.turno;
          
          setTimeout(spawnPieza, 700);
        }
      }
    }
    
    // Procesar inercias de deslizamiento de las columnas de pie
    for (let i = plat.pieces.length - 1; i >= 0; i--) {
      const p = plat.pieces[i];
      if (p.isSliding) {
        const dx = (p.slideTargetX - p.x) * 0.08;
        const dy = (p.slideTargetY - p.y) * 0.08;
        p.x += dx;
        p.y += dy;
        propagateDisplacement(p, dx, dy);
        p.slideProgress += 0.08;
        
        if (p.slideProgress >= 1.0) {
          p.isSliding = false;
        }
      }
    }

    // Resolver colisiones entre columnas
    resolverColisionesCirculos();

    // Comprobar si alguna columna cae fuera de la plataforma o pierde su apoyo
    for (let i = plat.pieces.length - 1; i >= 0; i--) {
      const p = plat.pieces[i];
      let falls = false;
      if (p.zLevel === 0) {
        if (!isPointInHexagon(p.x, p.y, 0, 0, R_PLATFORM)) {
          falls = true;
        }
      } else {
        const parent = plat.pieces.find(parentPiece => parentPiece.id === p.parentGroupId);
        if (!parent) {
          falls = true;
        } else {
          const dx = p.x - parent.x;
          const dy = p.y - parent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > (p.radius + parent.radius)) {
            falls = true;
          }
        }
      }
      
      if (falls) {
        logEvent('Una pieza cayó al vacío por desequilibrio.', 'alert');
        makePieceFall(p);
        recalcularFisica();
      }
    }

    // Actualizar física de las columnas cayendo al vacío
    for (let i = G.fallingOffPieces.length - 1; i >= 0; i--) {
      const fp = G.fallingOffPieces[i];
      fp.x += fp.vx;
      fp.y += fp.vy;
      fp.z += fp.vz;
      fp.vz -= 0.25; // gravedad
      fp.angle += fp.vRot;
      if (fp.z < -100) {
        G.fallingOffPieces.splice(i, 1);
      }
    }
  }

  function checkResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.floor(rect.width * dpr);
    const targetHeight = Math.floor(rect.height * dpr);
    
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
  }

  function resizeCanvas() {
    checkResize();
  }

  function loop() {
    checkResize();
    update();
    if (G.juegoTerminado && G.pieceState === 'collapsed') {
      drawCollapseScene();
    } else {
      drawScene();
    }
    requestAnimationFrame(loop);
  }

  function initJuego() {
    G = {
      turno: 1,
      piezasAsentadas: 0,
      estado: 'Estable',
      condicionActiva: null,
      vientoX: 0,
      vientoY: 0,
      vibracionActiva: false,
      platform: {
        z: PLATFORM_BASE_Z + 400, // Comienza arriba en el aire para la animación de entrada
        bounceZ: 0,
        swayX: 0,
        swayY: 0,
        tiltX: 0,
        tiltY: 0,
        color: '#FFFFFF',
        sideColor: '#D1CAB6',
        pieces: []
      },
      activePiece: null,
      pieceState: 'assembling', // Estado inicial de ensamblado
      juegoTerminado: false,
      deviation: 0,
      maxDeviation: 55,
      stabilityPercent: 0,
      fallingOffPieces: [],
      cameraAngle: (typeof G !== 'undefined' && G) ? G.cameraAngle : 0
    };
    
    particles = [];
    windLines = [];
    fallingOffPieces = [];
    collapsePlatform = null;
    collapsePieces = [];
    collapseFrame = 0;
    cameraShake = 0;
    
    const modal = document.getElementById('collapse-modal');
    if (modal) modal.classList.add('oculto');
    
    const turnEl = document.getElementById('n-turno');
    const pcEl = document.getElementById('pieces-count');
    const systemState = document.getElementById('system-state');
    const logList = document.getElementById('log-list');
    
    if (turnEl) turnEl.textContent = 1;
    if (pcEl) pcEl.textContent = 0;
    if (systemState) {
      systemState.textContent = 'Estable';
      systemState.style.color = '#52ABB8';
    }
    if (logList) logList.innerHTML = '';
    
    const canvasEl = document.getElementById('tower-canvas');
    if (canvasEl) canvasEl.classList.remove('vibrando-tablero');
    
    logEvent('Iniciando ensamblado de la plataforma...', 'info');
    
    recalcularFisica();
    // spawnPieza() se llamará al finalizar la animación de ensamblado
  }

  function triggerCollapse() {
    playSoundCollapse();
    G.juegoTerminado = true;
    G.pieceState = 'collapsed';
    collapseFrame = 0;
    
    const plat = G.platform;
    collapsePlatform = {
      z: plat.z,
      swayX: plat.swayX,
      swayY: plat.swayY,
      tiltX: plat.tiltX,
      tiltY: plat.tiltY,
      color: plat.color,
      sideColor: plat.sideColor,
      vx: (Math.random() - 0.5) * 3 + (plat.tiltX * 15),
      vy: (Math.random() - 0.5) * 3 + (plat.tiltY * 15),
      vz: -3.0 - Math.random() * 2.0, // Cae hacia abajo inmediatamente
      vRotX: (plat.tiltX > 0 ? 1 : -1) * (0.05 + Math.random() * 0.05),
      vRotY: (plat.tiltY > 0 ? 1 : -1) * (0.05 + Math.random() * 0.05),
      rotation: 0
    };
    
    plat.pieces.forEach(p => {
      const wx = plat.swayX + p.x;
      const wy = plat.swayY + p.y;
      const wz = plat.z - (p.x * plat.tiltX + p.y * plat.tiltY) + (p.zOffset || 0);
      
      collapsePieces.push({
        x: wx,
        y: wy,
        z: wz,
        vx: (Math.random() - 0.5) * 4 + (plat.tiltX * 20),
        vy: (Math.random() - 0.5) * 4 + (plat.tiltY * 20),
        vz: -1.0 - Math.random() * 3.0, // Caen hacia abajo inmediatamente
        angle: p.angle,
        vRot: (Math.random() - 0.5) * 0.08,
        vertices: p.vertices,
        color: p.color,
        size: p.size,
        height: p.height,
        radius: p.radius,
        shapeType: p.shapeType
      });
    });
    
    if (G.activePiece) {
      collapsePieces.push({
        x: G.activePiece.x,
        y: G.activePiece.y,
        z: G.activePiece.z,
        vx: (Math.random() - 0.5) * 3 + G.vientoX * 0.25,
        vy: (Math.random() - 0.5) * 3 + G.vientoY * 0.25,
        vz: -2.0, // Cae hacia abajo
        angle: G.activePiece.angle,
        vRot: (Math.random() - 0.5) * 0.05,
        vertices: G.activePiece.vertices,
        color: G.activePiece.color,
        size: G.activePiece.size,
        height: G.activePiece.height,
        radius: G.activePiece.radius,
        shapeType: G.activePiece.shapeType
      });
      G.activePiece = null;
    }
    
    logEvent('Desequilibrio estructural crítico. El sistema colapsó.', 'alert');
    
    const canvasEl = document.getElementById('tower-canvas');
    if (canvasEl) canvasEl.classList.add('vibrando-tablero');
    
    // Partículas de desastre
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 160,
        y: (Math.random() - 0.5) * 160,
        z: 100 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        vz: 3 + Math.random() * 6,
        color: COLORES_FIGMA[i % COLORES_FIGMA.length],
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02
      });
    }
  }

  // Variables auxiliares para arrastrar la cámara (rotación estilo carrusel)
  let isDraggingCamera = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragHasMoved = false;

  // Eventos del mouse
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isDraggingCamera = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragLastX = e.clientX;
      dragHasMoved = false;
      canvas.style.cursor = 'grabbing';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width) / dpr;
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height) / dpr;
    
    if (isDraggingCamera) {
      const dx = e.clientX - dragLastX;
      G.cameraAngle = (G.cameraAngle || 0) + dx * 0.008; // Sensibilidad de rotación
      dragLastX = e.clientX;
      
      const dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
      if (dist > 5) {
        dragHasMoved = true;
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isDraggingCamera) {
      isDraggingCamera = false;
      canvas.style.cursor = 'grab';
      
      // Si el movimiento fue de menos de 5px, se considera clic de soltado
      if (!dragHasMoved) {
        if (G.activePiece && G.pieceState === 'aiming' && !G.juegoTerminado) {
          G.pieceState = 'falling';
          playSoundDrop();
          logEvent('Liberando pieza. Iniciando caída...', 'info');
        }
      }
    }
  });

  // Espacio para soltar
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (G.activePiece && G.pieceState === 'aiming' && !G.juegoTerminado) {
        G.pieceState = 'falling';
        playSoundDrop();
        logEvent('Liberando pieza. Iniciando caída...', 'info');
      }
    }
  });

  window.addEventListener('resize', resizeCanvas);

  // Exponer al HTML
  window.reiniciarExperiencia = function () {
    initJuego();
  };

  window.volverLanding = function () {
    window.location.href = 'index.html';
  };

  // Inicialización
  resizeCanvas();
  initJuego();
  loop();

})();