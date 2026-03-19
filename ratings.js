// =============================================
// CRIKITISO — ratings.js
// =============================================

const SUPABASE_URL = 'https://bmdfgomboisosbqylmfs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZGZnb21ib2lzb3NicXlsbWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzY2OTAsImV4cCI6MjA4OTUxMjY5MH0.yzYKz1OlwbY_mcv-z2X1XKcAmcDiHInmvmu7ns_aC0Y';
const H = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
const COL = { puntuacion: 'punctuation', opinion: 'nombre opinion', utiles: 'nombre utiles', reportada: 'nombre reportada' };

// Estado de filtros y paginación por ISO
const state = {};

async function getValoraciones(iso) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?iso=eq.${iso}&order=created_at.desc`, { headers: H });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

async function getTotalValoraciones() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?${COL.reportada}=eq.false&select=id`, { headers: { ...H, 'Prefer': 'count=exact' } });
    const count = res.headers.get('content-range')?.split('/')[1];
    return parseInt(count) || 0;
  } catch { return 0; }
}

async function enviarValoracion(iso, puntuacion, opinion) {
  const body = { iso };
  body[COL.puntuacion] = puntuacion;
  body[COL.opinion] = opinion || null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones`, {
    method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(body)
  });
  return res.ok;
}

async function marcarUtil(id, utiles_actual) {
  const body = {}; body[COL.utiles] = (utiles_actual || 0) + 1;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?id=eq.${id}`, {
    method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(body)
  });
  return res.ok;
}

async function reportarOpinion(id) {
  const body = {}; body[COL.reportada] = true;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones?id=eq.${id}`, {
    method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(body)
  });
  return res.ok;
}

function renderEstrellas(n, interactive, iso, prefix) {
  return [1,2,3,4,5].map(i => {
    const filled = i <= Math.round(n) ? 'filled' : '';
    if (interactive) {
      return `<span class="star ${filled}" data-val="${i}" data-iso="${iso}"
        onclick="seleccionarEstrella(this,'${prefix}')"
        onmouseenter="hoverStars(this,'${prefix}')"
        onmouseleave="resetStars('${iso}','${prefix}')">★</span>`;
    }
    return `<span class="star ${filled} static">★</span>`;
  }).join('');
}

function hoverStars(el, prefix) {
  const iso = el.dataset.iso, val = parseInt(el.dataset.val);
  document.querySelectorAll(`#${prefix}-stars-${iso} .star`).forEach(s => {
    s.classList.toggle('hover', parseInt(s.dataset.val) <= val);
  });
}

function resetStars(iso, prefix) {
  const selected = parseInt(document.querySelector(`#${prefix}-stars-${iso}`)?.dataset.selected || 0);
  document.querySelectorAll(`#${prefix}-stars-${iso} .star`).forEach(s => {
    s.classList.remove('hover');
    s.classList.toggle('filled', parseInt(s.dataset.val) <= selected);
  });
}

function seleccionarEstrella(el, prefix) {
  const iso = el.dataset.iso, val = parseInt(el.dataset.val);
  const container = document.querySelector(`#${prefix}-stars-${iso}`);
  if (container) container.dataset.selected = val;
  document.querySelectorAll(`#${prefix}-stars-${iso} .star`).forEach(s => {
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
    btn.textContent = 'Error, inténtalo de nuevo'; btn.disabled = false;
  }
}

async function clickUtil(id, utiles, iso) {
  if (localStorage.getItem(`util_${id}`)) return;
  await marcarUtil(id, utiles);
  localStorage.setItem(`util_${id}`, '1');
  await renderWidget(document.querySelector(`.rating-widget[data-iso="${iso}"]`), iso);
}

async function clickReportar(id, iso) {
  if (localStorage.getItem(`report_${id}`)) { alert('Ya has reportado esta opinión.'); return; }
  if (!confirm('¿Reportar esta opinión como inapropiada?')) return;
  await reportarOpinion(id);
  localStorage.setItem(`report_${id}`, '1');
  alert('Opinión reportada. El equipo la revisará.');
  await renderWidget(document.querySelector(`.rating-widget[data-iso="${iso}"]`), iso);
}

function setFiltro(iso, estrellas) {
  state[iso].filtro = estrellas;
  state[iso].mostrar = 3;
  renderOpiniones(iso);
}

function verMas(iso) {
  state[iso].mostrar += 7;
  renderOpiniones(iso);
}

function renderOpiniones(iso) {
  const { data, filtro, mostrar } = state[iso];
  const visibles = data.filter(d => !d[COL.reportada] && d[COL.opinion]);
  const filtradas = filtro ? visibles.filter(d => d[COL.puntuacion] === filtro) : visibles;
  const mostradas = filtradas.slice(0, mostrar);
  const hayMas = filtradas.length > mostrar;

  const filtroHtml = `
    <div class="opiniones-filtros">
      <span class="filtro-label">Filtrar:</span>
      <button class="filtro-btn ${!filtro ? 'active' : ''}" onclick="setFiltro('${iso}', 0)">Todas</button>
      ${[5,4,3,2,1].map(n => `
        <button class="filtro-btn ${filtro === n ? 'active' : ''}" onclick="setFiltro('${iso}', ${n})">
          ${'★'.repeat(n)}
        </button>`).join('')}
    </div>`;

  const opinionesHtml = mostradas.map(d => `
    <div class="opinion-card">
      <div class="opinion-header">
        <div class="opinion-stars">${renderEstrellas(d[COL.puntuacion]||0, false, iso, 'op'+d.id)}</div>
        <span class="opinion-fecha">${new Date(d.created_at).toLocaleDateString('es-ES')}</span>
      </div>
      <p class="opinion-texto">${d[COL.opinion]}</p>
      <div class="opinion-actions">
        <button class="opinion-btn-util ${localStorage.getItem('util_'+d.id) ? 'used' : ''}"
          onclick="clickUtil(${d.id}, ${d[COL.utiles]||0}, '${iso}')">
          👍 Útil ${(d[COL.utiles]||0) > 0 ? `(${d[COL.utiles]})` : ''}
        </button>
        <button class="opinion-btn-report ${localStorage.getItem('report_'+d.id) ? 'used' : ''}"
          onclick="clickReportar(${d.id}, '${iso}')">
          ⚑ Reportar
        </button>
      </div>
    </div>`).join('');

  const verMasHtml = hayMas ? `
    <button class="btn-ghost ver-mas-btn" onclick="verMas('${iso}')">
      Ver más opiniones (${filtradas.length - mostrar} restantes) →
    </button>` : '';

  const sinOpiniones = filtradas.length === 0 ? `
    <div class="sin-opiniones">No hay opiniones con esta puntuación aún.</div>` : '';

  const container = document.getElementById(`opiniones-container-${iso}`);
  if (container) container.innerHTML = filtroHtml + (sinOpiniones || opinionesHtml + verMasHtml);
}

async function renderWidget(widget, iso) {
  const data = await getValoraciones(iso);
  const visibles = data.filter(d => !d[COL.reportada]);
  const yaVoto = localStorage.getItem(`voted_${iso}`);
  const media = visibles.length ? visibles.reduce((a,b) => a + (b[COL.puntuacion]||0), 0) / visibles.length : 0;

  if (!state[iso]) state[iso] = { filtro: 0, mostrar: 3 };
  state[iso].data = data;

  const resumen = `
    <div class="rating-resumen">
      <div class="rating-stars-big">${renderEstrellas(media, false, iso, 'res')}</div>
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
        ${renderEstrellas(0, true, iso, 'form')}
      </div>
      <textarea id="opinion-text-${iso}" class="form-input form-textarea rating-textarea"
        placeholder="Cuéntanos tu experiencia (opcional)..."></textarea>
      <button id="btn-enviar-${iso}" class="btn-primary" onclick="enviarForm('${iso}')">
        Publicar opinión →
      </button>
    </div>`;

  const tieneOpiniones = data.filter(d => !d[COL.reportada] && d[COL.opinion]).length > 0;

  widget.innerHTML = `
    ${resumen}
    ${formHtml}
    ${tieneOpiniones ? `
      <div class="opiniones-lista">
        <div class="opiniones-titulo">// opiniones de usuarios</div>
        <div id="opiniones-container-${iso}"></div>
      </div>` : ''}
  `;

  if (tieneOpiniones) renderOpiniones(iso);
}

async function iniciarRatings() {
  for (const widget of document.querySelectorAll('.rating-widget')) {
    await renderWidget(widget, widget.dataset.iso);
  }
}

async function iniciarContadores() {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;

  const total = await getTotalValoraciones();

  const isoEl = document.getElementById('stat-isos');
  const osEl  = document.getElementById('stat-os');
  const valEl = document.getElementById('stat-valoraciones');

  if (isoEl) isoEl.textContent = '3';
  if (osEl)  osEl.textContent  = '100%';
  if (valEl) valEl.textContent = total > 0 ? total : '0';
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarRatings();
  iniciarContadores();
});
