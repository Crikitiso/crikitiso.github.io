// =============================================
// CRIKITISO — ratings.js
// =============================================

const SUPABASE_URL = 'https://bmdfgomboisosbqylmfs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZGZnb21ib2lzb3NicXlsbWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzY2OTAsImV4cCI6MjA4OTUxMjY5MH0.yzYKz1OlwbY_mcv-z2X1XKcAmcDiHInmvmu7ns_aC0Y';

const H = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function getValoraciones(iso) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?iso=eq.${iso}&order=created_at.desc`, { headers: H });
  return res.ok ? await res.json() : [];
}

async function enviarValoracion(iso, puntuacion, opinion) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones`, {
    method: 'POST',
    headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ iso, puntuacion, "nombre opinion": opinion || null })
  });
  return res.ok;
}

async function marcarUtil(id, utiles_actual) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ "nombre utiles": (utiles_actual || 0) + 1 })
  });
  return res.ok;
}

async function reportarOpinion(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ "nombre reportada": true })
  });
  return res.ok;
}

function estrellas(n, total, interactive, iso) {
  return [1,2,3,4,5].map(i => {
    const cl = i <= Math.round(n) ? 'filled' : '';
    if (interactive) {
      return `<span class="star ${cl}" data-val="${i}" data-iso="${iso}"
        onclick="seleccionarEstrella(this)"
        onmouseenter="hoverStars(this)"
        onmouseleave="resetStars('${iso}')">★</span>`;
    }
    return `<span class="star ${cl} static">★</span>`;
  }).join('');
}

function hoverStars(el) {
  const iso = el.dataset.iso;
  const val = parseInt(el.dataset.val);
  document.querySelectorAll(`#form-stars-${iso} .star`).forEach(s => {
    s.classList.toggle('hover', parseInt(s.dataset.val) <= val);
  });
}

function resetStars(iso) {
  const selected = parseInt(document.querySelector(`#form-stars-${iso}`)?.dataset.selected || 0);
  document.querySelectorAll(`#form-stars-${iso} .star`).forEach(s => {
    s.classList.remove('hover');
    s.classList.toggle('filled', parseInt(s.dataset.val) <= selected);
  });
}

function seleccionarEstrella(el) {
  const iso = el.dataset.iso;
  const val = parseInt(el.dataset.val);
  const container = document.querySelector(`#form-stars-${iso}`);
  container.dataset.selected = val;
  document.querySelectorAll(`#form-stars-${iso} .star`).forEach(s => {
    s.classList.toggle('filled', parseInt(s.dataset.val) <= val);
    s.classList.remove('hover');
  });
}

async function enviarForm(iso) {
  const selected = parseInt(document.querySelector(`#form-stars-${iso}`)?.dataset.selected || 0);
  const opinion = document.getElementById(`opinion-text-${iso}`)?.value.trim();
  const btn = document.getElementById(`btn-enviar-${iso}`);

  if (!selected) { alert('Por favor selecciona una puntuación.'); return; }

  btn.textContent = 'Enviando...'; btn.disabled = true;
  const ok = await enviarValoracion(iso, selected, opinion);

  if (ok) {
    localStorage.setItem(`voted_${iso}`, selected);
    await renderWidget(document.querySelector(`.rating-widget[data-iso="${iso}"]`), iso);
  } else {
    btn.textContent = 'Error, inténtalo de nuevo';
    btn.disabled = false;
  }
}

async function clickUtil(id, utiles, iso) {
  const yaUtil = localStorage.getItem(`util_${id}`);
  if (yaUtil) return;
  await marcarUtil(id, utiles);
  localStorage.setItem(`util_${id}`, '1');
  await renderWidget(document.querySelector(`.rating-widget[data-iso="${iso}"]`), iso);
}

async function clickReportar(id, iso) {
  const yaReportado = localStorage.getItem(`report_${id}`);
  if (yaReportado) { alert('Ya has reportado esta opinión.'); return; }
  if (!confirm('¿Reportar esta opinión como inapropiada?')) return;
  await reportarOpinion(id);
  localStorage.setItem(`report_${id}`, '1');
  alert('Opinión reportada. El equipo la revisará.');
  await renderWidget(document.querySelector(`.rating-widget[data-iso="${iso}"]`), iso);
}

async function renderWidget(widget, iso) {
  const data = await getValoraciones(iso);
  const visibles = data.filter(d => !d["nombre reportada"]);
  const yaVoto = localStorage.getItem(`voted_${iso}`);
  const media = visibles.length ? visibles.reduce((a,b) => a + b.puntuacion, 0) / visibles.length : 0;

  const resumen = `
    <div class="rating-resumen">
      <div id="form-stars-${iso}" class="rating-stars-big" data-selected="0">
        ${estrellas(media, visibles.length, false, iso)}
      </div>
      <div class="rating-info">
        <span class="rating-avg">${media > 0 ? media.toFixed(1) : '—'}</span>
        <span class="rating-total">${visibles.length} ${visibles.length === 1 ? 'valoración' : 'valoraciones'}</span>
      </div>
    </div>`;

  const formHtml = yaVoto ? `
    <div class="rating-ya-votado">✓ Ya has dejado tu valoración. ¡Gracias!</div>` : `
    <div class="rating-form">
      <div class="rating-form-title">Deja tu opinión</div>
      <div id="form-stars-${iso}" class="rating-stars-interactive" data-selected="0">
        ${estrellas(0, 0, true, iso)}
      </div>
      <textarea id="opinion-text-${iso}" class="form-input form-textarea rating-textarea"
        placeholder="Cuéntanos tu experiencia con esta ISO (opcional)..."></textarea>
      <button id="btn-enviar-${iso}" class="btn-primary" onclick="enviarForm('${iso}')">
        Publicar opinión →
      </button>
    </div>`;

  const opiniones = visibles.filter(d => d["nombre opinion"]).map(d => `
    <div class="opinion-card">
      <div class="opinion-header">
        <div class="opinion-stars">${estrellas(d.puntuacion, 0, false, iso)}</div>
        <span class="opinion-fecha">${new Date(d.created_at).toLocaleDateString('es-ES')}</span>
      </div>
      <p class="opinion-texto">${d["nombre opinion"]}</p>
      <div class="opinion-actions">
        <button class="opinion-btn-util ${localStorage.getItem('util_'+d.id) ? 'used' : ''}"
          onclick="clickUtil(${d.id}, ${d["nombre utiles"]||0}, '${iso}')">
          👍 Útil ${d["nombre utiles"] > 0 ? `(${d["nombre utiles"]})` : ''}
        </button>
        <button class="opinion-btn-report ${localStorage.getItem('report_'+d.id) ? 'used' : ''}"
          onclick="clickReportar(${d.id}, '${iso}')">
          ⚑ Reportar
        </button>
      </div>
    </div>`).join('');

  widget.innerHTML = `
    ${resumen}
    ${formHtml}
    ${opiniones ? `<div class="opiniones-lista"><div class="opiniones-titulo">Opiniones de usuarios</div>${opiniones}</div>` : ''}
  `;
}

async function iniciarRatings() {
  for (const widget of document.querySelectorAll('.rating-widget')) {
    await renderWidget(widget, widget.dataset.iso);
  }
}

document.addEventListener('DOMContentLoaded', iniciarRatings);
