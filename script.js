// ===================================
// LÓGICA DE LA GALERÍA CON LIGHTBOX (DELEGACIÓN DE EVENTOS)
// ===================================
const track = document.getElementById('track');
const lightbox = document.getElementById('lightbox');
const imagenAmpliada = document.getElementById('imagen-ampliada');
const cerrar = document.querySelector(".cerrar");

if (track && lightbox && imagenAmpliada) {
    track.addEventListener("click", (e) => {
        if (e.target.tagName === 'IMG') {
            lightbox.style.display = "flex";
            imagenAmpliada.src = e.target.src;
        }
    });
}

if (cerrar) {
    cerrar.addEventListener("click", () => {
        lightbox.style.display = "none";
    });
}

if (lightbox) {
    lightbox.addEventListener("click", (e) => {
        if(e.target === lightbox){
            lightbox.style.display = "none";
        }
    });
}

// ===================================
// LÓGICA DEL CARRUSEL (RESPONSIVO E INFINITO CON CLONES)
// ===================================
let index = 0; // Índice lógico activo (0 a 4)
const totalOriginals = 5; // Cantidad de imágenes originales
let cloned = false;

function inicializarClones() {
    const trackEl = document.getElementById('track');
    if (!trackEl || cloned) return;
    const originalItems = Array.from(trackEl.querySelectorAll('img'));
    if (originalItems.length !== totalOriginals) return;

    // Clonar las 2 últimas imágenes para colocarlas al inicio
    const cloneLast1 = originalItems[totalOriginals - 2].cloneNode(true);
    const cloneLast2 = originalItems[totalOriginals - 1].cloneNode(true);
    // Clonar las 2 primeras imágenes para colocarlas al final
    const cloneFirst1 = originalItems[0].cloneNode(true);
    const cloneFirst2 = originalItems[1].cloneNode(true);

    // Remover IDs de los clones para evitar duplicados en el DOM (mantienen sus clases de estilos)
    cloneLast1.removeAttribute('id');
    cloneLast2.removeAttribute('id');
    cloneFirst1.removeAttribute('id');
    cloneFirst2.removeAttribute('id');

    // Insertar clones al inicio del track (en orden inverso de inserción)
    trackEl.insertBefore(cloneLast2, trackEl.firstChild);
    trackEl.insertBefore(cloneLast1, trackEl.firstChild);
    // Añadir clones al final del track
    trackEl.appendChild(cloneFirst1);
    trackEl.appendChild(cloneFirst2);

    cloned = true;

    // Registrar la escucha de la transición para el ciclo infinito
    trackEl.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'transform') return;
        
        let itemsPerView = 3;
        if (window.innerWidth <= 768) {
            itemsPerView = 1;
        } else if (window.innerWidth <= 1024) {
            itemsPerView = 2;
        }

        if (index >= totalOriginals) {
            // Salto silencioso al inicio
            trackEl.style.transition = 'none';
            index = index % totalOriginals;
            const w = 100 / itemsPerView;
            const idealTrans = (50 - w/2) - (index + 2) * w;
            trackEl.style.transform = `translateX(${idealTrans}%)`;
            trackEl.offsetHeight; // Forzar reflow
            trackEl.style.transition = '';
        } else if (index < 0) {
            // Salto silencioso al final
            trackEl.style.transition = 'none';
            index = (index % totalOriginals + totalOriginals) % totalOriginals;
            const w = 100 / itemsPerView;
            const idealTrans = (50 - w/2) - (index + 2) * w;
            trackEl.style.transform = `translateX(${idealTrans}%)`;
            trackEl.offsetHeight; // Forzar reflow
            trackEl.style.transition = '';
        }
    });
}

function actualizarCarrusel() {
    const trackEl = document.getElementById('track');
    if (!trackEl) return;
    const items = trackEl.querySelectorAll('img');

    let itemsPerView = 3;
    if (window.innerWidth <= 768) {
        itemsPerView = 1;
    } else if (window.innerWidth <= 1024) {
        itemsPerView = 2;
    }

    // Índice lógico actual normalizado a [0, totalOriginals - 1]
    const currentLogicalIndex = (index % totalOriginals + totalOriginals) % totalOriginals;

    // Asignar clase active a las imágenes (originales y clones) correspondientes
    items.forEach((item, idx) => {
        // Dado que agregamos 2 clones al inicio, el índice físico se desfasa por 2.
        const itemLogicalIdx = (idx - 2 + totalOriginals) % totalOriginals;
        if (itemLogicalIdx === currentLogicalIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Sincronizar los puntos indicadores (Dots)
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        if (idx === currentLogicalIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Calcular traducción centrada sobre la posición física (index + 2)
    const w = 100 / itemsPerView;
    const idealTrans = (50 - w/2) - (index + 2) * w;
    trackEl.style.transform = `translateX(${idealTrans}%)`;
}

function mover(direccion) {
    index += direccion;
    actualizarCarrusel();
}

// Permitir saltar directamente a una imagen mediante los dots
window.irASlide = function(n) {
    index = n;
    actualizarCarrusel();
};

// Inicializar clones
inicializarClones();

// Ejecutar primera actualización sin transición para evitar deslizamiento inicial al cargar
const trackElInit = document.getElementById('track');
if (trackElInit) {
    trackElInit.style.transition = 'none';
    actualizarCarrusel();
    trackElInit.offsetHeight; // Forzar reflow
    trackElInit.style.transition = '';
}

// Resetear posición al cambiar tamaño de pantalla
window.addEventListener('resize', () => {
    index = 0;
    actualizarCarrusel();
});

// ===================================
// LÓGICA DEL MENÚ DE NAVEGACIÓN Y HOVER DE FUNDAMENTOS
// ===================================
document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll(".scroll-section");
    const navLinks = document.querySelectorAll(".nav-link");
    const franjaNav = document.getElementById("main-nav");
    const heroSlide = document.getElementById("slide-hero");

    if(heroSlide && franjaNav) {
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    franjaNav.classList.remove("is-visible");
                } else {
                    franjaNav.classList.add("is-visible");
                }
            });
        }, { root: null, rootMargin: "-10% 0px -90% 0px", threshold: 0 });
        
        heroObserver.observe(heroSlide);
    }

    if(sections.length > 0 && navLinks.length > 0) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => link.classList.remove("active-nav"));
                    const activeId = entry.target.id;
                    const activeLink = document.querySelector(`.nav-link[href="#${activeId}"]`);
                    if (activeLink) activeLink.classList.add("active-nav");
                }
            });
        }, { root: null, rootMargin: "-30% 0px -70% 0px", threshold: 0 });
        
        sections.forEach(sec => navObserver.observe(sec));
    }

    // INTERACCIÓN DE PLACEHOLDERS (Sección Fundamento)
    const placeholders = document.querySelectorAll('.placeholder');
    placeholders.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const randomRot = (Math.random() * 2 - 1).toFixed(2);
            const randomX = (Math.random() * 4 - 2).toFixed(2);   
            const randomY = (Math.random() * 4 - 2).toFixed(2);   
            
            el.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRot}deg)`;
            el.style.backgroundColor = 'rgba(254, 251, 242, 0.15)';
            el.style.color = '#FEFBF2';
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0px, 0px) rotate(0deg)';
            el.style.backgroundColor = 'rgba(254, 251, 242, 0.05)';
            el.style.color = 'rgba(254, 251, 242, 0.6)';
        });
    });

    // ===================================
    // LÓGICA DEL MENÚ MÓVIL (HAMBURGUESA)
    // ===================================
    const navToggle = document.getElementById("nav-toggle");
    const navList = document.getElementById("nav-list");

    if (navToggle && navList) {
        navToggle.addEventListener("click", () => {
            navToggle.classList.toggle("is-active");
            navList.classList.toggle("is-open");
            document.body.classList.toggle("no-scroll");
        });

        // Cerrar menú al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                navToggle.classList.remove("is-active");
                navList.classList.remove("is-open");
                document.body.classList.remove("no-scroll");
            });
        });
    }

    // ===================================
    // ACCESO RESTRINGIDO A CRÉDITOS (SÓLO VÍA NAV LINK)
    // ===================================
    const creditosLink = document.querySelector('.nav-link[href="#creditos"]');
    const footerCreditos = document.getElementById('creditos');

    // Inicializar flag global para evitar redirección de GSAP al ver créditos
    window.isViewingCredits = false;

    if (creditosLink && footerCreditos) {
        // Ocultar footer por defecto al iniciar
        footerCreditos.style.display = 'none';

        creditosLink.addEventListener('click', (e) => {
            e.preventDefault(); // Evitar el scroll nativo instantáneo

            // Indicar que se está visualizando créditos
            window.isViewingCredits = true;

            // Hacer visible el footer
            footerCreditos.style.display = 'block';

            // Desplazar suavemente hasta él
            setTimeout(() => {
                footerCreditos.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        });

        // Ocultar de nuevo cuando el usuario scrollea hacia arriba y queda fuera de la vista
        window.addEventListener('scroll', () => {
            if (footerCreditos.style.display === 'block') {
                const rect = footerCreditos.getBoundingClientRect();
                // Si la parte superior del footer está completamente fuera de la pantalla por abajo
                if (rect.top > window.innerHeight) {
                    footerCreditos.style.display = 'none';
                    window.isViewingCredits = false; // Resetear flag
                }
            }
        });
    }
});


// ==========================================
// MAGIA GSAP: AUTOMATIZAR PORTAL DE ENTRADA
// ==========================================
window.addEventListener("load", () => {
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        let haSaltado = false; 

        gsap.to(".figura-progreso", {
          strokeDashoffset: 0, 
          ease: "none",        
          scrollTrigger: {
            trigger: ".portal-transicion",
            parent: document.body,
            start: "top top",     
            end: "bottom bottom", 
            scrub: 2,             
            onUpdate: (self) => {
              const boton = document.getElementById("boton-portal");
              
              if (self.progress > 0.4) {
                boton.style.opacity = (self.progress - 0.4) * 2; 
                boton.style.transform = `scale(${0.9 + (self.progress - 0.4) * 0.2})`;
              } else {
                boton.style.opacity = "0";
              }

              // Redirigir solo si el progreso es completo, no se están viendo los créditos y se scrollea hacia abajo
              if (self.progress >= 0.99 && !haSaltado && !window.isViewingCredits && self.direction === 1) {
                haSaltado = true; 
                window.location.href = "juego.html";
              }
            }
          }
        });
    }
});