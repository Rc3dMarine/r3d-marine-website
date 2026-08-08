const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DEFAULT_SITE = {
  hero_title: 'R3D Marine — Scale Marine Models & RC Design',
  hero_subtitle: 'Detailed 3D replicas of real boats, RC marine models and printable components.',
  logo: '/assets/ChatGPT Image Aug 7, 2026, 01_36_22 AM.png',
  hero_image: '/assets/Nimbus c11 cite 1.png',
  instagram: 'https://www.instagram.com/rc_3d_marine/',
  cults: 'https://cults3d.com/en/users/RC3DMARINE/3d-models',
  youtube: 'https://www.youtube.com/@rc3d114',
  about: 'R3D Marine creates detailed digital replicas, RC boat projects and 3D-printable marine components.'
};

async function loadJSON(path, fallback) {
  try {
    const separator = path.includes('?') ? '&' : '?';
    const res = await fetch(`${path}${separator}v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not load ${path}. Using fallback.`, err);
    return fallback;
  }
}

function normalizePath(path) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
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

function applySiteSettings(site) {
  const data = { ...DEFAULT_SITE, ...site };
  document.title = data.hero_title ? `${data.hero_title} | R3D Marine` : 'R3D Marine';

  $('#hero-title').textContent = data.hero_title || DEFAULT_SITE.hero_title;
  $('#hero-subtitle').textContent = data.hero_subtitle || '';
  $('#about-text').textContent = data.about || '';

  const logo = normalizePath(data.logo || DEFAULT_SITE.logo);
  ['#header-logo', '#about-logo', '#footer-logo'].forEach((selector) => {
    const img = $(selector);
    if (img) img.src = logo;
  });

  const hero = $('#hero-image');
  if (hero) hero.src = normalizePath(data.hero_image || DEFAULT_SITE.hero_image);

  ['#nav-cults', '#hero-cults', '#models-cults', '#about-cults'].forEach((s) => setLink(s, data.cults));
  ['#instagram-link', '#cta-instagram'].forEach((s) => setLink(s, data.instagram));
  ['#youtube-link', '#cta-youtube'].forEach((s) => setLink(s, data.youtube));
}

function modelImages(model) {
  const imgs = [];
  if (model.cover) imgs.push(model.cover);
  if (Array.isArray(model.gallery)) imgs.push(...model.gallery);
  return [...new Set(imgs.filter(Boolean))];
}

function renderModels(models) {
  const grid = $('#project-grid');
  const empty = $('#models-empty');
  grid.innerHTML = '';

  const list = Array.isArray(models) ? [...models] : [];
  list.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const firstFeaturedIndex = list.findIndex((m) => m.featured === true);
  const heroIndex = firstFeaturedIndex >= 0 ? firstFeaturedIndex : 0;

  list.forEach((model, index) => {
    const article = document.createElement('article');
    article.className = `project reveal ${index === heroIndex ? 'project-large' : ''}`.trim();
    article.tabIndex = 0;
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `Open ${model.name || 'model'}`);

    const image = normalizePath(model.cover || (Array.isArray(model.gallery) ? model.gallery[0] : ''));
    const category = model.category || 'Marine Model';
    const number = String(index + 1).padStart(2, '0');
    const cultsLink = model.cults_url || '';

    article.innerHTML = `
      <div class="project-image-wrap">
        ${image ? `<img src="${image}" alt="${escapeHTML(model.name || 'R3D Marine model')}" loading="lazy">` : '<div class="image-missing">IMAGE COMING SOON</div>'}
        <div class="project-number">${number}</div>
      </div>
      <div class="project-info">
        <div>
          <p>${escapeHTML(category)}</p>
          <h3>${escapeHTML(model.name || 'Untitled model')}</h3>
        </div>
        <span class="project-open">View project ↗</span>
      </div>`;

    const open = () => openModelModal(model);
    article.addEventListener('click', open);
    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
    grid.appendChild(article);
  });

  renderShowcase(list);
  initRevealObserver();
}

function renderShowcase(models) {
  const section = $('#showcase');
  const track = $('#showcase-track');
  const images = [];

  models.forEach((model) => {
    modelImages(model).forEach((img) => {
      if (!images.includes(img)) images.push(img);
    });
  });

  if (!images.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  track.innerHTML = images.slice(0, 3).map((img) => `
    <div class="showcase-card"><img src="${normalizePath(img)}" alt="R3D Marine model detail" loading="lazy"></div>
  `).join('');
}

function openModelModal(model) {
  const modal = $('#model-modal');
  const imgs = modelImages(model);
  const first = imgs[0] ? normalizePath(imgs[0]) : '';

  $('#modal-title').textContent = model.name || 'R3D Marine model';
  $('#modal-category').textContent = model.category || 'Marine Model';
  $('#modal-description').textContent = model.description || '';

  const main = $('#modal-main-image');
  main.src = first;
  main.alt = model.name || 'R3D Marine model';

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
  const modal = $('#model-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initMenu() {
  const toggle = $('.menu-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('.nav-links a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
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
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => revealObserver.observe(el));
}

function initParallax() {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const heroImg = $('.hero-image');
    if (heroImg && y < window.innerHeight) {
      heroImg.style.transform = `scale(1.02) translateY(${y * 0.045}px)`;
    }
  }, { passive: true });
}

async function init() {
  $('#year').textContent = new Date().getFullYear();
  initMenu();
  initRevealObserver();
  initParallax();

  const [site, models] = await Promise.all([
    loadJSON('data/site.json', DEFAULT_SITE),
    loadJSON('data/models.json', [])
  ]);

  applySiteSettings(site);
  renderModels(models);

  $('#modal-close').addEventListener('click', closeModelModal);
  $('#model-modal').addEventListener('click', (e) => {
    if (e.target === $('#model-modal')) closeModelModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModelModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
