/* ═══════════════════════════════════════════════════
   TERAL IT — Adaptive Particle System
   Pega este bloque justo antes de </body> en index.html
   (o cópialo a tu archivo JS principal)
═══════════════════════════════════════════════════ */
(function () {
    const canvas = document.getElementById('bgc');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* ── Secciones y sus colores de partícula ──────────
       light  → fondo blanco/claro  → partículas moradas
       dark   → fondo oscuro/negro  → partículas lila claro
    ─────────────────────────────────────────────────── */
    const SECTION_COLORS = {
        hero: { r: 107, g: 33, b: 168, a: 0.18 },  // blanco  → morado
        clients: { r: 107, g: 33, b: 168, a: 0.12 },
        services: { r: 107, g: 33, b: 168, a: 0.16 },
        cases: { r: 107, g: 33, b: 168, a: 0.14 },
        partners: { r: 107, g: 33, b: 168, a: 0.16 },
        process: { r: 107, g: 33, b: 168, a: 0.14 },
        cta: { r: 206, g: 147, b: 216, a: 0.22 },  // oscuro  → lila claro
    };

    const DEFAULT_COLOR = SECTION_COLORS.hero;

    /* ── Estado actual del color (se interpola suavemente) */
    let current = { ...DEFAULT_COLOR };
    let target = { ...DEFAULT_COLOR };

    /* ── Partículas ──────────────────────────────────── */
    const COUNT = 55;
    const particles = [];

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function createParticle(randomY) {
        return {
            x: rand(0, canvas.width),
            y: randomY ? rand(0, canvas.height) : rand(-20, canvas.height + 20),
            vx: rand(-0.18, 0.18),
            vy: rand(-0.22, -0.08),
            radius: rand(1.5, 4.2),
            opacity: rand(0.35, 1),
            pulse: rand(0, Math.PI * 2),
            pulseSpd: rand(0.008, 0.02),
        };
    }

    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < COUNT; i++) particles.push(createParticle(true));
    }

    /* ── Resize ──────────────────────────────────────── */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', () => { resize(); initParticles(); });
    resize();
    initParticles();

    /* ── Detectar sección activa ─────────────────────── */
    function getActiveSection() {
        const mid = window.scrollY + window.innerHeight * 0.5;
        const ids = ['cta', 'process', 'partners', 'cases', 'services', 'clients', 'hero'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            const top = el.offsetTop;
            const bot = top + el.offsetHeight;
            if (mid >= top && mid < bot) return id;
        }
        return 'hero';
    }

    /* ── Interpolar color ────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    function lerpColor(spd) {
        current.r = lerp(current.r, target.r, spd);
        current.g = lerp(current.g, target.g, spd);
        current.b = lerp(current.b, target.b, spd);
        current.a = lerp(current.a, target.a, spd);
    }

    /* ── Loop ────────────────────────────────────────── */
    let lastSection = '';

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* Actualizar target de color */
        const active = getActiveSection();
        if (active !== lastSection) {
            target = { ...(SECTION_COLORS[active] || DEFAULT_COLOR) };
            lastSection = active;
        }
        lerpColor(0.025);

        const { r, g, b, a } = current;

        particles.forEach(p => {
            /* Movimiento */
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpd;

            /* Respiración suave */
            const scale = 1 + Math.sin(p.pulse) * 0.18;
            const rad = p.radius * scale;
            const alpha = p.opacity * (0.75 + Math.sin(p.pulse + 1) * 0.25);

            /* Reciclar al salir */
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = rand(0, canvas.width);
            }
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;

            /* Dibujar */
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${(a * alpha).toFixed(3)})`;
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    draw();
})();