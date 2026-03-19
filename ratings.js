// =============================================
// CRIKITISO — ratings.js
// Sistema de valoraciones con Supabase
// =============================================

const SUPABASE_URL = 'https://bmdfgomboisosbqylmfs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZGZnb21ib2lzb3NicXlsbWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzY2OTAsImV4cCI6MjA4OTUxMjY5MH0.yzYKz1OlwbY_mcv-z2X1XKcAmcDiHInmvmu7ns_aC0Y';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Carga la media y número de votos de una ISO
async function cargarVaoraciones(iso) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/valoraciones?iso=eq.${iso}&select=puntuacion`,
      { headers }
    );
    const data = await res.json();
    if (!data.length) return { media: 0, total: 0 };
    const media = data.reduce((a, b) => a + b.puntuacion, 0) / data.length;
    return { media: Math.round(media * 10) / 10, total: data.length };
  } catch { return { media: 0, total: 0 }; }
}

// Envía una valoración
async function enviarValoracion(iso, puntuacion) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ iso, puntuacion })
  });
  return res.ok;
}

// Renderiza las estrellas en todos los widgets
async function iniciarRatings() {
  const widgets = document.querySelectorAll('.rating-widget');
  for (const widget of widgets) {
    const iso = widget.dataset.iso;
    const yaVoto = localStorage.getItem(`voted_${iso}`);
    const { media, total } = await cargarVaoraciones(iso);
    renderWidget(widget, iso, media, total, !!yaVoto);
  }
}

function renderWidget(widget, iso, media, total, yaVoto) {
  const estrellas = [1,2,3,4,5].map(n => {
    const filled = n <= Math.round(media);
    return `<span class="star ${filled ? 'filled' : ''} ${yaVoto ? 'voted' : ''}"
      data-val="${n}" data-iso="${iso}"
      onclick="${yaVoto ? '' : `votarISO('${iso}', ${n})`}"
      onmouseenter="${yaVoto ? '' : `hoverStars(this, ${n})`}"
      onmouseleave="${yaVoto ? '' : `resetStars('${iso}')`}">★</span>`;
  }).join('');

  widget.innerHTML = `
    <div class="rating-stars" id="stars-${iso}">${estrellas}</div>
    <div class="rating-info">
      <span class="rating-avg" id="avg-${iso}">${media > 0 ? media.toFixed(1) : '—'}</span>
      <span class="rating-total" id="total-${iso}">${total} ${total === 1 ? 'valoración' : 'valoraciones'}</span>
      ${yaVoto ? '<span class="rating-voted">✓ Ya has valorado</span>' : '<span class="rating-hint">Haz clic para valorar</span>'}
    </div>
  `;
}

function hoverStars(el, val) {
  const iso = el.dataset.iso;
  document.querySelectorAll(`#stars-${iso} .star`).forEach(s => {
    s.classList.toggle('hover', parseInt(s.dataset.val) <= val);
  });
}

function resetStars(iso) {
  document.querySelectorAll(`#stars-${iso} .star`).forEach(s => s.classList.remove('hover'));
}

async function votarISO(iso, puntuacion) {
  const ok = await enviarValoracion(iso, puntuacion);
  if (ok) {
    localStorage.setItem(`voted_${iso}`, puntuacion);
    const { media, total } = await cargarVaoraciones(iso);
    const widget = document.querySelector(`.rating-widget[data-iso="${iso}"]`);
    if (widget) renderWidget(widget, iso, media, total, true);
  }
}

document.addEventListener('DOMContentLoaded', iniciarRatings);
