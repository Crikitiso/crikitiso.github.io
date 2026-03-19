// =============================================
// CRIKITISO — main.js
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
    else a.classList.remove('active');
  });

  // ── Scroll progress bar
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / total * 100) + '%';
  });

  // ── Custom cursor overlay (desktop only, keeps system cursor)
  if (window.matchMedia('(pointer: fine)').matches) {
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    document.body.appendChild(cursor);
    document.body.appendChild(dot);
    let mx = -100, my = -100, cx = -100, cy = -100;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    const animCursor = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursor.style.left = (cx - 18) + 'px';
      cursor.style.top  = (cy - 18) + 'px';
      dot.style.left = (mx - 3) + 'px';
      dot.style.top  = (my - 3) + 'px';
      requestAnimationFrame(animCursor);
    };
    animCursor();
    document.querySelectorAll('a, button, .iso-card, .team-card, .faq-q, .download-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // ── Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.iso-card, .team-card, .value-item, .step, .download-card, ' +
    '.faq-item, .contact-card, .foro-topic-card, .foro-rules, ' +
    '.section-header, .mission-text, .mission-terminal'
  ).forEach((el, i) => {
    el.classList.add('scroll-hidden');
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
    observer.observe(el);
  });

  // ── Typewriter effect (hero terminal tag)
  const tag = document.querySelector('.terminal-tag');
  if (tag) {
    const text = tag.textContent;
    tag.textContent = '';
    tag.style.opacity = '1';
    let i = 0;
    const type = () => {
      if (i < text.length) { tag.textContent += text[i++]; setTimeout(type, 40); }
    };
    setTimeout(type, 400);
  }

  // ── Particle canvas (hero only)
  const hero = document.querySelector('.hero');
  if (hero) {
    const canvas = document.createElement('canvas');
    canvas.id = 'hero-canvas';
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.4 + 0.1;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${this.alpha})`;
        ctx.fill();
      }
    }
    const particles = Array.from({length: 80}, () => new Particle());
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(249,115,22,${0.08 * (1 - dist/100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  // ── Card tilt effect
  document.querySelectorAll('.iso-card, .download-card, .team-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y*6}deg) rotateY(${x*6}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

});

// ── Mobile nav
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// ── Contact form
async function enviarMensaje(e) {
  if (e) e.preventDefault();
  const nombre  = document.getElementById('nombre')?.value.trim();
  const email   = document.getElementById('email')?.value.trim();
  const asunto  = document.getElementById('asunto')?.value;
  const mensaje = document.getElementById('mensaje')?.value.trim();
  if (!nombre || !email || !mensaje) {
    alert('Por favor rellena los campos obligatorios: nombre, email y mensaje.');
    return;
  }
  const btn = document.querySelector('#contactForm .btn-primary');
  btn.textContent = 'Enviando...'; btn.disabled = true;
  try {
    const res = await fetch('https://formspree.io/f/mreyordj', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ nombre, email, asunto, mensaje })
    });
    if (res.ok) {
      document.getElementById('formSuccess').classList.add('show');
      document.getElementById('formError')?.classList.remove('show');
      ['nombre','email','asunto','mensaje'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } else throw new Error();
  } catch {
    document.getElementById('formError').classList.add('show');
    document.getElementById('formSuccess').classList.remove('show');
  } finally {
    btn.textContent = 'Enviar mensaje →'; btn.disabled = false;
  }
}

// ── FAQ accordion
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}
