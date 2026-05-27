import { Application, Container } from 'pixi.js';
import { fitSpineToView, loadMonsterSpine, pickIdleAnimation, pickReturnAnimation } from './spine-loader.js';
import { getCardThumbnail } from './thumbnail-renderer.js';

const catalogUrl = '/cards/catalog.json';
const DEFAULT_ANIMATION = 'std';
const ANIMATION_LABELS = {
  std: '待機',
  std2: '待機2',
  walk: '行走',
  atk: '攻擊',
  jifei: '擊飛',
  skill: '技能',
  ts: '特殊',
  gd: '受擊',
};

const state = {
  cards: [],
  selectedId: null,
  currentSpine: null,
  currentWrap: null,
  currentAnimation: DEFAULT_ANIMATION,
  idleAnimation: DEFAULT_ANIMATION,
  availableAnimations: [],
  filter: 'all',
  query: '',
};

const stageRoot = new Container();
const thumbObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      const host = entry.target;
      const { cardId } = host.dataset;
      if (!cardId || host.dataset.loaded === '1') {
        continue;
      }
      host.dataset.loaded = 'pending';
      getCardThumbnail(cardId, host.dataset.defaultAnimation || undefined)
        .then((url) => {
          host.innerHTML = `<img src="${url}" alt="" />`;
          host.dataset.loaded = '1';
        })
        .catch(() => {
          host.innerHTML = `<span class="card-thumb-fallback">${cardId}</span>`;
          host.dataset.loaded = 'error';
        });
    }
  },
  { root: null, rootMargin: '120px' },
);

const app = new Application({
  width: 360,
  height: 360,
  backgroundColor: 0x0b1016,
  backgroundAlpha: 1,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
app.view.id = 'spine-canvas';

const elements = {
  cardGrid: document.getElementById('card-grid'),
  search: document.getElementById('search'),
  filterButtons: [...document.querySelectorAll('[data-filter]')],
  preview: document.getElementById('preview'),
  previewFallback: document.getElementById('preview-fallback'),
  stage: document.getElementById('stage'),
  cardName: document.getElementById('card-name'),
  cardMeta: document.getElementById('card-meta'),
  cardStats: document.getElementById('card-stats'),
  animationBar: document.getElementById('animation-bar'),
  status: document.getElementById('status'),
};

elements.stage.appendChild(app.view);
app.stage.addChild(stageRoot);

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle('error', isError);
}

function getFilteredCards() {
  return state.cards.filter((card) => {
    if (state.filter === 'playable' && !card.playable) {
      return false;
    }
    if (!state.query) {
      return true;
    }
    const q = state.query.toLowerCase();
    return card.name.toLowerCase().includes(q) || card.id.toLowerCase().includes(q);
  });
}

function renderCardGrid() {
  thumbObserver.disconnect();
  const cards = getFilteredCards();
  elements.cardGrid.innerHTML = '';

  if (cards.length === 0) {
    elements.cardGrid.innerHTML = '<p class="empty">沒有符合條件的怪獸</p>';
    return;
  }

  for (const card of cards) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card-item${card.id === state.selectedId ? ' active' : ''}`;
    button.innerHTML = `
      <div class="card-thumb" data-card-id="${card.id}" data-default-animation="${card.spine?.defaultAnimation || ''}" aria-hidden="true">
        <span class="card-thumb-loading"></span>
      </div>
      <span>${card.name}</span>
      ${card.playable ? '<em class="badge">可出戰</em>' : ''}
    `;
    button.addEventListener('click', () => selectCard(card.id));
    elements.cardGrid.appendChild(button);
    thumbObserver.observe(button.querySelector('.card-thumb'));
  }
}

function renderAnimationButtons(animations) {
  elements.animationBar.innerHTML = '';
  for (const name of animations) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.anim = name;
    button.className = `anim-btn${name === state.currentAnimation ? ' active' : ''}`;
    button.textContent = ANIMATION_LABELS[name] || name;
    button.addEventListener('click', () => playAnimation(name, true));
    elements.animationBar.appendChild(button);
  }
}

function renderCardDetails(card) {
  elements.cardName.textContent = card.name;
  elements.cardMeta.textContent = `${card.id} · ${card.rarity} 階 · 第 ${card.group} 組 · ${card.variant}`;
  elements.cardStats.innerHTML = `
    <div><strong>HP</strong><span>${card.hp}</span></div>
    <div><strong>ATK</strong><span>${card.atk}</span></div>
    <div><strong>DEF</strong><span>${card.def}</span></div>
  `;
  elements.previewFallback.alt = card.name;
  elements.previewFallback.removeAttribute('src');
  getCardThumbnail(card.id, card.spine?.defaultAnimation)
    .then((url) => {
      if (state.selectedId === card.id) {
        elements.previewFallback.src = url;
      }
    })
    .catch(() => {
      if (state.selectedId === card.id) {
        elements.previewFallback.removeAttribute('src');
      }
    });
}

function clearStage() {
  if (state.currentWrap) {
    stageRoot.removeChild(state.currentWrap);
    state.currentWrap.destroy({ children: true });
    state.currentWrap = null;
  }
  state.currentSpine = null;
}

function fitSpine(spine, wrap) {
  fitSpineToView(spine, wrap, app.renderer.width, app.renderer.height);
}

function resizeStage() {
  const rect = elements.preview.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(320, Math.floor(rect.height));
  app.renderer.resize(width, height);
  app.view.style.width = '100%';
  app.view.style.height = '100%';
  if (state.currentSpine && state.currentWrap) {
    fitSpine(state.currentSpine, state.currentWrap);
  }
}

function playAnimation(name, loop = true) {
  if (!state.currentSpine?.state.hasAnimation(name)) {
    setStatus(`此怪獸沒有 ${name} 動畫`, true);
    return;
  }

  state.currentAnimation = name;
  const entry = state.currentSpine.state.setAnimation(0, name, loop);
  const returnAnimation = pickReturnAnimation(state.availableAnimations, state.idleAnimation, name);
  if (returnAnimation && (name === 'atk' || name === 'jifei' || name === 'skill')) {
    state.currentSpine.state.addAnimation(0, returnAnimation, true, entry.animation.duration);
  }

  [...elements.animationBar.children].forEach((button) => {
    button.classList.toggle('active', button.dataset.anim === name);
  });
  if (state.currentWrap) {
    fitSpine(state.currentSpine, state.currentWrap);
  }
  setStatus(`播放動畫：${ANIMATION_LABELS[name] || name}`);
}

async function selectCard(id) {
  const card = state.cards.find((item) => item.id === id);
  if (!card) {
    return;
  }

  state.selectedId = id;
  renderCardGrid();
  renderCardDetails(card);
  setStatus(`正在載入 ${card.name}...`);

  clearStage();
  elements.preview.classList.add('loading');

  try {
    const spine = await loadMonsterSpine(id);
    const wrap = new Container();
    wrap.addChild(spine);
    stageRoot.addChild(wrap);
    state.currentSpine = spine;
    state.currentWrap = wrap;

    const animations = card.spine?.animations?.length
      ? card.spine.animations
      : spine.spineData.animations.map((animation) => animation.name);

    state.availableAnimations = animations;
    state.idleAnimation = pickIdleAnimation(animations, card.spine?.defaultAnimation);
    state.currentAnimation = state.idleAnimation;

    renderAnimationButtons(animations);
    resizeStage();
    playAnimation(state.idleAnimation, true);
    elements.preview.classList.remove('loading');
    elements.preview.classList.add('animated');
  } catch (error) {
    elements.preview.classList.remove('loading', 'animated');
    setStatus(`動畫載入失敗：${error.message}`, true);
  }
}

async function init() {
  setStatus('正在讀取卡冊...');
  const response = await fetch(catalogUrl);
  const catalog = await response.json();
  state.cards = catalog.cards;

  renderCardGrid();
  setStatus(`已載入 ${catalog.totalCount} 張怪獸卡，其中 ${catalog.playableCount} 張可出戰`);

  const initial = state.cards.find((card) => card.id === 'guaiA2b') || state.cards[0];
  await selectCard(initial.id);
}

elements.search.addEventListener('input', (event) => {
  state.query = event.target.value.trim();
  renderCardGrid();
});

elements.filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    elements.filterButtons.forEach((item) => item.classList.toggle('active', item === button));
    renderCardGrid();
  });
});

window.addEventListener('resize', resizeStage);

init()
  .catch((error) => setStatus(`初始化失敗：${error.message}`, true))
  .finally(() => resizeStage());
