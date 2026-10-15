const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function loadJSON(path, fallback) {
  try {
    const res = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not load ${path}`, err);
    return fallback;
  }
}

function normalizePath(path) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function modelImages(model) {
  const imgs = [];
  if (model.cover) imgs.push(model.cover);
  if (Array.isArray(model.gallery)) imgs.push(...model.gallery);
  return [...new Set(imgs.filter(Boolean))];
}

function setLink(selector, href) {
  const el = $(selector);
  if (!el) return;
  if (href) {
    el.href = href;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function applySite(site = {}) {
  if (site.hero_title) $('#hero-title').textContent = site.hero_title;
  if (site.hero_kicker) $('#hero-kicker').textContent = site.hero_kicker;
  if (site.hero_tagline) $('#hero-tagline').textContent = site.hero_tagline;
  if (site.hero_subtitle) $('#hero-subtitle').textContent = site.hero_subtitle;
  if (site.about) $('#about-text').textContent = site.about;
  if (site.hero_image) $('#hero-image').src = normalizePath(site.hero_image);
  if (site.logo) $('#header-logo').src = normalizePath(site.logo);

  setLink('#instagram-link', site.instagram);
  setLink('#cults-link', site.cults);
  setLink('#youtube-link', site.youtube);

  if (site.email) {
    $('#email-link').href = `mailto:${site.email}`;
    $('#email-text').textContent = site.email;
  }
}

function statusClass(model) {
  return String(model.status || '').toLowerCase().includes('development') ? 'dev' : '';
}

function createModelCard(model, large = false) {
  const article = document.createElement('article');
  article.className = `model-card reveal ${large ? 'large' : ''}`.trim();
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `Open ${model.name}`);

  const image = normalizePath(model.cover || model.gallery?.[0] || '');
  article.innerHTML = `
    ${image ? `<img src="${image}" alt="${escapeHTML(model.name)}" loading="lazy">` : ''}
    ${model.status ? `<div class="card-status ${statusClass(model)}">${escapeHTML(model.status)}</div>` : ''}
    <div class="card-copy">
      <div>
        <div class="card-kicker">R3D</div>
        <h3 class="card-title">${escapeHTML(model.name)}</h3>
      </div>
      <div class="card-more">MORE ↗</div>
    </div>`;

  const open = () => openModelModal(model);
  article.addEventListener('click', open);
  article.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
  return article;
}

function renderCatalog(models) {
  const engines = models.filter((m) => m.category === 'Engine');
  const hulls = models.filter((m) => m.category === 'Hull');
  const systems = models.filter((m) => m.category === 'RC System');

  const engineGrid = $('#engines-grid');
  engineGrid.innerHTML = '';
  engines.forEach((model) => engineGrid.appendChild(createModelCard(model, false)));

  const hullGrid = $('#hulls-grid');
  hullGrid.innerHTML = '';
  hulls.forEach((model) => hullGrid.appendChild(createModelCard(model, true)));

  const systemGrid = $('#systems-grid');
  systemGrid.innerHTML = '';
  systems.forEach((model) => systemGrid.appendChild(createModelCard(model, false)));

  const development = models
    .filter((m) => String(m.status || '').toLowerCase().includes('development'))
    .slice(0, 3);
  const latestGrid = $('#latest-grid');
  latestGrid.innerHTML = '';
  development.forEach((model) => {
    const card = document.createElement('article');
    card.className = 'latest-card reveal';
    card.tabIndex = 0;
    const image = normalizePath(model.cover || model.gallery?.[0] || '');
    card.innerHTML = `
      ${image ? `<img src="${image}" alt="${escapeHTML(model.name)}" loading="lazy">` : ''}
      <div class="latest-card-copy">
        <h3>${escapeHTML(model.name)}</h3>
        <p>${escapeHTML(model.status || 'Project')}</p>
      </div>`;
    const open = () => openModelModal(model);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') open();
    });
    latestGrid.appendChild(card);
  });

  initRevealObserver();
}

function openModelModal(model) {
  const modal = $('#model-modal');
  const imgs = modelImages(model);
  const main = $('#modal-main-image');
  main.src = imgs[0] ? normalizePath(imgs[0]) : '';
  main.alt = model.name || 'R3D Marine project';

  $('#modal-title').textContent = model.name || 'R3D Marine project';
  $('#modal-category').textContent = model.category || 'Project';
  $('#modal-status').textContent = model.status || '';
  $('#modal-description').textContent = model.description || '';

  const thumbs = $('#modal-thumbs');
  thumbs.innerHTML = '';
  imgs.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.className = `modal-thumb ${i === 0 ? 'active' : ''}`;
    btn.innerHTML = `<img src="${normalizePath(img)}" alt="">`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      main.src = normalizePath(img);
      $$('.modal-thumb').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');
    });
    thumbs.appendChild(btn);
  });

  setLink('#modal-cults', model.cults_url);
  setLink('#modal-youtube', model.youtube_url);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModelModal() {
  $('#model-modal').classList.remove('open');
  $('#model-modal').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function initMenu() {
  const toggle = $('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('.nav-links a').forEach((a) => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

let revealObserver;
function initRevealObserver() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach((el) => revealObserver.observe(el));
}

async function init() {
  $('#year').textContent = new Date().getFullYear();
  initMenu();
  initRevealObserver();

  const [site, models] = await Promise.all([
    loadJSON('data/site.json', {}),
    loadJSON('data/models.json', [])
  ]);
  applySite(site);
  renderCatalog(Array.isArray(models) ? models.sort((a,b) => (a.order || 999) - (b.order || 999)) : []);

  $('#modal-close').addEventListener('click', closeModelModal);
  $('#model-modal').addEventListener('click', (e) => {
    if (e.target === $('#model-modal')) closeModelModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModelModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
