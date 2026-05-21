/* ── CURSOR ── */
const cur = document.getElementById('cur');
const ring = document.getElementById('curR');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function loop() {
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
    rx += (mx - rx) * .11;
    ry += (my - ry) * .11;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
})();


/* ── CANVAS PARTICLES (reutilizable, DPR-aware) ── */

const PAL = [
    [123, 31, 162], [171, 71, 188], [206, 147, 216], [74, 20, 140],
    [149, 117, 205], [103, 58, 183], [156, 39, 176], [186, 104, 200]
];
function rnd(a, b) { return a + Math.random() * (b - a); }

class Dot {
    constructor(W, H, fresh) {
        this.W = W; this.H = H;
        if (fresh) {
            const s = Math.random();
            if (s < .25) { this.x = -8; this.y = rnd(0, H); }
            else if (s < .5) { this.x = W + 8; this.y = rnd(0, H); }
            else if (s < .75) { this.y = -8; this.x = rnd(0, W); }
            else { this.y = H + 8; this.x = rnd(0, W); }
        } else {
            this.x = rnd(0, W); this.y = rnd(0, H);
        }
        this.vx = rnd(-.32, .32); this.vy = rnd(-.32, .32);
        this.sz = rnd(.8, 3);
        this.col = PAL[Math.floor(Math.random() * PAL.length)];
        this.a = rnd(.1, .65);
        this.life = 0; this.ml = rnd(300, 650);
        this.sq = Math.random() > .8;
        this.rot = rnd(0, Math.PI * 2); this.rv = rnd(-.012, .012);
    }

    step(mx, my) {
        this.life++;
        if (this.life > this.ml) return false;
        const dx = mx - this.x, dy = my - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160 && d > 0) {
            const f = (160 - d) / 160 * .015;
            this.vx -= dx / d * f; this.vy -= dy / d * f;
        }
        this.vy += .0004;
        this.vx *= .997; this.vy *= .997;
        this.x += this.vx; this.y += this.vy;
        this.rot += this.rv;
        return !(this.x < -20 || this.x > this.W + 20 || this.y < -20 || this.y > this.H + 20);
    }

    draw(ctx) {
        const p = this.life / this.ml;
        const fa = this.a * (p < .07 ? p / .07 : p > .88 ? (1 - p) / .12 : 1);
        const [r, g, b] = this.col;
        ctx.save();
        ctx.globalAlpha = fa;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        if (this.sq) {
            ctx.translate(this.x, this.y); ctx.rotate(this.rot);
            ctx.fillRect(-this.sz, -this.sz, this.sz * 2, this.sz * 2);
        } else {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

/* ─── Hero (canvas fijo, pantalla completa) ─── */
{
    const cv = document.getElementById('bgc');
    const ctx = cv.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    let W, H;

    function rsz() {
        W = innerWidth; H = innerHeight;
        cv.width = W * DPR; cv.height = H * DPR;
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.scale(DPR, DPR);
    }
    rsz();
    window.addEventListener('resize', rsz);

    let dots = [];
    let pmx = W / 2, pmy = H / 2;
    document.addEventListener('mousemove', e => { pmx = e.clientX; pmy = e.clientY; });

    for (let i = 0; i < 200; i++) {
        const d = new Dot(W, H, false); d.life = Math.random() * d.ml; dots.push(d);
    }

    function conn() {
        for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 80) {
                const [r, g, b] = dots[i].col;
                ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 80) * .09})`;
                ctx.lineWidth = .3; ctx.stroke();
            }
        }
    }

    (function frame() {
        ctx.clearRect(0, 0, W, H); conn();
        dots = dots.filter(d => { const ok = d.step(pmx, pmy); if (ok) d.draw(ctx); return ok; });
        while (dots.length < 200) dots.push(new Dot(W, H, true));
        requestAnimationFrame(frame);
    })();
}

/* ─── Secciones adicionales ─── */
function makeParticles(cv, count = 120) {
    const ctx = cv.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    let W = 0, H = 0;
    let dots = [], mx = 0, my = 0, active = false;

    function rsz() {
        // Leer el tamaño CSS real del canvas (que sigue a su sección)
        const rect = cv.getBoundingClientRect();
        W = rect.width || cv.parentElement.offsetWidth;
        H = rect.height || cv.parentElement.offsetHeight;
        cv.width = W * DPR; cv.height = H * DPR;
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        ctx.scale(DPR, DPR);
        // Resiembra puntos con las nuevas dimensiones
        dots = [];
        for (let i = 0; i < count; i++) {
            const d = new Dot(W, H, false); d.life = Math.random() * d.ml; dots.push(d);
        }
    }

    // Espera a que el DOM esté pintado para leer dimensiones correctas
    requestAnimationFrame(() => { rsz(); });
    window.addEventListener('resize', rsz);

    document.addEventListener('mousemove', e => {
        const r = cv.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
    });

    // Solo anima cuando la sección es visible
    new IntersectionObserver(([entry]) => {
        active = entry.isIntersecting;
        if (active && dots.length === 0) rsz(); // por si acaso
    }, { threshold: 0.05 }).observe(cv.parentElement);

    function conn() {
        for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 80) {
                const [r, g, b] = dots[i].col;
                ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 80) * .09})`;
                ctx.lineWidth = .3; ctx.stroke();
            }
        }
    }

    (function frame() {
        requestAnimationFrame(frame);
        if (!active || W === 0) return;
        ctx.clearRect(0, 0, W, H); conn();
        dots = dots.filter(d => { const ok = d.step(mx, my); if (ok) d.draw(ctx); return ok; });
        while (dots.length < count) dots.push(new Dot(W, H, true));
    })();
}

document.querySelectorAll('.sec-particles').forEach(cv => makeParticles(cv, 120));

/* ── NAV ── */
const nav = document.getElementById('nav');
const SCROLL_THRESHOLD = 80;

window.addEventListener('scroll', () => {
    if (nav) {
        nav.classList.toggle('visible', scrollY > SCROLL_THRESHOLD);
    }
});

/* ── MOBILE MENU ── */
const burger = document.getElementById('nBurger');
if (burger) {
    burger.addEventListener('click', () => {
        if (nav) {
            nav.classList.toggle('open');
            // Prevent scroll when menu is open
            document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
        }
    });
}

// Close menu when clicking a link
document.querySelectorAll('.nLinks a').forEach(link => {
    link.addEventListener('click', () => {
        if (nav) {
            nav.classList.remove('open');
        }
        document.body.style.overflow = '';
    });
});


/* ── CARRUSEL DE LOGOS ── */
const clientLogos = [
    { src: 'src/img/clientes/balcru.png', alt: 'Balcru' },
    { src: 'src/img/clientes/bode.png', alt: 'BodeVidrio' },
    { src: 'src/img/clientes/entorno (1).png', alt: 'EntornoLab' },
    { src: 'src/img/clientes/w.png', alt: 'W BRAND' },
    { src: 'src/img/clientes/grupotinta.png', alt: 'Grupo Tinta' },
    { src: 'src/img/clientes/growa.svg', alt: 'GROWA' },
    { src: 'src/img/clientes/diligencias.png', alt: 'La casa de las Diligencias' },
    { src: 'src/img/clientes/parapente.png', alt: 'Parapente Logistics' },
];

const track = document.getElementById('track');
if (track) {
    [...clientLogos, ...clientLogos].forEach(({ src, alt }) => {
        const div = document.createElement('div');
        div.className = 'cl-item';

        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.loading = 'lazy';
        img.onerror = function () {
            this.style.display = 'none';
            const span = document.createElement('span');
            span.textContent = alt;
            span.style.cssText = 'font-weight:600;font-size:14px;color:var(--ink2);';
            div.appendChild(span);
        };

        div.appendChild(img);
        track.appendChild(div);
    });
}


/* ── REVEALS ON SCROLL ── */
const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
    });
}, { threshold: .1 });

document.querySelectorAll('.reveal, .cCard, .pStep').forEach(el => obs.observe(el));
document.querySelectorAll('.cCard').forEach((c, i) => c.style.transitionDelay = (i * .1) + 's');
document.querySelectorAll('.pStep').forEach((c, i) => c.style.transitionDelay = (i * .11) + 's');


/* ── COUNT UP ── */
document.querySelectorAll('.mV').forEach(el => {
    const target = parseInt(el.dataset.t);
    const suffix = el.dataset.s;

    const o2 = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            let elapsed = 0;
            const dur = 1100;
            const step = dt => {
                elapsed += dt;
                const p = Math.min(elapsed / dur, 1);
                const ease = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(ease * target) + suffix;
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            o2.unobserve(el);
        }
    }, { threshold: .8 });

    o2.observe(el);
});


/* ── HERO PARALLAX ── */
const hero = document.getElementById('hero');
if (hero) {
    document.addEventListener('mousemove', e => {
        const x = (e.clientX / innerWidth - .5) * 5;
        const y = (e.clientY / innerHeight - .5) * 2.5;
        hero.style.transform = `translate(${x * .06}px, ${y * .06}px)`;
    });
}


/* ═══════════════════════════════════════════════════
   SERVICES — Magnetic tilt + spotlight + icon draw
═══════════════════════════════════════════════════ */

document.querySelectorAll('.svcCard').forEach((c, i) => {
    c.style.transitionDelay = (i * .07) + 's';
});

const svcRevealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('vis');
            const strokes = e.target.querySelectorAll('.sIco svg *');
            strokes.forEach((el, idx) => {
                try {
                    const len = typeof el.getTotalLength === 'function'
                        ? el.getTotalLength() : 120;
                    el.style.strokeDasharray = len;
                    el.style.strokeDashoffset = len;
                    setTimeout(() => {
                        el.style.transition = `stroke-dashoffset .7s ${idx * .1}s cubic-bezier(.23,1,.32,1)`;
                        el.style.strokeDashoffset = '0';
                    }, 80);
                } catch (_) { }
            });
            svcRevealObs.unobserve(e.target);
        }
    });
}, { threshold: .18 });

document.querySelectorAll('.svcCard').forEach(card => svcRevealObs.observe(card));

/* ── Service cards: magnetic tilt + spotlight ── */
document.querySelectorAll('.svcCard').forEach(card => {
    const isDark = card.classList.contains('svcCard--dark');
    const tiltStrength = isDark ? 3 : 7;

    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const xRel = e.clientX - r.left;
        const yRel = e.clientY - r.top;
        const xNorm = xRel / r.width - 0.5;
        const yNorm = yRel / r.height - 0.5;
        card.style.transform = [
            `perspective(900px)`,
            `rotateY(${xNorm * tiltStrength}deg)`,
            `rotateX(${-yNorm * tiltStrength}deg)`,
            `translateZ(10px)`
        ].join(' ');
        card.style.setProperty('--sx', xRel + 'px');
        card.style.setProperty('--sy', yRel + 'px');
    });

    card.addEventListener('mouseleave', () => {
        card.style.transition += ', transform .6s cubic-bezier(.23,1,.32,1)';
        card.style.transform = '';
        card.style.setProperty('--sx', '-300px');
        card.style.setProperty('--sy', '-300px');
    });

    card.addEventListener('mouseenter', () => {
        card.style.transition = card.style.transition.replace(', transform .6s cubic-bezier(.23,1,.32,1)', '');
    });
});


/* ═══════════════════════════════════════════════════
   CASE CARDS — Magnetic tilt + spotlight
═══════════════════════════════════════════════════ */

document.querySelectorAll('.cCard:not(.cCard--wide)').forEach(card => {
    const TILT = 6;

    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const xRel = e.clientX - r.left;
        const yRel = e.clientY - r.top;
        const xNorm = xRel / r.width - 0.5;
        const yNorm = yRel / r.height - 0.5;

        card.style.transform = [
            `perspective(1000px)`,
            `rotateY(${xNorm * TILT}deg)`,
            `rotateX(${-yNorm * TILT}deg)`,
            `translateZ(12px) translateY(-4px)`
        ].join(' ');

        card.style.setProperty('--sx', xRel + 'px');
        card.style.setProperty('--sy', yRel + 'px');
    });

    card.addEventListener('mouseleave', () => {
        card.style.transition = 'opacity .65s ease, transform .65s cubic-bezier(.23,1,.32,1), box-shadow .5s cubic-bezier(.23,1,.32,1), border-color .35s';
        card.style.transform = '';
        card.style.setProperty('--sx', '-300px');
        card.style.setProperty('--sy', '-300px');
    });

    card.addEventListener('mouseenter', () => {
        card.style.transition = 'opacity .65s ease, transform .2s cubic-bezier(.23,1,.32,1), box-shadow .5s cubic-bezier(.23,1,.32,1), border-color .35s';
    });
});


/* ════════════════════════════════════════════════════════
   PARTNERS DATA — Edit this array to add / remove partners
════════════════════════════════════════════════════════ */
const PARTNERS = [
    {
        name: 'Microsoft',
        cert: 'Partner Network',
        logo: 'src/img/Partners/MICROSOFT.webp',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Microsip',
        cert: 'Consultor Certificado',
        logo: 'src/img/Partners/MICROSIP.svg',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Odoo',
        cert: 'Certified Partner',
        logo: 'src/img/Partners/ODOO.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'QNAP',
        cert: 'Authorized Reseller',
        logo: 'src/img/Partners/QNAP.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Google',
        cert: 'Cloud Partner',
        logo: 'src/img/Partners/GCLOUD.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Kaspersky',
        cert: 'Business Partner',
        logo: 'src/img/Partners/KARSPERSKY.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Hikvision',
        cert: 'Authorized Partner',
        logo: 'src/img/Partners/HIKVISION.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Omada by TP-Link',
        cert: 'Authorized Reseller',
        logo: 'src/img/Partners/OMADA.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
    {
        name: 'Ubiquiti',
        cert: 'Authorized Reseller',
        logo: 'src/img/Partners/UBIQUITI.png',
        brand: '#714B67',
        glow: 'rgba(113,75,103,.17)',
        bg: 'rgba(113,75,103,.05)',
        border: 'rgba(113,75,103,.28)',
    },
];


/* ════════════════════════════════════════════════════════
   CHIP BUILDER
════════════════════════════════════════════════════════ */
function buildChip(p) {
    return `<div class="pChip" style="
      --brand:${p.brand};
      --brand-glow:${p.glow};
      --brand-bg:${p.bg};
      --brand-border:${p.border}">
    <div class="pChip-ico">
      <img
        src="${p.logo}"
        alt="${p.name}"
        loading="lazy"
        onerror="this.closest('.pChip-ico').classList.add('no-img')">
      <span class="pChip-fallback">${p.name.charAt(0)}</span>
    </div>
    <div class="pChip-body">
      <span class="pChip-name">${p.name}</span>
      <span class="pChip-cert">${p.cert}</span>
    </div>
  </div>`;
}


/* ════════════════════════════════════════════════════════
   POPULATE MARQUEE ROWS
   Row 1 → forward order × 2 (seamless loop)
   Row 2 → reversed order × 2
════════════════════════════════════════════════════════ */
(function populateRows() {
    const row1 = document.getElementById('pRow1');
    const row2 = document.getElementById('pRow2');
    if (!row1 || !row2) return;

    const fwd = PARTNERS.map(buildChip).join('');
    const rev = [...PARTNERS].reverse().map(buildChip).join('');

    row1.innerHTML = fwd + fwd;   // doubled for infinite
    row2.innerHTML = rev + rev;
})();


/* ════════════════════════════════════════════════════════
   STAGGER REVEAL
   Reuses the pattern already in your site.
   If you already have a global RevealObserver, remove this
   and just make sure .partnerRibbon and .pTrustBar carry
   the .reveal class.
════════════════════════════════════════════════════════ */
(function initReveal() {
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach((e, idx) => {
            if (!e.isIntersecting) return;
            const delay = parseFloat(e.target.dataset.revealDelay || 0);
            setTimeout(() => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
            }, delay);
            revealObs.unobserve(e.target);
        });
    }, { threshold: .12 });

    document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(22px)';
        el.style.transition = `opacity .6s ease, transform .65s cubic-bezier(.23,1,.32,1)`;
        el.dataset.revealDelay = i * 90;
        revealObs.observe(el);
    });
})();

const canvas = document.getElementById("bgParticles");
if (canvas) {
    const ctx = canvas.getContext("2d");

    let particles = [];
    let groups = [];

    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const SYMBOLS = ["{}", "</>", "[]", "#", "()", "=>", "API", "SQL"];

    // ---------------- PARTICULA ----------------
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = 1.2;
            this.target = null;
        }

        update() {
            if (this.target) {
                // movimiento suave hacia target
                this.x += (this.target.x - this.x) * 0.02;
                this.y += (this.target.y - this.y) * 0.02;
            } else {
                // flotación libre
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
            ctx.shadowColor = "#8b5cf6";
            ctx.shadowBlur = 6;
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // crear partículas
    for (let i = 0; i < 700; i++) {
        particles.push(new Particle());
    }

    // -------- GENERAR TEXTO EN POSICION RANDOM --------
    function createSymbolGroup() {
        const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

        const tempCanvas = document.createElement("canvas");
        const tctx = tempCanvas.getContext("2d");

        tempCanvas.width = 300;
        tempCanvas.height = 200;

        const offsetX = Math.random() * (canvas.width - 300);
        const offsetY = Math.random() * (canvas.height - 200);

        tctx.fillStyle = "black";
        tctx.font = "bold 80px monospace";
        tctx.textAlign = "center";
        tctx.textBaseline = "middle";
        tctx.fillText(symbol, 150, 100);

        const data = tctx.getImageData(0, 0, 300, 200).data;

        const points = [];

        for (let y = 0; y < 200; y += 5) {
            for (let x = 0; x < 300; x += 5) {
                const index = (y * 300 + x) * 4;
                if (data[index + 3] > 128) {
                    points.push({
                        x: x + offsetX,
                        y: y + offsetY
                    });
                }
            }
        }

        // asignar partículas a esos puntos
        const shuffled = particles.sort(() => 0.5 - Math.random());

        points.forEach((p, i) => {
            if (shuffled[i]) {
                shuffled[i].target = p;
            }
        });

        // liberar después de un tiempo (lento)
        setTimeout(() => {
            points.forEach((_, i) => {
                if (shuffled[i]) {
                    shuffled[i].target = null;
                }
            });
        }, 5000);
    }

    // loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();

    // crear símbolos en intervalos más naturales
    setInterval(() => {
        createSymbolGroup();
    }, 2500);
}