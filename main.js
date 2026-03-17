// Crikitiso — main.js

// Mobile nav toggle
function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  nav.classList.toggle('open');
}

// Contact form fake submit
function enviarMensaje() {
  const nombre  = document.getElementById('nombre')?.value;
  const email   = document.getElementById('email')?.value;
  const mensaje = document.getElementById('mensaje')?.value;
  if (!nombre || !email || !mensaje) {
    alert('Por favor rellena todos los campos obligatorios.');
    return;
  }
  document.getElementById('formSuccess').classList.add('show');
  document.getElementById('nombre').value  = '';
  document.getElementById('email').value   = '';
  document.getElementById('mensaje').value = '';
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
