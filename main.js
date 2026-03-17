// Crikitiso — main.js

// Mobile nav toggle
function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  nav.classList.toggle('open');
}

// Contact form — Formspree
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
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    const res = await fetch('https://formspree.io/f/PON_AQUI_TU_ID_FORMSPREE', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ nombre, email, asunto, mensaje })
    });

    if (res.ok) {
      document.getElementById('formSuccess').classList.add('show');
      document.getElementById('formError')?.classList.remove('show');
      document.getElementById('nombre').value  = '';
      document.getElementById('email').value   = '';
      document.getElementById('asunto').value  = '';
      document.getElementById('mensaje').value = '';
    } else {
      throw new Error('Error en el envío');
    }
  } catch {
    document.getElementById('formError').classList.add('show');
    document.getElementById('formSuccess').classList.remove('show');
  } finally {
    btn.textContent = 'Enviar mensaje →';
    btn.disabled = false;
  }
}

// FAQ accordion
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// Highlight active nav link based on current page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
    else a.classList.remove('active');
  });
});
