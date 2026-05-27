import { AtlasAttachmentLoader, SkeletonJson, Spine } from '@pixi-spine/runtime-3.7';
import { AttachmentType, TextureAtlas } from '@pixi-spine/base';
import { Assets } from 'pixi.js';

function monsterBasePath(id) {
  return `/${id}`;
}

function isEffectSlot(name) {
  return /(?:^|\/)TX|glow|\/YX/i.test(name);
}

async function loadTextureAtlas(id) {
  const base = monsterBasePath(id);
  const atlasText = await fetch(`${base}/${id}.atlas`).then((response) => {
    if (!response.ok) {
      throw new Error(`Atlas not found: ${id}`);
    }
    return response.text();
  });

  return new Promise((resolve, reject) => {
    new TextureAtlas(
      atlasText,
      (pageName, callback) => {
        const url = `${base}/${pageName.trim()}`;
        Assets.load(url)
          .then((texture) => callback(texture.baseTexture))
          .catch(reject);
      },
      (atlas) => {
        if (!atlas) {
          reject(new Error(`Failed to load atlas textures for ${id}`));
          return;
        }
        resolve(atlas);
      },
    );
  });
}

export function pickIdleAnimation(animations, preferred) {
  if (!animations.length) {
    return null;
  }

  if (preferred && animations.includes(preferred)) {
    return preferred;
  }

  for (const name of ['std', 'std2', 'walk']) {
    if (animations.includes(name)) {
      return name;
    }
  }

  return animations[0];
}

export function pickReturnAnimation(animations, idleAnimation, currentAnimation) {
  if (!idleAnimation || currentAnimation === idleAnimation) {
    return null;
  }

  if (animations.includes(idleAnimation)) {
    return idleAnimation;
  }

  return null;
}

export function computeSpineVisualBounds(spine) {
  spine.state.apply(spine.skeleton);
  spine.skeleton.updateWorldTransform();
  spine.update(1 / 60);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  const extend = (x, y) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    found = true;
  };

  for (const slot of spine.skeleton.slots) {
    const attachment = slot.getAttachment();
    if (!attachment || !slot.bone.active || isEffectSlot(slot.data.name)) {
      continue;
    }

    if (attachment.type === AttachmentType.Region) {
      const vertices = new Float32Array(8);
      attachment.computeWorldVertices(slot, vertices, 0, 2);
      for (let i = 0; i < 8; i += 2) {
        extend(vertices[i], vertices[i + 1]);
      }
      continue;
    }

    if (
      attachment.type === AttachmentType.Mesh
      || attachment.type === AttachmentType.LinkedMesh
    ) {
      const vertices = new Float32Array(attachment.worldVerticesLength);
      attachment.computeWorldVertices(slot, 0, attachment.worldVerticesLength, vertices, 0, 2);
      for (let i = 0; i < vertices.length; i += 2) {
        extend(vertices[i], vertices[i + 1]);
      }
    }
  }

  if (!found) {
    return spine.getLocalBounds();
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function fitSpineToView(spine, wrap, width, height, padding = 0.9) {
  spine.pivot.set(0, 0);
  spine.scale.set(1);
  spine.position.set(0, 0);
  wrap.scale.set(1);
  wrap.position.set(0, 0);

  const bounds = computeSpineVisualBounds(spine);
  const scale = Math.min(
    (width * padding) / Math.max(bounds.width, 1),
    (height * padding) / Math.max(bounds.height, 1),
  );
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  spine.scale.set(scale);
  spine.position.set(-centerX * scale, -centerY * scale);
  wrap.position.set(width / 2, height / 2);

  return { bounds, scale, width, height, centerX, centerY };
}

export async function loadMonsterSpine(id) {
  const base = monsterBasePath(id);
  const [atlas, skeletonJson] = await Promise.all([
    loadTextureAtlas(id),
    fetch(`${base}/${id}.json`).then((response) => {
      if (!response.ok) {
        throw new Error(`Skeleton not found: ${id}`);
      }
      return response.json();
    }),
  ]);

  const parser = new SkeletonJson(new AtlasAttachmentLoader(atlas));
  const spineData = parser.readSkeletonData(skeletonJson);
  const spine = new Spine(spineData);
  spine.autoUpdate = true;
  return spine;
}

export function getMonsterAssetUrls(id, cdnBase = '') {
  const prefix = cdnBase.replace(/\/$/, '');
  const base = `${prefix}/${id}`;
  return {
    jsonUrl: `${base}/${id}.json`,
    atlasUrl: `${base}/${id}.atlas`,
  };
}
