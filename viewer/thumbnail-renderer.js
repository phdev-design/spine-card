import { Application, Container } from 'pixi.js';
import { fitSpineToView, loadMonsterSpine, pickIdleAnimation } from './spine-loader.js';

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 213;
const THUMB_PADDING = 0.82;

const cache = new Map();
const pending = new Map();

let app;
let stageRoot;

function ensureRenderer() {
  if (app) {
    return app;
  }

  app = new Application({
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    backgroundColor: 0x0b1016,
    backgroundAlpha: 1,
    antialias: true,
    resolution: 1,
    autoDensity: false,
    preserveDrawingBuffer: true,
  });

  stageRoot = new Container();
  app.stage.addChild(stageRoot);
  return app;
}

async function renderThumbnail(id, preferredAnimation) {
  const renderer = ensureRenderer();
  const spine = await loadMonsterSpine(id);
  const wrap = new Container();
  wrap.addChild(spine);

  const animationNames = spine.spineData.animations.map((item) => item.name);
  const animationName = pickIdleAnimation(animationNames, preferredAnimation);
  if (animationName) {
    spine.state.setAnimation(0, animationName, true);
  }

  stageRoot.addChild(wrap);
  fitSpineToView(spine, wrap, THUMB_WIDTH, THUMB_HEIGHT, THUMB_PADDING);
  renderer.render();
  const dataUrl = renderer.view.toDataURL('image/png');

  stageRoot.removeChild(wrap);
  wrap.destroy({ children: true });

  return dataUrl;
}

export function getCardThumbnail(id, preferredAnimation) {
  const cacheKey = preferredAnimation ? `${id}:${preferredAnimation}` : id;
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey));
  }
  if (pending.has(cacheKey)) {
    return pending.get(cacheKey);
  }

  const promise = renderThumbnail(id, preferredAnimation)
    .then((dataUrl) => {
      cache.set(cacheKey, dataUrl);
      pending.delete(cacheKey);
      return dataUrl;
    })
    .catch((error) => {
      pending.delete(cacheKey);
      throw error;
    });

  pending.set(cacheKey, promise);
  return promise;
}
