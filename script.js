// ===================================
// LÓGICA DE LA GALERÍA CON LIGHTBOX
// ===================================
const imagenes = document.querySelectorAll(".grid img");
const lightbox = document.getElementById("lightbox");
const imagenAmpliada = document.getElementById("imagen-ampliada");
const cerrar = document.querySelector(".cerrar");

imagenes.forEach(imagen => {
    imagen.addEventListener("click", () => {
        lightbox.style.display = "flex";
        imagenAmpliada.src = imagen.src;
    });
});

cerrar.addEventListener("click", () => {
    lightbox.style.display = "none";
});

lightbox.addEventListener("click", (e) => {
    if(e.target === lightbox){
        lightbox.style.display = "none";
    }
});

// ===================================
// LÓGICA DEL CARRUSEL
// ===================================
let index = 0;
function mover(direccion) {
    const track = document.getElementById('track');
    index += direccion;
    
    if (index < 0) index = 0;
    if (index > 2) index = 2; 
    
    track.style.transform = `translateX(-${index * 33.33}%)`;
}

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
});

// =================================================
// ESTRUCTURA INESTABLE HERO: FÍSICA Y TENSIÓN
// =================================================
document.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector(".hero");
    const grid = document.querySelector(".hero-grid-bg");
    const zLetter = document.querySelector(".z-tension");
    const inestableWord = document.querySelector(".inestable-tension"); 

    if (!hero || !zLetter || typeof gsap === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    let tlHero = gsap.timeline({
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=800",
            pin: true,
            scrub: 1.5,
            anticipatePin: 1
        }
    });

    if (grid) {
        tlHero.to(grid, { opacity: 1, duration: 0.1 }, 0);
    }

    tlHero.to([zLetter, inestableWord], {
        rotation: 3.5,       
        skewX: -2,           
        y: 4,                
        ease: "power2.inOut",
        duration: 0.6        
    }, 0);

    tlHero.to([zLetter, inestableWord], {
        rotation: 1.5,       
        skewX: 0,            
        y: 2,                
        ease: "power1.out",
        duration: 0.4        
    }, 0.6);
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

              if (self.progress >= 0.99 && !haSaltado) {
                haSaltado = true; 
                window.location.href = "juego.html";
              }
            }
          }
        });
    }
});