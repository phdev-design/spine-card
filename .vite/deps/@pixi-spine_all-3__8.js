import {
  AttachmentType,
  BLEND_MODES,
  BaseTexture,
  BinaryInput,
  Color,
  DebugUtils,
  ExtensionType,
  IntSet,
  Interpolation,
  MathUtils,
  Matrix,
  MixBlend,
  MixDirection,
  Pool,
  PositionMode,
  Pow,
  PowOut,
  RotateMode,
  SVGResource,
  SkeletonBoundsBase,
  SpineBase,
  SpineDebugRenderer,
  SpineMesh,
  SpineSprite,
  StringSet,
  Texture,
  TextureAtlas,
  TextureAtlasPage,
  TextureAtlasRegion,
  TextureFilter,
  TextureRegion,
  TextureWrap,
  TimeKeeper,
  TransformMode,
  Utils,
  Vector2,
  VideoResource,
  WindowedMean,
  extensions,
  filterFromString,
  lib_exports,
  settings,
  settings2,
  wrapFromString
} from "./chunk-KPG2LP5M.js";
import "./chunk-DSMON2TE.js";

// node_modules/@pixi/assets/lib/AssetExtension.mjs
var assetKeyMap = {
  loader: ExtensionType.LoadParser,
  resolver: ExtensionType.ResolveParser,
  cache: ExtensionType.CacheParser,
  detection: ExtensionType.DetectionParser
};
extensions.handle(ExtensionType.Asset, (extension) => {
  const ref = extension.ref;
  Object.entries(assetKeyMap).filter(([key]) => !!ref[key]).forEach(([key, type]) => extensions.add(Object.assign(
    ref[key],
    // Allow the function to optionally define it's own
    // ExtensionMetadata, the use cases here is priority for LoaderParsers
    { extension: ref[key].extension ?? type }
  )));
}, (extension) => {
  const ref = extension.ref;
  Object.keys(assetKeyMap).filter((key) => !!ref[key]).forEach((key) => extensions.remove(ref[key]));
});

// node_modules/@pixi/assets/lib/BackgroundLoader.mjs
var BackgroundLoader = class {
  /**
   * @param loader
   * @param verbose - should the loader log to the console
   */
  constructor(loader, verbose = false) {
    this._loader = loader, this._assetList = [], this._isLoading = false, this._maxConcurrent = 1, this.verbose = verbose;
  }
  /**
   * Adds an array of assets to load.
   * @param assetUrls - assets to load
   */
  add(assetUrls) {
    assetUrls.forEach((a) => {
      this._assetList.push(a);
    }), this.verbose && console.log("[BackgroundLoader] assets: ", this._assetList), this._isActive && !this._isLoading && this._next();
  }
  /**
   * Loads the next set of assets. Will try to load as many assets as it can at the same time.
   *
   * The max assets it will try to load at one time will be 4.
   */
  async _next() {
    if (this._assetList.length && this._isActive) {
      this._isLoading = true;
      const toLoad = [], toLoadAmount = Math.min(this._assetList.length, this._maxConcurrent);
      for (let i = 0; i < toLoadAmount; i++)
        toLoad.push(this._assetList.pop());
      await this._loader.load(toLoad), this._isLoading = false, this._next();
    }
  }
  /**
   * Activate/Deactivate the loading. If set to true then it will immediately continue to load the next asset.
   * @returns whether the class is active
   */
  get active() {
    return this._isActive;
  }
  set active(value) {
    this._isActive !== value && (this._isActive = value, value && !this._isLoading && this._next());
  }
};

// node_modules/@pixi/assets/lib/utils/checkDataUrl.mjs
function checkDataUrl(url, mimes) {
  if (Array.isArray(mimes)) {
    for (const mime of mimes)
      if (url.startsWith(`data:${mime}`))
        return true;
    return false;
  }
  return url.startsWith(`data:${mimes}`);
}

// node_modules/@pixi/assets/lib/utils/checkExtension.mjs
function checkExtension(url, extension) {
  const tempURL = url.split("?")[0], ext = lib_exports.path.extname(tempURL).toLowerCase();
  return Array.isArray(extension) ? extension.includes(ext) : ext === extension;
}

// node_modules/@pixi/assets/lib/utils/convertToList.mjs
var convertToList = (input, transform, forceTransform = false) => (Array.isArray(input) || (input = [input]), transform ? input.map((item) => typeof item == "string" || forceTransform ? transform(item) : item) : input);

// node_modules/@pixi/assets/lib/utils/createStringVariations.mjs
function processX(base, ids, depth, result, tags) {
  const id = ids[depth];
  for (let i = 0; i < id.length; i++) {
    const value = id[i];
    depth < ids.length - 1 ? processX(base.replace(result[depth], value), ids, depth + 1, result, tags) : tags.push(base.replace(result[depth], value));
  }
}
function createStringVariations(string) {
  const regex = /\{(.*?)\}/g, result = string.match(regex), tags = [];
  if (result) {
    const ids = [];
    result.forEach((vars) => {
      const split = vars.substring(1, vars.length - 1).split(",");
      ids.push(split);
    }), processX(string, ids, 0, result, tags);
  } else
    tags.push(string);
  return tags;
}

// node_modules/@pixi/assets/lib/utils/isSingleItem.mjs
var isSingleItem = (item) => !Array.isArray(item);

// node_modules/@pixi/assets/lib/cache/Cache.mjs
var CacheClass = class {
  constructor() {
    this._parsers = [], this._cache = /* @__PURE__ */ new Map(), this._cacheMap = /* @__PURE__ */ new Map();
  }
  /** Clear all entries. */
  reset() {
    this._cacheMap.clear(), this._cache.clear();
  }
  /**
   * Check if the key exists
   * @param key - The key to check
   */
  has(key) {
    return this._cache.has(key);
  }
  /**
   * Fetch entry by key
   * @param key - The key of the entry to get
   */
  get(key) {
    const result = this._cache.get(key);
    return result || console.warn(`[Assets] Asset id ${key} was not found in the Cache`), result;
  }
  /**
   * Set a value by key or keys name
   * @param key - The key or keys to set
   * @param value - The value to store in the cache or from which cacheable assets will be derived.
   */
  set(key, value) {
    const keys = convertToList(key);
    let cacheableAssets;
    for (let i = 0; i < this.parsers.length; i++) {
      const parser = this.parsers[i];
      if (parser.test(value)) {
        cacheableAssets = parser.getCacheableAssets(keys, value);
        break;
      }
    }
    cacheableAssets || (cacheableAssets = {}, keys.forEach((key2) => {
      cacheableAssets[key2] = value;
    }));
    const cacheKeys = Object.keys(cacheableAssets), cachedAssets = {
      cacheKeys,
      keys
    };
    if (keys.forEach((key2) => {
      this._cacheMap.set(key2, cachedAssets);
    }), cacheKeys.forEach((key2) => {
      const val = cacheableAssets ? cacheableAssets[key2] : value;
      this._cache.has(key2) && this._cache.get(key2) !== val && console.warn("[Cache] already has key:", key2), this._cache.set(key2, cacheableAssets[key2]);
    }), value instanceof Texture) {
      const texture = value;
      keys.forEach((key2) => {
        texture.baseTexture !== Texture.EMPTY.baseTexture && BaseTexture.addToCache(texture.baseTexture, key2), Texture.addToCache(texture, key2);
      });
    }
  }
  /**
   * Remove entry by key
   *
   * This function will also remove any associated alias from the cache also.
   * @param key - The key of the entry to remove
   */
  remove(key) {
    if (!this._cacheMap.has(key)) {
      console.warn(`[Assets] Asset id ${key} was not found in the Cache`);
      return;
    }
    const cacheMap = this._cacheMap.get(key);
    cacheMap.cacheKeys.forEach((key2) => {
      this._cache.delete(key2);
    }), cacheMap.keys.forEach((key2) => {
      this._cacheMap.delete(key2);
    });
  }
  /** All loader parsers registered */
  get parsers() {
    return this._parsers;
  }
};
var Cache = new CacheClass();

// node_modules/@pixi/assets/lib/loader/Loader.mjs
var Loader = class {
  constructor() {
    this._parsers = [], this._parsersValidated = false, this.parsers = new Proxy(this._parsers, {
      set: (target, key, value) => (this._parsersValidated = false, target[key] = value, true)
    }), this.promiseCache = {};
  }
  /** function used for testing */
  reset() {
    this._parsersValidated = false, this.promiseCache = {};
  }
  /**
   * Used internally to generate a promise for the asset to be loaded.
   * @param url - The URL to be loaded
   * @param data - any custom additional information relevant to the asset being loaded
   * @returns - a promise that will resolve to an Asset for example a Texture of a JSON object
   */
  _getLoadPromiseAndParser(url, data) {
    const result = {
      promise: null,
      parser: null
    };
    return result.promise = (async () => {
      var _a, _b;
      let asset = null, parser = null;
      if (data.loadParser && (parser = this._parserHash[data.loadParser], parser || console.warn(`[Assets] specified load parser "${data.loadParser}" not found while loading ${url}`)), !parser) {
        for (let i = 0; i < this.parsers.length; i++) {
          const parserX = this.parsers[i];
          if (parserX.load && ((_a = parserX.test) == null ? void 0 : _a.call(parserX, url, data, this))) {
            parser = parserX;
            break;
          }
        }
        if (!parser)
          return console.warn(`[Assets] ${url} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`), null;
      }
      asset = await parser.load(url, data, this), result.parser = parser;
      for (let i = 0; i < this.parsers.length; i++) {
        const parser2 = this.parsers[i];
        parser2.parse && parser2.parse && await ((_b = parser2.testParse) == null ? void 0 : _b.call(parser2, asset, data, this)) && (asset = await parser2.parse(asset, data, this) || asset, result.parser = parser2);
      }
      return asset;
    })(), result;
  }
  async load(assetsToLoadIn, onProgress) {
    this._parsersValidated || this._validateParsers();
    let count = 0;
    const assets = {}, singleAsset = isSingleItem(assetsToLoadIn), assetsToLoad = convertToList(assetsToLoadIn, (item) => ({
      alias: [item],
      src: item
    })), total = assetsToLoad.length, promises = assetsToLoad.map(async (asset) => {
      const url = lib_exports.path.toAbsolute(asset.src);
      if (!assets[asset.src])
        try {
          this.promiseCache[url] || (this.promiseCache[url] = this._getLoadPromiseAndParser(url, asset)), assets[asset.src] = await this.promiseCache[url].promise, onProgress && onProgress(++count / total);
        } catch (e) {
          throw delete this.promiseCache[url], delete assets[asset.src], new Error(`[Loader.load] Failed to load ${url}.
${e}`);
        }
    });
    return await Promise.all(promises), singleAsset ? assets[assetsToLoad[0].src] : assets;
  }
  /**
   * Unloads one or more assets. Any unloaded assets will be destroyed, freeing up memory for your app.
   * The parser that created the asset, will be the one that unloads it.
   * @example
   * // Single asset:
   * const asset = await Loader.load('cool.png');
   *
   * await Loader.unload('cool.png');
   *
   * console.log(asset.destroyed); // true
   * @param assetsToUnloadIn - urls that you want to unload, or a single one!
   */
  async unload(assetsToUnloadIn) {
    const promises = convertToList(assetsToUnloadIn, (item) => ({
      alias: [item],
      src: item
    })).map(async (asset) => {
      var _a, _b;
      const url = lib_exports.path.toAbsolute(asset.src), loadPromise = this.promiseCache[url];
      if (loadPromise) {
        const loadedAsset = await loadPromise.promise;
        delete this.promiseCache[url], (_b = (_a = loadPromise.parser) == null ? void 0 : _a.unload) == null ? void 0 : _b.call(_a, loadedAsset, asset, this);
      }
    });
    await Promise.all(promises);
  }
  /** validates our parsers, right now it only checks for name conflicts but we can add more here as required! */
  _validateParsers() {
    this._parsersValidated = true, this._parserHash = this._parsers.filter((parser) => parser.name).reduce((hash, parser) => (hash[parser.name] && console.warn(`[Assets] loadParser name conflict "${parser.name}"`), { ...hash, [parser.name]: parser }), {});
  }
};

// node_modules/@pixi/assets/lib/loader/parsers/LoaderParser.mjs
var LoaderParserPriority = ((LoaderParserPriority2) => (LoaderParserPriority2[LoaderParserPriority2.Low = 0] = "Low", LoaderParserPriority2[LoaderParserPriority2.Normal = 1] = "Normal", LoaderParserPriority2[LoaderParserPriority2.High = 2] = "High", LoaderParserPriority2))(LoaderParserPriority || {});

// node_modules/@pixi/assets/lib/loader/parsers/loadJson.mjs
var validJSONExtension = ".json";
var validJSONMIME = "application/json";
var loadJson = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low
  },
  name: "loadJson",
  test(url) {
    return checkDataUrl(url, validJSONMIME) || checkExtension(url, validJSONExtension);
  },
  async load(url) {
    return await (await settings.ADAPTER.fetch(url)).json();
  }
};
extensions.add(loadJson);

// node_modules/@pixi/assets/lib/loader/parsers/loadTxt.mjs
var validTXTExtension = ".txt";
var validTXTMIME = "text/plain";
var loadTxt = {
  name: "loadTxt",
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low
  },
  test(url) {
    return checkDataUrl(url, validTXTMIME) || checkExtension(url, validTXTExtension);
  },
  async load(url) {
    return await (await settings.ADAPTER.fetch(url)).text();
  }
};
extensions.add(loadTxt);

// node_modules/@pixi/assets/lib/loader/parsers/loadWebFont.mjs
var validWeights = [
  "normal",
  "bold",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900"
];
var validFontExtensions = [".ttf", ".otf", ".woff", ".woff2"];
var validFontMIMEs = [
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2"
];
var CSS_IDENT_TOKEN_REGEX = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function getFontFamilyName(url) {
  const ext = lib_exports.path.extname(url), nameTokens = lib_exports.path.basename(url, ext).replace(/(-|_)/g, " ").toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  let valid = nameTokens.length > 0;
  for (const token of nameTokens)
    if (!token.match(CSS_IDENT_TOKEN_REGEX)) {
      valid = false;
      break;
    }
  let fontFamilyName = nameTokens.join(" ");
  return valid || (fontFamilyName = `"${fontFamilyName.replace(/[\\"]/g, "\\$&")}"`), fontFamilyName;
}
var validURICharactersRegex = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function encodeURIWhenNeeded(uri) {
  return validURICharactersRegex.test(uri) ? uri : encodeURI(uri);
}
var loadWebFont = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low
  },
  name: "loadWebFont",
  test(url) {
    return checkDataUrl(url, validFontMIMEs) || checkExtension(url, validFontExtensions);
  },
  async load(url, options) {
    var _a, _b, _c;
    const fonts = settings.ADAPTER.getFontFaceSet();
    if (fonts) {
      const fontFaces = [], name = ((_a = options.data) == null ? void 0 : _a.family) ?? getFontFamilyName(url), weights = ((_c = (_b = options.data) == null ? void 0 : _b.weights) == null ? void 0 : _c.filter((weight) => validWeights.includes(weight))) ?? ["normal"], data = options.data ?? {};
      for (let i = 0; i < weights.length; i++) {
        const weight = weights[i], font = new FontFace(name, `url(${encodeURIWhenNeeded(url)})`, {
          ...data,
          weight
        });
        await font.load(), fonts.add(font), fontFaces.push(font);
      }
      return fontFaces.length === 1 ? fontFaces[0] : fontFaces;
    }
    return console.warn("[loadWebFont] FontFace API is not supported. Skipping loading font"), null;
  },
  unload(font) {
    (Array.isArray(font) ? font : [font]).forEach((t) => settings.ADAPTER.getFontFaceSet().delete(t));
  }
};
extensions.add(loadWebFont);

// node_modules/@pixi/assets/lib/_virtual/checkImageBitmap.worker.mjs
var WORKER_CODE = `(function() {
  "use strict";
  const WHITE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
  async function checkImageBitmap() {
    try {
      if (typeof createImageBitmap != "function")
        return !1;
      const imageBlob = await (await fetch(WHITE_PNG)).blob(), imageBitmap = await createImageBitmap(imageBlob);
      return imageBitmap.width === 1 && imageBitmap.height === 1;
    } catch {
      return !1;
    }
  }
  checkImageBitmap().then((result) => {
    self.postMessage(result);
  });
})();
`;
var WORKER_URL = null;
var WorkerInstance = class {
  constructor() {
    WORKER_URL || (WORKER_URL = URL.createObjectURL(new Blob([WORKER_CODE], { type: "application/javascript" }))), this.worker = new Worker(WORKER_URL);
  }
};
WorkerInstance.revokeObjectURL = function() {
  WORKER_URL && (URL.revokeObjectURL(WORKER_URL), WORKER_URL = null);
};

// node_modules/@pixi/assets/lib/_virtual/loadImageBitmap.worker.mjs
var WORKER_CODE2 = `(function() {
  "use strict";
  async function loadImageBitmap(url) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(\`[WorkerManager.loadImageBitmap] Failed to fetch \${url}: \${response.status} \${response.statusText}\`);
    const imageBlob = await response.blob();
    return await createImageBitmap(imageBlob);
  }
  self.onmessage = async (event) => {
    try {
      const imageBitmap = await loadImageBitmap(event.data.data[0]);
      self.postMessage({
        data: imageBitmap,
        uuid: event.data.uuid,
        id: event.data.id
      }, [imageBitmap]);
    } catch (e) {
      self.postMessage({
        error: e,
        uuid: event.data.uuid,
        id: event.data.id
      });
    }
  };
})();
`;
var WORKER_URL2 = null;
var WorkerInstance2 = class {
  constructor() {
    WORKER_URL2 || (WORKER_URL2 = URL.createObjectURL(new Blob([WORKER_CODE2], { type: "application/javascript" }))), this.worker = new Worker(WORKER_URL2);
  }
};
WorkerInstance2.revokeObjectURL = function() {
  WORKER_URL2 && (URL.revokeObjectURL(WORKER_URL2), WORKER_URL2 = null);
};

// node_modules/@pixi/assets/lib/loader/parsers/WorkerManager.mjs
var UUID = 0;
var MAX_WORKERS;
var WorkerManagerClass = class {
  constructor() {
    this._initialized = false, this._createdWorkers = 0, this.workerPool = [], this.queue = [], this.resolveHash = {};
  }
  isImageBitmapSupported() {
    return this._isImageBitmapSupported !== void 0 ? this._isImageBitmapSupported : (this._isImageBitmapSupported = new Promise((resolve) => {
      const { worker } = new WorkerInstance();
      worker.addEventListener("message", (event) => {
        worker.terminate(), WorkerInstance.revokeObjectURL(), resolve(event.data);
      });
    }), this._isImageBitmapSupported);
  }
  loadImageBitmap(src) {
    return this._run("loadImageBitmap", [src]);
  }
  async _initWorkers() {
    this._initialized || (this._initialized = true);
  }
  getWorker() {
    MAX_WORKERS === void 0 && (MAX_WORKERS = navigator.hardwareConcurrency || 4);
    let worker = this.workerPool.pop();
    return !worker && this._createdWorkers < MAX_WORKERS && (this._createdWorkers++, worker = new WorkerInstance2().worker, worker.addEventListener("message", (event) => {
      this.complete(event.data), this.returnWorker(event.target), this.next();
    })), worker;
  }
  returnWorker(worker) {
    this.workerPool.push(worker);
  }
  complete(data) {
    data.error !== void 0 ? this.resolveHash[data.uuid].reject(data.error) : this.resolveHash[data.uuid].resolve(data.data), this.resolveHash[data.uuid] = null;
  }
  async _run(id, args) {
    await this._initWorkers();
    const promise = new Promise((resolve, reject) => {
      this.queue.push({ id, arguments: args, resolve, reject });
    });
    return this.next(), promise;
  }
  next() {
    if (!this.queue.length)
      return;
    const worker = this.getWorker();
    if (!worker)
      return;
    const toDo = this.queue.pop(), id = toDo.id;
    this.resolveHash[UUID] = { resolve: toDo.resolve, reject: toDo.reject }, worker.postMessage({
      data: toDo.arguments,
      uuid: UUID++,
      id
    });
  }
};
var WorkerManager = new WorkerManagerClass();

// node_modules/@pixi/assets/lib/loader/parsers/textures/utils/createTexture.mjs
function createTexture(base, loader, url) {
  base.resource.internal = true;
  const texture = new Texture(base), unload = () => {
    delete loader.promiseCache[url], Cache.has(url) && Cache.remove(url);
  };
  return texture.baseTexture.once("destroyed", () => {
    url in loader.promiseCache && (console.warn("[Assets] A BaseTexture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the BaseTexture."), unload());
  }), texture.once("destroyed", () => {
    base.destroyed || (console.warn("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture."), unload());
  }), texture;
}

// node_modules/@pixi/assets/lib/loader/parsers/textures/loadTextures.mjs
var validImageExtensions = [".jpeg", ".jpg", ".png", ".webp", ".avif"];
var validImageMIMEs = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
];
async function loadImageBitmap(url) {
  const response = await settings.ADAPTER.fetch(url);
  if (!response.ok)
    throw new Error(`[loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  const imageBlob = await response.blob();
  return await createImageBitmap(imageBlob);
}
var loadTextures = {
  name: "loadTextures",
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High
  },
  config: {
    preferWorkers: true,
    preferCreateImageBitmap: true,
    crossOrigin: "anonymous"
  },
  test(url) {
    return checkDataUrl(url, validImageMIMEs) || checkExtension(url, validImageExtensions);
  },
  async load(url, asset, loader) {
    var _a;
    const useImageBitmap = globalThis.createImageBitmap && this.config.preferCreateImageBitmap;
    let src;
    useImageBitmap ? this.config.preferWorkers && await WorkerManager.isImageBitmapSupported() ? src = await WorkerManager.loadImageBitmap(url) : src = await loadImageBitmap(url) : src = await new Promise((resolve, reject) => {
      const src2 = new Image();
      src2.crossOrigin = this.config.crossOrigin, src2.src = url, src2.complete ? resolve(src2) : (src2.onload = () => resolve(src2), src2.onerror = (e) => reject(e));
    });
    const options = { ...asset.data };
    options.resolution ?? (options.resolution = lib_exports.getResolutionOfUrl(url)), useImageBitmap && ((_a = options.resourceOptions) == null ? void 0 : _a.ownsImageBitmap) === void 0 && (options.resourceOptions = { ...options.resourceOptions }, options.resourceOptions.ownsImageBitmap = true);
    const base = new BaseTexture(src, options);
    return base.resource.src = url, createTexture(base, loader, url);
  },
  unload(texture) {
    texture.destroy(true);
  }
};
extensions.add(loadTextures);

// node_modules/@pixi/assets/lib/loader/parsers/textures/loadSVG.mjs
var validSVGExtension = ".svg";
var validSVGMIME = "image/svg+xml";
var loadSVG = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High
  },
  name: "loadSVG",
  test(url) {
    return checkDataUrl(url, validSVGMIME) || checkExtension(url, validSVGExtension);
  },
  async testParse(data) {
    return SVGResource.test(data);
  },
  async parse(asset, data, loader) {
    var _a;
    const src = new SVGResource(asset, (_a = data == null ? void 0 : data.data) == null ? void 0 : _a.resourceOptions);
    await src.load();
    const base = new BaseTexture(src, {
      resolution: lib_exports.getResolutionOfUrl(asset),
      ...data == null ? void 0 : data.data
    });
    return base.resource.src = data.src, createTexture(base, loader, data.src);
  },
  async load(url, _options) {
    return (await settings.ADAPTER.fetch(url)).text();
  },
  unload: loadTextures.unload
};
extensions.add(loadSVG);

// node_modules/@pixi/assets/lib/loader/parsers/textures/loadVideo.mjs
var validVideoExtensions = [".mp4", ".m4v", ".webm", ".ogv"];
var validVideoMIMEs = [
  "video/mp4",
  "video/webm",
  "video/ogg"
];
var loadVideo = {
  name: "loadVideo",
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High
  },
  config: {
    defaultAutoPlay: true,
    defaultUpdateFPS: 0,
    defaultLoop: false,
    defaultMuted: false,
    defaultPlaysinline: true
  },
  test(url) {
    return checkDataUrl(url, validVideoMIMEs) || checkExtension(url, validVideoExtensions);
  },
  async load(url, loadAsset, loader) {
    var _a;
    let texture;
    const blob = await (await settings.ADAPTER.fetch(url)).blob(), blobURL = URL.createObjectURL(blob);
    try {
      const options = {
        autoPlay: this.config.defaultAutoPlay,
        updateFPS: this.config.defaultUpdateFPS,
        loop: this.config.defaultLoop,
        muted: this.config.defaultMuted,
        playsinline: this.config.defaultPlaysinline,
        ...(_a = loadAsset == null ? void 0 : loadAsset.data) == null ? void 0 : _a.resourceOptions,
        autoLoad: true
      }, src = new VideoResource(blobURL, options);
      await src.load();
      const base = new BaseTexture(src, {
        alphaMode: await lib_exports.detectVideoAlphaMode(),
        resolution: lib_exports.getResolutionOfUrl(url),
        ...loadAsset == null ? void 0 : loadAsset.data
      });
      base.resource.src = url, texture = createTexture(base, loader, url), texture.baseTexture.once("destroyed", () => {
        URL.revokeObjectURL(blobURL);
      });
    } catch (e) {
      throw URL.revokeObjectURL(blobURL), e;
    }
    return texture;
  },
  unload(texture) {
    texture.destroy(true);
  }
};
extensions.add(loadVideo);

// node_modules/@pixi/assets/lib/resolver/Resolver.mjs
var Resolver = class {
  constructor() {
    this._defaultBundleIdentifierOptions = {
      connector: "-",
      createBundleAssetId: (bundleId, assetId) => `${bundleId}${this._bundleIdConnector}${assetId}`,
      extractAssetIdFromBundle: (bundleId, assetBundleId) => assetBundleId.replace(`${bundleId}${this._bundleIdConnector}`, "")
    }, this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector, this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId, this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle, this._assetMap = {}, this._preferredOrder = [], this._parsers = [], this._resolverHash = {}, this._bundles = {};
  }
  /**
   * Override how the resolver deals with generating bundle ids.
   * must be called before any bundles are added
   * @param bundleIdentifier - the bundle identifier options
   */
  setBundleIdentifier(bundleIdentifier) {
    if (this._bundleIdConnector = bundleIdentifier.connector ?? this._bundleIdConnector, this._createBundleAssetId = bundleIdentifier.createBundleAssetId ?? this._createBundleAssetId, this._extractAssetIdFromBundle = bundleIdentifier.extractAssetIdFromBundle ?? this._extractAssetIdFromBundle, this._extractAssetIdFromBundle("foo", this._createBundleAssetId("foo", "bar")) !== "bar")
      throw new Error("[Resolver] GenerateBundleAssetId are not working correctly");
  }
  /**
   * Let the resolver know which assets you prefer to use when resolving assets.
   * Multiple prefer user defined rules can be added.
   * @example
   * resolver.prefer({
   *     // first look for something with the correct format, and then then correct resolution
   *     priority: ['format', 'resolution'],
   *     params:{
   *         format:'webp', // prefer webp images
   *         resolution: 2, // prefer a resolution of 2
   *     }
   * })
   * resolver.add('foo', ['bar@2x.webp', 'bar@2x.png', 'bar.webp', 'bar.png']);
   * resolver.resolveUrl('foo') // => 'bar@2x.webp'
   * @param preferOrders - the prefer options
   */
  prefer(...preferOrders) {
    preferOrders.forEach((prefer) => {
      this._preferredOrder.push(prefer), prefer.priority || (prefer.priority = Object.keys(prefer.params));
    }), this._resolverHash = {};
  }
  /**
   * Set the base path to prepend to all urls when resolving
   * @example
   * resolver.basePath = 'https://home.com/';
   * resolver.add('foo', 'bar.ong');
   * resolver.resolveUrl('foo', 'bar.png'); // => 'https://home.com/bar.png'
   * @param basePath - the base path to use
   */
  set basePath(basePath) {
    this._basePath = basePath;
  }
  get basePath() {
    return this._basePath;
  }
  /**
   * Set the root path for root-relative URLs. By default the `basePath`'s root is used. If no `basePath` is set, then the
   * default value for browsers is `window.location.origin`
   * @example
   * // Application hosted on https://home.com/some-path/index.html
   * resolver.basePath = 'https://home.com/some-path/';
   * resolver.rootPath = 'https://home.com/';
   * resolver.add('foo', '/bar.png');
   * resolver.resolveUrl('foo', '/bar.png'); // => 'https://home.com/bar.png'
   * @param rootPath - the root path to use
   */
  set rootPath(rootPath) {
    this._rootPath = rootPath;
  }
  get rootPath() {
    return this._rootPath;
  }
  /**
   * All the active URL parsers that help the parser to extract information and create
   * an asset object-based on parsing the URL itself.
   *
   * Can be added using the extensions API
   * @example
   * resolver.add('foo', [
   *     {
   *         resolution: 2,
   *         format: 'png',
   *         src: 'image@2x.png',
   *     },
   *     {
   *         resolution:1,
   *         format:'png',
   *         src: 'image.png',
   *     },
   * ]);
   *
   * // With a url parser the information such as resolution and file format could extracted from the url itself:
   * extensions.add({
   *     extension: ExtensionType.ResolveParser,
   *     test: loadTextures.test, // test if url ends in an image
   *     parse: (value: string) =>
   *     ({
   *         resolution: parseFloat(settings.RETINA_PREFIX.exec(value)?.[1] ?? '1'),
   *         format: value.split('.').pop(),
   *         src: value,
   *     }),
   * });
   *
   * // Now resolution and format can be extracted from the url
   * resolver.add('foo', [
   *     'image@2x.png',
   *     'image.png',
   * ]);
   */
  get parsers() {
    return this._parsers;
  }
  /** Used for testing, this resets the resolver to its initial state */
  reset() {
    this.setBundleIdentifier(this._defaultBundleIdentifierOptions), this._assetMap = {}, this._preferredOrder = [], this._resolverHash = {}, this._rootPath = null, this._basePath = null, this._manifest = null, this._bundles = {}, this._defaultSearchParams = null;
  }
  /**
   * Sets the default URL search parameters for the URL resolver. The urls can be specified as a string or an object.
   * @param searchParams - the default url parameters to append when resolving urls
   */
  setDefaultSearchParams(searchParams) {
    if (typeof searchParams == "string")
      this._defaultSearchParams = searchParams;
    else {
      const queryValues = searchParams;
      this._defaultSearchParams = Object.keys(queryValues).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryValues[key])}`).join("&");
    }
  }
  /**
   * Returns the aliases for a given asset
   * @param asset - the asset to get the aliases for
   */
  getAlias(asset) {
    const { alias, name, src, srcs } = asset;
    return convertToList(
      alias || name || src || srcs,
      (value) => typeof value == "string" ? value : Array.isArray(value) ? value.map((v) => (v == null ? void 0 : v.src) ?? (v == null ? void 0 : v.srcs) ?? v) : (value == null ? void 0 : value.src) || (value == null ? void 0 : value.srcs) ? value.src ?? value.srcs : value,
      true
    );
  }
  /**
   * Add a manifest to the asset resolver. This is a nice way to add all the asset information in one go.
   * generally a manifest would be built using a tool.
   * @param manifest - the manifest to add to the resolver
   */
  addManifest(manifest) {
    this._manifest && console.warn("[Resolver] Manifest already exists, this will be overwritten"), this._manifest = manifest, manifest.bundles.forEach((bundle) => {
      this.addBundle(bundle.name, bundle.assets);
    });
  }
  /**
   * This adds a bundle of assets in one go so that you can resolve them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * resolver.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const resolvedAssets = await resolver.resolveBundle('animals');
   * @param bundleId - The id of the bundle to add
   * @param assets - A record of the asset or assets that will be chosen from when loading via the specified key
   */
  addBundle(bundleId, assets) {
    const assetNames = [];
    Array.isArray(assets) ? assets.forEach((asset) => {
      const srcs = asset.src ?? asset.srcs, aliases = asset.alias ?? asset.name;
      let ids;
      if (typeof aliases == "string") {
        const bundleAssetId = this._createBundleAssetId(bundleId, aliases);
        assetNames.push(bundleAssetId), ids = [aliases, bundleAssetId];
      } else {
        const bundleIds = aliases.map((name) => this._createBundleAssetId(bundleId, name));
        assetNames.push(...bundleIds), ids = [...aliases, ...bundleIds];
      }
      this.add({
        ...asset,
        alias: ids,
        src: srcs
      });
    }) : Object.keys(assets).forEach((key) => {
      const aliases = [key, this._createBundleAssetId(bundleId, key)];
      if (typeof assets[key] == "string")
        this.add({
          alias: aliases,
          src: assets[key]
        });
      else if (Array.isArray(assets[key]))
        this.add({
          alias: aliases,
          src: assets[key]
        });
      else {
        const asset = assets[key], assetSrc = asset.src ?? asset.srcs;
        this.add({
          ...asset,
          alias: aliases,
          src: Array.isArray(assetSrc) ? assetSrc : [assetSrc]
        });
      }
      assetNames.push(...aliases);
    }), this._bundles[bundleId] = assetNames;
  }
  add(aliases, srcs, data, format, loadParser) {
    const assets = [];
    typeof aliases == "string" || Array.isArray(aliases) && typeof aliases[0] == "string" ? (lib_exports.deprecation("7.2.0", `Assets.add now uses an object instead of individual parameters.
Please use Assets.add({ alias, src, data, format, loadParser }) instead.`), assets.push({ alias: aliases, src: srcs, data, format, loadParser })) : Array.isArray(aliases) ? assets.push(...aliases) : assets.push(aliases);
    let keyCheck;
    keyCheck = (key) => {
      this.hasKey(key) && console.warn(`[Resolver] already has key: ${key} overwriting`);
    }, convertToList(assets).forEach((asset) => {
      const { src, srcs: srcs2 } = asset;
      let { data: data2, format: format2, loadParser: loadParser2 } = asset;
      const srcsToUse = convertToList(src || srcs2).map((src2) => typeof src2 == "string" ? createStringVariations(src2) : Array.isArray(src2) ? src2 : [src2]), aliasesToUse = this.getAlias(asset);
      Array.isArray(aliasesToUse) ? aliasesToUse.forEach(keyCheck) : keyCheck(aliasesToUse);
      const resolvedAssets = [];
      srcsToUse.forEach((srcs3) => {
        srcs3.forEach((src2) => {
          let formattedAsset = {};
          if (typeof src2 != "object") {
            formattedAsset.src = src2;
            for (let i = 0; i < this._parsers.length; i++) {
              const parser = this._parsers[i];
              if (parser.test(src2)) {
                formattedAsset = parser.parse(src2);
                break;
              }
            }
          } else
            data2 = src2.data ?? data2, format2 = src2.format ?? format2, loadParser2 = src2.loadParser ?? loadParser2, formattedAsset = {
              ...formattedAsset,
              ...src2
            };
          if (!aliasesToUse)
            throw new Error(`[Resolver] alias is undefined for this asset: ${formattedAsset.src}`);
          formattedAsset = this.buildResolvedAsset(formattedAsset, {
            aliases: aliasesToUse,
            data: data2,
            format: format2,
            loadParser: loadParser2
          }), resolvedAssets.push(formattedAsset);
        });
      }), aliasesToUse.forEach((alias) => {
        this._assetMap[alias] = resolvedAssets;
      });
    });
  }
  // TODO: this needs an overload like load did in Assets
  /**
   * If the resolver has had a manifest set via setManifest, this will return the assets urls for
   * a given bundleId or bundleIds.
   * @example
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * resolver.setManifest(manifest);
   * const resolved = resolver.resolveBundle('load-screen');
   * @param bundleIds - The bundle ids to resolve
   * @returns All the bundles assets or a hash of assets for each bundle specified
   */
  resolveBundle(bundleIds) {
    const singleAsset = isSingleItem(bundleIds);
    bundleIds = convertToList(bundleIds);
    const out = {};
    return bundleIds.forEach((bundleId) => {
      const assetNames = this._bundles[bundleId];
      if (assetNames) {
        const results = this.resolve(assetNames), assets = {};
        for (const key in results) {
          const asset = results[key];
          assets[this._extractAssetIdFromBundle(bundleId, key)] = asset;
        }
        out[bundleId] = assets;
      }
    }), singleAsset ? out[bundleIds[0]] : out;
  }
  /**
   * Does exactly what resolve does, but returns just the URL rather than the whole asset object
   * @param key - The key or keys to resolve
   * @returns - The URLs associated with the key(s)
   */
  resolveUrl(key) {
    const result = this.resolve(key);
    if (typeof key != "string") {
      const out = {};
      for (const i in result)
        out[i] = result[i].src;
      return out;
    }
    return result.src;
  }
  resolve(keys) {
    const singleAsset = isSingleItem(keys);
    keys = convertToList(keys);
    const result = {};
    return keys.forEach((key) => {
      if (!this._resolverHash[key])
        if (this._assetMap[key]) {
          let assets = this._assetMap[key];
          const bestAsset = assets[0], preferredOrder = this._getPreferredOrder(assets);
          preferredOrder == null ? void 0 : preferredOrder.priority.forEach((priorityKey) => {
            preferredOrder.params[priorityKey].forEach((value) => {
              const filteredAssets = assets.filter((asset) => asset[priorityKey] ? asset[priorityKey] === value : false);
              filteredAssets.length && (assets = filteredAssets);
            });
          }), this._resolverHash[key] = assets[0] ?? bestAsset;
        } else
          this._resolverHash[key] = this.buildResolvedAsset({
            alias: [key],
            src: key
          }, {});
      result[key] = this._resolverHash[key];
    }), singleAsset ? result[keys[0]] : result;
  }
  /**
   * Checks if an asset with a given key exists in the resolver
   * @param key - The key of the asset
   */
  hasKey(key) {
    return !!this._assetMap[key];
  }
  /**
   * Checks if a bundle with the given key exists in the resolver
   * @param key - The key of the bundle
   */
  hasBundle(key) {
    return !!this._bundles[key];
  }
  /**
   * Internal function for figuring out what prefer criteria an asset should use.
   * @param assets
   */
  _getPreferredOrder(assets) {
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[0], preferred = this._preferredOrder.find((preference) => preference.params.format.includes(asset.format));
      if (preferred)
        return preferred;
    }
    return this._preferredOrder[0];
  }
  /**
   * Appends the default url parameters to the url
   * @param url - The url to append the default parameters to
   * @returns - The url with the default parameters appended
   */
  _appendDefaultSearchParams(url) {
    if (!this._defaultSearchParams)
      return url;
    const paramConnector = /\?/.test(url) ? "&" : "?";
    return `${url}${paramConnector}${this._defaultSearchParams}`;
  }
  buildResolvedAsset(formattedAsset, data) {
    const { aliases, data: assetData, loadParser, format } = data;
    return (this._basePath || this._rootPath) && (formattedAsset.src = lib_exports.path.toAbsolute(formattedAsset.src, this._basePath, this._rootPath)), formattedAsset.alias = aliases ?? formattedAsset.alias ?? [formattedAsset.src], formattedAsset.src = this._appendDefaultSearchParams(formattedAsset.src), formattedAsset.data = { ...assetData || {}, ...formattedAsset.data }, formattedAsset.loadParser = loadParser ?? formattedAsset.loadParser, formattedAsset.format = format ?? formattedAsset.format ?? lib_exports.path.extname(formattedAsset.src).slice(1), formattedAsset.srcs = formattedAsset.src, formattedAsset.name = formattedAsset.alias, formattedAsset;
  }
};

// node_modules/@pixi/assets/lib/Assets.mjs
var AssetsClass = class {
  constructor() {
    this._detections = [], this._initialized = false, this.resolver = new Resolver(), this.loader = new Loader(), this.cache = Cache, this._backgroundLoader = new BackgroundLoader(this.loader), this._backgroundLoader.active = true, this.reset();
  }
  /**
   * Best practice is to call this function before any loading commences
   * Initiating is the best time to add any customization to the way things are loaded.
   *
   * you do not need to call this for the Asset class to work, only if you want to set any initial properties
   * @param options - options to initialize the Asset manager with
   */
  async init(options = {}) {
    var _a, _b;
    if (this._initialized) {
      console.warn("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
      return;
    }
    if (this._initialized = true, options.defaultSearchParams && this.resolver.setDefaultSearchParams(options.defaultSearchParams), options.basePath && (this.resolver.basePath = options.basePath), options.bundleIdentifier && this.resolver.setBundleIdentifier(options.bundleIdentifier), options.manifest) {
      let manifest = options.manifest;
      typeof manifest == "string" && (manifest = await this.load(manifest)), this.resolver.addManifest(manifest);
    }
    const resolutionPref = ((_a = options.texturePreference) == null ? void 0 : _a.resolution) ?? 1, resolution = typeof resolutionPref == "number" ? [resolutionPref] : resolutionPref, formats = await this._detectFormats({
      preferredFormats: (_b = options.texturePreference) == null ? void 0 : _b.format,
      skipDetections: options.skipDetections,
      detections: this._detections
    });
    this.resolver.prefer({
      params: {
        format: formats,
        resolution
      }
    }), options.preferences && this.setPreferences(options.preferences);
  }
  add(aliases, srcs, data, format, loadParser) {
    this.resolver.add(aliases, srcs, data, format, loadParser);
  }
  async load(urls, onProgress) {
    this._initialized || await this.init();
    const singleAsset = isSingleItem(urls), urlArray = convertToList(urls).map((url) => {
      if (typeof url != "string") {
        const aliases = this.resolver.getAlias(url);
        return aliases.some((alias) => !this.resolver.hasKey(alias)) && this.add(url), Array.isArray(aliases) ? aliases[0] : aliases;
      }
      return this.resolver.hasKey(url) || this.add({ alias: url, src: url }), url;
    }), resolveResults = this.resolver.resolve(urlArray), out = await this._mapLoadToResolve(resolveResults, onProgress);
    return singleAsset ? out[urlArray[0]] : out;
  }
  /**
   * This adds a bundle of assets in one go so that you can load them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const assets = await Assets.loadBundle('animals');
   * @param bundleId - the id of the bundle to add
   * @param assets - a record of the asset or assets that will be chosen from when loading via the specified key
   */
  addBundle(bundleId, assets) {
    this.resolver.addBundle(bundleId, assets);
  }
  /**
   * Bundles are a way to load multiple assets at once.
   * If a manifest has been provided to the init function then you can load a bundle, or bundles.
   * you can also add bundles via `addBundle`
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * await Assets.init({ manifest });
   *
   * // Load a bundle...
   * loadScreenAssets = await Assets.loadBundle('load-screen');
   * // Load another bundle...
   * gameScreenAssets = await Assets.loadBundle('game-screen');
   * @param bundleIds - the bundle id or ids to load
   * @param onProgress - Optional function that is called when progress on asset loading is made.
   * The function is passed a single parameter, `progress`, which represents the percentage (0.0 - 1.0)
   * of the assets loaded. Do not use this function to detect when assets are complete and available,
   * instead use the Promise returned by this function.
   * @returns all the bundles assets or a hash of assets for each bundle specified
   */
  async loadBundle(bundleIds, onProgress) {
    this._initialized || await this.init();
    let singleAsset = false;
    typeof bundleIds == "string" && (singleAsset = true, bundleIds = [bundleIds]);
    const resolveResults = this.resolver.resolveBundle(bundleIds), out = {}, keys = Object.keys(resolveResults);
    let count = 0, total = 0;
    const _onProgress = () => {
      onProgress == null ? void 0 : onProgress(++count / total);
    }, promises = keys.map((bundleId) => {
      const resolveResult = resolveResults[bundleId];
      return total += Object.keys(resolveResult).length, this._mapLoadToResolve(resolveResult, _onProgress).then((resolveResult2) => {
        out[bundleId] = resolveResult2;
      });
    });
    return await Promise.all(promises), singleAsset ? out[bundleIds[0]] : out;
  }
  /**
   * Initiate a background load of some assets. It will passively begin to load these assets in the background.
   * So when you actually come to loading them you will get a promise that resolves to the loaded assets immediately
   *
   * An example of this might be that you would background load game assets after your inital load.
   * then when you got to actually load your game screen assets when a player goes to the game - the loading
   * would already have stared or may even be complete, saving you having to show an interim load bar.
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.backgroundLoad('bunny.png');
   *
   * // later on in your app...
   * await Assets.loadBundle('bunny.png'); // Will resolve quicker as loading may have completed!
   * @param urls - the url / urls you want to background load
   */
  async backgroundLoad(urls) {
    this._initialized || await this.init(), typeof urls == "string" && (urls = [urls]);
    const resolveResults = this.resolver.resolve(urls);
    this._backgroundLoader.add(Object.values(resolveResults));
  }
  /**
   * Initiate a background of a bundle, works exactly like backgroundLoad but for bundles.
   * this can only be used if the loader has been initiated with a manifest
   * @example
   * import { Assets } from 'pixi.js';
   *
   * await Assets.init({
   *     manifest: {
   *         bundles: [
   *             {
   *                 name: 'load-screen',
   *                 assets: [...],
   *             },
   *             ...
   *         ],
   *     },
   * });
   *
   * Assets.backgroundLoadBundle('load-screen');
   *
   * // Later on in your app...
   * await Assets.loadBundle('load-screen'); // Will resolve quicker as loading may have completed!
   * @param bundleIds - the bundleId / bundleIds you want to background load
   */
  async backgroundLoadBundle(bundleIds) {
    this._initialized || await this.init(), typeof bundleIds == "string" && (bundleIds = [bundleIds]);
    const resolveResults = this.resolver.resolveBundle(bundleIds);
    Object.values(resolveResults).forEach((resolveResult) => {
      this._backgroundLoader.add(Object.values(resolveResult));
    });
  }
  /**
   * Only intended for development purposes.
   * This will wipe the resolver and caches.
   * You will need to reinitialize the Asset
   */
  reset() {
    this.resolver.reset(), this.loader.reset(), this.cache.reset(), this._initialized = false;
  }
  get(keys) {
    if (typeof keys == "string")
      return Cache.get(keys);
    const assets = {};
    for (let i = 0; i < keys.length; i++)
      assets[i] = Cache.get(keys[i]);
    return assets;
  }
  /**
   * helper function to map resolved assets back to loaded assets
   * @param resolveResults - the resolve results from the resolver
   * @param onProgress - the progress callback
   */
  async _mapLoadToResolve(resolveResults, onProgress) {
    const resolveArray = Object.values(resolveResults), resolveKeys = Object.keys(resolveResults);
    this._backgroundLoader.active = false;
    const loadedAssets = await this.loader.load(resolveArray, onProgress);
    this._backgroundLoader.active = true;
    const out = {};
    return resolveArray.forEach((resolveResult, i) => {
      const asset = loadedAssets[resolveResult.src], keys = [resolveResult.src];
      resolveResult.alias && keys.push(...resolveResult.alias), out[resolveKeys[i]] = asset, Cache.set(keys, asset);
    }), out;
  }
  /**
   * Unload an asset or assets. As the Assets class is responsible for creating the assets via the `load` function
   * this will make sure to destroy any assets and release them from memory.
   * Once unloaded, you will need to load the asset again.
   *
   * Use this to help manage assets if you find that you have a large app and you want to free up memory.
   *
   * - it's up to you as the developer to make sure that textures are not actively being used when you unload them,
   * Pixi won't break but you will end up with missing assets. Not a good look for the user!
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Load a URL:
   * const myImageTexture = await Assets.load('http://some.url.com/image.png'); // => returns a texture
   *
   * await Assets.unload('http://some.url.com/image.png')
   *
   * // myImageTexture will be destroyed now.
   *
   * // Unload multiple assets:
   * const textures = await Assets.unload(['thumper', 'chicko']);
   * @param urls - the urls to unload
   */
  async unload(urls) {
    this._initialized || await this.init();
    const urlArray = convertToList(urls).map((url) => typeof url != "string" ? url.src : url), resolveResults = this.resolver.resolve(urlArray);
    await this._unloadFromResolved(resolveResults);
  }
  /**
   * Bundles are a way to manage multiple assets at once.
   * this will unload all files in a bundle.
   *
   * once a bundle has been unloaded, you need to load it again to have access to the assets.
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.addBundle({
   *     'thumper': 'http://some.url.com/thumper.png',
   * })
   *
   * const assets = await Assets.loadBundle('thumper');
   *
   * // Now to unload...
   *
   * await Assets.unloadBundle('thumper');
   *
   * // All assets in the assets object will now have been destroyed and purged from the cache
   * @param bundleIds - the bundle id or ids to unload
   */
  async unloadBundle(bundleIds) {
    this._initialized || await this.init(), bundleIds = convertToList(bundleIds);
    const resolveResults = this.resolver.resolveBundle(bundleIds), promises = Object.keys(resolveResults).map((bundleId) => this._unloadFromResolved(resolveResults[bundleId]));
    await Promise.all(promises);
  }
  async _unloadFromResolved(resolveResult) {
    const resolveArray = Object.values(resolveResult);
    resolveArray.forEach((resolveResult2) => {
      Cache.remove(resolveResult2.src);
    }), await this.loader.unload(resolveArray);
  }
  /**
   * Detects the supported formats for the browser, and returns an array of supported formats, respecting
   * the users preferred formats order.
   * @param options - the options to use when detecting formats
   * @param options.preferredFormats - the preferred formats to use
   * @param options.skipDetections - if we should skip the detections altogether
   * @param options.detections - the detections to use
   * @returns - the detected formats
   */
  async _detectFormats(options) {
    let formats = [];
    options.preferredFormats && (formats = Array.isArray(options.preferredFormats) ? options.preferredFormats : [options.preferredFormats]);
    for (const detection of options.detections)
      options.skipDetections || await detection.test() ? formats = await detection.add(formats) : options.skipDetections || (formats = await detection.remove(formats));
    return formats = formats.filter((format, index) => formats.indexOf(format) === index), formats;
  }
  /** All the detection parsers currently added to the Assets class. */
  get detections() {
    return this._detections;
  }
  /**
   * @deprecated since 7.2.0
   * @see {@link Assets.setPreferences}
   */
  get preferWorkers() {
    return loadTextures.config.preferWorkers;
  }
  set preferWorkers(value) {
    lib_exports.deprecation("7.2.0", "Assets.prefersWorkers is deprecated, use Assets.setPreferences({ preferWorkers: true }) instead."), this.setPreferences({ preferWorkers: value });
  }
  /**
   * General setter for preferences. This is a helper function to set preferences on all parsers.
   * @param preferences - the preferences to set
   */
  setPreferences(preferences) {
    this.loader.parsers.forEach((parser) => {
      parser.config && Object.keys(parser.config).filter((key) => key in preferences).forEach((key) => {
        parser.config[key] = preferences[key];
      });
    });
  }
};
var Assets = new AssetsClass();
extensions.handleByList(ExtensionType.LoadParser, Assets.loader.parsers).handleByList(ExtensionType.ResolveParser, Assets.resolver.parsers).handleByList(ExtensionType.CacheParser, Assets.cache.parsers).handleByList(ExtensionType.DetectionParser, Assets.detections);

// node_modules/@pixi/assets/lib/cache/parsers/cacheTextureArray.mjs
var cacheTextureArray = {
  extension: ExtensionType.CacheParser,
  test: (asset) => Array.isArray(asset) && asset.every((t) => t instanceof Texture),
  getCacheableAssets: (keys, asset) => {
    const out = {};
    return keys.forEach((key) => {
      asset.forEach((item, i) => {
        out[key + (i === 0 ? "" : i + 1)] = item;
      });
    }), out;
  }
};
extensions.add(cacheTextureArray);

// node_modules/@pixi/assets/lib/detections/utils/testImageFormat.mjs
async function testImageFormat(imageData) {
  if ("Image" in globalThis)
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve(true);
      }, image.onerror = () => {
        resolve(false);
      }, image.src = imageData;
    });
  if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
    try {
      const blob = await (await fetch(imageData)).blob();
      await createImageBitmap(blob);
    } catch {
      return false;
    }
    return true;
  }
  return false;
}

// node_modules/@pixi/assets/lib/detections/parsers/detectAvif.mjs
var detectAvif = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 1
  },
  test: async () => testImageFormat(
    // eslint-disable-next-line max-len
    "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
  ),
  add: async (formats) => [...formats, "avif"],
  remove: async (formats) => formats.filter((f) => f !== "avif")
};
extensions.add(detectAvif);

// node_modules/@pixi/assets/lib/detections/parsers/detectWebp.mjs
var detectWebp = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testImageFormat(
    "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="
  ),
  add: async (formats) => [...formats, "webp"],
  remove: async (formats) => formats.filter((f) => f !== "webp")
};
extensions.add(detectWebp);

// node_modules/@pixi/assets/lib/detections/parsers/detectDefaults.mjs
var imageFormats = ["png", "jpg", "jpeg"];
var detectDefaults = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: -1
  },
  test: () => Promise.resolve(true),
  add: async (formats) => [...formats, ...imageFormats],
  remove: async (formats) => formats.filter((f) => !imageFormats.includes(f))
};
extensions.add(detectDefaults);

// node_modules/@pixi/assets/lib/detections/utils/testVideoFormat.mjs
var inWorker = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function testVideoFormat(mimeType) {
  return inWorker ? false : document.createElement("video").canPlayType(mimeType) !== "";
}

// node_modules/@pixi/assets/lib/detections/parsers/detectWebm.mjs
var detectWebm = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testVideoFormat("video/webm"),
  add: async (formats) => [...formats, "webm"],
  remove: async (formats) => formats.filter((f) => f !== "webm")
};
extensions.add(detectWebm);

// node_modules/@pixi/assets/lib/detections/parsers/detectMp4.mjs
var detectMp4 = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testVideoFormat("video/mp4"),
  add: async (formats) => [...formats, "mp4", "m4v"],
  remove: async (formats) => formats.filter((f) => f !== "mp4" && f !== "m4v")
};
extensions.add(detectMp4);

// node_modules/@pixi/assets/lib/detections/parsers/detectOgv.mjs
var detectOgv = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testVideoFormat("video/ogg"),
  add: async (formats) => [...formats, "ogv"],
  remove: async (formats) => formats.filter((f) => f !== "ogv")
};
extensions.add(detectOgv);

// node_modules/@pixi/assets/lib/resolver/parsers/resolveTextureUrl.mjs
var resolveTextureUrl = {
  extension: ExtensionType.ResolveParser,
  test: loadTextures.test,
  parse: (value) => {
    var _a;
    return {
      resolution: parseFloat(((_a = settings.RETINA_PREFIX.exec(value)) == null ? void 0 : _a[1]) ?? "1"),
      format: lib_exports.path.extname(value).slice(1),
      src: value
    };
  }
};
extensions.add(resolveTextureUrl);

// node_modules/@pixi-spine/loader-base/lib/atlasLoader.mjs
var spineTextureAtlasLoader = {
  extension: ExtensionType.Asset,
  // cache: {
  //     test: (asset: RawAtlas | TextureAtlas) => asset instanceof TextureAtlas,
  //     getCacheableAssets: (keys: string[], asset: RawAtlas | TextureAtlas) => getCacheableAssets(keys, asset),
  // },
  loader: {
    extension: {
      type: ExtensionType.LoadParser,
      priority: LoaderParserPriority.Normal
    },
    test(url) {
      return checkExtension(url, ".atlas");
    },
    async load(url) {
      const response = await settings.ADAPTER.fetch(url);
      const txt = await response.text();
      return txt;
    },
    testParse(asset, options) {
      const isExtensionRight = checkExtension(options.src, ".atlas");
      const isString = typeof asset === "string";
      return Promise.resolve(isExtensionRight && isString);
    },
    async parse(asset, options, loader) {
      const metadata = options.data;
      let basePath = lib_exports.path.dirname(options.src);
      if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) {
        basePath += "/";
      }
      let resolve = null;
      let reject = null;
      const retPromise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      let retval;
      const resolveCallback = (newAtlas) => {
        if (!newAtlas) {
          reject("Something went terribly wrong loading a spine .atlas file\nMost likely your texture failed to load.");
        }
        resolve(retval);
      };
      if (metadata.image || metadata.images) {
        const pages = Object.assign(metadata.image ? { default: metadata.image } : {}, metadata.images);
        retval = new TextureAtlas(
          asset,
          (line, callback) => {
            const page = pages[line] || pages.default;
            if (page && page.baseTexture)
              callback(page.baseTexture);
            else
              callback(page);
          },
          resolveCallback
        );
      } else {
        retval = new TextureAtlas(asset, makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject(loader, basePath, metadata.imageMetadata), resolveCallback);
      }
      return await retPromise;
    },
    unload(atlas) {
      atlas.dispose();
    }
  }
};
var makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject = (loader, atlasBasePath, imageMetadata) => {
  return async (pageName, textureLoadedCallback) => {
    try {
      const url = lib_exports.path.normalize([...atlasBasePath.split(lib_exports.path.sep), pageName].join(lib_exports.path.sep));
      const texture = await loader.load({ src: url, data: imageMetadata });
      textureLoadedCallback(texture.baseTexture);
    } catch (e) {
      if (settings2.REPORT_TEXTURE_LOADER_ERROR) {
        console.error("Spine: error in texture loader", e);
      }
      textureLoadedCallback(null);
    }
  };
};
extensions.add(spineTextureAtlasLoader);

// node_modules/@pixi-spine/loader-base/lib/SpineLoaderAbstract.mjs
function isJson(resource) {
  return resource.hasOwnProperty("bones");
}
function isBuffer(resource) {
  return resource instanceof ArrayBuffer;
}
var SpineLoaderAbstract = class {
  constructor() {
  }
  installLoader() {
    const spineAdapter = this;
    const spineLoaderExtension = {
      extension: ExtensionType.Asset,
      loader: {
        extension: {
          type: ExtensionType.LoadParser,
          priority: LoaderParserPriority.Normal
        },
        // #region Downloading skel buffer data
        test(url) {
          return checkExtension(url, ".skel");
        },
        async load(url) {
          const response = await settings.ADAPTER.fetch(url);
          const buffer = await response.arrayBuffer();
          return buffer;
        },
        // #endregion
        // #region Parsing spine data
        testParse(asset, options) {
          var _a;
          const isJsonSpineModel = checkExtension(options.src, ".json") && isJson(asset);
          const isBinarySpineModel = checkExtension(options.src, ".skel") && isBuffer(asset);
          const isMetadataAngry = ((_a = options.data) == null ? void 0 : _a.spineAtlas) === false;
          return Promise.resolve(isJsonSpineModel && !isMetadataAngry || isBinarySpineModel);
        },
        async parse(asset, loadAsset, loader) {
          const fileExt = lib_exports.path.extname(loadAsset.src).toLowerCase();
          const fileName = lib_exports.path.basename(loadAsset.src, fileExt);
          let basePath = lib_exports.path.dirname(loadAsset.src);
          if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) {
            basePath += "/";
          }
          const isJsonSpineModel = checkExtension(loadAsset.src, ".json") && isJson(asset);
          let parser = null;
          let dataToParse = asset;
          if (isJsonSpineModel) {
            parser = spineAdapter.createJsonParser();
          } else {
            parser = spineAdapter.createBinaryParser();
            dataToParse = new Uint8Array(asset);
          }
          const metadata = loadAsset.data || {};
          const metadataSkeletonScale = (metadata == null ? void 0 : metadata.spineSkeletonScale) ?? null;
          if (metadataSkeletonScale) {
            parser.scale = metadataSkeletonScale;
          }
          const metadataAtlas = metadata.spineAtlas;
          if (metadataAtlas && metadataAtlas.pages) {
            return spineAdapter.parseData(parser, metadataAtlas, dataToParse);
          }
          const textAtlas = metadata.atlasRawData;
          if (textAtlas) {
            let auxResolve = null;
            let auxReject = null;
            const atlasPromise = new Promise((resolve, reject) => {
              auxResolve = resolve;
              auxReject = reject;
            });
            const atlas = new TextureAtlas(textAtlas, makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject(loader, basePath, metadata.imageMetadata), (newAtlas) => {
              if (!newAtlas) {
                auxReject("Something went terribly wrong loading a spine .atlas file\nMost likely your texture failed to load.");
              }
              auxResolve(atlas);
            });
            const textureAtlas2 = await atlasPromise;
            return spineAdapter.parseData(parser, textureAtlas2, dataToParse);
          }
          let atlasPath = metadata.spineAtlasFile;
          if (!atlasPath) {
            atlasPath = `${basePath + fileName}.atlas`;
          }
          const textureAtlas = await loader.load({ src: atlasPath, data: metadata, alias: metadata.spineAtlasAlias });
          return spineAdapter.parseData(parser, textureAtlas, dataToParse);
        }
        // #endregion
        // unload(asset: ISpineResource<SKD>, loadAsset, loader) {
        // 	???
        // },
      }
    };
    extensions.add(spineLoaderExtension);
    return spineLoaderExtension;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/Attachment.mjs
var Attachment = class {
  constructor(name) {
    if (name == null)
      throw new Error("name cannot be null.");
    this.name = name;
  }
};
var _VertexAttachment = class extends Attachment {
  constructor(name) {
    super(name);
    this.id = (_VertexAttachment.nextID++ & 65535) << 11;
    this.worldVerticesLength = 0;
    this.deformAttachment = this;
  }
  computeWorldVerticesOld(slot, worldVertices) {
    this.computeWorldVertices(slot, 0, this.worldVerticesLength, worldVertices, 0, 2);
  }
  /** Transforms local vertices to world coordinates.
   * @param start The index of the first local vertex value to transform. Each vertex has 2 values, x and y.
   * @param count The number of world vertex values to output. Must be <= {@link #getWorldVerticesLength()} - start.
   * @param worldVertices The output world vertices. Must have a length >= offset + count.
   * @param offset The worldVertices index to begin writing values. */
  computeWorldVertices(slot, start, count, worldVertices, offset, stride) {
    count = offset + (count >> 1) * stride;
    const skeleton = slot.bone.skeleton;
    const deformArray = slot.deform;
    let vertices = this.vertices;
    const bones = this.bones;
    if (bones == null) {
      if (deformArray.length > 0)
        vertices = deformArray;
      const mat = slot.bone.matrix;
      const x = mat.tx;
      const y = mat.ty;
      const a = mat.a;
      const b = mat.c;
      const c = mat.b;
      const d = mat.d;
      for (let v2 = start, w = offset; w < count; v2 += 2, w += stride) {
        const vx = vertices[v2];
        const vy = vertices[v2 + 1];
        worldVertices[w] = vx * a + vy * b + x;
        worldVertices[w + 1] = vx * c + vy * d + y;
      }
      return;
    }
    let v = 0;
    let skip = 0;
    for (let i = 0; i < start; i += 2) {
      const n = bones[v];
      v += n + 1;
      skip += n;
    }
    const skeletonBones = skeleton.bones;
    if (deformArray.length == 0) {
      for (let w = offset, b = skip * 3; w < count; w += stride) {
        let wx = 0;
        let wy = 0;
        let n = bones[v++];
        n += v;
        for (; v < n; v++, b += 3) {
          const mat = skeletonBones[bones[v]].matrix;
          const vx = vertices[b];
          const vy = vertices[b + 1];
          const weight = vertices[b + 2];
          wx += (vx * mat.a + vy * mat.c + mat.tx) * weight;
          wy += (vx * mat.b + vy * mat.d + mat.ty) * weight;
        }
        worldVertices[w] = wx;
        worldVertices[w + 1] = wy;
      }
    } else {
      const deform = deformArray;
      for (let w = offset, b = skip * 3, f = skip << 1; w < count; w += stride) {
        let wx = 0;
        let wy = 0;
        let n = bones[v++];
        n += v;
        for (; v < n; v++, b += 3, f += 2) {
          const mat = skeletonBones[bones[v]].matrix;
          const vx = vertices[b] + deform[f];
          const vy = vertices[b + 1] + deform[f + 1];
          const weight = vertices[b + 2];
          wx += (vx * mat.a + vy * mat.c + mat.tx) * weight;
          wy += (vx * mat.b + vy * mat.d + mat.ty) * weight;
        }
        worldVertices[w] = wx;
        worldVertices[w + 1] = wy;
      }
    }
  }
  copyTo(attachment) {
    if (this.bones != null) {
      attachment.bones = new Array(this.bones.length);
      Utils.arrayCopy(this.bones, 0, attachment.bones, 0, this.bones.length);
    } else
      attachment.bones = null;
    if (this.vertices != null) {
      attachment.vertices = Utils.newFloatArray(this.vertices.length);
      Utils.arrayCopy(this.vertices, 0, attachment.vertices, 0, this.vertices.length);
    } else
      attachment.vertices = null;
    attachment.worldVerticesLength = this.worldVerticesLength;
    attachment.deformAttachment = this.deformAttachment;
  }
};
var VertexAttachment = _VertexAttachment;
VertexAttachment.nextID = 0;

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/BoundingBoxAttachment.mjs
var BoundingBoxAttachment = class _BoundingBoxAttachment extends VertexAttachment {
  constructor(name) {
    super(name);
    this.type = AttachmentType.BoundingBox;
    this.color = new Color(1, 1, 1, 1);
  }
  copy() {
    const copy = new _BoundingBoxAttachment(this.name);
    this.copyTo(copy);
    copy.color.setFromColor(this.color);
    return copy;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/ClippingAttachment.mjs
var ClippingAttachment = class _ClippingAttachment extends VertexAttachment {
  // ce3a3aff
  constructor(name) {
    super(name);
    this.type = AttachmentType.Clipping;
    this.color = new Color(0.2275, 0.2275, 0.8078, 1);
  }
  copy() {
    const copy = new _ClippingAttachment(this.name);
    this.copyTo(copy);
    copy.endSlot = this.endSlot;
    copy.color.setFromColor(this.color);
    return copy;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/MeshAttachment.mjs
var MeshAttachment = class _MeshAttachment extends VertexAttachment {
  constructor(name) {
    super(name);
    this.type = AttachmentType.Mesh;
    this.color = new Color(1, 1, 1, 1);
    this.tempColor = new Color(0, 0, 0, 0);
  }
  getParentMesh() {
    return this.parentMesh;
  }
  /** @param parentMesh May be null. */
  setParentMesh(parentMesh) {
    this.parentMesh = parentMesh;
    if (parentMesh != null) {
      this.bones = parentMesh.bones;
      this.vertices = parentMesh.vertices;
      this.worldVerticesLength = parentMesh.worldVerticesLength;
      this.regionUVs = parentMesh.regionUVs;
      this.triangles = parentMesh.triangles;
      this.hullLength = parentMesh.hullLength;
      this.worldVerticesLength = parentMesh.worldVerticesLength;
    }
  }
  copy() {
    if (this.parentMesh != null)
      return this.newLinkedMesh();
    const copy = new _MeshAttachment(this.name);
    copy.region = this.region;
    copy.path = this.path;
    copy.color.setFromColor(this.color);
    this.copyTo(copy);
    copy.regionUVs = new Float32Array(this.regionUVs.length);
    Utils.arrayCopy(this.regionUVs, 0, copy.regionUVs, 0, this.regionUVs.length);
    copy.triangles = new Array(this.triangles.length);
    Utils.arrayCopy(this.triangles, 0, copy.triangles, 0, this.triangles.length);
    copy.hullLength = this.hullLength;
    if (this.edges != null) {
      copy.edges = new Array(this.edges.length);
      Utils.arrayCopy(this.edges, 0, copy.edges, 0, this.edges.length);
    }
    copy.width = this.width;
    copy.height = this.height;
    return copy;
  }
  newLinkedMesh() {
    const copy = new _MeshAttachment(this.name);
    copy.region = this.region;
    copy.path = this.path;
    copy.color.setFromColor(this.color);
    copy.deformAttachment = this.deformAttachment;
    copy.setParentMesh(this.parentMesh != null ? this.parentMesh : this);
    return copy;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/PathAttachment.mjs
var PathAttachment = class _PathAttachment extends VertexAttachment {
  constructor(name) {
    super(name);
    this.type = AttachmentType.Path;
    this.closed = false;
    this.constantSpeed = false;
    this.color = new Color(1, 1, 1, 1);
  }
  copy() {
    const copy = new _PathAttachment(this.name);
    this.copyTo(copy);
    copy.lengths = new Array(this.lengths.length);
    Utils.arrayCopy(this.lengths, 0, copy.lengths, 0, this.lengths.length);
    copy.closed = closed;
    copy.constantSpeed = this.constantSpeed;
    copy.color.setFromColor(this.color);
    return copy;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/PointAttachment.mjs
var PointAttachment = class _PointAttachment extends VertexAttachment {
  constructor(name) {
    super(name);
    this.type = AttachmentType.Point;
    this.color = new Color(0.38, 0.94, 0, 1);
  }
  computeWorldPosition(bone, point) {
    const mat = bone.matrix;
    point.x = this.x * mat.a + this.y * mat.c + bone.worldX;
    point.y = this.x * mat.b + this.y * mat.d + bone.worldY;
    return point;
  }
  computeWorldRotation(bone) {
    const mat = bone.matrix;
    const cos = MathUtils.cosDeg(this.rotation);
    const sin = MathUtils.sinDeg(this.rotation);
    const x = cos * mat.a + sin * mat.c;
    const y = cos * mat.b + sin * mat.d;
    return Math.atan2(y, x) * MathUtils.radDeg;
  }
  copy() {
    const copy = new _PointAttachment(this.name);
    copy.x = this.x;
    copy.y = this.y;
    copy.rotation = this.rotation;
    copy.color.setFromColor(this.color);
    return copy;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/Slot.mjs
var Slot = class {
  constructor(data, bone) {
    this.deform = new Array();
    if (data == null)
      throw new Error("data cannot be null.");
    if (bone == null)
      throw new Error("bone cannot be null.");
    this.data = data;
    this.bone = bone;
    this.color = new Color();
    this.darkColor = data.darkColor == null ? null : new Color();
    this.setToSetupPose();
    this.blendMode = this.data.blendMode;
  }
  /** @return May be null. */
  getAttachment() {
    return this.attachment;
  }
  /** Sets the attachment and if it changed, resets {@link #getAttachmentTime()} and clears {@link #getAttachmentVertices()}.
   * @param attachment May be null. */
  setAttachment(attachment) {
    if (this.attachment == attachment)
      return;
    this.attachment = attachment;
    this.attachmentTime = this.bone.skeleton.time;
    this.deform.length = 0;
  }
  setAttachmentTime(time) {
    this.attachmentTime = this.bone.skeleton.time - time;
  }
  /** Returns the time since the attachment was set. */
  getAttachmentTime() {
    return this.bone.skeleton.time - this.attachmentTime;
  }
  setToSetupPose() {
    this.color.setFromColor(this.data.color);
    if (this.darkColor != null)
      this.darkColor.setFromColor(this.data.darkColor);
    if (this.data.attachmentName == null)
      this.attachment = null;
    else {
      this.attachment = null;
      this.setAttachment(this.bone.skeleton.getAttachment(this.data.index, this.data.attachmentName));
    }
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/attachments/RegionAttachment.mjs
var _RegionAttachment = class extends Attachment {
  constructor(name) {
    super(name);
    this.type = AttachmentType.Region;
    this.x = 0;
    this.y = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.width = 0;
    this.height = 0;
    this.color = new Color(1, 1, 1, 1);
    this.offset = Utils.newFloatArray(8);
    this.uvs = Utils.newFloatArray(8);
    this.tempColor = new Color(1, 1, 1, 1);
  }
  updateOffset() {
    const regionScaleX = this.width / this.region.originalWidth * this.scaleX;
    const regionScaleY = this.height / this.region.originalHeight * this.scaleY;
    const localX = -this.width / 2 * this.scaleX + this.region.offsetX * regionScaleX;
    const localY = -this.height / 2 * this.scaleY + this.region.offsetY * regionScaleY;
    const localX2 = localX + this.region.width * regionScaleX;
    const localY2 = localY + this.region.height * regionScaleY;
    const radians = this.rotation * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const localXCos = localX * cos + this.x;
    const localXSin = localX * sin;
    const localYCos = localY * cos + this.y;
    const localYSin = localY * sin;
    const localX2Cos = localX2 * cos + this.x;
    const localX2Sin = localX2 * sin;
    const localY2Cos = localY2 * cos + this.y;
    const localY2Sin = localY2 * sin;
    const offset = this.offset;
    offset[_RegionAttachment.OX1] = localXCos - localYSin;
    offset[_RegionAttachment.OY1] = localYCos + localXSin;
    offset[_RegionAttachment.OX2] = localXCos - localY2Sin;
    offset[_RegionAttachment.OY2] = localY2Cos + localXSin;
    offset[_RegionAttachment.OX3] = localX2Cos - localY2Sin;
    offset[_RegionAttachment.OY3] = localY2Cos + localX2Sin;
    offset[_RegionAttachment.OX4] = localX2Cos - localYSin;
    offset[_RegionAttachment.OY4] = localYCos + localX2Sin;
  }
  setRegion(region) {
    this.region = region;
    const uvs = this.uvs;
    if (region.rotate) {
      uvs[2] = region.u;
      uvs[3] = region.v2;
      uvs[4] = region.u;
      uvs[5] = region.v;
      uvs[6] = region.u2;
      uvs[7] = region.v;
      uvs[0] = region.u2;
      uvs[1] = region.v2;
    } else {
      uvs[0] = region.u;
      uvs[1] = region.v2;
      uvs[2] = region.u;
      uvs[3] = region.v;
      uvs[4] = region.u2;
      uvs[5] = region.v;
      uvs[6] = region.u2;
      uvs[7] = region.v2;
    }
  }
  computeWorldVertices(bone, worldVertices, offset, stride) {
    const vertexOffset = this.offset;
    const mat = bone instanceof Slot ? bone.bone.matrix : bone.matrix;
    const x = mat.tx;
    const y = mat.ty;
    const a = mat.a;
    const b = mat.c;
    const c = mat.b;
    const d = mat.d;
    let offsetX = 0;
    let offsetY = 0;
    offsetX = vertexOffset[_RegionAttachment.OX1];
    offsetY = vertexOffset[_RegionAttachment.OY1];
    worldVertices[offset] = offsetX * a + offsetY * b + x;
    worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
    offset += stride;
    offsetX = vertexOffset[_RegionAttachment.OX2];
    offsetY = vertexOffset[_RegionAttachment.OY2];
    worldVertices[offset] = offsetX * a + offsetY * b + x;
    worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
    offset += stride;
    offsetX = vertexOffset[_RegionAttachment.OX3];
    offsetY = vertexOffset[_RegionAttachment.OY3];
    worldVertices[offset] = offsetX * a + offsetY * b + x;
    worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
    offset += stride;
    offsetX = vertexOffset[_RegionAttachment.OX4];
    offsetY = vertexOffset[_RegionAttachment.OY4];
    worldVertices[offset] = offsetX * a + offsetY * b + x;
    worldVertices[offset + 1] = offsetX * c + offsetY * d + y;
  }
  copy() {
    const copy = new _RegionAttachment(this.name);
    copy.region = this.region;
    copy.rendererObject = this.rendererObject;
    copy.path = this.path;
    copy.x = this.x;
    copy.y = this.y;
    copy.scaleX = this.scaleX;
    copy.scaleY = this.scaleY;
    copy.rotation = this.rotation;
    copy.width = this.width;
    copy.height = this.height;
    Utils.arrayCopy(this.uvs, 0, copy.uvs, 0, 8);
    Utils.arrayCopy(this.offset, 0, copy.offset, 0, 8);
    copy.color.setFromColor(this.color);
    return copy;
  }
};
var RegionAttachment = _RegionAttachment;
RegionAttachment.OX1 = 0;
RegionAttachment.OY1 = 1;
RegionAttachment.OX2 = 2;
RegionAttachment.OY2 = 3;
RegionAttachment.OX3 = 4;
RegionAttachment.OY3 = 5;
RegionAttachment.OX4 = 6;
RegionAttachment.OY4 = 7;
RegionAttachment.X1 = 0;
RegionAttachment.Y1 = 1;
RegionAttachment.C1R = 2;
RegionAttachment.C1G = 3;
RegionAttachment.C1B = 4;
RegionAttachment.C1A = 5;
RegionAttachment.U1 = 6;
RegionAttachment.V1 = 7;
RegionAttachment.X2 = 8;
RegionAttachment.Y2 = 9;
RegionAttachment.C2R = 10;
RegionAttachment.C2G = 11;
RegionAttachment.C2B = 12;
RegionAttachment.C2A = 13;
RegionAttachment.U2 = 14;
RegionAttachment.V2 = 15;
RegionAttachment.X3 = 16;
RegionAttachment.Y3 = 17;
RegionAttachment.C3R = 18;
RegionAttachment.C3G = 19;
RegionAttachment.C3B = 20;
RegionAttachment.C3A = 21;
RegionAttachment.U3 = 22;
RegionAttachment.V3 = 23;
RegionAttachment.X4 = 24;
RegionAttachment.Y4 = 25;
RegionAttachment.C4R = 26;
RegionAttachment.C4G = 27;
RegionAttachment.C4B = 28;
RegionAttachment.C4A = 29;
RegionAttachment.U4 = 30;
RegionAttachment.V4 = 31;

// node_modules/@pixi-spine/runtime-3.8/lib/core/vertexeffects/JitterEffect.mjs
var JitterEffect = class {
  constructor(jitterX, jitterY) {
    this.jitterX = 0;
    this.jitterY = 0;
    this.jitterX = jitterX;
    this.jitterY = jitterY;
  }
  begin(skeleton) {
  }
  transform(position, uv, light, dark) {
    position.x += MathUtils.randomTriangular(-this.jitterX, this.jitterY);
    position.y += MathUtils.randomTriangular(-this.jitterX, this.jitterY);
  }
  end() {
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/vertexeffects/SwirlEffect.mjs
var _SwirlEffect = class {
  constructor(radius) {
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 0;
    this.angle = 0;
    this.worldX = 0;
    this.worldY = 0;
    this.radius = radius;
  }
  begin(skeleton) {
    this.worldX = skeleton.x + this.centerX;
    this.worldY = skeleton.y + this.centerY;
  }
  transform(position, uv, light, dark) {
    const radAngle = this.angle * MathUtils.degreesToRadians;
    const x = position.x - this.worldX;
    const y = position.y - this.worldY;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < this.radius) {
      const theta = _SwirlEffect.interpolation.apply(0, radAngle, (this.radius - dist) / this.radius);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      position.x = cos * x - sin * y + this.worldX;
      position.y = sin * x + cos * y + this.worldY;
    }
  }
  end() {
  }
};
var SwirlEffect = _SwirlEffect;
SwirlEffect.interpolation = new PowOut(2);

// node_modules/@pixi-spine/runtime-3.8/lib/core/Animation.mjs
var Animation = class {
  constructor(name, timelines, duration) {
    if (name == null)
      throw new Error("name cannot be null.");
    if (timelines == null)
      throw new Error("timelines cannot be null.");
    this.name = name;
    this.timelines = timelines;
    this.timelineIds = [];
    for (let i = 0; i < timelines.length; i++)
      this.timelineIds[timelines[i].getPropertyId()] = true;
    this.duration = duration;
  }
  hasTimeline(id) {
    return this.timelineIds[id] == true;
  }
  /** Applies all the animation's timelines to the specified skeleton.
   *
   * See Timeline {@link Timeline#apply(Skeleton, float, float, Array, float, MixBlend, MixDirection)}.
   * @param loop If true, the animation repeats after {@link #getDuration()}.
   * @param events May be null to ignore fired events. */
  apply(skeleton, lastTime, time, loop, events, alpha, blend, direction) {
    if (skeleton == null)
      throw new Error("skeleton cannot be null.");
    if (loop && this.duration != 0) {
      time %= this.duration;
      if (lastTime > 0)
        lastTime %= this.duration;
    }
    const timelines = this.timelines;
    for (let i = 0, n = timelines.length; i < n; i++)
      timelines[i].apply(skeleton, lastTime, time, events, alpha, blend, direction);
  }
  /** @param target After the first and before the last value.
   * @returns index of first value greater than the target. */
  static binarySearch(values, target, step = 1) {
    let low = 0;
    let high = values.length / step - 2;
    if (high == 0)
      return step;
    let current = high >>> 1;
    while (true) {
      if (values[(current + 1) * step] <= target)
        low = current + 1;
      else
        high = current;
      if (low == high)
        return (low + 1) * step;
      current = low + high >>> 1;
    }
  }
  static linearSearch(values, target, step) {
    for (let i = 0, last = values.length - step; i <= last; i += step)
      if (values[i] > target)
        return i;
    return -1;
  }
};
var TimelineType = ((TimelineType2) => {
  TimelineType2[TimelineType2["rotate"] = 0] = "rotate";
  TimelineType2[TimelineType2["translate"] = 1] = "translate";
  TimelineType2[TimelineType2["scale"] = 2] = "scale";
  TimelineType2[TimelineType2["shear"] = 3] = "shear";
  TimelineType2[TimelineType2["attachment"] = 4] = "attachment";
  TimelineType2[TimelineType2["color"] = 5] = "color";
  TimelineType2[TimelineType2["deform"] = 6] = "deform";
  TimelineType2[TimelineType2["event"] = 7] = "event";
  TimelineType2[TimelineType2["drawOrder"] = 8] = "drawOrder";
  TimelineType2[TimelineType2["ikConstraint"] = 9] = "ikConstraint";
  TimelineType2[TimelineType2["transformConstraint"] = 10] = "transformConstraint";
  TimelineType2[TimelineType2["pathConstraintPosition"] = 11] = "pathConstraintPosition";
  TimelineType2[TimelineType2["pathConstraintSpacing"] = 12] = "pathConstraintSpacing";
  TimelineType2[TimelineType2["pathConstraintMix"] = 13] = "pathConstraintMix";
  TimelineType2[TimelineType2["twoColor"] = 14] = "twoColor";
  return TimelineType2;
})(TimelineType || {});
var _CurveTimeline = class {
  constructor(frameCount) {
    if (frameCount <= 0)
      throw new Error(`frameCount must be > 0: ${frameCount}`);
    this.curves = Utils.newFloatArray((frameCount - 1) * _CurveTimeline.BEZIER_SIZE);
  }
  /** The number of key frames for this timeline. */
  getFrameCount() {
    return this.curves.length / _CurveTimeline.BEZIER_SIZE + 1;
  }
  /** Sets the specified key frame to linear interpolation. */
  setLinear(frameIndex) {
    this.curves[frameIndex * _CurveTimeline.BEZIER_SIZE] = _CurveTimeline.LINEAR;
  }
  /** Sets the specified key frame to stepped interpolation. */
  setStepped(frameIndex) {
    this.curves[frameIndex * _CurveTimeline.BEZIER_SIZE] = _CurveTimeline.STEPPED;
  }
  /** Returns the interpolation type for the specified key frame.
   * @returns Linear is 0, stepped is 1, Bezier is 2. */
  getCurveType(frameIndex) {
    const index = frameIndex * _CurveTimeline.BEZIER_SIZE;
    if (index == this.curves.length)
      return _CurveTimeline.LINEAR;
    const type = this.curves[index];
    if (type == _CurveTimeline.LINEAR)
      return _CurveTimeline.LINEAR;
    if (type == _CurveTimeline.STEPPED)
      return _CurveTimeline.STEPPED;
    return _CurveTimeline.BEZIER;
  }
  /** Sets the specified key frame to Bezier interpolation. `cx1` and `cx2` are from 0 to 1,
   * representing the percent of time between the two key frames. `cy1` and `cy2` are the percent of the
   * difference between the key frame's values. */
  setCurve(frameIndex, cx1, cy1, cx2, cy2) {
    const tmpx = (-cx1 * 2 + cx2) * 0.03;
    const tmpy = (-cy1 * 2 + cy2) * 0.03;
    const dddfx = ((cx1 - cx2) * 3 + 1) * 6e-3;
    const dddfy = ((cy1 - cy2) * 3 + 1) * 6e-3;
    let ddfx = tmpx * 2 + dddfx;
    let ddfy = tmpy * 2 + dddfy;
    let dfx = cx1 * 0.3 + tmpx + dddfx * 0.16666667;
    let dfy = cy1 * 0.3 + tmpy + dddfy * 0.16666667;
    let i = frameIndex * _CurveTimeline.BEZIER_SIZE;
    const curves = this.curves;
    curves[i++] = _CurveTimeline.BEZIER;
    let x = dfx;
    let y = dfy;
    for (let n = i + _CurveTimeline.BEZIER_SIZE - 1; i < n; i += 2) {
      curves[i] = x;
      curves[i + 1] = y;
      dfx += ddfx;
      dfy += ddfy;
      ddfx += dddfx;
      ddfy += dddfy;
      x += dfx;
      y += dfy;
    }
  }
  /** Returns the interpolated percentage for the specified key frame and linear percentage. */
  getCurvePercent(frameIndex, percent) {
    percent = MathUtils.clamp(percent, 0, 1);
    const curves = this.curves;
    let i = frameIndex * _CurveTimeline.BEZIER_SIZE;
    const type = curves[i];
    if (type == _CurveTimeline.LINEAR)
      return percent;
    if (type == _CurveTimeline.STEPPED)
      return 0;
    i++;
    let x = 0;
    for (let start = i, n = i + _CurveTimeline.BEZIER_SIZE - 1; i < n; i += 2) {
      x = curves[i];
      if (x >= percent) {
        let prevX;
        let prevY;
        if (i == start) {
          prevX = 0;
          prevY = 0;
        } else {
          prevX = curves[i - 2];
          prevY = curves[i - 1];
        }
        return prevY + (curves[i + 1] - prevY) * (percent - prevX) / (x - prevX);
      }
    }
    const y = curves[i - 1];
    return y + (1 - y) * (percent - x) / (1 - x);
  }
};
var CurveTimeline = _CurveTimeline;
CurveTimeline.LINEAR = 0;
CurveTimeline.STEPPED = 1;
CurveTimeline.BEZIER = 2;
CurveTimeline.BEZIER_SIZE = 10 * 2 - 1;
var _RotateTimeline = class extends CurveTimeline {
  // time, degrees, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount << 1);
  }
  getPropertyId() {
    return (0 << 24) + this.boneIndex;
  }
  /** Sets the time and angle of the specified keyframe. */
  setFrame(frameIndex, time, degrees) {
    frameIndex <<= 1;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _RotateTimeline.ROTATION] = degrees;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const frames = this.frames;
    const bone = skeleton.bones[this.boneIndex];
    if (!bone.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          bone.rotation = bone.data.rotation;
          return;
        case MixBlend.first:
          const r2 = bone.data.rotation - bone.rotation;
          bone.rotation += (r2 - (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360) * alpha;
      }
      return;
    }
    if (time >= frames[frames.length - _RotateTimeline.ENTRIES]) {
      let r2 = frames[frames.length + _RotateTimeline.PREV_ROTATION];
      switch (blend) {
        case MixBlend.setup:
          bone.rotation = bone.data.rotation + r2 * alpha;
          break;
        case MixBlend.first:
        case MixBlend.replace:
          r2 += bone.data.rotation - bone.rotation;
          r2 -= (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360;
        case MixBlend.add:
          bone.rotation += r2 * alpha;
      }
      return;
    }
    const frame = Animation.binarySearch(frames, time, _RotateTimeline.ENTRIES);
    const prevRotation = frames[frame + _RotateTimeline.PREV_ROTATION];
    const frameTime = frames[frame];
    const percent = this.getCurvePercent((frame >> 1) - 1, 1 - (time - frameTime) / (frames[frame + _RotateTimeline.PREV_TIME] - frameTime));
    let r = frames[frame + _RotateTimeline.ROTATION] - prevRotation;
    r = prevRotation + (r - (16384 - (16384.499999999996 - r / 360 | 0)) * 360) * percent;
    switch (blend) {
      case MixBlend.setup:
        bone.rotation = bone.data.rotation + (r - (16384 - (16384.499999999996 - r / 360 | 0)) * 360) * alpha;
        break;
      case MixBlend.first:
      case MixBlend.replace:
        r += bone.data.rotation - bone.rotation;
      case MixBlend.add:
        bone.rotation += (r - (16384 - (16384.499999999996 - r / 360 | 0)) * 360) * alpha;
    }
  }
};
var RotateTimeline = _RotateTimeline;
RotateTimeline.ENTRIES = 2;
RotateTimeline.PREV_TIME = -2;
RotateTimeline.PREV_ROTATION = -1;
RotateTimeline.ROTATION = 1;
var _TranslateTimeline = class extends CurveTimeline {
  // time, x, y, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _TranslateTimeline.ENTRIES);
  }
  getPropertyId() {
    return (1 << 24) + this.boneIndex;
  }
  /** Sets the time in seconds, x, and y values for the specified key frame. */
  setFrame(frameIndex, time, x, y) {
    frameIndex *= _TranslateTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _TranslateTimeline.X] = x;
    this.frames[frameIndex + _TranslateTimeline.Y] = y;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const frames = this.frames;
    const bone = skeleton.bones[this.boneIndex];
    if (!bone.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          bone.x = bone.data.x;
          bone.y = bone.data.y;
          return;
        case MixBlend.first:
          bone.x += (bone.data.x - bone.x) * alpha;
          bone.y += (bone.data.y - bone.y) * alpha;
      }
      return;
    }
    let x = 0;
    let y = 0;
    if (time >= frames[frames.length - _TranslateTimeline.ENTRIES]) {
      x = frames[frames.length + _TranslateTimeline.PREV_X];
      y = frames[frames.length + _TranslateTimeline.PREV_Y];
    } else {
      const frame = Animation.binarySearch(frames, time, _TranslateTimeline.ENTRIES);
      x = frames[frame + _TranslateTimeline.PREV_X];
      y = frames[frame + _TranslateTimeline.PREV_Y];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(frame / _TranslateTimeline.ENTRIES - 1, 1 - (time - frameTime) / (frames[frame + _TranslateTimeline.PREV_TIME] - frameTime));
      x += (frames[frame + _TranslateTimeline.X] - x) * percent;
      y += (frames[frame + _TranslateTimeline.Y] - y) * percent;
    }
    switch (blend) {
      case MixBlend.setup:
        bone.x = bone.data.x + x * alpha;
        bone.y = bone.data.y + y * alpha;
        break;
      case MixBlend.first:
      case MixBlend.replace:
        bone.x += (bone.data.x + x - bone.x) * alpha;
        bone.y += (bone.data.y + y - bone.y) * alpha;
        break;
      case MixBlend.add:
        bone.x += x * alpha;
        bone.y += y * alpha;
    }
  }
};
var TranslateTimeline = _TranslateTimeline;
TranslateTimeline.ENTRIES = 3;
TranslateTimeline.PREV_TIME = -3;
TranslateTimeline.PREV_X = -2;
TranslateTimeline.PREV_Y = -1;
TranslateTimeline.X = 1;
TranslateTimeline.Y = 2;
var ScaleTimeline = class _ScaleTimeline extends TranslateTimeline {
  constructor(frameCount) {
    super(frameCount);
  }
  getPropertyId() {
    return (2 << 24) + this.boneIndex;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const frames = this.frames;
    const bone = skeleton.bones[this.boneIndex];
    if (!bone.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          bone.scaleX = bone.data.scaleX;
          bone.scaleY = bone.data.scaleY;
          return;
        case MixBlend.first:
          bone.scaleX += (bone.data.scaleX - bone.scaleX) * alpha;
          bone.scaleY += (bone.data.scaleY - bone.scaleY) * alpha;
      }
      return;
    }
    let x = 0;
    let y = 0;
    if (time >= frames[frames.length - _ScaleTimeline.ENTRIES]) {
      x = frames[frames.length + _ScaleTimeline.PREV_X] * bone.data.scaleX;
      y = frames[frames.length + _ScaleTimeline.PREV_Y] * bone.data.scaleY;
    } else {
      const frame = Animation.binarySearch(frames, time, _ScaleTimeline.ENTRIES);
      x = frames[frame + _ScaleTimeline.PREV_X];
      y = frames[frame + _ScaleTimeline.PREV_Y];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(frame / _ScaleTimeline.ENTRIES - 1, 1 - (time - frameTime) / (frames[frame + _ScaleTimeline.PREV_TIME] - frameTime));
      x = (x + (frames[frame + _ScaleTimeline.X] - x) * percent) * bone.data.scaleX;
      y = (y + (frames[frame + _ScaleTimeline.Y] - y) * percent) * bone.data.scaleY;
    }
    if (alpha == 1) {
      if (blend == MixBlend.add) {
        bone.scaleX += x - bone.data.scaleX;
        bone.scaleY += y - bone.data.scaleY;
      } else {
        bone.scaleX = x;
        bone.scaleY = y;
      }
    } else {
      let bx = 0;
      let by = 0;
      if (direction == MixDirection.mixOut) {
        switch (blend) {
          case MixBlend.setup:
            bx = bone.data.scaleX;
            by = bone.data.scaleY;
            bone.scaleX = bx + (Math.abs(x) * MathUtils.signum(bx) - bx) * alpha;
            bone.scaleY = by + (Math.abs(y) * MathUtils.signum(by) - by) * alpha;
            break;
          case MixBlend.first:
          case MixBlend.replace:
            bx = bone.scaleX;
            by = bone.scaleY;
            bone.scaleX = bx + (Math.abs(x) * MathUtils.signum(bx) - bx) * alpha;
            bone.scaleY = by + (Math.abs(y) * MathUtils.signum(by) - by) * alpha;
            break;
          case MixBlend.add:
            bx = bone.scaleX;
            by = bone.scaleY;
            bone.scaleX = bx + (Math.abs(x) * MathUtils.signum(bx) - bone.data.scaleX) * alpha;
            bone.scaleY = by + (Math.abs(y) * MathUtils.signum(by) - bone.data.scaleY) * alpha;
        }
      } else {
        switch (blend) {
          case MixBlend.setup:
            bx = Math.abs(bone.data.scaleX) * MathUtils.signum(x);
            by = Math.abs(bone.data.scaleY) * MathUtils.signum(y);
            bone.scaleX = bx + (x - bx) * alpha;
            bone.scaleY = by + (y - by) * alpha;
            break;
          case MixBlend.first:
          case MixBlend.replace:
            bx = Math.abs(bone.scaleX) * MathUtils.signum(x);
            by = Math.abs(bone.scaleY) * MathUtils.signum(y);
            bone.scaleX = bx + (x - bx) * alpha;
            bone.scaleY = by + (y - by) * alpha;
            break;
          case MixBlend.add:
            bx = MathUtils.signum(x);
            by = MathUtils.signum(y);
            bone.scaleX = Math.abs(bone.scaleX) * bx + (x - Math.abs(bone.data.scaleX) * bx) * alpha;
            bone.scaleY = Math.abs(bone.scaleY) * by + (y - Math.abs(bone.data.scaleY) * by) * alpha;
        }
      }
    }
  }
};
var ShearTimeline = class _ShearTimeline extends TranslateTimeline {
  constructor(frameCount) {
    super(frameCount);
  }
  getPropertyId() {
    return (3 << 24) + this.boneIndex;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const frames = this.frames;
    const bone = skeleton.bones[this.boneIndex];
    if (!bone.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          bone.shearX = bone.data.shearX;
          bone.shearY = bone.data.shearY;
          return;
        case MixBlend.first:
          bone.shearX += (bone.data.shearX - bone.shearX) * alpha;
          bone.shearY += (bone.data.shearY - bone.shearY) * alpha;
      }
      return;
    }
    let x = 0;
    let y = 0;
    if (time >= frames[frames.length - _ShearTimeline.ENTRIES]) {
      x = frames[frames.length + _ShearTimeline.PREV_X];
      y = frames[frames.length + _ShearTimeline.PREV_Y];
    } else {
      const frame = Animation.binarySearch(frames, time, _ShearTimeline.ENTRIES);
      x = frames[frame + _ShearTimeline.PREV_X];
      y = frames[frame + _ShearTimeline.PREV_Y];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(frame / _ShearTimeline.ENTRIES - 1, 1 - (time - frameTime) / (frames[frame + _ShearTimeline.PREV_TIME] - frameTime));
      x = x + (frames[frame + _ShearTimeline.X] - x) * percent;
      y = y + (frames[frame + _ShearTimeline.Y] - y) * percent;
    }
    switch (blend) {
      case MixBlend.setup:
        bone.shearX = bone.data.shearX + x * alpha;
        bone.shearY = bone.data.shearY + y * alpha;
        break;
      case MixBlend.first:
      case MixBlend.replace:
        bone.shearX += (bone.data.shearX + x - bone.shearX) * alpha;
        bone.shearY += (bone.data.shearY + y - bone.shearY) * alpha;
        break;
      case MixBlend.add:
        bone.shearX += x * alpha;
        bone.shearY += y * alpha;
    }
  }
};
var _ColorTimeline = class extends CurveTimeline {
  // time, r, g, b, a, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _ColorTimeline.ENTRIES);
  }
  getPropertyId() {
    return (5 << 24) + this.slotIndex;
  }
  /** Sets the time in seconds, red, green, blue, and alpha for the specified key frame. */
  setFrame(frameIndex, time, r, g, b, a) {
    frameIndex *= _ColorTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _ColorTimeline.R] = r;
    this.frames[frameIndex + _ColorTimeline.G] = g;
    this.frames[frameIndex + _ColorTimeline.B] = b;
    this.frames[frameIndex + _ColorTimeline.A] = a;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const slot = skeleton.slots[this.slotIndex];
    if (!slot.bone.active)
      return;
    const frames = this.frames;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          slot.color.setFromColor(slot.data.color);
          return;
        case MixBlend.first:
          const color = slot.color;
          const setup = slot.data.color;
          color.add((setup.r - color.r) * alpha, (setup.g - color.g) * alpha, (setup.b - color.b) * alpha, (setup.a - color.a) * alpha);
      }
      return;
    }
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    if (time >= frames[frames.length - _ColorTimeline.ENTRIES]) {
      const i = frames.length;
      r = frames[i + _ColorTimeline.PREV_R];
      g = frames[i + _ColorTimeline.PREV_G];
      b = frames[i + _ColorTimeline.PREV_B];
      a = frames[i + _ColorTimeline.PREV_A];
    } else {
      const frame = Animation.binarySearch(frames, time, _ColorTimeline.ENTRIES);
      r = frames[frame + _ColorTimeline.PREV_R];
      g = frames[frame + _ColorTimeline.PREV_G];
      b = frames[frame + _ColorTimeline.PREV_B];
      a = frames[frame + _ColorTimeline.PREV_A];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(frame / _ColorTimeline.ENTRIES - 1, 1 - (time - frameTime) / (frames[frame + _ColorTimeline.PREV_TIME] - frameTime));
      r += (frames[frame + _ColorTimeline.R] - r) * percent;
      g += (frames[frame + _ColorTimeline.G] - g) * percent;
      b += (frames[frame + _ColorTimeline.B] - b) * percent;
      a += (frames[frame + _ColorTimeline.A] - a) * percent;
    }
    if (alpha == 1)
      slot.color.set(r, g, b, a);
    else {
      const color = slot.color;
      if (blend == MixBlend.setup)
        color.setFromColor(slot.data.color);
      color.add((r - color.r) * alpha, (g - color.g) * alpha, (b - color.b) * alpha, (a - color.a) * alpha);
    }
  }
};
var ColorTimeline = _ColorTimeline;
ColorTimeline.ENTRIES = 5;
ColorTimeline.PREV_TIME = -5;
ColorTimeline.PREV_R = -4;
ColorTimeline.PREV_G = -3;
ColorTimeline.PREV_B = -2;
ColorTimeline.PREV_A = -1;
ColorTimeline.R = 1;
ColorTimeline.G = 2;
ColorTimeline.B = 3;
ColorTimeline.A = 4;
var _TwoColorTimeline = class extends CurveTimeline {
  // time, r, g, b, a, r2, g2, b2, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _TwoColorTimeline.ENTRIES);
  }
  getPropertyId() {
    return (14 << 24) + this.slotIndex;
  }
  /** Sets the time in seconds, light, and dark colors for the specified key frame. */
  setFrame(frameIndex, time, r, g, b, a, r2, g2, b2) {
    frameIndex *= _TwoColorTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _TwoColorTimeline.R] = r;
    this.frames[frameIndex + _TwoColorTimeline.G] = g;
    this.frames[frameIndex + _TwoColorTimeline.B] = b;
    this.frames[frameIndex + _TwoColorTimeline.A] = a;
    this.frames[frameIndex + _TwoColorTimeline.R2] = r2;
    this.frames[frameIndex + _TwoColorTimeline.G2] = g2;
    this.frames[frameIndex + _TwoColorTimeline.B2] = b2;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const slot = skeleton.slots[this.slotIndex];
    if (!slot.bone.active)
      return;
    const frames = this.frames;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          slot.color.setFromColor(slot.data.color);
          slot.darkColor.setFromColor(slot.data.darkColor);
          return;
        case MixBlend.first:
          const light = slot.color;
          const dark = slot.darkColor;
          const setupLight = slot.data.color;
          const setupDark = slot.data.darkColor;
          light.add((setupLight.r - light.r) * alpha, (setupLight.g - light.g) * alpha, (setupLight.b - light.b) * alpha, (setupLight.a - light.a) * alpha);
          dark.add((setupDark.r - dark.r) * alpha, (setupDark.g - dark.g) * alpha, (setupDark.b - dark.b) * alpha, 0);
      }
      return;
    }
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    let r2 = 0;
    let g2 = 0;
    let b2 = 0;
    if (time >= frames[frames.length - _TwoColorTimeline.ENTRIES]) {
      const i = frames.length;
      r = frames[i + _TwoColorTimeline.PREV_R];
      g = frames[i + _TwoColorTimeline.PREV_G];
      b = frames[i + _TwoColorTimeline.PREV_B];
      a = frames[i + _TwoColorTimeline.PREV_A];
      r2 = frames[i + _TwoColorTimeline.PREV_R2];
      g2 = frames[i + _TwoColorTimeline.PREV_G2];
      b2 = frames[i + _TwoColorTimeline.PREV_B2];
    } else {
      const frame = Animation.binarySearch(frames, time, _TwoColorTimeline.ENTRIES);
      r = frames[frame + _TwoColorTimeline.PREV_R];
      g = frames[frame + _TwoColorTimeline.PREV_G];
      b = frames[frame + _TwoColorTimeline.PREV_B];
      a = frames[frame + _TwoColorTimeline.PREV_A];
      r2 = frames[frame + _TwoColorTimeline.PREV_R2];
      g2 = frames[frame + _TwoColorTimeline.PREV_G2];
      b2 = frames[frame + _TwoColorTimeline.PREV_B2];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(frame / _TwoColorTimeline.ENTRIES - 1, 1 - (time - frameTime) / (frames[frame + _TwoColorTimeline.PREV_TIME] - frameTime));
      r += (frames[frame + _TwoColorTimeline.R] - r) * percent;
      g += (frames[frame + _TwoColorTimeline.G] - g) * percent;
      b += (frames[frame + _TwoColorTimeline.B] - b) * percent;
      a += (frames[frame + _TwoColorTimeline.A] - a) * percent;
      r2 += (frames[frame + _TwoColorTimeline.R2] - r2) * percent;
      g2 += (frames[frame + _TwoColorTimeline.G2] - g2) * percent;
      b2 += (frames[frame + _TwoColorTimeline.B2] - b2) * percent;
    }
    if (alpha == 1) {
      slot.color.set(r, g, b, a);
      slot.darkColor.set(r2, g2, b2, 1);
    } else {
      const light = slot.color;
      const dark = slot.darkColor;
      if (blend == MixBlend.setup) {
        light.setFromColor(slot.data.color);
        dark.setFromColor(slot.data.darkColor);
      }
      light.add((r - light.r) * alpha, (g - light.g) * alpha, (b - light.b) * alpha, (a - light.a) * alpha);
      dark.add((r2 - dark.r) * alpha, (g2 - dark.g) * alpha, (b2 - dark.b) * alpha, 0);
    }
  }
};
var TwoColorTimeline = _TwoColorTimeline;
TwoColorTimeline.ENTRIES = 8;
TwoColorTimeline.PREV_TIME = -8;
TwoColorTimeline.PREV_R = -7;
TwoColorTimeline.PREV_G = -6;
TwoColorTimeline.PREV_B = -5;
TwoColorTimeline.PREV_A = -4;
TwoColorTimeline.PREV_R2 = -3;
TwoColorTimeline.PREV_G2 = -2;
TwoColorTimeline.PREV_B2 = -1;
TwoColorTimeline.R = 1;
TwoColorTimeline.G = 2;
TwoColorTimeline.B = 3;
TwoColorTimeline.A = 4;
TwoColorTimeline.R2 = 5;
TwoColorTimeline.G2 = 6;
TwoColorTimeline.B2 = 7;
var AttachmentTimeline = class {
  constructor(frameCount) {
    this.frames = Utils.newFloatArray(frameCount);
    this.attachmentNames = new Array(frameCount);
  }
  getPropertyId() {
    return (4 << 24) + this.slotIndex;
  }
  /** The number of key frames for this timeline. */
  getFrameCount() {
    return this.frames.length;
  }
  /** Sets the time in seconds and the attachment name for the specified key frame. */
  setFrame(frameIndex, time, attachmentName) {
    this.frames[frameIndex] = time;
    this.attachmentNames[frameIndex] = attachmentName;
  }
  apply(skeleton, lastTime, time, events, alpha, blend, direction) {
    const slot = skeleton.slots[this.slotIndex];
    if (!slot.bone.active)
      return;
    if (direction == MixDirection.mixOut) {
      if (blend == MixBlend.setup)
        this.setAttachment(skeleton, slot, slot.data.attachmentName);
      return;
    }
    const frames = this.frames;
    if (time < frames[0]) {
      if (blend == MixBlend.setup || blend == MixBlend.first)
        this.setAttachment(skeleton, slot, slot.data.attachmentName);
      return;
    }
    let frameIndex = 0;
    if (time >= frames[frames.length - 1])
      frameIndex = frames.length - 1;
    else
      frameIndex = Animation.binarySearch(frames, time, 1) - 1;
    const attachmentName = this.attachmentNames[frameIndex];
    skeleton.slots[this.slotIndex].setAttachment(attachmentName == null ? null : skeleton.getAttachment(this.slotIndex, attachmentName));
  }
  setAttachment(skeleton, slot, attachmentName) {
    slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(this.slotIndex, attachmentName));
  }
};
var zeros = null;
var DeformTimeline = class extends CurveTimeline {
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount);
    this.frameVertices = new Array(frameCount);
    if (zeros == null)
      zeros = Utils.newFloatArray(64);
  }
  getPropertyId() {
    return (6 << 27) + Number(this.attachment.id) + this.slotIndex;
  }
  /** Sets the time in seconds and the vertices for the specified key frame.
   * @param vertices Vertex positions for an unweighted VertexAttachment, or deform offsets if it has weights. */
  setFrame(frameIndex, time, vertices) {
    this.frames[frameIndex] = time;
    this.frameVertices[frameIndex] = vertices;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const slot = skeleton.slots[this.slotIndex];
    if (!slot.bone.active)
      return;
    const slotAttachment = slot.getAttachment();
    if (!(slotAttachment instanceof VertexAttachment) || !(slotAttachment.deformAttachment == this.attachment))
      return;
    const deformArray = slot.deform;
    if (deformArray.length == 0)
      blend = MixBlend.setup;
    const frameVertices = this.frameVertices;
    const vertexCount = frameVertices[0].length;
    const frames = this.frames;
    if (time < frames[0]) {
      const vertexAttachment = slotAttachment;
      switch (blend) {
        case MixBlend.setup:
          deformArray.length = 0;
          return;
        case MixBlend.first:
          if (alpha == 1) {
            deformArray.length = 0;
            break;
          }
          const deform2 = Utils.setArraySize(deformArray, vertexCount);
          if (vertexAttachment.bones == null) {
            const setupVertices = vertexAttachment.vertices;
            for (let i = 0; i < vertexCount; i++)
              deform2[i] += (setupVertices[i] - deform2[i]) * alpha;
          } else {
            alpha = 1 - alpha;
            for (let i = 0; i < vertexCount; i++)
              deform2[i] *= alpha;
          }
      }
      return;
    }
    const deform = Utils.setArraySize(deformArray, vertexCount);
    if (time >= frames[frames.length - 1]) {
      const lastVertices = frameVertices[frames.length - 1];
      if (alpha == 1) {
        if (blend == MixBlend.add) {
          const vertexAttachment = slotAttachment;
          if (vertexAttachment.bones == null) {
            const setupVertices = vertexAttachment.vertices;
            for (let i = 0; i < vertexCount; i++) {
              deform[i] += lastVertices[i] - setupVertices[i];
            }
          } else {
            for (let i = 0; i < vertexCount; i++)
              deform[i] += lastVertices[i];
          }
        } else {
          Utils.arrayCopy(lastVertices, 0, deform, 0, vertexCount);
        }
      } else {
        switch (blend) {
          case MixBlend.setup: {
            const vertexAttachment2 = slotAttachment;
            if (vertexAttachment2.bones == null) {
              const setupVertices = vertexAttachment2.vertices;
              for (let i = 0; i < vertexCount; i++) {
                const setup = setupVertices[i];
                deform[i] = setup + (lastVertices[i] - setup) * alpha;
              }
            } else {
              for (let i = 0; i < vertexCount; i++)
                deform[i] = lastVertices[i] * alpha;
            }
            break;
          }
          case MixBlend.first:
          case MixBlend.replace:
            for (let i = 0; i < vertexCount; i++)
              deform[i] += (lastVertices[i] - deform[i]) * alpha;
            break;
          case MixBlend.add:
            const vertexAttachment = slotAttachment;
            if (vertexAttachment.bones == null) {
              const setupVertices = vertexAttachment.vertices;
              for (let i = 0; i < vertexCount; i++) {
                deform[i] += (lastVertices[i] - setupVertices[i]) * alpha;
              }
            } else {
              for (let i = 0; i < vertexCount; i++)
                deform[i] += lastVertices[i] * alpha;
            }
        }
      }
      return;
    }
    const frame = Animation.binarySearch(frames, time);
    const prevVertices = frameVertices[frame - 1];
    const nextVertices = frameVertices[frame];
    const frameTime = frames[frame];
    const percent = this.getCurvePercent(frame - 1, 1 - (time - frameTime) / (frames[frame - 1] - frameTime));
    if (alpha == 1) {
      if (blend == MixBlend.add) {
        const vertexAttachment = slotAttachment;
        if (vertexAttachment.bones == null) {
          const setupVertices = vertexAttachment.vertices;
          for (let i = 0; i < vertexCount; i++) {
            const prev = prevVertices[i];
            deform[i] += prev + (nextVertices[i] - prev) * percent - setupVertices[i];
          }
        } else {
          for (let i = 0; i < vertexCount; i++) {
            const prev = prevVertices[i];
            deform[i] += prev + (nextVertices[i] - prev) * percent;
          }
        }
      } else {
        for (let i = 0; i < vertexCount; i++) {
          const prev = prevVertices[i];
          deform[i] = prev + (nextVertices[i] - prev) * percent;
        }
      }
    } else {
      switch (blend) {
        case MixBlend.setup: {
          const vertexAttachment2 = slotAttachment;
          if (vertexAttachment2.bones == null) {
            const setupVertices = vertexAttachment2.vertices;
            for (let i = 0; i < vertexCount; i++) {
              const prev = prevVertices[i];
              const setup = setupVertices[i];
              deform[i] = setup + (prev + (nextVertices[i] - prev) * percent - setup) * alpha;
            }
          } else {
            for (let i = 0; i < vertexCount; i++) {
              const prev = prevVertices[i];
              deform[i] = (prev + (nextVertices[i] - prev) * percent) * alpha;
            }
          }
          break;
        }
        case MixBlend.first:
        case MixBlend.replace:
          for (let i = 0; i < vertexCount; i++) {
            const prev = prevVertices[i];
            deform[i] += (prev + (nextVertices[i] - prev) * percent - deform[i]) * alpha;
          }
          break;
        case MixBlend.add:
          const vertexAttachment = slotAttachment;
          if (vertexAttachment.bones == null) {
            const setupVertices = vertexAttachment.vertices;
            for (let i = 0; i < vertexCount; i++) {
              const prev = prevVertices[i];
              deform[i] += (prev + (nextVertices[i] - prev) * percent - setupVertices[i]) * alpha;
            }
          } else {
            for (let i = 0; i < vertexCount; i++) {
              const prev = prevVertices[i];
              deform[i] += (prev + (nextVertices[i] - prev) * percent) * alpha;
            }
          }
      }
    }
  }
};
var EventTimeline = class {
  constructor(frameCount) {
    this.frames = Utils.newFloatArray(frameCount);
    this.events = new Array(frameCount);
  }
  getPropertyId() {
    return 7 << 24;
  }
  /** The number of key frames for this timeline. */
  getFrameCount() {
    return this.frames.length;
  }
  /** Sets the time in seconds and the event for the specified key frame. */
  setFrame(frameIndex, event) {
    this.frames[frameIndex] = event.time;
    this.events[frameIndex] = event;
  }
  /** Fires events for frames > `lastTime` and <= `time`. */
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    if (firedEvents == null)
      return;
    const frames = this.frames;
    const frameCount = this.frames.length;
    if (lastTime > time) {
      this.apply(skeleton, lastTime, Number.MAX_VALUE, firedEvents, alpha, blend, direction);
      lastTime = -1;
    } else if (lastTime >= frames[frameCount - 1])
      return;
    if (time < frames[0])
      return;
    let frame = 0;
    if (lastTime < frames[0])
      frame = 0;
    else {
      frame = Animation.binarySearch(frames, lastTime);
      const frameTime = frames[frame];
      while (frame > 0) {
        if (frames[frame - 1] != frameTime)
          break;
        frame--;
      }
    }
    for (; frame < frameCount && time >= frames[frame]; frame++)
      firedEvents.push(this.events[frame]);
  }
};
var DrawOrderTimeline = class {
  constructor(frameCount) {
    this.frames = Utils.newFloatArray(frameCount);
    this.drawOrders = new Array(frameCount);
  }
  getPropertyId() {
    return 8 << 24;
  }
  /** The number of key frames for this timeline. */
  getFrameCount() {
    return this.frames.length;
  }
  /** Sets the time in seconds and the draw order for the specified key frame.
   * @param drawOrder For each slot in {@link Skeleton#slots}, the index of the new draw order. May be null to use setup pose
   *           draw order. */
  setFrame(frameIndex, time, drawOrder) {
    this.frames[frameIndex] = time;
    this.drawOrders[frameIndex] = drawOrder;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const drawOrder = skeleton.drawOrder;
    const slots = skeleton.slots;
    if (direction == MixDirection.mixOut && blend == MixBlend.setup) {
      Utils.arrayCopy(skeleton.slots, 0, skeleton.drawOrder, 0, skeleton.slots.length);
      return;
    }
    const frames = this.frames;
    if (time < frames[0]) {
      if (blend == MixBlend.setup || blend == MixBlend.first)
        Utils.arrayCopy(skeleton.slots, 0, skeleton.drawOrder, 0, skeleton.slots.length);
      return;
    }
    let frame = 0;
    if (time >= frames[frames.length - 1])
      frame = frames.length - 1;
    else
      frame = Animation.binarySearch(frames, time) - 1;
    const drawOrderToSetupIndex = this.drawOrders[frame];
    if (drawOrderToSetupIndex == null)
      Utils.arrayCopy(slots, 0, drawOrder, 0, slots.length);
    else {
      for (let i = 0, n = drawOrderToSetupIndex.length; i < n; i++)
        drawOrder[i] = slots[drawOrderToSetupIndex[i]];
    }
  }
};
var _IkConstraintTimeline = class extends CurveTimeline {
  // time, mix, softness, bendDirection, compress, stretch, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _IkConstraintTimeline.ENTRIES);
  }
  getPropertyId() {
    return (9 << 24) + this.ikConstraintIndex;
  }
  /** Sets the time in seconds, mix, softness, bend direction, compress, and stretch for the specified key frame. */
  setFrame(frameIndex, time, mix, softness, bendDirection, compress, stretch) {
    frameIndex *= _IkConstraintTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _IkConstraintTimeline.MIX] = mix;
    this.frames[frameIndex + _IkConstraintTimeline.SOFTNESS] = softness;
    this.frames[frameIndex + _IkConstraintTimeline.BEND_DIRECTION] = bendDirection;
    this.frames[frameIndex + _IkConstraintTimeline.COMPRESS] = compress ? 1 : 0;
    this.frames[frameIndex + _IkConstraintTimeline.STRETCH] = stretch ? 1 : 0;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const frames = this.frames;
    const constraint = skeleton.ikConstraints[this.ikConstraintIndex];
    if (!constraint.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          constraint.mix = constraint.data.mix;
          constraint.softness = constraint.data.softness;
          constraint.bendDirection = constraint.data.bendDirection;
          constraint.compress = constraint.data.compress;
          constraint.stretch = constraint.data.stretch;
          return;
        case MixBlend.first:
          constraint.mix += (constraint.data.mix - constraint.mix) * alpha;
          constraint.softness += (constraint.data.softness - constraint.softness) * alpha;
          constraint.bendDirection = constraint.data.bendDirection;
          constraint.compress = constraint.data.compress;
          constraint.stretch = constraint.data.stretch;
      }
      return;
    }
    if (time >= frames[frames.length - _IkConstraintTimeline.ENTRIES]) {
      if (blend == MixBlend.setup) {
        constraint.mix = constraint.data.mix + (frames[frames.length + _IkConstraintTimeline.PREV_MIX] - constraint.data.mix) * alpha;
        constraint.softness = constraint.data.softness + (frames[frames.length + _IkConstraintTimeline.PREV_SOFTNESS] - constraint.data.softness) * alpha;
        if (direction == MixDirection.mixOut) {
          constraint.bendDirection = constraint.data.bendDirection;
          constraint.compress = constraint.data.compress;
          constraint.stretch = constraint.data.stretch;
        } else {
          constraint.bendDirection = frames[frames.length + _IkConstraintTimeline.PREV_BEND_DIRECTION];
          constraint.compress = frames[frames.length + _IkConstraintTimeline.PREV_COMPRESS] != 0;
          constraint.stretch = frames[frames.length + _IkConstraintTimeline.PREV_STRETCH] != 0;
        }
      } else {
        constraint.mix += (frames[frames.length + _IkConstraintTimeline.PREV_MIX] - constraint.mix) * alpha;
        constraint.softness += (frames[frames.length + _IkConstraintTimeline.PREV_SOFTNESS] - constraint.softness) * alpha;
        if (direction == MixDirection.mixIn) {
          constraint.bendDirection = frames[frames.length + _IkConstraintTimeline.PREV_BEND_DIRECTION];
          constraint.compress = frames[frames.length + _IkConstraintTimeline.PREV_COMPRESS] != 0;
          constraint.stretch = frames[frames.length + _IkConstraintTimeline.PREV_STRETCH] != 0;
        }
      }
      return;
    }
    const frame = Animation.binarySearch(frames, time, _IkConstraintTimeline.ENTRIES);
    const mix = frames[frame + _IkConstraintTimeline.PREV_MIX];
    const softness = frames[frame + _IkConstraintTimeline.PREV_SOFTNESS];
    const frameTime = frames[frame];
    const percent = this.getCurvePercent(frame / _IkConstraintTimeline.ENTRIES - 1, 1 - (time - frameTime) / (frames[frame + _IkConstraintTimeline.PREV_TIME] - frameTime));
    if (blend == MixBlend.setup) {
      constraint.mix = constraint.data.mix + (mix + (frames[frame + _IkConstraintTimeline.MIX] - mix) * percent - constraint.data.mix) * alpha;
      constraint.softness = constraint.data.softness + (softness + (frames[frame + _IkConstraintTimeline.SOFTNESS] - softness) * percent - constraint.data.softness) * alpha;
      if (direction == MixDirection.mixOut) {
        constraint.bendDirection = constraint.data.bendDirection;
        constraint.compress = constraint.data.compress;
        constraint.stretch = constraint.data.stretch;
      } else {
        constraint.bendDirection = frames[frame + _IkConstraintTimeline.PREV_BEND_DIRECTION];
        constraint.compress = frames[frame + _IkConstraintTimeline.PREV_COMPRESS] != 0;
        constraint.stretch = frames[frame + _IkConstraintTimeline.PREV_STRETCH] != 0;
      }
    } else {
      constraint.mix += (mix + (frames[frame + _IkConstraintTimeline.MIX] - mix) * percent - constraint.mix) * alpha;
      constraint.softness += (softness + (frames[frame + _IkConstraintTimeline.SOFTNESS] - softness) * percent - constraint.softness) * alpha;
      if (direction == MixDirection.mixIn) {
        constraint.bendDirection = frames[frame + _IkConstraintTimeline.PREV_BEND_DIRECTION];
        constraint.compress = frames[frame + _IkConstraintTimeline.PREV_COMPRESS] != 0;
        constraint.stretch = frames[frame + _IkConstraintTimeline.PREV_STRETCH] != 0;
      }
    }
  }
};
var IkConstraintTimeline = _IkConstraintTimeline;
IkConstraintTimeline.ENTRIES = 6;
IkConstraintTimeline.PREV_TIME = -6;
IkConstraintTimeline.PREV_MIX = -5;
IkConstraintTimeline.PREV_SOFTNESS = -4;
IkConstraintTimeline.PREV_BEND_DIRECTION = -3;
IkConstraintTimeline.PREV_COMPRESS = -2;
IkConstraintTimeline.PREV_STRETCH = -1;
IkConstraintTimeline.MIX = 1;
IkConstraintTimeline.SOFTNESS = 2;
IkConstraintTimeline.BEND_DIRECTION = 3;
IkConstraintTimeline.COMPRESS = 4;
IkConstraintTimeline.STRETCH = 5;
var _TransformConstraintTimeline = class extends CurveTimeline {
  // time, rotate mix, translate mix, scale mix, shear mix, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _TransformConstraintTimeline.ENTRIES);
  }
  getPropertyId() {
    return (10 << 24) + this.transformConstraintIndex;
  }
  /** The time in seconds, rotate mix, translate mix, scale mix, and shear mix for the specified key frame. */
  setFrame(frameIndex, time, rotateMix, translateMix, scaleMix, shearMix) {
    frameIndex *= _TransformConstraintTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _TransformConstraintTimeline.ROTATE] = rotateMix;
    this.frames[frameIndex + _TransformConstraintTimeline.TRANSLATE] = translateMix;
    this.frames[frameIndex + _TransformConstraintTimeline.SCALE] = scaleMix;
    this.frames[frameIndex + _TransformConstraintTimeline.SHEAR] = shearMix;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const frames = this.frames;
    const constraint = skeleton.transformConstraints[this.transformConstraintIndex];
    if (!constraint.active)
      return;
    if (time < frames[0]) {
      const data = constraint.data;
      switch (blend) {
        case MixBlend.setup:
          constraint.rotateMix = data.rotateMix;
          constraint.translateMix = data.translateMix;
          constraint.scaleMix = data.scaleMix;
          constraint.shearMix = data.shearMix;
          return;
        case MixBlend.first:
          constraint.rotateMix += (data.rotateMix - constraint.rotateMix) * alpha;
          constraint.translateMix += (data.translateMix - constraint.translateMix) * alpha;
          constraint.scaleMix += (data.scaleMix - constraint.scaleMix) * alpha;
          constraint.shearMix += (data.shearMix - constraint.shearMix) * alpha;
      }
      return;
    }
    let rotate = 0;
    let translate = 0;
    let scale = 0;
    let shear = 0;
    if (time >= frames[frames.length - _TransformConstraintTimeline.ENTRIES]) {
      const i = frames.length;
      rotate = frames[i + _TransformConstraintTimeline.PREV_ROTATE];
      translate = frames[i + _TransformConstraintTimeline.PREV_TRANSLATE];
      scale = frames[i + _TransformConstraintTimeline.PREV_SCALE];
      shear = frames[i + _TransformConstraintTimeline.PREV_SHEAR];
    } else {
      const frame = Animation.binarySearch(frames, time, _TransformConstraintTimeline.ENTRIES);
      rotate = frames[frame + _TransformConstraintTimeline.PREV_ROTATE];
      translate = frames[frame + _TransformConstraintTimeline.PREV_TRANSLATE];
      scale = frames[frame + _TransformConstraintTimeline.PREV_SCALE];
      shear = frames[frame + _TransformConstraintTimeline.PREV_SHEAR];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(
        frame / _TransformConstraintTimeline.ENTRIES - 1,
        1 - (time - frameTime) / (frames[frame + _TransformConstraintTimeline.PREV_TIME] - frameTime)
      );
      rotate += (frames[frame + _TransformConstraintTimeline.ROTATE] - rotate) * percent;
      translate += (frames[frame + _TransformConstraintTimeline.TRANSLATE] - translate) * percent;
      scale += (frames[frame + _TransformConstraintTimeline.SCALE] - scale) * percent;
      shear += (frames[frame + _TransformConstraintTimeline.SHEAR] - shear) * percent;
    }
    if (blend == MixBlend.setup) {
      const data = constraint.data;
      constraint.rotateMix = data.rotateMix + (rotate - data.rotateMix) * alpha;
      constraint.translateMix = data.translateMix + (translate - data.translateMix) * alpha;
      constraint.scaleMix = data.scaleMix + (scale - data.scaleMix) * alpha;
      constraint.shearMix = data.shearMix + (shear - data.shearMix) * alpha;
    } else {
      constraint.rotateMix += (rotate - constraint.rotateMix) * alpha;
      constraint.translateMix += (translate - constraint.translateMix) * alpha;
      constraint.scaleMix += (scale - constraint.scaleMix) * alpha;
      constraint.shearMix += (shear - constraint.shearMix) * alpha;
    }
  }
};
var TransformConstraintTimeline = _TransformConstraintTimeline;
TransformConstraintTimeline.ENTRIES = 5;
TransformConstraintTimeline.PREV_TIME = -5;
TransformConstraintTimeline.PREV_ROTATE = -4;
TransformConstraintTimeline.PREV_TRANSLATE = -3;
TransformConstraintTimeline.PREV_SCALE = -2;
TransformConstraintTimeline.PREV_SHEAR = -1;
TransformConstraintTimeline.ROTATE = 1;
TransformConstraintTimeline.TRANSLATE = 2;
TransformConstraintTimeline.SCALE = 3;
TransformConstraintTimeline.SHEAR = 4;
var _PathConstraintPositionTimeline = class extends CurveTimeline {
  // time, position, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _PathConstraintPositionTimeline.ENTRIES);
  }
  getPropertyId() {
    return (11 << 24) + this.pathConstraintIndex;
  }
  /** Sets the time in seconds and path constraint position for the specified key frame. */
  setFrame(frameIndex, time, value) {
    frameIndex *= _PathConstraintPositionTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _PathConstraintPositionTimeline.VALUE] = value;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const frames = this.frames;
    const constraint = skeleton.pathConstraints[this.pathConstraintIndex];
    if (!constraint.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          constraint.position = constraint.data.position;
          return;
        case MixBlend.first:
          constraint.position += (constraint.data.position - constraint.position) * alpha;
      }
      return;
    }
    let position = 0;
    if (time >= frames[frames.length - _PathConstraintPositionTimeline.ENTRIES])
      position = frames[frames.length + _PathConstraintPositionTimeline.PREV_VALUE];
    else {
      const frame = Animation.binarySearch(frames, time, _PathConstraintPositionTimeline.ENTRIES);
      position = frames[frame + _PathConstraintPositionTimeline.PREV_VALUE];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(
        frame / _PathConstraintPositionTimeline.ENTRIES - 1,
        1 - (time - frameTime) / (frames[frame + _PathConstraintPositionTimeline.PREV_TIME] - frameTime)
      );
      position += (frames[frame + _PathConstraintPositionTimeline.VALUE] - position) * percent;
    }
    if (blend == MixBlend.setup)
      constraint.position = constraint.data.position + (position - constraint.data.position) * alpha;
    else
      constraint.position += (position - constraint.position) * alpha;
  }
};
var PathConstraintPositionTimeline = _PathConstraintPositionTimeline;
PathConstraintPositionTimeline.ENTRIES = 2;
PathConstraintPositionTimeline.PREV_TIME = -2;
PathConstraintPositionTimeline.PREV_VALUE = -1;
PathConstraintPositionTimeline.VALUE = 1;
var PathConstraintSpacingTimeline = class _PathConstraintSpacingTimeline extends PathConstraintPositionTimeline {
  constructor(frameCount) {
    super(frameCount);
  }
  getPropertyId() {
    return (12 << 24) + this.pathConstraintIndex;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const frames = this.frames;
    const constraint = skeleton.pathConstraints[this.pathConstraintIndex];
    if (!constraint.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          constraint.spacing = constraint.data.spacing;
          return;
        case MixBlend.first:
          constraint.spacing += (constraint.data.spacing - constraint.spacing) * alpha;
      }
      return;
    }
    let spacing = 0;
    if (time >= frames[frames.length - _PathConstraintSpacingTimeline.ENTRIES])
      spacing = frames[frames.length + _PathConstraintSpacingTimeline.PREV_VALUE];
    else {
      const frame = Animation.binarySearch(frames, time, _PathConstraintSpacingTimeline.ENTRIES);
      spacing = frames[frame + _PathConstraintSpacingTimeline.PREV_VALUE];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(
        frame / _PathConstraintSpacingTimeline.ENTRIES - 1,
        1 - (time - frameTime) / (frames[frame + _PathConstraintSpacingTimeline.PREV_TIME] - frameTime)
      );
      spacing += (frames[frame + _PathConstraintSpacingTimeline.VALUE] - spacing) * percent;
    }
    if (blend == MixBlend.setup)
      constraint.spacing = constraint.data.spacing + (spacing - constraint.data.spacing) * alpha;
    else
      constraint.spacing += (spacing - constraint.spacing) * alpha;
  }
};
var _PathConstraintMixTimeline = class extends CurveTimeline {
  // time, rotate mix, translate mix, ...
  constructor(frameCount) {
    super(frameCount);
    this.frames = Utils.newFloatArray(frameCount * _PathConstraintMixTimeline.ENTRIES);
  }
  getPropertyId() {
    return (13 << 24) + this.pathConstraintIndex;
  }
  /** The time in seconds, rotate mix, and translate mix for the specified key frame. */
  setFrame(frameIndex, time, rotateMix, translateMix) {
    frameIndex *= _PathConstraintMixTimeline.ENTRIES;
    this.frames[frameIndex] = time;
    this.frames[frameIndex + _PathConstraintMixTimeline.ROTATE] = rotateMix;
    this.frames[frameIndex + _PathConstraintMixTimeline.TRANSLATE] = translateMix;
  }
  apply(skeleton, lastTime, time, firedEvents, alpha, blend, direction) {
    const frames = this.frames;
    const constraint = skeleton.pathConstraints[this.pathConstraintIndex];
    if (!constraint.active)
      return;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          constraint.rotateMix = constraint.data.rotateMix;
          constraint.translateMix = constraint.data.translateMix;
          return;
        case MixBlend.first:
          constraint.rotateMix += (constraint.data.rotateMix - constraint.rotateMix) * alpha;
          constraint.translateMix += (constraint.data.translateMix - constraint.translateMix) * alpha;
      }
      return;
    }
    let rotate = 0;
    let translate = 0;
    if (time >= frames[frames.length - _PathConstraintMixTimeline.ENTRIES]) {
      rotate = frames[frames.length + _PathConstraintMixTimeline.PREV_ROTATE];
      translate = frames[frames.length + _PathConstraintMixTimeline.PREV_TRANSLATE];
    } else {
      const frame = Animation.binarySearch(frames, time, _PathConstraintMixTimeline.ENTRIES);
      rotate = frames[frame + _PathConstraintMixTimeline.PREV_ROTATE];
      translate = frames[frame + _PathConstraintMixTimeline.PREV_TRANSLATE];
      const frameTime = frames[frame];
      const percent = this.getCurvePercent(
        frame / _PathConstraintMixTimeline.ENTRIES - 1,
        1 - (time - frameTime) / (frames[frame + _PathConstraintMixTimeline.PREV_TIME] - frameTime)
      );
      rotate += (frames[frame + _PathConstraintMixTimeline.ROTATE] - rotate) * percent;
      translate += (frames[frame + _PathConstraintMixTimeline.TRANSLATE] - translate) * percent;
    }
    if (blend == MixBlend.setup) {
      constraint.rotateMix = constraint.data.rotateMix + (rotate - constraint.data.rotateMix) * alpha;
      constraint.translateMix = constraint.data.translateMix + (translate - constraint.data.translateMix) * alpha;
    } else {
      constraint.rotateMix += (rotate - constraint.rotateMix) * alpha;
      constraint.translateMix += (translate - constraint.translateMix) * alpha;
    }
  }
};
var PathConstraintMixTimeline = _PathConstraintMixTimeline;
PathConstraintMixTimeline.ENTRIES = 3;
PathConstraintMixTimeline.PREV_TIME = -3;
PathConstraintMixTimeline.PREV_ROTATE = -2;
PathConstraintMixTimeline.PREV_TRANSLATE = -1;
PathConstraintMixTimeline.ROTATE = 1;
PathConstraintMixTimeline.TRANSLATE = 2;

// node_modules/@pixi-spine/runtime-3.8/lib/core/AnimationState.mjs
var _AnimationState = class {
  constructor(data) {
    this.tracks = new Array();
    this.timeScale = 1;
    this.unkeyedState = 0;
    this.events = new Array();
    this.listeners = new Array();
    this.queue = new EventQueue(this);
    this.propertyIDs = new IntSet();
    this.animationsChanged = false;
    this.trackEntryPool = new Pool(() => new TrackEntry());
    this.data = data;
  }
  /** Increments each track entry {@link TrackEntry#trackTime()}, setting queued animations as current if needed. */
  update(delta) {
    delta *= this.timeScale;
    const tracks = this.tracks;
    for (let i = 0, n = tracks.length; i < n; i++) {
      const current = tracks[i];
      if (current == null)
        continue;
      current.animationLast = current.nextAnimationLast;
      current.trackLast = current.nextTrackLast;
      let currentDelta = delta * current.timeScale;
      if (current.delay > 0) {
        current.delay -= currentDelta;
        if (current.delay > 0)
          continue;
        currentDelta = -current.delay;
        current.delay = 0;
      }
      let next = current.next;
      if (next != null) {
        const nextTime = current.trackLast - next.delay;
        if (nextTime >= 0) {
          next.delay = 0;
          next.trackTime += current.timeScale == 0 ? 0 : (nextTime / current.timeScale + delta) * next.timeScale;
          current.trackTime += currentDelta;
          this.setCurrent(i, next, true);
          while (next.mixingFrom != null) {
            next.mixTime += delta;
            next = next.mixingFrom;
          }
          continue;
        }
      } else if (current.trackLast >= current.trackEnd && current.mixingFrom == null) {
        tracks[i] = null;
        this.queue.end(current);
        this.disposeNext(current);
        continue;
      }
      if (current.mixingFrom != null && this.updateMixingFrom(current, delta)) {
        let from = current.mixingFrom;
        current.mixingFrom = null;
        if (from != null)
          from.mixingTo = null;
        while (from != null) {
          this.queue.end(from);
          from = from.mixingFrom;
        }
      }
      current.trackTime += currentDelta;
    }
    this.queue.drain();
  }
  /** Returns true when all mixing from entries are complete. */
  updateMixingFrom(to, delta) {
    const from = to.mixingFrom;
    if (from == null)
      return true;
    const finished = this.updateMixingFrom(from, delta);
    from.animationLast = from.nextAnimationLast;
    from.trackLast = from.nextTrackLast;
    if (to.mixTime > 0 && to.mixTime >= to.mixDuration) {
      if (from.totalAlpha == 0 || to.mixDuration == 0) {
        to.mixingFrom = from.mixingFrom;
        if (from.mixingFrom != null)
          from.mixingFrom.mixingTo = to;
        to.interruptAlpha = from.interruptAlpha;
        this.queue.end(from);
      }
      return finished;
    }
    from.trackTime += delta * from.timeScale;
    to.mixTime += delta;
    return false;
  }
  /** Poses the skeleton using the track entry animations. There are no side effects other than invoking listeners, so the
   * animation state can be applied to multiple skeletons to pose them identically.
   * @returns True if any animations were applied. */
  apply(skeleton) {
    if (skeleton == null)
      throw new Error("skeleton cannot be null.");
    if (this.animationsChanged)
      this._animationsChanged();
    const events = this.events;
    const tracks = this.tracks;
    let applied = false;
    for (let i = 0, n = tracks.length; i < n; i++) {
      const current = tracks[i];
      if (current == null || current.delay > 0)
        continue;
      applied = true;
      const blend = i == 0 ? MixBlend.first : current.mixBlend;
      let mix = current.alpha;
      if (current.mixingFrom != null)
        mix *= this.applyMixingFrom(current, skeleton, blend);
      else if (current.trackTime >= current.trackEnd && current.next == null)
        mix = 0;
      const animationLast = current.animationLast;
      const animationTime = current.getAnimationTime();
      const timelineCount = current.animation.timelines.length;
      const timelines = current.animation.timelines;
      if (i == 0 && mix == 1 || blend == MixBlend.add) {
        for (let ii = 0; ii < timelineCount; ii++) {
          Utils.webkit602BugfixHelper(mix, blend);
          const timeline = timelines[ii];
          if (timeline instanceof AttachmentTimeline)
            this.applyAttachmentTimeline(timeline, skeleton, animationTime, blend, true);
          else
            timeline.apply(skeleton, animationLast, animationTime, events, mix, blend, MixDirection.mixIn);
        }
      } else {
        const timelineMode = current.timelineMode;
        const firstFrame = current.timelinesRotation.length == 0;
        if (firstFrame)
          Utils.setArraySize(current.timelinesRotation, timelineCount << 1, null);
        const timelinesRotation = current.timelinesRotation;
        for (let ii = 0; ii < timelineCount; ii++) {
          const timeline = timelines[ii];
          const timelineBlend = timelineMode[ii] == _AnimationState.SUBSEQUENT ? blend : MixBlend.setup;
          if (timeline instanceof RotateTimeline) {
            this.applyRotateTimeline(timeline, skeleton, animationTime, mix, timelineBlend, timelinesRotation, ii << 1, firstFrame);
          } else if (timeline instanceof AttachmentTimeline) {
            this.applyAttachmentTimeline(timeline, skeleton, animationTime, blend, true);
          } else {
            Utils.webkit602BugfixHelper(mix, blend);
            timeline.apply(skeleton, animationLast, animationTime, events, mix, timelineBlend, MixDirection.mixIn);
          }
        }
      }
      this.queueEvents(current, animationTime);
      events.length = 0;
      current.nextAnimationLast = animationTime;
      current.nextTrackLast = current.trackTime;
    }
    const setupState = this.unkeyedState + _AnimationState.SETUP;
    const slots = skeleton.slots;
    for (let i = 0, n = skeleton.slots.length; i < n; i++) {
      const slot = slots[i];
      if (slot.attachmentState == setupState) {
        const attachmentName = slot.data.attachmentName;
        slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(slot.data.index, attachmentName));
      }
    }
    this.unkeyedState += 2;
    this.queue.drain();
    return applied;
  }
  applyMixingFrom(to, skeleton, blend) {
    const from = to.mixingFrom;
    if (from.mixingFrom != null)
      this.applyMixingFrom(from, skeleton, blend);
    let mix = 0;
    if (to.mixDuration == 0) {
      mix = 1;
      if (blend == MixBlend.first)
        blend = MixBlend.setup;
    } else {
      mix = to.mixTime / to.mixDuration;
      if (mix > 1)
        mix = 1;
      if (blend != MixBlend.first)
        blend = from.mixBlend;
    }
    const events = mix < from.eventThreshold ? this.events : null;
    const attachments = mix < from.attachmentThreshold;
    const drawOrder = mix < from.drawOrderThreshold;
    const animationLast = from.animationLast;
    const animationTime = from.getAnimationTime();
    const timelineCount = from.animation.timelines.length;
    const timelines = from.animation.timelines;
    const alphaHold = from.alpha * to.interruptAlpha;
    const alphaMix = alphaHold * (1 - mix);
    if (blend == MixBlend.add) {
      for (let i = 0; i < timelineCount; i++)
        timelines[i].apply(skeleton, animationLast, animationTime, events, alphaMix, blend, MixDirection.mixOut);
    } else {
      const timelineMode = from.timelineMode;
      const timelineHoldMix = from.timelineHoldMix;
      const firstFrame = from.timelinesRotation.length == 0;
      if (firstFrame)
        Utils.setArraySize(from.timelinesRotation, timelineCount << 1, null);
      const timelinesRotation = from.timelinesRotation;
      from.totalAlpha = 0;
      for (let i = 0; i < timelineCount; i++) {
        const timeline = timelines[i];
        let direction = MixDirection.mixOut;
        let timelineBlend;
        let alpha = 0;
        switch (timelineMode[i]) {
          case _AnimationState.SUBSEQUENT:
            if (!drawOrder && timeline instanceof DrawOrderTimeline)
              continue;
            timelineBlend = blend;
            alpha = alphaMix;
            break;
          case _AnimationState.FIRST:
            timelineBlend = MixBlend.setup;
            alpha = alphaMix;
            break;
          case _AnimationState.HOLD_SUBSEQUENT:
            timelineBlend = blend;
            alpha = alphaHold;
            break;
          case _AnimationState.HOLD_FIRST:
            timelineBlend = MixBlend.setup;
            alpha = alphaHold;
            break;
          default:
            timelineBlend = MixBlend.setup;
            const holdMix = timelineHoldMix[i];
            alpha = alphaHold * Math.max(0, 1 - holdMix.mixTime / holdMix.mixDuration);
            break;
        }
        from.totalAlpha += alpha;
        if (timeline instanceof RotateTimeline)
          this.applyRotateTimeline(timeline, skeleton, animationTime, alpha, timelineBlend, timelinesRotation, i << 1, firstFrame);
        else if (timeline instanceof AttachmentTimeline)
          this.applyAttachmentTimeline(timeline, skeleton, animationTime, timelineBlend, attachments);
        else {
          Utils.webkit602BugfixHelper(alpha, blend);
          if (drawOrder && timeline instanceof DrawOrderTimeline && timelineBlend == MixBlend.setup)
            direction = MixDirection.mixIn;
          timeline.apply(skeleton, animationLast, animationTime, events, alpha, timelineBlend, direction);
        }
      }
    }
    if (to.mixDuration > 0)
      this.queueEvents(from, animationTime);
    this.events.length = 0;
    from.nextAnimationLast = animationTime;
    from.nextTrackLast = from.trackTime;
    return mix;
  }
  applyAttachmentTimeline(timeline, skeleton, time, blend, attachments) {
    const slot = skeleton.slots[timeline.slotIndex];
    if (!slot.bone.active)
      return;
    const frames = timeline.frames;
    if (time < frames[0]) {
      if (blend == MixBlend.setup || blend == MixBlend.first)
        this.setAttachment(skeleton, slot, slot.data.attachmentName, attachments);
    } else {
      let frameIndex;
      if (time >= frames[frames.length - 1])
        frameIndex = frames.length - 1;
      else
        frameIndex = Animation.binarySearch(frames, time) - 1;
      this.setAttachment(skeleton, slot, timeline.attachmentNames[frameIndex], attachments);
    }
    if (slot.attachmentState <= this.unkeyedState)
      slot.attachmentState = this.unkeyedState + _AnimationState.SETUP;
  }
  setAttachment(skeleton, slot, attachmentName, attachments) {
    slot.setAttachment(attachmentName == null ? null : skeleton.getAttachment(slot.data.index, attachmentName));
    if (attachments)
      slot.attachmentState = this.unkeyedState + _AnimationState.CURRENT;
  }
  applyRotateTimeline(timeline, skeleton, time, alpha, blend, timelinesRotation, i, firstFrame) {
    if (firstFrame)
      timelinesRotation[i] = 0;
    if (alpha == 1) {
      timeline.apply(skeleton, 0, time, null, 1, blend, MixDirection.mixIn);
      return;
    }
    const rotateTimeline = timeline;
    const frames = rotateTimeline.frames;
    const bone = skeleton.bones[rotateTimeline.boneIndex];
    if (!bone.active)
      return;
    let r1 = 0;
    let r2 = 0;
    if (time < frames[0]) {
      switch (blend) {
        case MixBlend.setup:
          bone.rotation = bone.data.rotation;
        default:
          return;
        case MixBlend.first:
          r1 = bone.rotation;
          r2 = bone.data.rotation;
      }
    } else {
      r1 = blend == MixBlend.setup ? bone.data.rotation : bone.rotation;
      if (time >= frames[frames.length - RotateTimeline.ENTRIES])
        r2 = bone.data.rotation + frames[frames.length + RotateTimeline.PREV_ROTATION];
      else {
        const frame = Animation.binarySearch(frames, time, RotateTimeline.ENTRIES);
        const prevRotation = frames[frame + RotateTimeline.PREV_ROTATION];
        const frameTime = frames[frame];
        const percent = rotateTimeline.getCurvePercent((frame >> 1) - 1, 1 - (time - frameTime) / (frames[frame + RotateTimeline.PREV_TIME] - frameTime));
        r2 = frames[frame + RotateTimeline.ROTATION] - prevRotation;
        r2 -= (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360;
        r2 = prevRotation + r2 * percent + bone.data.rotation;
        r2 -= (16384 - (16384.499999999996 - r2 / 360 | 0)) * 360;
      }
    }
    let total = 0;
    let diff = r2 - r1;
    diff -= (16384 - (16384.499999999996 - diff / 360 | 0)) * 360;
    if (diff == 0) {
      total = timelinesRotation[i];
    } else {
      let lastTotal = 0;
      let lastDiff = 0;
      if (firstFrame) {
        lastTotal = 0;
        lastDiff = diff;
      } else {
        lastTotal = timelinesRotation[i];
        lastDiff = timelinesRotation[i + 1];
      }
      const current = diff > 0;
      let dir = lastTotal >= 0;
      if (MathUtils.signum(lastDiff) != MathUtils.signum(diff) && Math.abs(lastDiff) <= 90) {
        if (Math.abs(lastTotal) > 180)
          lastTotal += 360 * MathUtils.signum(lastTotal);
        dir = current;
      }
      total = diff + lastTotal - lastTotal % 360;
      if (dir != current)
        total += 360 * MathUtils.signum(lastTotal);
      timelinesRotation[i] = total;
    }
    timelinesRotation[i + 1] = diff;
    r1 += total * alpha;
    bone.rotation = r1 - (16384 - (16384.499999999996 - r1 / 360 | 0)) * 360;
  }
  queueEvents(entry, animationTime) {
    const animationStart = entry.animationStart;
    const animationEnd = entry.animationEnd;
    const duration = animationEnd - animationStart;
    const trackLastWrapped = entry.trackLast % duration;
    const events = this.events;
    let i = 0;
    const n = events.length;
    for (; i < n; i++) {
      const event = events[i];
      if (event.time < trackLastWrapped)
        break;
      if (event.time > animationEnd)
        continue;
      this.queue.event(entry, event);
    }
    let complete = false;
    if (entry.loop)
      complete = duration == 0 || trackLastWrapped > entry.trackTime % duration;
    else
      complete = animationTime >= animationEnd && entry.animationLast < animationEnd;
    if (complete)
      this.queue.complete(entry);
    for (; i < n; i++) {
      const event = events[i];
      if (event.time < animationStart)
        continue;
      this.queue.event(entry, events[i]);
    }
  }
  /** Removes all animations from all tracks, leaving skeletons in their current pose.
   *
   * It may be desired to use {@link AnimationState#setEmptyAnimation()} to mix the skeletons back to the setup pose,
   * rather than leaving them in their current pose. */
  clearTracks() {
    const oldDrainDisabled = this.queue.drainDisabled;
    this.queue.drainDisabled = true;
    for (let i = 0, n = this.tracks.length; i < n; i++)
      this.clearTrack(i);
    this.tracks.length = 0;
    this.queue.drainDisabled = oldDrainDisabled;
    this.queue.drain();
  }
  /** Removes all animations from the track, leaving skeletons in their current pose.
   *
   * It may be desired to use {@link AnimationState#setEmptyAnimation()} to mix the skeletons back to the setup pose,
   * rather than leaving them in their current pose. */
  clearTrack(trackIndex) {
    if (trackIndex >= this.tracks.length)
      return;
    const current = this.tracks[trackIndex];
    if (current == null)
      return;
    this.queue.end(current);
    this.disposeNext(current);
    let entry = current;
    while (true) {
      const from = entry.mixingFrom;
      if (from == null)
        break;
      this.queue.end(from);
      entry.mixingFrom = null;
      entry.mixingTo = null;
      entry = from;
    }
    this.tracks[current.trackIndex] = null;
    this.queue.drain();
  }
  setCurrent(index, current, interrupt) {
    const from = this.expandToIndex(index);
    this.tracks[index] = current;
    if (from != null) {
      if (interrupt)
        this.queue.interrupt(from);
      current.mixingFrom = from;
      from.mixingTo = current;
      current.mixTime = 0;
      if (from.mixingFrom != null && from.mixDuration > 0)
        current.interruptAlpha *= Math.min(1, from.mixTime / from.mixDuration);
      from.timelinesRotation.length = 0;
    }
    this.queue.start(current);
  }
  /** Sets an animation by name.
   *
   * {@link #setAnimationWith(}. */
  setAnimation(trackIndex, animationName, loop) {
    const animation = this.data.skeletonData.findAnimation(animationName);
    if (animation == null)
      throw new Error(`Animation not found: ${animationName}`);
    return this.setAnimationWith(trackIndex, animation, loop);
  }
  /** Sets the current animation for a track, discarding any queued animations. If the formerly current track entry was never
   * applied to a skeleton, it is replaced (not mixed from).
   * @param loop If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its
   *           duration. In either case {@link TrackEntry#trackEnd} determines when the track is cleared.
   * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept
   *         after the {@link AnimationStateListener#dispose()} event occurs. */
  setAnimationWith(trackIndex, animation, loop) {
    if (animation == null)
      throw new Error("animation cannot be null.");
    let interrupt = true;
    let current = this.expandToIndex(trackIndex);
    if (current != null) {
      if (current.nextTrackLast == -1) {
        this.tracks[trackIndex] = current.mixingFrom;
        this.queue.interrupt(current);
        this.queue.end(current);
        this.disposeNext(current);
        current = current.mixingFrom;
        interrupt = false;
      } else
        this.disposeNext(current);
    }
    const entry = this.trackEntry(trackIndex, animation, loop, current);
    this.setCurrent(trackIndex, entry, interrupt);
    this.queue.drain();
    return entry;
  }
  /** Queues an animation by name.
   *
   * See {@link #addAnimationWith()}. */
  addAnimation(trackIndex, animationName, loop, delay) {
    const animation = this.data.skeletonData.findAnimation(animationName);
    if (animation == null)
      throw new Error(`Animation not found: ${animationName}`);
    return this.addAnimationWith(trackIndex, animation, loop, delay);
  }
  /** Adds an animation to be played after the current or last queued animation for a track. If the track is empty, it is
   * equivalent to calling {@link #setAnimationWith()}.
   * @param delay If > 0, sets {@link TrackEntry#delay}. If <= 0, the delay set is the duration of the previous track entry
   *           minus any mix duration (from the {@link AnimationStateData}) plus the specified `delay` (ie the mix
   *           ends at (`delay` = 0) or before (`delay` < 0) the previous track entry duration). If the
   *           previous entry is looping, its next loop completion is used instead of its duration.
   * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept
   *         after the {@link AnimationStateListener#dispose()} event occurs. */
  addAnimationWith(trackIndex, animation, loop, delay) {
    if (animation == null)
      throw new Error("animation cannot be null.");
    let last = this.expandToIndex(trackIndex);
    if (last != null) {
      while (last.next != null)
        last = last.next;
    }
    const entry = this.trackEntry(trackIndex, animation, loop, last);
    if (last == null) {
      this.setCurrent(trackIndex, entry, true);
      this.queue.drain();
    } else {
      last.next = entry;
      if (delay <= 0) {
        const duration = last.animationEnd - last.animationStart;
        if (duration != 0) {
          if (last.loop)
            delay += duration * (1 + (last.trackTime / duration | 0));
          else
            delay += Math.max(duration, last.trackTime);
          delay -= this.data.getMix(last.animation, animation);
        } else
          delay = last.trackTime;
      }
    }
    entry.delay = delay;
    return entry;
  }
  /** Sets an empty animation for a track, discarding any queued animations, and sets the track entry's
   * {@link TrackEntry#mixduration}. An empty animation has no timelines and serves as a placeholder for mixing in or out.
   *
   * Mixing out is done by setting an empty animation with a mix duration using either {@link #setEmptyAnimation()},
   * {@link #setEmptyAnimations()}, or {@link #addEmptyAnimation()}. Mixing to an empty animation causes
   * the previous animation to be applied less and less over the mix duration. Properties keyed in the previous animation
   * transition to the value from lower tracks or to the setup pose value if no lower tracks key the property. A mix duration of
   * 0 still mixes out over one frame.
   *
   * Mixing in is done by first setting an empty animation, then adding an animation using
   * {@link #addAnimation()} and on the returned track entry, set the
   * {@link TrackEntry#setMixDuration()}. Mixing from an empty animation causes the new animation to be applied more and
   * more over the mix duration. Properties keyed in the new animation transition from the value from lower tracks or from the
   * setup pose value if no lower tracks key the property to the value keyed in the new animation. */
  setEmptyAnimation(trackIndex, mixDuration) {
    const entry = this.setAnimationWith(trackIndex, _AnimationState.emptyAnimation, false);
    entry.mixDuration = mixDuration;
    entry.trackEnd = mixDuration;
    return entry;
  }
  /** Adds an empty animation to be played after the current or last queued animation for a track, and sets the track entry's
   * {@link TrackEntry#mixDuration}. If the track is empty, it is equivalent to calling
   * {@link #setEmptyAnimation()}.
   *
   * See {@link #setEmptyAnimation()}.
   * @param delay If > 0, sets {@link TrackEntry#delay}. If <= 0, the delay set is the duration of the previous track entry
   *           minus any mix duration plus the specified `delay` (ie the mix ends at (`delay` = 0) or
   *           before (`delay` < 0) the previous track entry duration). If the previous entry is looping, its next
   *           loop completion is used instead of its duration.
   * @return A track entry to allow further customization of animation playback. References to the track entry must not be kept
   *         after the {@link AnimationStateListener#dispose()} event occurs. */
  addEmptyAnimation(trackIndex, mixDuration, delay) {
    if (delay <= 0)
      delay -= mixDuration;
    const entry = this.addAnimationWith(trackIndex, _AnimationState.emptyAnimation, false, delay);
    entry.mixDuration = mixDuration;
    entry.trackEnd = mixDuration;
    return entry;
  }
  /** Sets an empty animation for every track, discarding any queued animations, and mixes to it over the specified mix
   * duration. */
  setEmptyAnimations(mixDuration) {
    const oldDrainDisabled = this.queue.drainDisabled;
    this.queue.drainDisabled = true;
    for (let i = 0, n = this.tracks.length; i < n; i++) {
      const current = this.tracks[i];
      if (current != null)
        this.setEmptyAnimation(current.trackIndex, mixDuration);
    }
    this.queue.drainDisabled = oldDrainDisabled;
    this.queue.drain();
  }
  expandToIndex(index) {
    if (index < this.tracks.length)
      return this.tracks[index];
    Utils.ensureArrayCapacity(this.tracks, index + 1, null);
    this.tracks.length = index + 1;
    return null;
  }
  /** @param last May be null. */
  trackEntry(trackIndex, animation, loop, last) {
    const entry = this.trackEntryPool.obtain();
    entry.trackIndex = trackIndex;
    entry.animation = animation;
    entry.loop = loop;
    entry.holdPrevious = false;
    entry.eventThreshold = 0;
    entry.attachmentThreshold = 0;
    entry.drawOrderThreshold = 0;
    entry.animationStart = 0;
    entry.animationEnd = animation.duration;
    entry.animationLast = -1;
    entry.nextAnimationLast = -1;
    entry.delay = 0;
    entry.trackTime = 0;
    entry.trackLast = -1;
    entry.nextTrackLast = -1;
    entry.trackEnd = Number.MAX_VALUE;
    entry.timeScale = 1;
    entry.alpha = 1;
    entry.interruptAlpha = 1;
    entry.mixTime = 0;
    entry.mixDuration = last == null ? 0 : this.data.getMix(last.animation, animation);
    entry.mixBlend = MixBlend.replace;
    return entry;
  }
  disposeNext(entry) {
    let next = entry.next;
    while (next != null) {
      this.queue.dispose(next);
      next = next.next;
    }
    entry.next = null;
  }
  _animationsChanged() {
    this.animationsChanged = false;
    this.propertyIDs.clear();
    for (let i = 0, n = this.tracks.length; i < n; i++) {
      let entry = this.tracks[i];
      if (entry == null)
        continue;
      while (entry.mixingFrom != null)
        entry = entry.mixingFrom;
      do {
        if (entry.mixingFrom == null || entry.mixBlend != MixBlend.add)
          this.computeHold(entry);
        entry = entry.mixingTo;
      } while (entry != null);
    }
  }
  computeHold(entry) {
    const to = entry.mixingTo;
    const timelines = entry.animation.timelines;
    const timelinesCount = entry.animation.timelines.length;
    const timelineMode = Utils.setArraySize(entry.timelineMode, timelinesCount);
    entry.timelineHoldMix.length = 0;
    const timelineDipMix = Utils.setArraySize(entry.timelineHoldMix, timelinesCount);
    const propertyIDs = this.propertyIDs;
    if (to != null && to.holdPrevious) {
      for (let i = 0; i < timelinesCount; i++) {
        timelineMode[i] = propertyIDs.add(timelines[i].getPropertyId()) ? _AnimationState.HOLD_FIRST : _AnimationState.HOLD_SUBSEQUENT;
      }
      return;
    }
    outer:
      for (let i = 0; i < timelinesCount; i++) {
        const timeline = timelines[i];
        const id = timeline.getPropertyId();
        if (!propertyIDs.add(id))
          timelineMode[i] = _AnimationState.SUBSEQUENT;
        else if (to == null || timeline instanceof AttachmentTimeline || timeline instanceof DrawOrderTimeline || timeline instanceof EventTimeline || !to.animation.hasTimeline(id)) {
          timelineMode[i] = _AnimationState.FIRST;
        } else {
          for (let next = to.mixingTo; next != null; next = next.mixingTo) {
            if (next.animation.hasTimeline(id))
              continue;
            if (entry.mixDuration > 0) {
              timelineMode[i] = _AnimationState.HOLD_MIX;
              timelineDipMix[i] = next;
              continue outer;
            }
            break;
          }
          timelineMode[i] = _AnimationState.HOLD_FIRST;
        }
      }
  }
  /** Returns the track entry for the animation currently playing on the track, or null if no animation is currently playing. */
  getCurrent(trackIndex) {
    if (trackIndex >= this.tracks.length)
      return null;
    return this.tracks[trackIndex];
  }
  /** Adds a listener to receive events for all track entries. */
  addListener(listener) {
    if (listener == null)
      throw new Error("listener cannot be null.");
    this.listeners.push(listener);
  }
  /** Removes the listener added with {@link #addListener()}. */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index >= 0)
      this.listeners.splice(index, 1);
  }
  /** Removes all listeners added with {@link #addListener()}. */
  clearListeners() {
    this.listeners.length = 0;
  }
  /** Discards all listener notifications that have not yet been delivered. This can be useful to call from an
   * {@link AnimationStateListener} when it is known that further notifications that may have been already queued for delivery
   * are not wanted because new animations are being set. */
  clearListenerNotifications() {
    this.queue.clear();
  }
  setAnimationByName(trackIndex, animationName, loop) {
    if (!_AnimationState.deprecatedWarning1) {
      _AnimationState.deprecatedWarning1 = true;
      console.warn("Spine Deprecation Warning: AnimationState.setAnimationByName is deprecated, please use setAnimation from now on.");
    }
    this.setAnimation(trackIndex, animationName, loop);
  }
  addAnimationByName(trackIndex, animationName, loop, delay) {
    if (!_AnimationState.deprecatedWarning2) {
      _AnimationState.deprecatedWarning2 = true;
      console.warn("Spine Deprecation Warning: AnimationState.addAnimationByName is deprecated, please use addAnimation from now on.");
    }
    this.addAnimation(trackIndex, animationName, loop, delay);
  }
  hasAnimation(animationName) {
    const animation = this.data.skeletonData.findAnimation(animationName);
    return animation !== null;
  }
  hasAnimationByName(animationName) {
    if (!_AnimationState.deprecatedWarning3) {
      _AnimationState.deprecatedWarning3 = true;
      console.warn("Spine Deprecation Warning: AnimationState.hasAnimationByName is deprecated, please use hasAnimation from now on.");
    }
    return this.hasAnimation(animationName);
  }
};
var AnimationState = _AnimationState;
AnimationState.emptyAnimation = new Animation("<empty>", [], 0);
AnimationState.SUBSEQUENT = 0;
AnimationState.FIRST = 1;
AnimationState.HOLD_SUBSEQUENT = 2;
AnimationState.HOLD_FIRST = 3;
AnimationState.HOLD_MIX = 4;
AnimationState.SETUP = 1;
AnimationState.CURRENT = 2;
AnimationState.deprecatedWarning1 = false;
AnimationState.deprecatedWarning2 = false;
AnimationState.deprecatedWarning3 = false;
var _TrackEntry = class {
  constructor() {
    this.mixBlend = MixBlend.replace;
    this.timelineMode = new Array();
    this.timelineHoldMix = new Array();
    this.timelinesRotation = new Array();
  }
  reset() {
    this.next = null;
    this.mixingFrom = null;
    this.mixingTo = null;
    this.animation = null;
    this.listener = null;
    this.timelineMode.length = 0;
    this.timelineHoldMix.length = 0;
    this.timelinesRotation.length = 0;
  }
  /** Uses {@link #trackTime} to compute the `animationTime`, which is between {@link #animationStart}
   * and {@link #animationEnd}. When the `trackTime` is 0, the `animationTime` is equal to the
   * `animationStart` time. */
  getAnimationTime() {
    if (this.loop) {
      const duration = this.animationEnd - this.animationStart;
      if (duration == 0)
        return this.animationStart;
      return this.trackTime % duration + this.animationStart;
    }
    return Math.min(this.trackTime + this.animationStart, this.animationEnd);
  }
  setAnimationLast(animationLast) {
    this.animationLast = animationLast;
    this.nextAnimationLast = animationLast;
  }
  /** Returns true if at least one loop has been completed.
   *
   * See {@link AnimationStateListener#complete()}. */
  isComplete() {
    return this.trackTime >= this.animationEnd - this.animationStart;
  }
  /** Resets the rotation directions for mixing this entry's rotate timelines. This can be useful to avoid bones rotating the
   * long way around when using {@link #alpha} and starting animations on other tracks.
   *
   * Mixing with {@link MixBlend#replace} involves finding a rotation between two others, which has two possible solutions:
   * the short way or the long way around. The two rotations likely change over time, so which direction is the short or long
   * way also changes. If the short way was always chosen, bones would flip to the other side when that direction became the
   * long way. TrackEntry chooses the short way the first time it is applied and remembers that direction. */
  resetRotationDirections() {
    this.timelinesRotation.length = 0;
  }
  get time() {
    if (!_TrackEntry.deprecatedWarning1) {
      _TrackEntry.deprecatedWarning1 = true;
      console.warn("Spine Deprecation Warning: TrackEntry.time is deprecated, please use trackTime from now on.");
    }
    return this.trackTime;
  }
  set time(value) {
    if (!_TrackEntry.deprecatedWarning1) {
      _TrackEntry.deprecatedWarning1 = true;
      console.warn("Spine Deprecation Warning: TrackEntry.time is deprecated, please use trackTime from now on.");
    }
    this.trackTime = value;
  }
  get endTime() {
    if (!_TrackEntry.deprecatedWarning2) {
      _TrackEntry.deprecatedWarning2 = true;
      console.warn("Spine Deprecation Warning: TrackEntry.endTime is deprecated, please use trackEnd from now on.");
    }
    return this.trackTime;
  }
  set endTime(value) {
    if (!_TrackEntry.deprecatedWarning2) {
      _TrackEntry.deprecatedWarning2 = true;
      console.warn("Spine Deprecation Warning: TrackEntry.endTime is deprecated, please use trackEnd from now on.");
    }
    this.trackTime = value;
  }
  loopsCount() {
    return Math.floor(this.trackTime / this.trackEnd);
  }
};
var TrackEntry = _TrackEntry;
TrackEntry.deprecatedWarning1 = false;
TrackEntry.deprecatedWarning2 = false;
var _EventQueue = class {
  constructor(animState) {
    this.objects = [];
    this.drainDisabled = false;
    this.animState = animState;
  }
  start(entry) {
    this.objects.push(EventType.start);
    this.objects.push(entry);
    this.animState.animationsChanged = true;
  }
  interrupt(entry) {
    this.objects.push(EventType.interrupt);
    this.objects.push(entry);
  }
  end(entry) {
    this.objects.push(EventType.end);
    this.objects.push(entry);
    this.animState.animationsChanged = true;
  }
  dispose(entry) {
    this.objects.push(EventType.dispose);
    this.objects.push(entry);
  }
  complete(entry) {
    this.objects.push(EventType.complete);
    this.objects.push(entry);
  }
  event(entry, event) {
    this.objects.push(EventType.event);
    this.objects.push(entry);
    this.objects.push(event);
  }
  deprecateStuff() {
    if (!_EventQueue.deprecatedWarning1) {
      _EventQueue.deprecatedWarning1 = true;
      console.warn(
        "Spine Deprecation Warning: onComplete, onStart, onEnd, onEvent art deprecated, please use listeners from now on. 'state.addListener({ complete: function(track, event) { } })'"
      );
    }
    return true;
  }
  drain() {
    if (this.drainDisabled)
      return;
    this.drainDisabled = true;
    const objects = this.objects;
    const listeners = this.animState.listeners;
    for (let i = 0; i < objects.length; i += 2) {
      const type = objects[i];
      const entry = objects[i + 1];
      switch (type) {
        case EventType.start:
          if (entry.listener != null && entry.listener.start)
            entry.listener.start(entry);
          for (let ii = 0; ii < listeners.length; ii++)
            if (listeners[ii].start)
              listeners[ii].start(entry);
          entry.onStart && this.deprecateStuff() && entry.onStart(entry.trackIndex);
          this.animState.onStart && this.deprecateStuff() && this.deprecateStuff && this.animState.onStart(entry.trackIndex);
          break;
        case EventType.interrupt:
          if (entry.listener != null && entry.listener.interrupt)
            entry.listener.interrupt(entry);
          for (let ii = 0; ii < listeners.length; ii++)
            if (listeners[ii].interrupt)
              listeners[ii].interrupt(entry);
          break;
        case EventType.end:
          if (entry.listener != null && entry.listener.end)
            entry.listener.end(entry);
          for (let ii = 0; ii < listeners.length; ii++)
            if (listeners[ii].end)
              listeners[ii].end(entry);
          entry.onEnd && this.deprecateStuff() && entry.onEnd(entry.trackIndex);
          this.animState.onEnd && this.deprecateStuff() && this.animState.onEnd(entry.trackIndex);
        case EventType.dispose:
          if (entry.listener != null && entry.listener.dispose)
            entry.listener.dispose(entry);
          for (let ii = 0; ii < listeners.length; ii++)
            if (listeners[ii].dispose)
              listeners[ii].dispose(entry);
          this.animState.trackEntryPool.free(entry);
          break;
        case EventType.complete:
          if (entry.listener != null && entry.listener.complete)
            entry.listener.complete(entry);
          for (let ii = 0; ii < listeners.length; ii++)
            if (listeners[ii].complete)
              listeners[ii].complete(entry);
          const count = MathUtils.toInt(entry.loopsCount());
          entry.onComplete && this.deprecateStuff() && entry.onComplete(entry.trackIndex, count);
          this.animState.onComplete && this.deprecateStuff() && this.animState.onComplete(entry.trackIndex, count);
          break;
        case EventType.event:
          const event = objects[i++ + 2];
          if (entry.listener != null && entry.listener.event)
            entry.listener.event(entry, event);
          for (let ii = 0; ii < listeners.length; ii++)
            if (listeners[ii].event)
              listeners[ii].event(entry, event);
          entry.onEvent && this.deprecateStuff() && entry.onEvent(entry.trackIndex, event);
          this.animState.onEvent && this.deprecateStuff() && this.animState.onEvent(entry.trackIndex, event);
          break;
      }
    }
    this.clear();
    this.drainDisabled = false;
  }
  clear() {
    this.objects.length = 0;
  }
};
var EventQueue = _EventQueue;
EventQueue.deprecatedWarning1 = false;
var EventType = ((EventType2) => {
  EventType2[EventType2["start"] = 0] = "start";
  EventType2[EventType2["interrupt"] = 1] = "interrupt";
  EventType2[EventType2["end"] = 2] = "end";
  EventType2[EventType2["dispose"] = 3] = "dispose";
  EventType2[EventType2["complete"] = 4] = "complete";
  EventType2[EventType2["event"] = 5] = "event";
  return EventType2;
})(EventType || {});
var AnimationStateAdapter = class {
  start(entry) {
  }
  interrupt(entry) {
  }
  end(entry) {
  }
  dispose(entry) {
  }
  complete(entry) {
  }
  event(entry, event) {
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/AnimationStateData.mjs
var _AnimationStateData = class {
  constructor(skeletonData) {
    this.animationToMixTime = {};
    this.defaultMix = 0;
    if (skeletonData == null)
      throw new Error("skeletonData cannot be null.");
    this.skeletonData = skeletonData;
  }
  setMix(fromName, toName, duration) {
    const from = this.skeletonData.findAnimation(fromName);
    if (from == null)
      throw new Error(`Animation not found: ${fromName}`);
    const to = this.skeletonData.findAnimation(toName);
    if (to == null)
      throw new Error(`Animation not found: ${toName}`);
    this.setMixWith(from, to, duration);
  }
  setMixByName(fromName, toName, duration) {
    if (!_AnimationStateData.deprecatedWarning1) {
      _AnimationStateData.deprecatedWarning1 = true;
      console.warn("Deprecation Warning: AnimationStateData.setMixByName is deprecated, please use setMix from now on.");
    }
    this.setMix(fromName, toName, duration);
  }
  setMixWith(from, to, duration) {
    if (from == null)
      throw new Error("from cannot be null.");
    if (to == null)
      throw new Error("to cannot be null.");
    const key = `${from.name}.${to.name}`;
    this.animationToMixTime[key] = duration;
  }
  getMix(from, to) {
    const key = `${from.name}.${to.name}`;
    const value = this.animationToMixTime[key];
    return value === void 0 ? this.defaultMix : value;
  }
};
var AnimationStateData = _AnimationStateData;
AnimationStateData.deprecatedWarning1 = false;

// node_modules/@pixi-spine/runtime-3.8/lib/core/AtlasAttachmentLoader.mjs
var AtlasAttachmentLoader = class {
  constructor(atlas) {
    this.atlas = atlas;
  }
  /** @return May be null to not load an attachment. */
  newRegionAttachment(skin, name, path) {
    const region = this.atlas.findRegion(path);
    if (region == null)
      throw new Error(`Region not found in atlas: ${path} (region attachment: ${name})`);
    const attachment = new RegionAttachment(name);
    attachment.region = region;
    return attachment;
  }
  /** @return May be null to not load an attachment. */
  newMeshAttachment(skin, name, path) {
    const region = this.atlas.findRegion(path);
    if (region == null)
      throw new Error(`Region not found in atlas: ${path} (mesh attachment: ${name})`);
    const attachment = new MeshAttachment(name);
    attachment.region = region;
    return attachment;
  }
  /** @return May be null to not load an attachment. */
  newBoundingBoxAttachment(skin, name) {
    return new BoundingBoxAttachment(name);
  }
  /** @return May be null to not load an attachment */
  newPathAttachment(skin, name) {
    return new PathAttachment(name);
  }
  newPointAttachment(skin, name) {
    return new PointAttachment(name);
  }
  newClippingAttachment(skin, name) {
    return new ClippingAttachment(name);
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/Bone.mjs
var Bone = class {
  /** @param parent May be null. */
  constructor(data, skeleton, parent) {
    this.matrix = new Matrix();
    this.children = new Array();
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.scaleX = 0;
    this.scaleY = 0;
    this.shearX = 0;
    this.shearY = 0;
    this.ax = 0;
    this.ay = 0;
    this.arotation = 0;
    this.ascaleX = 0;
    this.ascaleY = 0;
    this.ashearX = 0;
    this.ashearY = 0;
    this.appliedValid = false;
    this.sorted = false;
    this.active = false;
    if (data == null)
      throw new Error("data cannot be null.");
    if (skeleton == null)
      throw new Error("skeleton cannot be null.");
    this.data = data;
    this.skeleton = skeleton;
    this.parent = parent;
    this.setToSetupPose();
  }
  get worldX() {
    return this.matrix.tx;
  }
  get worldY() {
    return this.matrix.ty;
  }
  isActive() {
    return this.active;
  }
  /** Same as {@link #updateWorldTransform()}. This method exists for Bone to implement {@link Updatable}. */
  update() {
    this.updateWorldTransformWith(this.x, this.y, this.rotation, this.scaleX, this.scaleY, this.shearX, this.shearY);
  }
  /** Computes the world transform using the parent bone and this bone's local transform. */
  updateWorldTransform() {
    this.updateWorldTransformWith(this.x, this.y, this.rotation, this.scaleX, this.scaleY, this.shearX, this.shearY);
  }
  /** Computes the world transform using the parent bone and the specified local transform. */
  updateWorldTransformWith(x, y, rotation, scaleX, scaleY, shearX, shearY) {
    this.ax = x;
    this.ay = y;
    this.arotation = rotation;
    this.ascaleX = scaleX;
    this.ascaleY = scaleY;
    this.ashearX = shearX;
    this.ashearY = shearY;
    this.appliedValid = true;
    const parent = this.parent;
    const m = this.matrix;
    const sx = this.skeleton.scaleX;
    const sy = settings2.yDown ? -this.skeleton.scaleY : this.skeleton.scaleY;
    if (parent == null) {
      const skeleton = this.skeleton;
      const rotationY = rotation + 90 + shearY;
      m.a = MathUtils.cosDeg(rotation + shearX) * scaleX * sx;
      m.c = MathUtils.cosDeg(rotationY) * scaleY * sx;
      m.b = MathUtils.sinDeg(rotation + shearX) * scaleX * sy;
      m.d = MathUtils.sinDeg(rotationY) * scaleY * sy;
      m.tx = x * sx + skeleton.x;
      m.ty = y * sy + skeleton.y;
      return;
    }
    let pa = parent.matrix.a;
    let pb = parent.matrix.c;
    let pc = parent.matrix.b;
    let pd = parent.matrix.d;
    m.tx = pa * x + pb * y + parent.matrix.tx;
    m.ty = pc * x + pd * y + parent.matrix.ty;
    switch (this.data.transformMode) {
      case TransformMode.Normal: {
        const rotationY = rotation + 90 + shearY;
        const la = MathUtils.cosDeg(rotation + shearX) * scaleX;
        const lb = MathUtils.cosDeg(rotationY) * scaleY;
        const lc = MathUtils.sinDeg(rotation + shearX) * scaleX;
        const ld = MathUtils.sinDeg(rotationY) * scaleY;
        m.a = pa * la + pb * lc;
        m.c = pa * lb + pb * ld;
        m.b = pc * la + pd * lc;
        m.d = pc * lb + pd * ld;
        return;
      }
      case TransformMode.OnlyTranslation: {
        const rotationY = rotation + 90 + shearY;
        m.a = MathUtils.cosDeg(rotation + shearX) * scaleX;
        m.c = MathUtils.cosDeg(rotationY) * scaleY;
        m.b = MathUtils.sinDeg(rotation + shearX) * scaleX;
        m.d = MathUtils.sinDeg(rotationY) * scaleY;
        break;
      }
      case TransformMode.NoRotationOrReflection: {
        let s = pa * pa + pc * pc;
        let prx = 0;
        if (s > 1e-4) {
          s = Math.abs(pa * pd - pb * pc) / s;
          pa /= this.skeleton.scaleX;
          pc /= this.skeleton.scaleY;
          pb = pc * s;
          pd = pa * s;
          prx = Math.atan2(pc, pa) * MathUtils.radDeg;
        } else {
          pa = 0;
          pc = 0;
          prx = 90 - Math.atan2(pd, pb) * MathUtils.radDeg;
        }
        const rx = rotation + shearX - prx;
        const ry = rotation + shearY - prx + 90;
        const la = MathUtils.cosDeg(rx) * scaleX;
        const lb = MathUtils.cosDeg(ry) * scaleY;
        const lc = MathUtils.sinDeg(rx) * scaleX;
        const ld = MathUtils.sinDeg(ry) * scaleY;
        m.a = pa * la - pb * lc;
        m.c = pa * lb - pb * ld;
        m.b = pc * la + pd * lc;
        m.d = pc * lb + pd * ld;
        break;
      }
      case TransformMode.NoScale:
      case TransformMode.NoScaleOrReflection: {
        const cos = MathUtils.cosDeg(rotation);
        const sin = MathUtils.sinDeg(rotation);
        let za = (pa * cos + pb * sin) / sx;
        let zc = (pc * cos + pd * sin) / sy;
        let s = Math.sqrt(za * za + zc * zc);
        if (s > 1e-5)
          s = 1 / s;
        za *= s;
        zc *= s;
        s = Math.sqrt(za * za + zc * zc);
        if (this.data.transformMode == TransformMode.NoScale && pa * pd - pb * pc < 0 != (settings2.yDown ? this.skeleton.scaleX < 0 != this.skeleton.scaleY > 0 : this.skeleton.scaleX < 0 != this.skeleton.scaleY < 0))
          s = -s;
        const r = Math.PI / 2 + Math.atan2(zc, za);
        const zb = Math.cos(r) * s;
        const zd = Math.sin(r) * s;
        const la = MathUtils.cosDeg(shearX) * scaleX;
        const lb = MathUtils.cosDeg(90 + shearY) * scaleY;
        const lc = MathUtils.sinDeg(shearX) * scaleX;
        const ld = MathUtils.sinDeg(90 + shearY) * scaleY;
        m.a = za * la + zb * lc;
        m.c = za * lb + zb * ld;
        m.b = zc * la + zd * lc;
        m.d = zc * lb + zd * ld;
        break;
      }
    }
    m.a *= sx;
    m.c *= sx;
    m.b *= sy;
    m.d *= sy;
  }
  setToSetupPose() {
    const data = this.data;
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.rotation;
    this.scaleX = data.scaleX;
    this.scaleY = data.scaleY;
    this.shearX = data.shearX;
    this.shearY = data.shearY;
  }
  getWorldRotationX() {
    return Math.atan2(this.matrix.b, this.matrix.a) * MathUtils.radDeg;
  }
  getWorldRotationY() {
    return Math.atan2(this.matrix.d, this.matrix.c) * MathUtils.radDeg;
  }
  getWorldScaleX() {
    const m = this.matrix;
    return Math.sqrt(m.a * m.a + m.c * m.c);
  }
  getWorldScaleY() {
    const m = this.matrix;
    return Math.sqrt(m.b * m.b + m.d * m.d);
  }
  /** Computes the individual applied transform values from the world transform. This can be useful to perform processing using
   * the applied transform after the world transform has been modified directly (eg, by a constraint).
   * <p>
   * Some information is ambiguous in the world transform, such as -1,-1 scale versus 180 rotation. */
  updateAppliedTransform() {
    this.appliedValid = true;
    const parent = this.parent;
    const m = this.matrix;
    if (parent == null) {
      this.ax = m.tx;
      this.ay = m.ty;
      this.arotation = Math.atan2(m.b, m.a) * MathUtils.radDeg;
      this.ascaleX = Math.sqrt(m.a * m.a + m.b * m.b);
      this.ascaleY = Math.sqrt(m.c * m.c + m.d * m.d);
      this.ashearX = 0;
      this.ashearY = Math.atan2(m.a * m.c + m.b * m.d, m.a * m.d - m.b * m.c) * MathUtils.radDeg;
      return;
    }
    const pm = parent.matrix;
    const pid = 1 / (pm.a * pm.d - pm.b * pm.c);
    const dx = m.tx - pm.tx;
    const dy = m.ty - pm.ty;
    this.ax = dx * pm.d * pid - dy * pm.c * pid;
    this.ay = dy * pm.a * pid - dx * pm.b * pid;
    const ia = pid * pm.d;
    const id = pid * pm.a;
    const ib = pid * pm.c;
    const ic = pid * pm.b;
    const ra = ia * m.a - ib * m.b;
    const rb = ia * m.c - ib * m.d;
    const rc = id * m.b - ic * m.a;
    const rd = id * m.d - ic * m.c;
    this.ashearX = 0;
    this.ascaleX = Math.sqrt(ra * ra + rc * rc);
    if (this.ascaleX > 1e-4) {
      const det = ra * rd - rb * rc;
      this.ascaleY = det / this.ascaleX;
      this.ashearY = Math.atan2(ra * rb + rc * rd, det) * MathUtils.radDeg;
      this.arotation = Math.atan2(rc, ra) * MathUtils.radDeg;
    } else {
      this.ascaleX = 0;
      this.ascaleY = Math.sqrt(rb * rb + rd * rd);
      this.ashearY = 0;
      this.arotation = 90 - Math.atan2(rd, rb) * MathUtils.radDeg;
    }
  }
  worldToLocal(world) {
    const m = this.matrix;
    const a = m.a;
    const b = m.c;
    const c = m.b;
    const d = m.d;
    const invDet = 1 / (a * d - b * c);
    const x = world.x - m.tx;
    const y = world.y - m.ty;
    world.x = x * d * invDet - y * b * invDet;
    world.y = y * a * invDet - x * c * invDet;
    return world;
  }
  localToWorld(local) {
    const m = this.matrix;
    const x = local.x;
    const y = local.y;
    local.x = x * m.a + y * m.c + m.tx;
    local.y = x * m.b + y * m.d + m.ty;
    return local;
  }
  worldToLocalRotation(worldRotation) {
    const sin = MathUtils.sinDeg(worldRotation);
    const cos = MathUtils.cosDeg(worldRotation);
    const mat = this.matrix;
    return Math.atan2(mat.a * sin - mat.b * cos, mat.d * cos - mat.c * sin) * MathUtils.radDeg;
  }
  localToWorldRotation(localRotation) {
    const sin = MathUtils.sinDeg(localRotation);
    const cos = MathUtils.cosDeg(localRotation);
    const mat = this.matrix;
    return Math.atan2(cos * mat.b + sin * mat.d, cos * mat.a + sin * mat.c) * MathUtils.radDeg;
  }
  rotateWorld(degrees) {
    const mat = this.matrix;
    const a = mat.a;
    const b = mat.c;
    const c = mat.b;
    const d = mat.d;
    const cos = MathUtils.cosDeg(degrees);
    const sin = MathUtils.sinDeg(degrees);
    mat.a = cos * a - sin * c;
    mat.c = cos * b - sin * d;
    mat.b = sin * a + cos * c;
    mat.d = sin * b + cos * d;
    this.appliedValid = false;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/BoneData.mjs
var BoneData = class {
  constructor(index, name, parent) {
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.shearX = 0;
    this.shearY = 0;
    this.transformMode = TransformMode.Normal;
    this.skinRequired = false;
    this.color = new Color();
    if (index < 0)
      throw new Error("index must be >= 0.");
    if (name == null)
      throw new Error("name cannot be null.");
    this.index = index;
    this.name = name;
    this.parent = parent;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/Constraint.mjs
var ConstraintData = class {
  constructor(name, order, skinRequired) {
    this.name = name;
    this.order = order;
    this.skinRequired = skinRequired;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/Event.mjs
var Event = class {
  constructor(time, data) {
    if (data == null)
      throw new Error("data cannot be null.");
    this.time = time;
    this.data = data;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/EventData.mjs
var EventData = class {
  constructor(name) {
    this.name = name;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/IkConstraint.mjs
var IkConstraint = class {
  constructor(data, skeleton) {
    this.bendDirection = 0;
    this.compress = false;
    this.stretch = false;
    this.mix = 1;
    this.softness = 0;
    this.active = false;
    if (data == null)
      throw new Error("data cannot be null.");
    if (skeleton == null)
      throw new Error("skeleton cannot be null.");
    this.data = data;
    this.mix = data.mix;
    this.softness = data.softness;
    this.bendDirection = data.bendDirection;
    this.compress = data.compress;
    this.stretch = data.stretch;
    this.bones = new Array();
    for (let i = 0; i < data.bones.length; i++)
      this.bones.push(skeleton.findBone(data.bones[i].name));
    this.target = skeleton.findBone(data.target.name);
  }
  isActive() {
    return this.active;
  }
  apply() {
    this.update();
  }
  update() {
    const target = this.target;
    const bones = this.bones;
    switch (bones.length) {
      case 1:
        this.apply1(bones[0], target.worldX, target.worldY, this.compress, this.stretch, this.data.uniform, this.mix);
        break;
      case 2:
        this.apply2(bones[0], bones[1], target.worldX, target.worldY, this.bendDirection, this.stretch, this.softness, this.mix);
        break;
    }
  }
  /** Adjusts the bone rotation so the tip is as close to the target position as possible. The target is specified in the world
   * coordinate system. */
  apply1(bone, targetX, targetY, compress, stretch, uniform, alpha) {
    if (!bone.appliedValid)
      bone.updateAppliedTransform();
    const p = bone.parent.matrix;
    const pa = p.a;
    let pb = p.c;
    const pc = p.b;
    let pd = p.d;
    let rotationIK = -bone.ashearX - bone.arotation;
    let tx = 0;
    let ty = 0;
    switch (bone.data.transformMode) {
      case TransformMode.OnlyTranslation:
        tx = targetX - bone.worldX;
        ty = targetY - bone.worldY;
        break;
      case TransformMode.NoRotationOrReflection:
        const s = Math.abs(pa * pd - pb * pc) / (pa * pa + pc * pc);
        const sa = pa / bone.skeleton.scaleX;
        const sc = pc / bone.skeleton.scaleY;
        pb = -sc * s * bone.skeleton.scaleX;
        pd = sa * s * bone.skeleton.scaleY;
        rotationIK += Math.atan2(sc, sa) * MathUtils.radDeg;
      default:
        const x = targetX - p.tx;
        const y = targetY - p.ty;
        const d = pa * pd - pb * pc;
        tx = (x * pd - y * pb) / d - bone.ax;
        ty = (y * pa - x * pc) / d - bone.ay;
    }
    rotationIK += Math.atan2(ty, tx) * MathUtils.radDeg;
    if (bone.ascaleX < 0)
      rotationIK += 180;
    if (rotationIK > 180)
      rotationIK -= 360;
    else if (rotationIK < -180)
      rotationIK += 360;
    let sx = bone.ascaleX;
    let sy = bone.ascaleY;
    if (compress || stretch) {
      switch (bone.data.transformMode) {
        case TransformMode.NoScale:
        case TransformMode.NoScaleOrReflection:
          tx = targetX - bone.worldX;
          ty = targetY - bone.worldY;
      }
      const b = bone.data.length * sx;
      const dd = Math.sqrt(tx * tx + ty * ty);
      if (compress && dd < b || stretch && dd > b && b > 1e-4) {
        const s = (dd / b - 1) * alpha + 1;
        sx *= s;
        if (uniform)
          sy *= s;
      }
    }
    bone.updateWorldTransformWith(bone.ax, bone.ay, bone.arotation + rotationIK * alpha, sx, sy, bone.ashearX, bone.ashearY);
  }
  /** Adjusts the parent and child bone rotations so the tip of the child is as close to the target position as possible. The
   * target is specified in the world coordinate system.
   * @param child A direct descendant of the parent bone. */
  apply2(parent, child, targetX, targetY, bendDir, stretch, softness, alpha) {
    if (alpha == 0) {
      child.updateWorldTransform();
      return;
    }
    if (!parent.appliedValid)
      parent.updateAppliedTransform();
    if (!child.appliedValid)
      child.updateAppliedTransform();
    const px = parent.ax;
    const py = parent.ay;
    let psx = parent.ascaleX;
    let sx = psx;
    let psy = parent.ascaleY;
    let csx = child.ascaleX;
    const pmat = parent.matrix;
    let os1 = 0;
    let os2 = 0;
    let s2 = 0;
    if (psx < 0) {
      psx = -psx;
      os1 = 180;
      s2 = -1;
    } else {
      os1 = 0;
      s2 = 1;
    }
    if (psy < 0) {
      psy = -psy;
      s2 = -s2;
    }
    if (csx < 0) {
      csx = -csx;
      os2 = 180;
    } else
      os2 = 0;
    const cx = child.ax;
    let cy = 0;
    let cwx = 0;
    let cwy = 0;
    let a = pmat.a;
    let b = pmat.c;
    let c = pmat.b;
    let d = pmat.d;
    const u = Math.abs(psx - psy) <= 1e-4;
    if (!u) {
      cy = 0;
      cwx = a * cx + pmat.tx;
      cwy = c * cx + pmat.ty;
    } else {
      cy = child.ay;
      cwx = a * cx + b * cy + pmat.tx;
      cwy = c * cx + d * cy + pmat.ty;
    }
    const pp = parent.parent.matrix;
    a = pp.a;
    b = pp.c;
    c = pp.b;
    d = pp.d;
    const id = 1 / (a * d - b * c);
    let x = cwx - pp.tx;
    let y = cwy - pp.ty;
    const dx = (x * d - y * b) * id - px;
    const dy = (y * a - x * c) * id - py;
    const l1 = Math.sqrt(dx * dx + dy * dy);
    let l2 = child.data.length * csx;
    let a1;
    let a2;
    if (l1 < 1e-4) {
      this.apply1(parent, targetX, targetY, false, stretch, false, alpha);
      child.updateWorldTransformWith(cx, cy, 0, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
      return;
    }
    x = targetX - pp.tx;
    y = targetY - pp.ty;
    let tx = (x * d - y * b) * id - px;
    let ty = (y * a - x * c) * id - py;
    let dd = tx * tx + ty * ty;
    if (softness != 0) {
      softness *= psx * (csx + 1) / 2;
      const td = Math.sqrt(dd);
      const sd = td - l1 - l2 * psx + softness;
      if (sd > 0) {
        let p = Math.min(1, sd / (softness * 2)) - 1;
        p = (sd - softness * (1 - p * p)) / td;
        tx -= p * tx;
        ty -= p * ty;
        dd = tx * tx + ty * ty;
      }
    }
    outer:
      if (u) {
        l2 *= psx;
        let cos = (dd - l1 * l1 - l2 * l2) / (2 * l1 * l2);
        if (cos < -1)
          cos = -1;
        else if (cos > 1) {
          cos = 1;
          if (stretch)
            sx *= (Math.sqrt(dd) / (l1 + l2) - 1) * alpha + 1;
        }
        a2 = Math.acos(cos) * bendDir;
        a = l1 + l2 * cos;
        b = l2 * Math.sin(a2);
        a1 = Math.atan2(ty * a - tx * b, tx * a + ty * b);
      } else {
        a = psx * l2;
        b = psy * l2;
        const aa = a * a;
        const bb = b * b;
        const ta = Math.atan2(ty, tx);
        c = bb * l1 * l1 + aa * dd - aa * bb;
        const c1 = -2 * bb * l1;
        const c2 = bb - aa;
        d = c1 * c1 - 4 * c2 * c;
        if (d >= 0) {
          let q = Math.sqrt(d);
          if (c1 < 0)
            q = -q;
          q = -(c1 + q) / 2;
          const r0 = q / c2;
          const r1 = c / q;
          const r = Math.abs(r0) < Math.abs(r1) ? r0 : r1;
          if (r * r <= dd) {
            y = Math.sqrt(dd - r * r) * bendDir;
            a1 = ta - Math.atan2(y, r);
            a2 = Math.atan2(y / psy, (r - l1) / psx);
            break outer;
          }
        }
        let minAngle = MathUtils.PI;
        let minX = l1 - a;
        let minDist = minX * minX;
        let minY = 0;
        let maxAngle = 0;
        let maxX = l1 + a;
        let maxDist = maxX * maxX;
        let maxY = 0;
        c = -a * l1 / (aa - bb);
        if (c >= -1 && c <= 1) {
          c = Math.acos(c);
          x = a * Math.cos(c) + l1;
          y = b * Math.sin(c);
          d = x * x + y * y;
          if (d < minDist) {
            minAngle = c;
            minDist = d;
            minX = x;
            minY = y;
          }
          if (d > maxDist) {
            maxAngle = c;
            maxDist = d;
            maxX = x;
            maxY = y;
          }
        }
        if (dd <= (minDist + maxDist) / 2) {
          a1 = ta - Math.atan2(minY * bendDir, minX);
          a2 = minAngle * bendDir;
        } else {
          a1 = ta - Math.atan2(maxY * bendDir, maxX);
          a2 = maxAngle * bendDir;
        }
      }
    const os = Math.atan2(cy, cx) * s2;
    let rotation = parent.arotation;
    a1 = (a1 - os) * MathUtils.radDeg + os1 - rotation;
    if (a1 > 180)
      a1 -= 360;
    else if (a1 < -180)
      a1 += 360;
    parent.updateWorldTransformWith(px, py, rotation + a1 * alpha, sx, parent.ascaleY, 0, 0);
    rotation = child.arotation;
    a2 = ((a2 + os) * MathUtils.radDeg - child.ashearX) * s2 + os2 - rotation;
    if (a2 > 180)
      a2 -= 360;
    else if (a2 < -180)
      a2 += 360;
    child.updateWorldTransformWith(cx, cy, rotation + a2 * alpha, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/IkConstraintData.mjs
var IkConstraintData = class extends ConstraintData {
  constructor(name) {
    super(name, 0, false);
    this.bones = new Array();
    this.bendDirection = 1;
    this.compress = false;
    this.stretch = false;
    this.uniform = false;
    this.mix = 1;
    this.softness = 0;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/PathConstraintData.mjs
var PathConstraintData = class extends ConstraintData {
  constructor(name) {
    super(name, 0, false);
    this.bones = new Array();
  }
};
var SpacingMode = ((SpacingMode2) => {
  SpacingMode2[SpacingMode2["Length"] = 0] = "Length";
  SpacingMode2[SpacingMode2["Fixed"] = 1] = "Fixed";
  SpacingMode2[SpacingMode2["Percent"] = 2] = "Percent";
  return SpacingMode2;
})(SpacingMode || {});

// node_modules/@pixi-spine/runtime-3.8/lib/core/PathConstraint.mjs
var _PathConstraint = class {
  constructor(data, skeleton) {
    this.position = 0;
    this.spacing = 0;
    this.rotateMix = 0;
    this.translateMix = 0;
    this.spaces = new Array();
    this.positions = new Array();
    this.world = new Array();
    this.curves = new Array();
    this.lengths = new Array();
    this.segments = new Array();
    this.active = false;
    if (data == null)
      throw new Error("data cannot be null.");
    if (skeleton == null)
      throw new Error("skeleton cannot be null.");
    this.data = data;
    this.bones = new Array();
    for (let i = 0, n = data.bones.length; i < n; i++)
      this.bones.push(skeleton.findBone(data.bones[i].name));
    this.target = skeleton.findSlot(data.target.name);
    this.position = data.position;
    this.spacing = data.spacing;
    this.rotateMix = data.rotateMix;
    this.translateMix = data.translateMix;
  }
  isActive() {
    return this.active;
  }
  apply() {
    this.update();
  }
  update() {
    const attachment = this.target.getAttachment();
    if (!(attachment instanceof PathAttachment))
      return;
    const rotateMix = this.rotateMix;
    const translateMix = this.translateMix;
    const translate = translateMix > 0;
    const rotate = rotateMix > 0;
    if (!translate && !rotate)
      return;
    const data = this.data;
    const spacingMode = data.spacingMode;
    const lengthSpacing = spacingMode == SpacingMode.Length;
    const rotateMode = data.rotateMode;
    const tangents = rotateMode == RotateMode.Tangent;
    const scale = rotateMode == RotateMode.ChainScale;
    const boneCount = this.bones.length;
    const spacesCount = tangents ? boneCount : boneCount + 1;
    const bones = this.bones;
    const spaces = Utils.setArraySize(this.spaces, spacesCount);
    let lengths = null;
    const spacing = this.spacing;
    if (scale || lengthSpacing) {
      if (scale)
        lengths = Utils.setArraySize(this.lengths, boneCount);
      for (let i = 0, n = spacesCount - 1; i < n; ) {
        const bone = bones[i];
        const setupLength = bone.data.length;
        if (setupLength < _PathConstraint.epsilon) {
          if (scale)
            lengths[i] = 0;
          spaces[++i] = 0;
        } else {
          const x = setupLength * bone.matrix.a;
          const y = setupLength * bone.matrix.b;
          const length = Math.sqrt(x * x + y * y);
          if (scale)
            lengths[i] = length;
          spaces[++i] = (lengthSpacing ? setupLength + spacing : spacing) * length / setupLength;
        }
      }
    } else {
      for (let i = 1; i < spacesCount; i++)
        spaces[i] = spacing;
    }
    const positions = this.computeWorldPositions(
      attachment,
      spacesCount,
      tangents,
      data.positionMode == PositionMode.Percent,
      spacingMode == SpacingMode.Percent
    );
    let boneX = positions[0];
    let boneY = positions[1];
    let offsetRotation = data.offsetRotation;
    let tip = false;
    if (offsetRotation == 0)
      tip = rotateMode == RotateMode.Chain;
    else {
      tip = false;
      const p = this.target.bone.matrix;
      offsetRotation *= p.a * p.d - p.b * p.c > 0 ? MathUtils.degRad : -MathUtils.degRad;
    }
    for (let i = 0, p = 3; i < boneCount; i++, p += 3) {
      const bone = bones[i];
      const mat = bone.matrix;
      mat.tx += (boneX - mat.tx) * translateMix;
      mat.ty += (boneY - mat.ty) * translateMix;
      const x = positions[p];
      const y = positions[p + 1];
      const dx = x - boneX;
      const dy = y - boneY;
      if (scale) {
        const length = lengths[i];
        if (length != 0) {
          const s = (Math.sqrt(dx * dx + dy * dy) / length - 1) * rotateMix + 1;
          mat.a *= s;
          mat.b *= s;
        }
      }
      boneX = x;
      boneY = y;
      if (rotate) {
        const a = mat.a;
        const b = mat.c;
        const c = mat.b;
        const d = mat.d;
        let r = 0;
        let cos = 0;
        let sin = 0;
        if (tangents)
          if (tangents)
            r = positions[p - 1];
          else if (spaces[i + 1] == 0)
            r = positions[p + 2];
          else
            r = Math.atan2(dy, dx);
        r -= Math.atan2(c, a);
        if (tip) {
          cos = Math.cos(r);
          sin = Math.sin(r);
          const length = bone.data.length;
          boneX += (length * (cos * a - sin * c) - dx) * rotateMix;
          boneY += (length * (sin * a + cos * c) - dy) * rotateMix;
        } else {
          r += offsetRotation;
        }
        if (r > MathUtils.PI)
          r -= MathUtils.PI2;
        else if (r < -MathUtils.PI)
          r += MathUtils.PI2;
        r *= rotateMix;
        cos = Math.cos(r);
        sin = Math.sin(r);
        mat.a = cos * a - sin * c;
        mat.c = cos * b - sin * d;
        mat.b = sin * a + cos * c;
        mat.d = sin * b + cos * d;
      }
      bone.appliedValid = false;
    }
  }
  computeWorldPositions(path, spacesCount, tangents, percentPosition, percentSpacing) {
    const target = this.target;
    let position = this.position;
    const spaces = this.spaces;
    const out = Utils.setArraySize(this.positions, spacesCount * 3 + 2);
    let world = null;
    const closed2 = path.closed;
    let verticesLength = path.worldVerticesLength;
    let curveCount = verticesLength / 6;
    let prevCurve = _PathConstraint.NONE;
    if (!path.constantSpeed) {
      const lengths = path.lengths;
      curveCount -= closed2 ? 1 : 2;
      const pathLength2 = lengths[curveCount];
      if (percentPosition)
        position *= pathLength2;
      if (percentSpacing) {
        for (let i = 0; i < spacesCount; i++)
          spaces[i] *= pathLength2;
      }
      world = Utils.setArraySize(this.world, 8);
      for (let i = 0, o = 0, curve = 0; i < spacesCount; i++, o += 3) {
        const space = spaces[i];
        position += space;
        let p = position;
        if (closed2) {
          p %= pathLength2;
          if (p < 0)
            p += pathLength2;
          curve = 0;
        } else if (p < 0) {
          if (prevCurve != _PathConstraint.BEFORE) {
            prevCurve = _PathConstraint.BEFORE;
            path.computeWorldVertices(target, 2, 4, world, 0, 2);
          }
          this.addBeforePosition(p, world, 0, out, o);
          continue;
        } else if (p > pathLength2) {
          if (prevCurve != _PathConstraint.AFTER) {
            prevCurve = _PathConstraint.AFTER;
            path.computeWorldVertices(target, verticesLength - 6, 4, world, 0, 2);
          }
          this.addAfterPosition(p - pathLength2, world, 0, out, o);
          continue;
        }
        for (; ; curve++) {
          const length = lengths[curve];
          if (p > length)
            continue;
          if (curve == 0)
            p /= length;
          else {
            const prev = lengths[curve - 1];
            p = (p - prev) / (length - prev);
          }
          break;
        }
        if (curve != prevCurve) {
          prevCurve = curve;
          if (closed2 && curve == curveCount) {
            path.computeWorldVertices(target, verticesLength - 4, 4, world, 0, 2);
            path.computeWorldVertices(target, 0, 4, world, 4, 2);
          } else
            path.computeWorldVertices(target, curve * 6 + 2, 8, world, 0, 2);
        }
        this.addCurvePosition(p, world[0], world[1], world[2], world[3], world[4], world[5], world[6], world[7], out, o, tangents || i > 0 && space == 0);
      }
      return out;
    }
    if (closed2) {
      verticesLength += 2;
      world = Utils.setArraySize(this.world, verticesLength);
      path.computeWorldVertices(target, 2, verticesLength - 4, world, 0, 2);
      path.computeWorldVertices(target, 0, 2, world, verticesLength - 4, 2);
      world[verticesLength - 2] = world[0];
      world[verticesLength - 1] = world[1];
    } else {
      curveCount--;
      verticesLength -= 4;
      world = Utils.setArraySize(this.world, verticesLength);
      path.computeWorldVertices(target, 2, verticesLength, world, 0, 2);
    }
    const curves = Utils.setArraySize(this.curves, curveCount);
    let pathLength = 0;
    let x1 = world[0];
    let y1 = world[1];
    let cx1 = 0;
    let cy1 = 0;
    let cx2 = 0;
    let cy2 = 0;
    let x2 = 0;
    let y2 = 0;
    let tmpx = 0;
    let tmpy = 0;
    let dddfx = 0;
    let dddfy = 0;
    let ddfx = 0;
    let ddfy = 0;
    let dfx = 0;
    let dfy = 0;
    for (let i = 0, w = 2; i < curveCount; i++, w += 6) {
      cx1 = world[w];
      cy1 = world[w + 1];
      cx2 = world[w + 2];
      cy2 = world[w + 3];
      x2 = world[w + 4];
      y2 = world[w + 5];
      tmpx = (x1 - cx1 * 2 + cx2) * 0.1875;
      tmpy = (y1 - cy1 * 2 + cy2) * 0.1875;
      dddfx = ((cx1 - cx2) * 3 - x1 + x2) * 0.09375;
      dddfy = ((cy1 - cy2) * 3 - y1 + y2) * 0.09375;
      ddfx = tmpx * 2 + dddfx;
      ddfy = tmpy * 2 + dddfy;
      dfx = (cx1 - x1) * 0.75 + tmpx + dddfx * 0.16666667;
      dfy = (cy1 - y1) * 0.75 + tmpy + dddfy * 0.16666667;
      pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
      dfx += ddfx;
      dfy += ddfy;
      ddfx += dddfx;
      ddfy += dddfy;
      pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
      dfx += ddfx;
      dfy += ddfy;
      pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
      dfx += ddfx + dddfx;
      dfy += ddfy + dddfy;
      pathLength += Math.sqrt(dfx * dfx + dfy * dfy);
      curves[i] = pathLength;
      x1 = x2;
      y1 = y2;
    }
    if (percentPosition)
      position *= pathLength;
    if (percentSpacing) {
      for (let i = 0; i < spacesCount; i++)
        spaces[i] *= pathLength;
    }
    const segments = this.segments;
    let curveLength = 0;
    for (let i = 0, o = 0, curve = 0, segment = 0; i < spacesCount; i++, o += 3) {
      const space = spaces[i];
      position += space;
      let p = position;
      if (closed2) {
        p %= pathLength;
        if (p < 0)
          p += pathLength;
        curve = 0;
      } else if (p < 0) {
        this.addBeforePosition(p, world, 0, out, o);
        continue;
      } else if (p > pathLength) {
        this.addAfterPosition(p - pathLength, world, verticesLength - 4, out, o);
        continue;
      }
      for (; ; curve++) {
        const length = curves[curve];
        if (p > length)
          continue;
        if (curve == 0)
          p /= length;
        else {
          const prev = curves[curve - 1];
          p = (p - prev) / (length - prev);
        }
        break;
      }
      if (curve != prevCurve) {
        prevCurve = curve;
        let ii = curve * 6;
        x1 = world[ii];
        y1 = world[ii + 1];
        cx1 = world[ii + 2];
        cy1 = world[ii + 3];
        cx2 = world[ii + 4];
        cy2 = world[ii + 5];
        x2 = world[ii + 6];
        y2 = world[ii + 7];
        tmpx = (x1 - cx1 * 2 + cx2) * 0.03;
        tmpy = (y1 - cy1 * 2 + cy2) * 0.03;
        dddfx = ((cx1 - cx2) * 3 - x1 + x2) * 6e-3;
        dddfy = ((cy1 - cy2) * 3 - y1 + y2) * 6e-3;
        ddfx = tmpx * 2 + dddfx;
        ddfy = tmpy * 2 + dddfy;
        dfx = (cx1 - x1) * 0.3 + tmpx + dddfx * 0.16666667;
        dfy = (cy1 - y1) * 0.3 + tmpy + dddfy * 0.16666667;
        curveLength = Math.sqrt(dfx * dfx + dfy * dfy);
        segments[0] = curveLength;
        for (ii = 1; ii < 8; ii++) {
          dfx += ddfx;
          dfy += ddfy;
          ddfx += dddfx;
          ddfy += dddfy;
          curveLength += Math.sqrt(dfx * dfx + dfy * dfy);
          segments[ii] = curveLength;
        }
        dfx += ddfx;
        dfy += ddfy;
        curveLength += Math.sqrt(dfx * dfx + dfy * dfy);
        segments[8] = curveLength;
        dfx += ddfx + dddfx;
        dfy += ddfy + dddfy;
        curveLength += Math.sqrt(dfx * dfx + dfy * dfy);
        segments[9] = curveLength;
        segment = 0;
      }
      p *= curveLength;
      for (; ; segment++) {
        const length = segments[segment];
        if (p > length)
          continue;
        if (segment == 0)
          p /= length;
        else {
          const prev = segments[segment - 1];
          p = segment + (p - prev) / (length - prev);
        }
        break;
      }
      this.addCurvePosition(p * 0.1, x1, y1, cx1, cy1, cx2, cy2, x2, y2, out, o, tangents || i > 0 && space == 0);
    }
    return out;
  }
  addBeforePosition(p, temp, i, out, o) {
    const x1 = temp[i];
    const y1 = temp[i + 1];
    const dx = temp[i + 2] - x1;
    const dy = temp[i + 3] - y1;
    const r = Math.atan2(dy, dx);
    out[o] = x1 + p * Math.cos(r);
    out[o + 1] = y1 + p * Math.sin(r);
    out[o + 2] = r;
  }
  addAfterPosition(p, temp, i, out, o) {
    const x1 = temp[i + 2];
    const y1 = temp[i + 3];
    const dx = x1 - temp[i];
    const dy = y1 - temp[i + 1];
    const r = Math.atan2(dy, dx);
    out[o] = x1 + p * Math.cos(r);
    out[o + 1] = y1 + p * Math.sin(r);
    out[o + 2] = r;
  }
  addCurvePosition(p, x1, y1, cx1, cy1, cx2, cy2, x2, y2, out, o, tangents) {
    if (p == 0 || isNaN(p))
      p = 1e-4;
    const tt = p * p;
    const ttt = tt * p;
    const u = 1 - p;
    const uu = u * u;
    const uuu = uu * u;
    const ut = u * p;
    const ut3 = ut * 3;
    const uut3 = u * ut3;
    const utt3 = ut3 * p;
    const x = x1 * uuu + cx1 * uut3 + cx2 * utt3 + x2 * ttt;
    const y = y1 * uuu + cy1 * uut3 + cy2 * utt3 + y2 * ttt;
    out[o] = x;
    out[o + 1] = y;
    if (tangents)
      out[o + 2] = Math.atan2(y - (y1 * uu + cy1 * ut * 2 + cy2 * tt), x - (x1 * uu + cx1 * ut * 2 + cx2 * tt));
  }
};
var PathConstraint = _PathConstraint;
PathConstraint.NONE = -1;
PathConstraint.BEFORE = -2;
PathConstraint.AFTER = -3;
PathConstraint.epsilon = 1e-5;

// node_modules/@pixi-spine/runtime-3.8/lib/core/TransformConstraint.mjs
var TransformConstraint = class {
  constructor(data, skeleton) {
    this.rotateMix = 0;
    this.translateMix = 0;
    this.scaleMix = 0;
    this.shearMix = 0;
    this.temp = new Vector2();
    this.active = false;
    if (data == null)
      throw new Error("data cannot be null.");
    if (skeleton == null)
      throw new Error("skeleton cannot be null.");
    this.data = data;
    this.rotateMix = data.rotateMix;
    this.translateMix = data.translateMix;
    this.scaleMix = data.scaleMix;
    this.shearMix = data.shearMix;
    this.bones = new Array();
    for (let i = 0; i < data.bones.length; i++)
      this.bones.push(skeleton.findBone(data.bones[i].name));
    this.target = skeleton.findBone(data.target.name);
  }
  isActive() {
    return this.active;
  }
  apply() {
    this.update();
  }
  update() {
    if (this.data.local) {
      if (this.data.relative)
        this.applyRelativeLocal();
      else
        this.applyAbsoluteLocal();
    } else if (this.data.relative)
      this.applyRelativeWorld();
    else
      this.applyAbsoluteWorld();
  }
  applyAbsoluteWorld() {
    const rotateMix = this.rotateMix;
    const translateMix = this.translateMix;
    const scaleMix = this.scaleMix;
    const shearMix = this.shearMix;
    const target = this.target;
    const targetMat = target.matrix;
    const ta = targetMat.a;
    const tb = targetMat.c;
    const tc = targetMat.b;
    const td = targetMat.d;
    const degRadReflect = ta * td - tb * tc > 0 ? MathUtils.degRad : -MathUtils.degRad;
    const offsetRotation = this.data.offsetRotation * degRadReflect;
    const offsetShearY = this.data.offsetShearY * degRadReflect;
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      let modified = false;
      const mat = bone.matrix;
      if (rotateMix != 0) {
        const a = mat.a;
        const b = mat.c;
        const c = mat.b;
        const d = mat.d;
        let r = Math.atan2(tc, ta) - Math.atan2(c, a) + offsetRotation;
        if (r > MathUtils.PI)
          r -= MathUtils.PI2;
        else if (r < -MathUtils.PI)
          r += MathUtils.PI2;
        r *= rotateMix;
        const cos = Math.cos(r);
        const sin = Math.sin(r);
        mat.a = cos * a - sin * c;
        mat.c = cos * b - sin * d;
        mat.b = sin * a + cos * c;
        mat.d = sin * b + cos * d;
        modified = true;
      }
      if (translateMix != 0) {
        const temp = this.temp;
        target.localToWorld(temp.set(this.data.offsetX, this.data.offsetY));
        mat.tx += (temp.x - mat.tx) * translateMix;
        mat.ty += (temp.y - mat.ty) * translateMix;
        modified = true;
      }
      if (scaleMix > 0) {
        let s = Math.sqrt(mat.a * mat.a + mat.b * mat.b);
        let ts = Math.sqrt(ta * ta + tc * tc);
        if (s > 1e-5)
          s = (s + (ts - s + this.data.offsetScaleX) * scaleMix) / s;
        mat.a *= s;
        mat.b *= s;
        s = Math.sqrt(mat.c * mat.c + mat.d * mat.d);
        ts = Math.sqrt(tb * tb + td * td);
        if (s > 1e-5)
          s = (s + (ts - s + this.data.offsetScaleY) * scaleMix) / s;
        mat.c *= s;
        mat.d *= s;
        modified = true;
      }
      if (shearMix > 0) {
        const b = mat.c;
        const d = mat.d;
        const by = Math.atan2(d, b);
        let r = Math.atan2(td, tb) - Math.atan2(tc, ta) - (by - Math.atan2(mat.b, mat.a));
        if (r > MathUtils.PI)
          r -= MathUtils.PI2;
        else if (r < -MathUtils.PI)
          r += MathUtils.PI2;
        r = by + (r + offsetShearY) * shearMix;
        const s = Math.sqrt(b * b + d * d);
        mat.c = Math.cos(r) * s;
        mat.d = Math.sin(r) * s;
        modified = true;
      }
      if (modified)
        bone.appliedValid = false;
    }
  }
  applyRelativeWorld() {
    const rotateMix = this.rotateMix;
    const translateMix = this.translateMix;
    const scaleMix = this.scaleMix;
    const shearMix = this.shearMix;
    const target = this.target;
    const targetMat = target.matrix;
    const ta = targetMat.a;
    const tb = targetMat.c;
    const tc = targetMat.b;
    const td = targetMat.d;
    const degRadReflect = ta * td - tb * tc > 0 ? MathUtils.degRad : -MathUtils.degRad;
    const offsetRotation = this.data.offsetRotation * degRadReflect;
    const offsetShearY = this.data.offsetShearY * degRadReflect;
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      let modified = false;
      const mat = bone.matrix;
      if (rotateMix != 0) {
        const a = mat.a;
        const b = mat.c;
        const c = mat.b;
        const d = mat.d;
        let r = Math.atan2(tc, ta) + offsetRotation;
        if (r > MathUtils.PI)
          r -= MathUtils.PI2;
        else if (r < -MathUtils.PI)
          r += MathUtils.PI2;
        r *= rotateMix;
        const cos = Math.cos(r);
        const sin = Math.sin(r);
        mat.a = cos * a - sin * c;
        mat.c = cos * b - sin * d;
        mat.b = sin * a + cos * c;
        mat.d = sin * b + cos * d;
        modified = true;
      }
      if (translateMix != 0) {
        const temp = this.temp;
        target.localToWorld(temp.set(this.data.offsetX, this.data.offsetY));
        mat.tx += temp.x * translateMix;
        mat.ty += temp.y * translateMix;
        modified = true;
      }
      if (scaleMix > 0) {
        let s = (Math.sqrt(ta * ta + tc * tc) - 1 + this.data.offsetScaleX) * scaleMix + 1;
        mat.a *= s;
        mat.b *= s;
        s = (Math.sqrt(tb * tb + td * td) - 1 + this.data.offsetScaleY) * scaleMix + 1;
        mat.c *= s;
        mat.d *= s;
        modified = true;
      }
      if (shearMix > 0) {
        let r = Math.atan2(td, tb) - Math.atan2(tc, ta);
        if (r > MathUtils.PI)
          r -= MathUtils.PI2;
        else if (r < -MathUtils.PI)
          r += MathUtils.PI2;
        const b = mat.c;
        const d = mat.d;
        r = Math.atan2(d, b) + (r - MathUtils.PI / 2 + offsetShearY) * shearMix;
        const s = Math.sqrt(b * b + d * d);
        mat.c = Math.cos(r) * s;
        mat.d = Math.sin(r) * s;
        modified = true;
      }
      if (modified)
        bone.appliedValid = false;
    }
  }
  applyAbsoluteLocal() {
    const rotateMix = this.rotateMix;
    const translateMix = this.translateMix;
    const scaleMix = this.scaleMix;
    const shearMix = this.shearMix;
    const target = this.target;
    if (!target.appliedValid)
      target.updateAppliedTransform();
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      if (!bone.appliedValid)
        bone.updateAppliedTransform();
      let rotation = bone.arotation;
      if (rotateMix != 0) {
        let r = target.arotation - rotation + this.data.offsetRotation;
        r -= (16384 - (16384.499999999996 - r / 360 | 0)) * 360;
        rotation += r * rotateMix;
      }
      let x = bone.ax;
      let y = bone.ay;
      if (translateMix != 0) {
        x += (target.ax - x + this.data.offsetX) * translateMix;
        y += (target.ay - y + this.data.offsetY) * translateMix;
      }
      let scaleX = bone.ascaleX;
      let scaleY = bone.ascaleY;
      if (scaleMix > 0) {
        if (scaleX > 1e-5)
          scaleX = (scaleX + (target.ascaleX - scaleX + this.data.offsetScaleX) * scaleMix) / scaleX;
        if (scaleY > 1e-5)
          scaleY = (scaleY + (target.ascaleY - scaleY + this.data.offsetScaleY) * scaleMix) / scaleY;
      }
      const shearY = bone.ashearY;
      if (shearMix > 0) {
        let r = target.ashearY - shearY + this.data.offsetShearY;
        r -= (16384 - (16384.499999999996 - r / 360 | 0)) * 360;
        bone.shearY += r * shearMix;
      }
      bone.updateWorldTransformWith(x, y, rotation, scaleX, scaleY, bone.ashearX, shearY);
    }
  }
  applyRelativeLocal() {
    const rotateMix = this.rotateMix;
    const translateMix = this.translateMix;
    const scaleMix = this.scaleMix;
    const shearMix = this.shearMix;
    const target = this.target;
    if (!target.appliedValid)
      target.updateAppliedTransform();
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      if (!bone.appliedValid)
        bone.updateAppliedTransform();
      let rotation = bone.arotation;
      if (rotateMix != 0)
        rotation += (target.arotation + this.data.offsetRotation) * rotateMix;
      let x = bone.ax;
      let y = bone.ay;
      if (translateMix != 0) {
        x += (target.ax + this.data.offsetX) * translateMix;
        y += (target.ay + this.data.offsetY) * translateMix;
      }
      let scaleX = bone.ascaleX;
      let scaleY = bone.ascaleY;
      if (scaleMix > 0) {
        if (scaleX > 1e-5)
          scaleX *= (target.ascaleX - 1 + this.data.offsetScaleX) * scaleMix + 1;
        if (scaleY > 1e-5)
          scaleY *= (target.ascaleY - 1 + this.data.offsetScaleY) * scaleMix + 1;
      }
      let shearY = bone.ashearY;
      if (shearMix > 0)
        shearY += (target.ashearY + this.data.offsetShearY) * shearMix;
      bone.updateWorldTransformWith(x, y, rotation, scaleX, scaleY, bone.ashearX, shearY);
    }
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/Skeleton.mjs
var _Skeleton = class {
  constructor(data) {
    this._updateCache = new Array();
    this.updateCacheReset = new Array();
    this.time = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.x = 0;
    this.y = 0;
    if (data == null)
      throw new Error("data cannot be null.");
    this.data = data;
    this.bones = new Array();
    for (let i = 0; i < data.bones.length; i++) {
      const boneData = data.bones[i];
      let bone;
      if (boneData.parent == null)
        bone = new Bone(boneData, this, null);
      else {
        const parent = this.bones[boneData.parent.index];
        bone = new Bone(boneData, this, parent);
        parent.children.push(bone);
      }
      this.bones.push(bone);
    }
    this.slots = new Array();
    this.drawOrder = new Array();
    for (let i = 0; i < data.slots.length; i++) {
      const slotData = data.slots[i];
      const bone = this.bones[slotData.boneData.index];
      const slot = new Slot(slotData, bone);
      this.slots.push(slot);
      this.drawOrder.push(slot);
    }
    this.ikConstraints = new Array();
    for (let i = 0; i < data.ikConstraints.length; i++) {
      const ikConstraintData = data.ikConstraints[i];
      this.ikConstraints.push(new IkConstraint(ikConstraintData, this));
    }
    this.transformConstraints = new Array();
    for (let i = 0; i < data.transformConstraints.length; i++) {
      const transformConstraintData = data.transformConstraints[i];
      this.transformConstraints.push(new TransformConstraint(transformConstraintData, this));
    }
    this.pathConstraints = new Array();
    for (let i = 0; i < data.pathConstraints.length; i++) {
      const pathConstraintData = data.pathConstraints[i];
      this.pathConstraints.push(new PathConstraint(pathConstraintData, this));
    }
    this.color = new Color(1, 1, 1, 1);
    this.updateCache();
  }
  updateCache() {
    const updateCache = this._updateCache;
    updateCache.length = 0;
    this.updateCacheReset.length = 0;
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      bone.sorted = bone.data.skinRequired;
      bone.active = !bone.sorted;
    }
    if (this.skin != null) {
      const skinBones = this.skin.bones;
      for (let i = 0, n = this.skin.bones.length; i < n; i++) {
        let bone = this.bones[skinBones[i].index];
        do {
          bone.sorted = false;
          bone.active = true;
          bone = bone.parent;
        } while (bone != null);
      }
    }
    const ikConstraints = this.ikConstraints;
    const transformConstraints = this.transformConstraints;
    const pathConstraints = this.pathConstraints;
    const ikCount = ikConstraints.length;
    const transformCount = transformConstraints.length;
    const pathCount = pathConstraints.length;
    const constraintCount = ikCount + transformCount + pathCount;
    outer:
      for (let i = 0; i < constraintCount; i++) {
        for (let ii = 0; ii < ikCount; ii++) {
          const constraint = ikConstraints[ii];
          if (constraint.data.order == i) {
            this.sortIkConstraint(constraint);
            continue outer;
          }
        }
        for (let ii = 0; ii < transformCount; ii++) {
          const constraint = transformConstraints[ii];
          if (constraint.data.order == i) {
            this.sortTransformConstraint(constraint);
            continue outer;
          }
        }
        for (let ii = 0; ii < pathCount; ii++) {
          const constraint = pathConstraints[ii];
          if (constraint.data.order == i) {
            this.sortPathConstraint(constraint);
            continue outer;
          }
        }
      }
    for (let i = 0, n = bones.length; i < n; i++)
      this.sortBone(bones[i]);
  }
  sortIkConstraint(constraint) {
    constraint.active = constraint.target.isActive() && (!constraint.data.skinRequired || this.skin != null && Utils.contains(this.skin.constraints, constraint.data, true));
    if (!constraint.active)
      return;
    const target = constraint.target;
    this.sortBone(target);
    const constrained = constraint.bones;
    const parent = constrained[0];
    this.sortBone(parent);
    if (constrained.length > 1) {
      const child = constrained[constrained.length - 1];
      if (!(this._updateCache.indexOf(child) > -1))
        this.updateCacheReset.push(child);
    }
    this._updateCache.push(constraint);
    this.sortReset(parent.children);
    constrained[constrained.length - 1].sorted = true;
  }
  sortPathConstraint(constraint) {
    constraint.active = constraint.target.bone.isActive() && (!constraint.data.skinRequired || this.skin != null && Utils.contains(this.skin.constraints, constraint.data, true));
    if (!constraint.active)
      return;
    const slot = constraint.target;
    const slotIndex = slot.data.index;
    const slotBone = slot.bone;
    if (this.skin != null)
      this.sortPathConstraintAttachment(this.skin, slotIndex, slotBone);
    if (this.data.defaultSkin != null && this.data.defaultSkin != this.skin)
      this.sortPathConstraintAttachment(this.data.defaultSkin, slotIndex, slotBone);
    for (let i = 0, n = this.data.skins.length; i < n; i++)
      this.sortPathConstraintAttachment(this.data.skins[i], slotIndex, slotBone);
    const attachment = slot.getAttachment();
    if (attachment instanceof PathAttachment)
      this.sortPathConstraintAttachmentWith(attachment, slotBone);
    const constrained = constraint.bones;
    const boneCount = constrained.length;
    for (let i = 0; i < boneCount; i++)
      this.sortBone(constrained[i]);
    this._updateCache.push(constraint);
    for (let i = 0; i < boneCount; i++)
      this.sortReset(constrained[i].children);
    for (let i = 0; i < boneCount; i++)
      constrained[i].sorted = true;
  }
  sortTransformConstraint(constraint) {
    constraint.active = constraint.target.isActive() && (!constraint.data.skinRequired || this.skin != null && Utils.contains(this.skin.constraints, constraint.data, true));
    if (!constraint.active)
      return;
    this.sortBone(constraint.target);
    const constrained = constraint.bones;
    const boneCount = constrained.length;
    if (constraint.data.local) {
      for (let i = 0; i < boneCount; i++) {
        const child = constrained[i];
        this.sortBone(child.parent);
        if (!(this._updateCache.indexOf(child) > -1))
          this.updateCacheReset.push(child);
      }
    } else {
      for (let i = 0; i < boneCount; i++) {
        this.sortBone(constrained[i]);
      }
    }
    this._updateCache.push(constraint);
    for (let ii = 0; ii < boneCount; ii++)
      this.sortReset(constrained[ii].children);
    for (let ii = 0; ii < boneCount; ii++)
      constrained[ii].sorted = true;
  }
  sortPathConstraintAttachment(skin, slotIndex, slotBone) {
    const attachments = skin.attachments[slotIndex];
    if (!attachments)
      return;
    for (const key in attachments) {
      this.sortPathConstraintAttachmentWith(attachments[key], slotBone);
    }
  }
  sortPathConstraintAttachmentWith(attachment, slotBone) {
    if (!(attachment instanceof PathAttachment))
      return;
    const pathBones = attachment.bones;
    if (pathBones == null)
      this.sortBone(slotBone);
    else {
      const bones = this.bones;
      let i = 0;
      while (i < pathBones.length) {
        const boneCount = pathBones[i++];
        for (let n = i + boneCount; i < n; i++) {
          const boneIndex = pathBones[i];
          this.sortBone(bones[boneIndex]);
        }
      }
    }
  }
  sortBone(bone) {
    if (bone.sorted)
      return;
    const parent = bone.parent;
    if (parent != null)
      this.sortBone(parent);
    bone.sorted = true;
    this._updateCache.push(bone);
  }
  sortReset(bones) {
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      if (!bone.active)
        continue;
      if (bone.sorted)
        this.sortReset(bone.children);
      bone.sorted = false;
    }
  }
  /** Updates the world transform for each bone and applies constraints. */
  updateWorldTransform() {
    const updateCacheReset = this.updateCacheReset;
    for (let i = 0, n = updateCacheReset.length; i < n; i++) {
      const bone = updateCacheReset[i];
      bone.ax = bone.x;
      bone.ay = bone.y;
      bone.arotation = bone.rotation;
      bone.ascaleX = bone.scaleX;
      bone.ascaleY = bone.scaleY;
      bone.ashearX = bone.shearX;
      bone.ashearY = bone.shearY;
      bone.appliedValid = true;
    }
    const updateCache = this._updateCache;
    for (let i = 0, n = updateCache.length; i < n; i++)
      updateCache[i].update();
  }
  /** Sets the bones, constraints, and slots to their setup pose values. */
  setToSetupPose() {
    this.setBonesToSetupPose();
    this.setSlotsToSetupPose();
  }
  /** Sets the bones and constraints to their setup pose values. */
  setBonesToSetupPose() {
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++)
      bones[i].setToSetupPose();
    const ikConstraints = this.ikConstraints;
    for (let i = 0, n = ikConstraints.length; i < n; i++) {
      const constraint = ikConstraints[i];
      constraint.mix = constraint.data.mix;
      constraint.softness = constraint.data.softness;
      constraint.bendDirection = constraint.data.bendDirection;
      constraint.compress = constraint.data.compress;
      constraint.stretch = constraint.data.stretch;
    }
    const transformConstraints = this.transformConstraints;
    for (let i = 0, n = transformConstraints.length; i < n; i++) {
      const constraint = transformConstraints[i];
      const data = constraint.data;
      constraint.rotateMix = data.rotateMix;
      constraint.translateMix = data.translateMix;
      constraint.scaleMix = data.scaleMix;
      constraint.shearMix = data.shearMix;
    }
    const pathConstraints = this.pathConstraints;
    for (let i = 0, n = pathConstraints.length; i < n; i++) {
      const constraint = pathConstraints[i];
      const data = constraint.data;
      constraint.position = data.position;
      constraint.spacing = data.spacing;
      constraint.rotateMix = data.rotateMix;
      constraint.translateMix = data.translateMix;
    }
  }
  setSlotsToSetupPose() {
    const slots = this.slots;
    Utils.arrayCopy(slots, 0, this.drawOrder, 0, slots.length);
    for (let i = 0, n = slots.length; i < n; i++)
      slots[i].setToSetupPose();
  }
  /** @return May return null. */
  getRootBone() {
    if (this.bones.length == 0)
      return null;
    return this.bones[0];
  }
  /** @return May be null. */
  findBone(boneName) {
    if (boneName == null)
      throw new Error("boneName cannot be null.");
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      if (bone.data.name == boneName)
        return bone;
    }
    return null;
  }
  /** @return -1 if the bone was not found. */
  findBoneIndex(boneName) {
    if (boneName == null)
      throw new Error("boneName cannot be null.");
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++)
      if (bones[i].data.name == boneName)
        return i;
    return -1;
  }
  /** @return May be null. */
  findSlot(slotName) {
    if (slotName == null)
      throw new Error("slotName cannot be null.");
    const slots = this.slots;
    for (let i = 0, n = slots.length; i < n; i++) {
      const slot = slots[i];
      if (slot.data.name == slotName)
        return slot;
    }
    return null;
  }
  /** @return -1 if the bone was not found. */
  findSlotIndex(slotName) {
    if (slotName == null)
      throw new Error("slotName cannot be null.");
    const slots = this.slots;
    for (let i = 0, n = slots.length; i < n; i++)
      if (slots[i].data.name == slotName)
        return i;
    return -1;
  }
  /** Sets a skin by name.
   * @see #setSkin(Skin) */
  setSkinByName(skinName) {
    const skin = this.data.findSkin(skinName);
    if (skin == null)
      throw new Error(`Skin not found: ${skinName}`);
    this.setSkin(skin);
  }
  /** Sets the skin used to look up attachments before looking in the {@link SkeletonData#getDefaultSkin() default skin}.
   * Attachments from the new skin are attached if the corresponding attachment from the old skin was attached. If there was no
   * old skin, each slot's setup mode attachment is attached from the new skin.
   * @param newSkin May be null. */
  setSkin(newSkin) {
    if (newSkin == this.skin)
      return;
    if (newSkin != null) {
      if (this.skin != null)
        newSkin.attachAll(this, this.skin);
      else {
        const slots = this.slots;
        for (let i = 0, n = slots.length; i < n; i++) {
          const slot = slots[i];
          const name = slot.data.attachmentName;
          if (name != null) {
            const attachment = newSkin.getAttachment(i, name);
            if (attachment != null)
              slot.setAttachment(attachment);
          }
        }
      }
    }
    this.skin = newSkin;
    this.updateCache();
  }
  /** @return May be null. */
  getAttachmentByName(slotName, attachmentName) {
    return this.getAttachment(this.data.findSlotIndex(slotName), attachmentName);
  }
  /** @return May be null. */
  getAttachment(slotIndex, attachmentName) {
    if (attachmentName == null)
      throw new Error("attachmentName cannot be null.");
    if (this.skin != null) {
      const attachment = this.skin.getAttachment(slotIndex, attachmentName);
      if (attachment != null)
        return attachment;
    }
    if (this.data.defaultSkin != null)
      return this.data.defaultSkin.getAttachment(slotIndex, attachmentName);
    return null;
  }
  /** @param attachmentName May be null. */
  setAttachment(slotName, attachmentName) {
    if (slotName == null)
      throw new Error("slotName cannot be null.");
    const slots = this.slots;
    for (let i = 0, n = slots.length; i < n; i++) {
      const slot = slots[i];
      if (slot.data.name == slotName) {
        let attachment = null;
        if (attachmentName != null) {
          attachment = this.getAttachment(i, attachmentName);
          if (attachment == null)
            throw new Error(`Attachment not found: ${attachmentName}, for slot: ${slotName}`);
        }
        slot.setAttachment(attachment);
        return;
      }
    }
    throw new Error(`Slot not found: ${slotName}`);
  }
  /** @return May be null. */
  findIkConstraint(constraintName) {
    if (constraintName == null)
      throw new Error("constraintName cannot be null.");
    const ikConstraints = this.ikConstraints;
    for (let i = 0, n = ikConstraints.length; i < n; i++) {
      const ikConstraint = ikConstraints[i];
      if (ikConstraint.data.name == constraintName)
        return ikConstraint;
    }
    return null;
  }
  /** @return May be null. */
  findTransformConstraint(constraintName) {
    if (constraintName == null)
      throw new Error("constraintName cannot be null.");
    const transformConstraints = this.transformConstraints;
    for (let i = 0, n = transformConstraints.length; i < n; i++) {
      const constraint = transformConstraints[i];
      if (constraint.data.name == constraintName)
        return constraint;
    }
    return null;
  }
  /** @return May be null. */
  findPathConstraint(constraintName) {
    if (constraintName == null)
      throw new Error("constraintName cannot be null.");
    const pathConstraints = this.pathConstraints;
    for (let i = 0, n = pathConstraints.length; i < n; i++) {
      const constraint = pathConstraints[i];
      if (constraint.data.name == constraintName)
        return constraint;
    }
    return null;
  }
  /** Returns the axis aligned bounding box (AABB) of the region and mesh attachments for the current pose.
   * @param offset The distance from the skeleton origin to the bottom left corner of the AABB.
   * @param size The width and height of the AABB.
   * @param temp Working memory */
  getBounds(offset, size, temp = new Array(2)) {
    if (offset == null)
      throw new Error("offset cannot be null.");
    if (size == null)
      throw new Error("size cannot be null.");
    const drawOrder = this.drawOrder;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0, n = drawOrder.length; i < n; i++) {
      const slot = drawOrder[i];
      if (!slot.bone.active)
        continue;
      let verticesLength = 0;
      let vertices = null;
      const attachment = slot.getAttachment();
      if (attachment instanceof RegionAttachment) {
        verticesLength = 8;
        vertices = Utils.setArraySize(temp, verticesLength, 0);
        attachment.computeWorldVertices(slot.bone, vertices, 0, 2);
      } else if (attachment instanceof MeshAttachment) {
        const mesh = attachment;
        verticesLength = mesh.worldVerticesLength;
        vertices = Utils.setArraySize(temp, verticesLength, 0);
        mesh.computeWorldVertices(slot, 0, verticesLength, vertices, 0, 2);
      }
      if (vertices != null) {
        for (let ii = 0, nn = vertices.length; ii < nn; ii += 2) {
          const x = vertices[ii];
          const y = vertices[ii + 1];
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    offset.set(minX, minY);
    size.set(maxX - minX, maxY - minY);
  }
  update(delta) {
    this.time += delta;
  }
  get flipX() {
    return this.scaleX == -1;
  }
  set flipX(value) {
    if (!_Skeleton.deprecatedWarning1) {
      _Skeleton.deprecatedWarning1 = true;
      console.warn("Spine Deprecation Warning: `Skeleton.flipX/flipY` was deprecated, please use scaleX/scaleY");
    }
    this.scaleX = value ? 1 : -1;
  }
  get flipY() {
    return this.scaleY == -1;
  }
  set flipY(value) {
    if (!_Skeleton.deprecatedWarning1) {
      _Skeleton.deprecatedWarning1 = true;
      console.warn("Spine Deprecation Warning: `Skeleton.flipX/flipY` was deprecated, please use scaleX/scaleY");
    }
    this.scaleY = value ? 1 : -1;
  }
};
var Skeleton = _Skeleton;
Skeleton.deprecatedWarning1 = false;

// node_modules/@pixi-spine/runtime-3.8/lib/core/SkeletonData.mjs
var SkeletonData = class {
  constructor() {
    this.bones = new Array();
    this.slots = new Array();
    this.skins = new Array();
    this.events = new Array();
    this.animations = new Array();
    this.ikConstraints = new Array();
    this.transformConstraints = new Array();
    this.pathConstraints = new Array();
    this.fps = 0;
  }
  findBone(boneName) {
    if (boneName == null)
      throw new Error("boneName cannot be null.");
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++) {
      const bone = bones[i];
      if (bone.name == boneName)
        return bone;
    }
    return null;
  }
  findBoneIndex(boneName) {
    if (boneName == null)
      throw new Error("boneName cannot be null.");
    const bones = this.bones;
    for (let i = 0, n = bones.length; i < n; i++)
      if (bones[i].name == boneName)
        return i;
    return -1;
  }
  findSlot(slotName) {
    if (slotName == null)
      throw new Error("slotName cannot be null.");
    const slots = this.slots;
    for (let i = 0, n = slots.length; i < n; i++) {
      const slot = slots[i];
      if (slot.name == slotName)
        return slot;
    }
    return null;
  }
  findSlotIndex(slotName) {
    if (slotName == null)
      throw new Error("slotName cannot be null.");
    const slots = this.slots;
    for (let i = 0, n = slots.length; i < n; i++)
      if (slots[i].name == slotName)
        return i;
    return -1;
  }
  findSkin(skinName) {
    if (skinName == null)
      throw new Error("skinName cannot be null.");
    const skins = this.skins;
    for (let i = 0, n = skins.length; i < n; i++) {
      const skin = skins[i];
      if (skin.name == skinName)
        return skin;
    }
    return null;
  }
  findEvent(eventDataName) {
    if (eventDataName == null)
      throw new Error("eventDataName cannot be null.");
    const events = this.events;
    for (let i = 0, n = events.length; i < n; i++) {
      const event = events[i];
      if (event.name == eventDataName)
        return event;
    }
    return null;
  }
  findAnimation(animationName) {
    if (animationName == null)
      throw new Error("animationName cannot be null.");
    const animations = this.animations;
    for (let i = 0, n = animations.length; i < n; i++) {
      const animation = animations[i];
      if (animation.name == animationName)
        return animation;
    }
    return null;
  }
  findIkConstraint(constraintName) {
    if (constraintName == null)
      throw new Error("constraintName cannot be null.");
    const ikConstraints = this.ikConstraints;
    for (let i = 0, n = ikConstraints.length; i < n; i++) {
      const constraint = ikConstraints[i];
      if (constraint.name == constraintName)
        return constraint;
    }
    return null;
  }
  findTransformConstraint(constraintName) {
    if (constraintName == null)
      throw new Error("constraintName cannot be null.");
    const transformConstraints = this.transformConstraints;
    for (let i = 0, n = transformConstraints.length; i < n; i++) {
      const constraint = transformConstraints[i];
      if (constraint.name == constraintName)
        return constraint;
    }
    return null;
  }
  findPathConstraint(constraintName) {
    if (constraintName == null)
      throw new Error("constraintName cannot be null.");
    const pathConstraints = this.pathConstraints;
    for (let i = 0, n = pathConstraints.length; i < n; i++) {
      const constraint = pathConstraints[i];
      if (constraint.name == constraintName)
        return constraint;
    }
    return null;
  }
  findPathConstraintIndex(pathConstraintName) {
    if (pathConstraintName == null)
      throw new Error("pathConstraintName cannot be null.");
    const pathConstraints = this.pathConstraints;
    for (let i = 0, n = pathConstraints.length; i < n; i++)
      if (pathConstraints[i].name == pathConstraintName)
        return i;
    return -1;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/SlotData.mjs
var SlotData = class {
  constructor(index, name, boneData) {
    this.color = new Color(1, 1, 1, 1);
    if (index < 0)
      throw new Error("index must be >= 0.");
    if (name == null)
      throw new Error("name cannot be null.");
    if (boneData == null)
      throw new Error("boneData cannot be null.");
    this.index = index;
    this.name = name;
    this.boneData = boneData;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/TransformConstraintData.mjs
var TransformConstraintData = class extends ConstraintData {
  constructor(name) {
    super(name, 0, false);
    this.bones = new Array();
    this.rotateMix = 0;
    this.translateMix = 0;
    this.scaleMix = 0;
    this.shearMix = 0;
    this.offsetRotation = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.offsetScaleX = 0;
    this.offsetScaleY = 0;
    this.offsetShearY = 0;
    this.relative = false;
    this.local = false;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/Skin.mjs
var SkinEntry = class {
  constructor(slotIndex, name, attachment) {
    this.slotIndex = slotIndex;
    this.name = name;
    this.attachment = attachment;
  }
};
var Skin = class {
  constructor(name) {
    this.attachments = new Array();
    this.bones = Array();
    this.constraints = new Array();
    if (name == null)
      throw new Error("name cannot be null.");
    this.name = name;
  }
  setAttachment(slotIndex, name, attachment) {
    if (attachment == null)
      throw new Error("attachment cannot be null.");
    const attachments = this.attachments;
    if (slotIndex >= attachments.length)
      attachments.length = slotIndex + 1;
    if (!attachments[slotIndex])
      attachments[slotIndex] = {};
    attachments[slotIndex][name] = attachment;
  }
  addSkin(skin) {
    for (let i = 0; i < skin.bones.length; i++) {
      const bone = skin.bones[i];
      let contained = false;
      for (let j = 0; j < this.bones.length; j++) {
        if (this.bones[j] == bone) {
          contained = true;
          break;
        }
      }
      if (!contained)
        this.bones.push(bone);
    }
    for (let i = 0; i < skin.constraints.length; i++) {
      const constraint = skin.constraints[i];
      let contained = false;
      for (let j = 0; j < this.constraints.length; j++) {
        if (this.constraints[j] == constraint) {
          contained = true;
          break;
        }
      }
      if (!contained)
        this.constraints.push(constraint);
    }
    const attachments = skin.getAttachments();
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
    }
  }
  copySkin(skin) {
    for (let i = 0; i < skin.bones.length; i++) {
      const bone = skin.bones[i];
      let contained = false;
      for (let j = 0; j < this.bones.length; j++) {
        if (this.bones[j] == bone) {
          contained = true;
          break;
        }
      }
      if (!contained)
        this.bones.push(bone);
    }
    for (let i = 0; i < skin.constraints.length; i++) {
      const constraint = skin.constraints[i];
      let contained = false;
      for (let j = 0; j < this.constraints.length; j++) {
        if (this.constraints[j] == constraint) {
          contained = true;
          break;
        }
      }
      if (!contained)
        this.constraints.push(constraint);
    }
    const attachments = skin.getAttachments();
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      if (attachment.attachment == null)
        continue;
      if (attachment.attachment instanceof MeshAttachment) {
        attachment.attachment = attachment.attachment.newLinkedMesh();
        this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
      } else {
        attachment.attachment = attachment.attachment.copy();
        this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
      }
    }
  }
  /** @return May be null. */
  getAttachment(slotIndex, name) {
    const dictionary = this.attachments[slotIndex];
    return dictionary ? dictionary[name] : null;
  }
  removeAttachment(slotIndex, name) {
    const dictionary = this.attachments[slotIndex];
    if (dictionary)
      dictionary[name] = null;
  }
  getAttachments() {
    const entries = new Array();
    for (let i = 0; i < this.attachments.length; i++) {
      const slotAttachments = this.attachments[i];
      if (slotAttachments) {
        for (const name in slotAttachments) {
          const attachment = slotAttachments[name];
          if (attachment)
            entries.push(new SkinEntry(i, name, attachment));
        }
      }
    }
    return entries;
  }
  getAttachmentsForSlot(slotIndex, attachments) {
    const slotAttachments = this.attachments[slotIndex];
    if (slotAttachments) {
      for (const name in slotAttachments) {
        const attachment = slotAttachments[name];
        if (attachment)
          attachments.push(new SkinEntry(slotIndex, name, attachment));
      }
    }
  }
  clear() {
    this.attachments.length = 0;
    this.bones.length = 0;
    this.constraints.length = 0;
  }
  /** Attach each attachment in this skin if the corresponding attachment in the old skin is currently attached. */
  attachAll(skeleton, oldSkin) {
    let slotIndex = 0;
    for (let i = 0; i < skeleton.slots.length; i++) {
      const slot = skeleton.slots[i];
      const slotAttachment = slot.getAttachment();
      if (slotAttachment && slotIndex < oldSkin.attachments.length) {
        const dictionary = oldSkin.attachments[slotIndex];
        for (const key in dictionary) {
          const skinAttachment = dictionary[key];
          if (slotAttachment == skinAttachment) {
            const attachment = this.getAttachment(slotIndex, key);
            if (attachment != null)
              slot.setAttachment(attachment);
            break;
          }
        }
      }
      slotIndex++;
    }
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/SkeletonBinary.mjs
var _SkeletonBinary = class {
  constructor(attachmentLoader) {
    this.scale = 1;
    this.linkedMeshes = new Array();
    this.attachmentLoader = attachmentLoader;
  }
  readSkeletonData(binary) {
    const scale = this.scale;
    const skeletonData = new SkeletonData();
    skeletonData.name = "";
    const input = new BinaryInput(binary);
    skeletonData.hash = input.readString();
    skeletonData.version = input.readString();
    if (skeletonData.version === "3.8.75") {
      const error = `Unsupported skeleton data, 3.8.75 is deprecated, please export with a newer version of Spine.`;
      console.error(error);
    }
    skeletonData.x = input.readFloat();
    skeletonData.y = input.readFloat();
    skeletonData.width = input.readFloat();
    skeletonData.height = input.readFloat();
    const nonessential = input.readBoolean();
    if (nonessential) {
      skeletonData.fps = input.readFloat();
      skeletonData.imagesPath = input.readString();
      skeletonData.audioPath = input.readString();
    }
    let n = 0;
    n = input.readInt(true);
    for (let i = 0; i < n; i++)
      input.strings.push(input.readString());
    n = input.readInt(true);
    for (let i = 0; i < n; i++) {
      const name = input.readString();
      const parent = i == 0 ? null : skeletonData.bones[input.readInt(true)];
      const data = new BoneData(i, name, parent);
      data.rotation = input.readFloat();
      data.x = input.readFloat() * scale;
      data.y = input.readFloat() * scale;
      data.scaleX = input.readFloat();
      data.scaleY = input.readFloat();
      data.shearX = input.readFloat();
      data.shearY = input.readFloat();
      data.length = input.readFloat() * scale;
      data.transformMode = _SkeletonBinary.TransformModeValues[input.readInt(true)];
      data.skinRequired = input.readBoolean();
      if (nonessential)
        Color.rgba8888ToColor(data.color, input.readInt32());
      skeletonData.bones.push(data);
    }
    n = input.readInt(true);
    for (let i = 0; i < n; i++) {
      const slotName = input.readString();
      const boneData = skeletonData.bones[input.readInt(true)];
      const data = new SlotData(i, slotName, boneData);
      Color.rgba8888ToColor(data.color, input.readInt32());
      const darkColor = input.readInt32();
      if (darkColor != -1)
        Color.rgb888ToColor(data.darkColor = new Color(), darkColor);
      data.attachmentName = input.readStringRef();
      data.blendMode = _SkeletonBinary.BlendModeValues[input.readInt(true)];
      skeletonData.slots.push(data);
    }
    n = input.readInt(true);
    for (let i = 0, nn; i < n; i++) {
      const data = new IkConstraintData(input.readString());
      data.order = input.readInt(true);
      data.skinRequired = input.readBoolean();
      nn = input.readInt(true);
      for (let ii = 0; ii < nn; ii++)
        data.bones.push(skeletonData.bones[input.readInt(true)]);
      data.target = skeletonData.bones[input.readInt(true)];
      data.mix = input.readFloat();
      data.softness = input.readFloat() * scale;
      data.bendDirection = input.readByte();
      data.compress = input.readBoolean();
      data.stretch = input.readBoolean();
      data.uniform = input.readBoolean();
      skeletonData.ikConstraints.push(data);
    }
    n = input.readInt(true);
    for (let i = 0, nn; i < n; i++) {
      const data = new TransformConstraintData(input.readString());
      data.order = input.readInt(true);
      data.skinRequired = input.readBoolean();
      nn = input.readInt(true);
      for (let ii = 0; ii < nn; ii++)
        data.bones.push(skeletonData.bones[input.readInt(true)]);
      data.target = skeletonData.bones[input.readInt(true)];
      data.local = input.readBoolean();
      data.relative = input.readBoolean();
      data.offsetRotation = input.readFloat();
      data.offsetX = input.readFloat() * scale;
      data.offsetY = input.readFloat() * scale;
      data.offsetScaleX = input.readFloat();
      data.offsetScaleY = input.readFloat();
      data.offsetShearY = input.readFloat();
      data.rotateMix = input.readFloat();
      data.translateMix = input.readFloat();
      data.scaleMix = input.readFloat();
      data.shearMix = input.readFloat();
      skeletonData.transformConstraints.push(data);
    }
    n = input.readInt(true);
    for (let i = 0, nn; i < n; i++) {
      const data = new PathConstraintData(input.readString());
      data.order = input.readInt(true);
      data.skinRequired = input.readBoolean();
      nn = input.readInt(true);
      for (let ii = 0; ii < nn; ii++)
        data.bones.push(skeletonData.bones[input.readInt(true)]);
      data.target = skeletonData.slots[input.readInt(true)];
      data.positionMode = _SkeletonBinary.PositionModeValues[input.readInt(true)];
      data.spacingMode = _SkeletonBinary.SpacingModeValues[input.readInt(true)];
      data.rotateMode = _SkeletonBinary.RotateModeValues[input.readInt(true)];
      data.offsetRotation = input.readFloat();
      data.position = input.readFloat();
      if (data.positionMode == PositionMode.Fixed)
        data.position *= scale;
      data.spacing = input.readFloat();
      if (data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed)
        data.spacing *= scale;
      data.rotateMix = input.readFloat();
      data.translateMix = input.readFloat();
      skeletonData.pathConstraints.push(data);
    }
    const defaultSkin = this.readSkin(input, skeletonData, true, nonessential);
    if (defaultSkin != null) {
      skeletonData.defaultSkin = defaultSkin;
      skeletonData.skins.push(defaultSkin);
    }
    {
      let i = skeletonData.skins.length;
      Utils.setArraySize(skeletonData.skins, n = i + input.readInt(true));
      for (; i < n; i++)
        skeletonData.skins[i] = this.readSkin(input, skeletonData, false, nonessential);
    }
    n = this.linkedMeshes.length;
    for (let i = 0; i < n; i++) {
      const linkedMesh = this.linkedMeshes[i];
      const skin = linkedMesh.skin == null ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin);
      if (skin == null)
        throw new Error(`Skin not found: ${linkedMesh.skin}`);
      const parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent);
      if (parent == null)
        throw new Error(`Parent mesh not found: ${linkedMesh.parent}`);
      linkedMesh.mesh.deformAttachment = linkedMesh.inheritDeform ? parent : linkedMesh.mesh;
      linkedMesh.mesh.setParentMesh(parent);
    }
    this.linkedMeshes.length = 0;
    n = input.readInt(true);
    for (let i = 0; i < n; i++) {
      const data = new EventData(input.readStringRef());
      data.intValue = input.readInt(false);
      data.floatValue = input.readFloat();
      data.stringValue = input.readString();
      data.audioPath = input.readString();
      if (data.audioPath != null) {
        data.volume = input.readFloat();
        data.balance = input.readFloat();
      }
      skeletonData.events.push(data);
    }
    n = input.readInt(true);
    for (let i = 0; i < n; i++)
      skeletonData.animations.push(this.readAnimation(input, input.readString(), skeletonData));
    return skeletonData;
  }
  readSkin(input, skeletonData, defaultSkin, nonessential) {
    let skin = null;
    let slotCount = 0;
    if (defaultSkin) {
      slotCount = input.readInt(true);
      if (slotCount == 0)
        return null;
      skin = new Skin("default");
    } else {
      skin = new Skin(input.readStringRef());
      skin.bones.length = input.readInt(true);
      for (let i = 0, n = skin.bones.length; i < n; i++)
        skin.bones[i] = skeletonData.bones[input.readInt(true)];
      for (let i = 0, n = input.readInt(true); i < n; i++)
        skin.constraints.push(skeletonData.ikConstraints[input.readInt(true)]);
      for (let i = 0, n = input.readInt(true); i < n; i++)
        skin.constraints.push(skeletonData.transformConstraints[input.readInt(true)]);
      for (let i = 0, n = input.readInt(true); i < n; i++)
        skin.constraints.push(skeletonData.pathConstraints[input.readInt(true)]);
      slotCount = input.readInt(true);
    }
    for (let i = 0; i < slotCount; i++) {
      const slotIndex = input.readInt(true);
      for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
        const name = input.readStringRef();
        const attachment = this.readAttachment(input, skeletonData, skin, slotIndex, name, nonessential);
        if (attachment != null)
          skin.setAttachment(slotIndex, name, attachment);
      }
    }
    return skin;
  }
  readAttachment(input, skeletonData, skin, slotIndex, attachmentName, nonessential) {
    const scale = this.scale;
    let name = input.readStringRef();
    if (name == null)
      name = attachmentName;
    const typeIndex = input.readByte();
    const type = _SkeletonBinary.AttachmentTypeValues[typeIndex];
    switch (type) {
      case AttachmentType.Region: {
        let path = input.readStringRef();
        const rotation = input.readFloat();
        const x = input.readFloat();
        const y = input.readFloat();
        const scaleX = input.readFloat();
        const scaleY = input.readFloat();
        const width = input.readFloat();
        const height = input.readFloat();
        const color = input.readInt32();
        if (path == null)
          path = name;
        const region = this.attachmentLoader.newRegionAttachment(skin, name, path);
        if (region == null)
          return null;
        region.path = path;
        region.x = x * scale;
        region.y = y * scale;
        region.scaleX = scaleX;
        region.scaleY = scaleY;
        region.rotation = rotation;
        region.width = width * scale;
        region.height = height * scale;
        Color.rgba8888ToColor(region.color, color);
        return region;
      }
      case AttachmentType.BoundingBox: {
        const vertexCount = input.readInt(true);
        const vertices = this.readVertices(input, vertexCount);
        const color = nonessential ? input.readInt32() : 0;
        const box = this.attachmentLoader.newBoundingBoxAttachment(skin, name);
        if (box == null)
          return null;
        box.worldVerticesLength = vertexCount << 1;
        box.vertices = vertices.vertices;
        box.bones = vertices.bones;
        if (nonessential)
          Color.rgba8888ToColor(box.color, color);
        return box;
      }
      case AttachmentType.Mesh: {
        let path = input.readStringRef();
        const color = input.readInt32();
        const vertexCount = input.readInt(true);
        const uvs = this.readFloatArray(input, vertexCount << 1, 1);
        const triangles = this.readShortArray(input);
        const vertices = this.readVertices(input, vertexCount);
        const hullLength = input.readInt(true);
        let edges = null;
        let width = 0;
        let height = 0;
        if (nonessential) {
          edges = this.readShortArray(input);
          width = input.readFloat();
          height = input.readFloat();
        }
        if (path == null)
          path = name;
        const mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
        if (mesh == null)
          return null;
        mesh.path = path;
        Color.rgba8888ToColor(mesh.color, color);
        mesh.bones = vertices.bones;
        mesh.vertices = vertices.vertices;
        mesh.worldVerticesLength = vertexCount << 1;
        mesh.triangles = triangles;
        mesh.regionUVs = new Float32Array(uvs);
        mesh.hullLength = hullLength << 1;
        if (nonessential) {
          mesh.edges = edges;
          mesh.width = width * scale;
          mesh.height = height * scale;
        }
        return mesh;
      }
      case AttachmentType.LinkedMesh: {
        let path = input.readStringRef();
        const color = input.readInt32();
        const skinName = input.readStringRef();
        const parent = input.readStringRef();
        const inheritDeform = input.readBoolean();
        let width = 0;
        let height = 0;
        if (nonessential) {
          width = input.readFloat();
          height = input.readFloat();
        }
        if (path == null)
          path = name;
        const mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
        if (mesh == null)
          return null;
        mesh.path = path;
        Color.rgba8888ToColor(mesh.color, color);
        if (nonessential) {
          mesh.width = width * scale;
          mesh.height = height * scale;
        }
        this.linkedMeshes.push(new LinkedMesh(mesh, skinName, slotIndex, parent, inheritDeform));
        return mesh;
      }
      case AttachmentType.Path: {
        const closed2 = input.readBoolean();
        const constantSpeed = input.readBoolean();
        const vertexCount = input.readInt(true);
        const vertices = this.readVertices(input, vertexCount);
        const lengths = Utils.newArray(vertexCount / 3, 0);
        for (let i = 0, n = lengths.length; i < n; i++)
          lengths[i] = input.readFloat() * scale;
        const color = nonessential ? input.readInt32() : 0;
        const path = this.attachmentLoader.newPathAttachment(skin, name);
        if (path == null)
          return null;
        path.closed = closed2;
        path.constantSpeed = constantSpeed;
        path.worldVerticesLength = vertexCount << 1;
        path.vertices = vertices.vertices;
        path.bones = vertices.bones;
        path.lengths = lengths;
        if (nonessential)
          Color.rgba8888ToColor(path.color, color);
        return path;
      }
      case AttachmentType.Point: {
        const rotation = input.readFloat();
        const x = input.readFloat();
        const y = input.readFloat();
        const color = nonessential ? input.readInt32() : 0;
        const point = this.attachmentLoader.newPointAttachment(skin, name);
        if (point == null)
          return null;
        point.x = x * scale;
        point.y = y * scale;
        point.rotation = rotation;
        if (nonessential)
          Color.rgba8888ToColor(point.color, color);
        return point;
      }
      case AttachmentType.Clipping: {
        const endSlotIndex = input.readInt(true);
        const vertexCount = input.readInt(true);
        const vertices = this.readVertices(input, vertexCount);
        const color = nonessential ? input.readInt32() : 0;
        const clip = this.attachmentLoader.newClippingAttachment(skin, name);
        if (clip == null)
          return null;
        clip.endSlot = skeletonData.slots[endSlotIndex];
        clip.worldVerticesLength = vertexCount << 1;
        clip.vertices = vertices.vertices;
        clip.bones = vertices.bones;
        if (nonessential)
          Color.rgba8888ToColor(clip.color, color);
        return clip;
      }
    }
    return null;
  }
  readVertices(input, vertexCount) {
    const verticesLength = vertexCount << 1;
    const vertices = new Vertices();
    const scale = this.scale;
    if (!input.readBoolean()) {
      vertices.vertices = this.readFloatArray(input, verticesLength, scale);
      return vertices;
    }
    const weights = new Array();
    const bonesArray = new Array();
    for (let i = 0; i < vertexCount; i++) {
      const boneCount = input.readInt(true);
      bonesArray.push(boneCount);
      for (let ii = 0; ii < boneCount; ii++) {
        bonesArray.push(input.readInt(true));
        weights.push(input.readFloat() * scale);
        weights.push(input.readFloat() * scale);
        weights.push(input.readFloat());
      }
    }
    vertices.vertices = Utils.toFloatArray(weights);
    vertices.bones = bonesArray;
    return vertices;
  }
  readFloatArray(input, n, scale) {
    const array = new Array(n);
    if (scale == 1) {
      for (let i = 0; i < n; i++)
        array[i] = input.readFloat();
    } else {
      for (let i = 0; i < n; i++)
        array[i] = input.readFloat() * scale;
    }
    return array;
  }
  readShortArray(input) {
    const n = input.readInt(true);
    const array = new Array(n);
    for (let i = 0; i < n; i++)
      array[i] = input.readShort();
    return array;
  }
  readAnimation(input, name, skeletonData) {
    const timelines = new Array();
    const scale = this.scale;
    let duration = 0;
    const tempColor1 = new Color();
    const tempColor2 = new Color();
    for (let i = 0, n = input.readInt(true); i < n; i++) {
      const slotIndex = input.readInt(true);
      for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
        const timelineType = input.readByte();
        const frameCount = input.readInt(true);
        switch (timelineType) {
          case _SkeletonBinary.SLOT_ATTACHMENT: {
            const timeline = new AttachmentTimeline(frameCount);
            timeline.slotIndex = slotIndex;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++)
              timeline.setFrame(frameIndex, input.readFloat(), input.readStringRef());
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[frameCount - 1]);
            break;
          }
          case _SkeletonBinary.SLOT_COLOR: {
            const timeline = new ColorTimeline(frameCount);
            timeline.slotIndex = slotIndex;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              const time = input.readFloat();
              Color.rgba8888ToColor(tempColor1, input.readInt32());
              timeline.setFrame(frameIndex, time, tempColor1.r, tempColor1.g, tempColor1.b, tempColor1.a);
              if (frameIndex < frameCount - 1)
                this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(frameCount - 1) * ColorTimeline.ENTRIES]);
            break;
          }
          case _SkeletonBinary.SLOT_TWO_COLOR: {
            const timeline = new TwoColorTimeline(frameCount);
            timeline.slotIndex = slotIndex;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              const time = input.readFloat();
              Color.rgba8888ToColor(tempColor1, input.readInt32());
              Color.rgb888ToColor(tempColor2, input.readInt32());
              timeline.setFrame(frameIndex, time, tempColor1.r, tempColor1.g, tempColor1.b, tempColor1.a, tempColor2.r, tempColor2.g, tempColor2.b);
              if (frameIndex < frameCount - 1)
                this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(frameCount - 1) * TwoColorTimeline.ENTRIES]);
            break;
          }
        }
      }
    }
    for (let i = 0, n = input.readInt(true); i < n; i++) {
      const boneIndex = input.readInt(true);
      for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
        const timelineType = input.readByte();
        const frameCount = input.readInt(true);
        switch (timelineType) {
          case _SkeletonBinary.BONE_ROTATE: {
            const timeline = new RotateTimeline(frameCount);
            timeline.boneIndex = boneIndex;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              timeline.setFrame(frameIndex, input.readFloat(), input.readFloat());
              if (frameIndex < frameCount - 1)
                this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(frameCount - 1) * RotateTimeline.ENTRIES]);
            break;
          }
          case _SkeletonBinary.BONE_TRANSLATE:
          case _SkeletonBinary.BONE_SCALE:
          case _SkeletonBinary.BONE_SHEAR: {
            let timeline;
            let timelineScale = 1;
            if (timelineType == _SkeletonBinary.BONE_SCALE)
              timeline = new ScaleTimeline(frameCount);
            else if (timelineType == _SkeletonBinary.BONE_SHEAR)
              timeline = new ShearTimeline(frameCount);
            else {
              timeline = new TranslateTimeline(frameCount);
              timelineScale = scale;
            }
            timeline.boneIndex = boneIndex;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              timeline.setFrame(frameIndex, input.readFloat(), input.readFloat() * timelineScale, input.readFloat() * timelineScale);
              if (frameIndex < frameCount - 1)
                this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(frameCount - 1) * TranslateTimeline.ENTRIES]);
            break;
          }
        }
      }
    }
    for (let i = 0, n = input.readInt(true); i < n; i++) {
      const index = input.readInt(true);
      const frameCount = input.readInt(true);
      const timeline = new IkConstraintTimeline(frameCount);
      timeline.ikConstraintIndex = index;
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        timeline.setFrame(frameIndex, input.readFloat(), input.readFloat(), input.readFloat() * scale, input.readByte(), input.readBoolean(), input.readBoolean());
        if (frameIndex < frameCount - 1)
          this.readCurve(input, frameIndex, timeline);
      }
      timelines.push(timeline);
      duration = Math.max(duration, timeline.frames[(frameCount - 1) * IkConstraintTimeline.ENTRIES]);
    }
    for (let i = 0, n = input.readInt(true); i < n; i++) {
      const index = input.readInt(true);
      const frameCount = input.readInt(true);
      const timeline = new TransformConstraintTimeline(frameCount);
      timeline.transformConstraintIndex = index;
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        timeline.setFrame(frameIndex, input.readFloat(), input.readFloat(), input.readFloat(), input.readFloat(), input.readFloat());
        if (frameIndex < frameCount - 1)
          this.readCurve(input, frameIndex, timeline);
      }
      timelines.push(timeline);
      duration = Math.max(duration, timeline.frames[(frameCount - 1) * TransformConstraintTimeline.ENTRIES]);
    }
    for (let i = 0, n = input.readInt(true); i < n; i++) {
      const index = input.readInt(true);
      const data = skeletonData.pathConstraints[index];
      for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
        const timelineType = input.readByte();
        const frameCount = input.readInt(true);
        switch (timelineType) {
          case _SkeletonBinary.PATH_POSITION:
          case _SkeletonBinary.PATH_SPACING: {
            let timeline;
            let timelineScale = 1;
            if (timelineType == _SkeletonBinary.PATH_SPACING) {
              timeline = new PathConstraintSpacingTimeline(frameCount);
              if (data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed)
                timelineScale = scale;
            } else {
              timeline = new PathConstraintPositionTimeline(frameCount);
              if (data.positionMode == PositionMode.Fixed)
                timelineScale = scale;
            }
            timeline.pathConstraintIndex = index;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              timeline.setFrame(frameIndex, input.readFloat(), input.readFloat() * timelineScale);
              if (frameIndex < frameCount - 1)
                this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(frameCount - 1) * PathConstraintPositionTimeline.ENTRIES]);
            break;
          }
          case _SkeletonBinary.PATH_MIX: {
            const timeline = new PathConstraintMixTimeline(frameCount);
            timeline.pathConstraintIndex = index;
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
              timeline.setFrame(frameIndex, input.readFloat(), input.readFloat(), input.readFloat());
              if (frameIndex < frameCount - 1)
                this.readCurve(input, frameIndex, timeline);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(frameCount - 1) * PathConstraintMixTimeline.ENTRIES]);
            break;
          }
        }
      }
    }
    for (let i = 0, n = input.readInt(true); i < n; i++) {
      const skin = skeletonData.skins[input.readInt(true)];
      for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
        const slotIndex = input.readInt(true);
        for (let iii = 0, nnn = input.readInt(true); iii < nnn; iii++) {
          const attachment = skin.getAttachment(slotIndex, input.readStringRef());
          const weighted = attachment.bones != null;
          const vertices = attachment.vertices;
          const deformLength = weighted ? vertices.length / 3 * 2 : vertices.length;
          const frameCount = input.readInt(true);
          const timeline = new DeformTimeline(frameCount);
          timeline.slotIndex = slotIndex;
          timeline.attachment = attachment;
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
            const time = input.readFloat();
            let deform;
            let end = input.readInt(true);
            if (end == 0)
              deform = weighted ? Utils.newFloatArray(deformLength) : vertices;
            else {
              deform = Utils.newFloatArray(deformLength);
              const start = input.readInt(true);
              end += start;
              if (scale == 1) {
                for (let v = start; v < end; v++)
                  deform[v] = input.readFloat();
              } else {
                for (let v = start; v < end; v++)
                  deform[v] = input.readFloat() * scale;
              }
              if (!weighted) {
                for (let v = 0, vn = deform.length; v < vn; v++)
                  deform[v] += vertices[v];
              }
            }
            timeline.setFrame(frameIndex, time, deform);
            if (frameIndex < frameCount - 1)
              this.readCurve(input, frameIndex, timeline);
          }
          timelines.push(timeline);
          duration = Math.max(duration, timeline.frames[frameCount - 1]);
        }
      }
    }
    const drawOrderCount = input.readInt(true);
    if (drawOrderCount > 0) {
      const timeline = new DrawOrderTimeline(drawOrderCount);
      const slotCount = skeletonData.slots.length;
      for (let i = 0; i < drawOrderCount; i++) {
        const time = input.readFloat();
        const offsetCount = input.readInt(true);
        const drawOrder = Utils.newArray(slotCount, 0);
        for (let ii = slotCount - 1; ii >= 0; ii--)
          drawOrder[ii] = -1;
        const unchanged = Utils.newArray(slotCount - offsetCount, 0);
        let originalIndex = 0;
        let unchangedIndex = 0;
        for (let ii = 0; ii < offsetCount; ii++) {
          const slotIndex = input.readInt(true);
          while (originalIndex != slotIndex)
            unchanged[unchangedIndex++] = originalIndex++;
          drawOrder[originalIndex + input.readInt(true)] = originalIndex++;
        }
        while (originalIndex < slotCount)
          unchanged[unchangedIndex++] = originalIndex++;
        for (let ii = slotCount - 1; ii >= 0; ii--)
          if (drawOrder[ii] == -1)
            drawOrder[ii] = unchanged[--unchangedIndex];
        timeline.setFrame(i, time, drawOrder);
      }
      timelines.push(timeline);
      duration = Math.max(duration, timeline.frames[drawOrderCount - 1]);
    }
    const eventCount = input.readInt(true);
    if (eventCount > 0) {
      const timeline = new EventTimeline(eventCount);
      for (let i = 0; i < eventCount; i++) {
        const time = input.readFloat();
        const eventData = skeletonData.events[input.readInt(true)];
        const event = new Event(time, eventData);
        event.intValue = input.readInt(false);
        event.floatValue = input.readFloat();
        event.stringValue = input.readBoolean() ? input.readString() : eventData.stringValue;
        if (event.data.audioPath != null) {
          event.volume = input.readFloat();
          event.balance = input.readFloat();
        }
        timeline.setFrame(i, event);
      }
      timelines.push(timeline);
      duration = Math.max(duration, timeline.frames[eventCount - 1]);
    }
    return new Animation(name, timelines, duration);
  }
  readCurve(input, frameIndex, timeline) {
    switch (input.readByte()) {
      case _SkeletonBinary.CURVE_STEPPED:
        timeline.setStepped(frameIndex);
        break;
      case _SkeletonBinary.CURVE_BEZIER:
        this.setCurve(timeline, frameIndex, input.readFloat(), input.readFloat(), input.readFloat(), input.readFloat());
        break;
    }
  }
  setCurve(timeline, frameIndex, cx1, cy1, cx2, cy2) {
    timeline.setCurve(frameIndex, cx1, cy1, cx2, cy2);
  }
};
var SkeletonBinary = _SkeletonBinary;
SkeletonBinary.AttachmentTypeValues = [
  0,
  1,
  2,
  3,
  4,
  5,
  6
];
SkeletonBinary.TransformModeValues = [
  TransformMode.Normal,
  TransformMode.OnlyTranslation,
  TransformMode.NoRotationOrReflection,
  TransformMode.NoScale,
  TransformMode.NoScaleOrReflection
];
SkeletonBinary.PositionModeValues = [PositionMode.Fixed, PositionMode.Percent];
SkeletonBinary.SpacingModeValues = [SpacingMode.Length, SpacingMode.Fixed, SpacingMode.Percent];
SkeletonBinary.RotateModeValues = [RotateMode.Tangent, RotateMode.Chain, RotateMode.ChainScale];
SkeletonBinary.BlendModeValues = [BLEND_MODES.NORMAL, BLEND_MODES.ADD, BLEND_MODES.MULTIPLY, BLEND_MODES.SCREEN];
SkeletonBinary.BONE_ROTATE = 0;
SkeletonBinary.BONE_TRANSLATE = 1;
SkeletonBinary.BONE_SCALE = 2;
SkeletonBinary.BONE_SHEAR = 3;
SkeletonBinary.SLOT_ATTACHMENT = 0;
SkeletonBinary.SLOT_COLOR = 1;
SkeletonBinary.SLOT_TWO_COLOR = 2;
SkeletonBinary.PATH_POSITION = 0;
SkeletonBinary.PATH_SPACING = 1;
SkeletonBinary.PATH_MIX = 2;
SkeletonBinary.CURVE_LINEAR = 0;
SkeletonBinary.CURVE_STEPPED = 1;
SkeletonBinary.CURVE_BEZIER = 2;
var LinkedMesh = class {
  constructor(mesh, skin, slotIndex, parent, inheritDeform) {
    this.mesh = mesh;
    this.skin = skin;
    this.slotIndex = slotIndex;
    this.parent = parent;
    this.inheritDeform = inheritDeform;
  }
};
var Vertices = class {
  constructor(bones = null, vertices = null) {
    this.bones = bones;
    this.vertices = vertices;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/SkeletonBounds.mjs
var SkeletonBounds = class extends SkeletonBoundsBase {
};

// node_modules/@pixi-spine/runtime-3.8/lib/core/SkeletonJson.mjs
var SkeletonJson = class _SkeletonJson {
  constructor(attachmentLoader) {
    this.scale = 1;
    this.linkedMeshes = new Array();
    this.attachmentLoader = attachmentLoader;
  }
  readSkeletonData(json) {
    const scale = this.scale;
    const skeletonData = new SkeletonData();
    const root = typeof json === "string" ? JSON.parse(json) : json;
    const skeletonMap = root.skeleton;
    if (skeletonMap != null) {
      skeletonData.hash = skeletonMap.hash;
      skeletonData.version = skeletonMap.spine;
      if (skeletonData.version.substr(0, 3) !== "3.8") {
        const error = `Spine 3.8 loader cant load version ${skeletonMap.spine}. Please configure your pixi-spine bundle`;
        console.error(error);
      }
      if (skeletonData.version === "3.8.75") {
        const error = `Unsupported skeleton data, 3.8.75 is deprecated, please export with a newer version of Spine.`;
        console.error(error);
      }
      skeletonData.x = skeletonMap.x;
      skeletonData.y = skeletonMap.y;
      skeletonData.width = skeletonMap.width;
      skeletonData.height = skeletonMap.height;
      skeletonData.fps = skeletonMap.fps;
      skeletonData.imagesPath = skeletonMap.images;
    }
    if (root.bones) {
      for (let i = 0; i < root.bones.length; i++) {
        const boneMap = root.bones[i];
        let parent = null;
        const parentName = this.getValue(boneMap, "parent", null);
        if (parentName != null) {
          parent = skeletonData.findBone(parentName);
          if (parent == null)
            throw new Error(`Parent bone not found: ${parentName}`);
        }
        const data = new BoneData(skeletonData.bones.length, boneMap.name, parent);
        data.length = this.getValue(boneMap, "length", 0) * scale;
        data.x = this.getValue(boneMap, "x", 0) * scale;
        data.y = this.getValue(boneMap, "y", 0) * scale;
        data.rotation = this.getValue(boneMap, "rotation", 0);
        data.scaleX = this.getValue(boneMap, "scaleX", 1);
        data.scaleY = this.getValue(boneMap, "scaleY", 1);
        data.shearX = this.getValue(boneMap, "shearX", 0);
        data.shearY = this.getValue(boneMap, "shearY", 0);
        data.transformMode = _SkeletonJson.transformModeFromString(this.getValue(boneMap, "transform", "normal"));
        data.skinRequired = this.getValue(boneMap, "skin", false);
        skeletonData.bones.push(data);
      }
    }
    if (root.slots) {
      for (let i = 0; i < root.slots.length; i++) {
        const slotMap = root.slots[i];
        const slotName = slotMap.name;
        const boneName = slotMap.bone;
        const boneData = skeletonData.findBone(boneName);
        if (boneData == null)
          throw new Error(`Slot bone not found: ${boneName}`);
        const data = new SlotData(skeletonData.slots.length, slotName, boneData);
        const color = this.getValue(slotMap, "color", null);
        if (color != null)
          data.color.setFromString(color);
        const dark = this.getValue(slotMap, "dark", null);
        if (dark != null) {
          data.darkColor = new Color(1, 1, 1, 1);
          data.darkColor.setFromString(dark);
        }
        data.attachmentName = this.getValue(slotMap, "attachment", null);
        data.blendMode = _SkeletonJson.blendModeFromString(this.getValue(slotMap, "blend", "normal"));
        skeletonData.slots.push(data);
      }
    }
    if (root.ik) {
      for (let i = 0; i < root.ik.length; i++) {
        const constraintMap = root.ik[i];
        const data = new IkConstraintData(constraintMap.name);
        data.order = this.getValue(constraintMap, "order", 0);
        data.skinRequired = this.getValue(constraintMap, "skin", false);
        for (let j = 0; j < constraintMap.bones.length; j++) {
          const boneName = constraintMap.bones[j];
          const bone = skeletonData.findBone(boneName);
          if (bone == null)
            throw new Error(`IK bone not found: ${boneName}`);
          data.bones.push(bone);
        }
        const targetName = constraintMap.target;
        data.target = skeletonData.findBone(targetName);
        if (data.target == null)
          throw new Error(`IK target bone not found: ${targetName}`);
        data.mix = this.getValue(constraintMap, "mix", 1);
        data.softness = this.getValue(constraintMap, "softness", 0) * scale;
        data.bendDirection = this.getValue(constraintMap, "bendPositive", true) ? 1 : -1;
        data.compress = this.getValue(constraintMap, "compress", false);
        data.stretch = this.getValue(constraintMap, "stretch", false);
        data.uniform = this.getValue(constraintMap, "uniform", false);
        skeletonData.ikConstraints.push(data);
      }
    }
    if (root.transform) {
      for (let i = 0; i < root.transform.length; i++) {
        const constraintMap = root.transform[i];
        const data = new TransformConstraintData(constraintMap.name);
        data.order = this.getValue(constraintMap, "order", 0);
        data.skinRequired = this.getValue(constraintMap, "skin", false);
        for (let j = 0; j < constraintMap.bones.length; j++) {
          const boneName = constraintMap.bones[j];
          const bone = skeletonData.findBone(boneName);
          if (bone == null)
            throw new Error(`Transform constraint bone not found: ${boneName}`);
          data.bones.push(bone);
        }
        const targetName = constraintMap.target;
        data.target = skeletonData.findBone(targetName);
        if (data.target == null)
          throw new Error(`Transform constraint target bone not found: ${targetName}`);
        data.local = this.getValue(constraintMap, "local", false);
        data.relative = this.getValue(constraintMap, "relative", false);
        data.offsetRotation = this.getValue(constraintMap, "rotation", 0);
        data.offsetX = this.getValue(constraintMap, "x", 0) * scale;
        data.offsetY = this.getValue(constraintMap, "y", 0) * scale;
        data.offsetScaleX = this.getValue(constraintMap, "scaleX", 0);
        data.offsetScaleY = this.getValue(constraintMap, "scaleY", 0);
        data.offsetShearY = this.getValue(constraintMap, "shearY", 0);
        data.rotateMix = this.getValue(constraintMap, "rotateMix", 1);
        data.translateMix = this.getValue(constraintMap, "translateMix", 1);
        data.scaleMix = this.getValue(constraintMap, "scaleMix", 1);
        data.shearMix = this.getValue(constraintMap, "shearMix", 1);
        skeletonData.transformConstraints.push(data);
      }
    }
    if (root.path) {
      for (let i = 0; i < root.path.length; i++) {
        const constraintMap = root.path[i];
        const data = new PathConstraintData(constraintMap.name);
        data.order = this.getValue(constraintMap, "order", 0);
        data.skinRequired = this.getValue(constraintMap, "skin", false);
        for (let j = 0; j < constraintMap.bones.length; j++) {
          const boneName = constraintMap.bones[j];
          const bone = skeletonData.findBone(boneName);
          if (bone == null)
            throw new Error(`Transform constraint bone not found: ${boneName}`);
          data.bones.push(bone);
        }
        const targetName = constraintMap.target;
        data.target = skeletonData.findSlot(targetName);
        if (data.target == null)
          throw new Error(`Path target slot not found: ${targetName}`);
        data.positionMode = _SkeletonJson.positionModeFromString(this.getValue(constraintMap, "positionMode", "percent"));
        data.spacingMode = _SkeletonJson.spacingModeFromString(this.getValue(constraintMap, "spacingMode", "length"));
        data.rotateMode = _SkeletonJson.rotateModeFromString(this.getValue(constraintMap, "rotateMode", "tangent"));
        data.offsetRotation = this.getValue(constraintMap, "rotation", 0);
        data.position = this.getValue(constraintMap, "position", 0);
        if (data.positionMode == PositionMode.Fixed)
          data.position *= scale;
        data.spacing = this.getValue(constraintMap, "spacing", 0);
        if (data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed)
          data.spacing *= scale;
        data.rotateMix = this.getValue(constraintMap, "rotateMix", 1);
        data.translateMix = this.getValue(constraintMap, "translateMix", 1);
        skeletonData.pathConstraints.push(data);
      }
    }
    if (root.skins) {
      for (let i = 0; i < root.skins.length; i++) {
        const skinMap = root.skins[i];
        const skin = new Skin(skinMap.name);
        if (skinMap.bones) {
          for (let ii = 0; ii < skinMap.bones.length; ii++) {
            const bone = skeletonData.findBone(skinMap.bones[ii]);
            if (bone == null)
              throw new Error(`Skin bone not found: ${skinMap.bones[i]}`);
            skin.bones.push(bone);
          }
        }
        if (skinMap.ik) {
          for (let ii = 0; ii < skinMap.ik.length; ii++) {
            const constraint = skeletonData.findIkConstraint(skinMap.ik[ii]);
            if (constraint == null)
              throw new Error(`Skin IK constraint not found: ${skinMap.ik[i]}`);
            skin.constraints.push(constraint);
          }
        }
        if (skinMap.transform) {
          for (let ii = 0; ii < skinMap.transform.length; ii++) {
            const constraint = skeletonData.findTransformConstraint(skinMap.transform[ii]);
            if (constraint == null)
              throw new Error(`Skin transform constraint not found: ${skinMap.transform[i]}`);
            skin.constraints.push(constraint);
          }
        }
        if (skinMap.path) {
          for (let ii = 0; ii < skinMap.path.length; ii++) {
            const constraint = skeletonData.findPathConstraint(skinMap.path[ii]);
            if (constraint == null)
              throw new Error(`Skin path constraint not found: ${skinMap.path[i]}`);
            skin.constraints.push(constraint);
          }
        }
        for (const slotName in skinMap.attachments) {
          const slot = skeletonData.findSlot(slotName);
          if (slot == null)
            throw new Error(`Slot not found: ${slotName}`);
          const slotMap = skinMap.attachments[slotName];
          for (const entryName in slotMap) {
            const attachment = this.readAttachment(slotMap[entryName], skin, slot.index, entryName, skeletonData);
            if (attachment != null)
              skin.setAttachment(slot.index, entryName, attachment);
          }
        }
        skeletonData.skins.push(skin);
        if (skin.name == "default")
          skeletonData.defaultSkin = skin;
      }
    }
    for (let i = 0, n = this.linkedMeshes.length; i < n; i++) {
      const linkedMesh = this.linkedMeshes[i];
      const skin = linkedMesh.skin == null ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin);
      if (skin == null)
        throw new Error(`Skin not found: ${linkedMesh.skin}`);
      const parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent);
      if (parent == null)
        throw new Error(`Parent mesh not found: ${linkedMesh.parent}`);
      linkedMesh.mesh.deformAttachment = linkedMesh.inheritDeform ? parent : linkedMesh.mesh;
      linkedMesh.mesh.setParentMesh(parent);
    }
    this.linkedMeshes.length = 0;
    if (root.events) {
      for (const eventName in root.events) {
        const eventMap = root.events[eventName];
        const data = new EventData(eventName);
        data.intValue = this.getValue(eventMap, "int", 0);
        data.floatValue = this.getValue(eventMap, "float", 0);
        data.stringValue = this.getValue(eventMap, "string", "");
        data.audioPath = this.getValue(eventMap, "audio", null);
        if (data.audioPath != null) {
          data.volume = this.getValue(eventMap, "volume", 1);
          data.balance = this.getValue(eventMap, "balance", 0);
        }
        skeletonData.events.push(data);
      }
    }
    if (root.animations) {
      for (const animationName in root.animations) {
        const animationMap = root.animations[animationName];
        this.readAnimation(animationMap, animationName, skeletonData);
      }
    }
    return skeletonData;
  }
  readAttachment(map, skin, slotIndex, name, skeletonData) {
    const scale = this.scale;
    name = this.getValue(map, "name", name);
    const type = this.getValue(map, "type", "region");
    switch (type) {
      case "region": {
        const path = this.getValue(map, "path", name);
        const region = this.attachmentLoader.newRegionAttachment(skin, name, path);
        if (region == null)
          return null;
        region.path = path;
        region.x = this.getValue(map, "x", 0) * scale;
        region.y = this.getValue(map, "y", 0) * scale;
        region.scaleX = this.getValue(map, "scaleX", 1);
        region.scaleY = this.getValue(map, "scaleY", 1);
        region.rotation = this.getValue(map, "rotation", 0);
        region.width = map.width * scale;
        region.height = map.height * scale;
        const color = this.getValue(map, "color", null);
        if (color != null)
          region.color.setFromString(color);
        return region;
      }
      case "boundingbox": {
        const box = this.attachmentLoader.newBoundingBoxAttachment(skin, name);
        if (box == null)
          return null;
        this.readVertices(map, box, map.vertexCount << 1);
        const color = this.getValue(map, "color", null);
        if (color != null)
          box.color.setFromString(color);
        return box;
      }
      case "mesh":
      case "linkedmesh": {
        const path = this.getValue(map, "path", name);
        const mesh = this.attachmentLoader.newMeshAttachment(skin, name, path);
        if (mesh == null)
          return null;
        mesh.path = path;
        const color = this.getValue(map, "color", null);
        if (color != null)
          mesh.color.setFromString(color);
        mesh.width = this.getValue(map, "width", 0) * scale;
        mesh.height = this.getValue(map, "height", 0) * scale;
        const parent = this.getValue(map, "parent", null);
        if (parent != null) {
          this.linkedMeshes.push(new LinkedMesh2(mesh, this.getValue(map, "skin", null), slotIndex, parent, this.getValue(map, "deform", true)));
          return mesh;
        }
        const uvs = map.uvs;
        this.readVertices(map, mesh, uvs.length);
        mesh.triangles = map.triangles;
        mesh.regionUVs = new Float32Array(uvs);
        mesh.edges = this.getValue(map, "edges", null);
        mesh.hullLength = this.getValue(map, "hull", 0) * 2;
        return mesh;
      }
      case "path": {
        const path = this.attachmentLoader.newPathAttachment(skin, name);
        if (path == null)
          return null;
        path.closed = this.getValue(map, "closed", false);
        path.constantSpeed = this.getValue(map, "constantSpeed", true);
        const vertexCount = map.vertexCount;
        this.readVertices(map, path, vertexCount << 1);
        const lengths = Utils.newArray(vertexCount / 3, 0);
        for (let i = 0; i < map.lengths.length; i++)
          lengths[i] = map.lengths[i] * scale;
        path.lengths = lengths;
        const color = this.getValue(map, "color", null);
        if (color != null)
          path.color.setFromString(color);
        return path;
      }
      case "point": {
        const point = this.attachmentLoader.newPointAttachment(skin, name);
        if (point == null)
          return null;
        point.x = this.getValue(map, "x", 0) * scale;
        point.y = this.getValue(map, "y", 0) * scale;
        point.rotation = this.getValue(map, "rotation", 0);
        const color = this.getValue(map, "color", null);
        if (color != null)
          point.color.setFromString(color);
        return point;
      }
      case "clipping": {
        const clip = this.attachmentLoader.newClippingAttachment(skin, name);
        if (clip == null)
          return null;
        const end = this.getValue(map, "end", null);
        if (end != null) {
          const slot = skeletonData.findSlot(end);
          if (slot == null)
            throw new Error(`Clipping end slot not found: ${end}`);
          clip.endSlot = slot;
        }
        const vertexCount = map.vertexCount;
        this.readVertices(map, clip, vertexCount << 1);
        const color = this.getValue(map, "color", null);
        if (color != null)
          clip.color.setFromString(color);
        return clip;
      }
    }
    return null;
  }
  readVertices(map, attachment, verticesLength) {
    const scale = this.scale;
    attachment.worldVerticesLength = verticesLength;
    const vertices = map.vertices;
    if (verticesLength == vertices.length) {
      const scaledVertices = Utils.toFloatArray(vertices);
      if (scale != 1) {
        for (let i = 0, n = vertices.length; i < n; i++)
          scaledVertices[i] *= scale;
      }
      attachment.vertices = scaledVertices;
      return;
    }
    const weights = new Array();
    const bones = new Array();
    for (let i = 0, n = vertices.length; i < n; ) {
      const boneCount = vertices[i++];
      bones.push(boneCount);
      for (let nn = i + boneCount * 4; i < nn; i += 4) {
        bones.push(vertices[i]);
        weights.push(vertices[i + 1] * scale);
        weights.push(vertices[i + 2] * scale);
        weights.push(vertices[i + 3]);
      }
    }
    attachment.bones = bones;
    attachment.vertices = Utils.toFloatArray(weights);
  }
  readAnimation(map, name, skeletonData) {
    const scale = this.scale;
    const timelines = new Array();
    let duration = 0;
    if (map.slots) {
      for (const slotName in map.slots) {
        const slotMap = map.slots[slotName];
        const slotIndex = skeletonData.findSlotIndex(slotName);
        if (slotIndex == -1)
          throw new Error(`Slot not found: ${slotName}`);
        for (const timelineName in slotMap) {
          const timelineMap = slotMap[timelineName];
          if (timelineName == "attachment") {
            const timeline = new AttachmentTimeline(timelineMap.length);
            timeline.slotIndex = slotIndex;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              timeline.setFrame(frameIndex++, this.getValue(valueMap, "time", 0), valueMap.name);
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
          } else if (timelineName == "color") {
            const timeline = new ColorTimeline(timelineMap.length);
            timeline.slotIndex = slotIndex;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              const color = new Color();
              color.setFromString(valueMap.color || "ffffffff");
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), color.r, color.g, color.b, color.a);
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * ColorTimeline.ENTRIES]);
          } else if (timelineName == "twoColor") {
            const timeline = new TwoColorTimeline(timelineMap.length);
            timeline.slotIndex = slotIndex;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              const light = new Color();
              const dark = new Color();
              light.setFromString(valueMap.light);
              dark.setFromString(valueMap.dark);
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), light.r, light.g, light.b, light.a, dark.r, dark.g, dark.b);
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * TwoColorTimeline.ENTRIES]);
          } else
            throw new Error(`Invalid timeline type for a slot: ${timelineName} (${slotName})`);
        }
      }
    }
    if (map.bones) {
      for (const boneName in map.bones) {
        const boneMap = map.bones[boneName];
        const boneIndex = skeletonData.findBoneIndex(boneName);
        if (boneIndex == -1)
          throw new Error(`Bone not found: ${boneName}`);
        for (const timelineName in boneMap) {
          const timelineMap = boneMap[timelineName];
          if (timelineName === "rotate") {
            const timeline = new RotateTimeline(timelineMap.length);
            timeline.boneIndex = boneIndex;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), this.getValue(valueMap, "angle", 0));
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * RotateTimeline.ENTRIES]);
          } else if (timelineName === "translate" || timelineName === "scale" || timelineName === "shear") {
            let timeline = null;
            let timelineScale = 1;
            let defaultValue = 0;
            if (timelineName === "scale") {
              timeline = new ScaleTimeline(timelineMap.length);
              defaultValue = 1;
            } else if (timelineName === "shear")
              timeline = new ShearTimeline(timelineMap.length);
            else {
              timeline = new TranslateTimeline(timelineMap.length);
              timelineScale = scale;
            }
            timeline.boneIndex = boneIndex;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              const x = this.getValue(valueMap, "x", defaultValue);
              const y = this.getValue(valueMap, "y", defaultValue);
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), x * timelineScale, y * timelineScale);
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * TranslateTimeline.ENTRIES]);
          } else
            throw new Error(`Invalid timeline type for a bone: ${timelineName} (${boneName})`);
        }
      }
    }
    if (map.ik) {
      for (const constraintName in map.ik) {
        const constraintMap = map.ik[constraintName];
        const constraint = skeletonData.findIkConstraint(constraintName);
        const timeline = new IkConstraintTimeline(constraintMap.length);
        timeline.ikConstraintIndex = skeletonData.ikConstraints.indexOf(constraint);
        let frameIndex = 0;
        for (let i = 0; i < constraintMap.length; i++) {
          const valueMap = constraintMap[i];
          timeline.setFrame(
            frameIndex,
            this.getValue(valueMap, "time", 0),
            this.getValue(valueMap, "mix", 1),
            this.getValue(valueMap, "softness", 0) * scale,
            this.getValue(valueMap, "bendPositive", true) ? 1 : -1,
            this.getValue(valueMap, "compress", false),
            this.getValue(valueMap, "stretch", false)
          );
          this.readCurve(valueMap, timeline, frameIndex);
          frameIndex++;
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * IkConstraintTimeline.ENTRIES]);
      }
    }
    if (map.transform) {
      for (const constraintName in map.transform) {
        const constraintMap = map.transform[constraintName];
        const constraint = skeletonData.findTransformConstraint(constraintName);
        const timeline = new TransformConstraintTimeline(constraintMap.length);
        timeline.transformConstraintIndex = skeletonData.transformConstraints.indexOf(constraint);
        let frameIndex = 0;
        for (let i = 0; i < constraintMap.length; i++) {
          const valueMap = constraintMap[i];
          timeline.setFrame(
            frameIndex,
            this.getValue(valueMap, "time", 0),
            this.getValue(valueMap, "rotateMix", 1),
            this.getValue(valueMap, "translateMix", 1),
            this.getValue(valueMap, "scaleMix", 1),
            this.getValue(valueMap, "shearMix", 1)
          );
          this.readCurve(valueMap, timeline, frameIndex);
          frameIndex++;
        }
        timelines.push(timeline);
        duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * TransformConstraintTimeline.ENTRIES]);
      }
    }
    if (map.path) {
      for (const constraintName in map.path) {
        const constraintMap = map.path[constraintName];
        const index = skeletonData.findPathConstraintIndex(constraintName);
        if (index == -1)
          throw new Error(`Path constraint not found: ${constraintName}`);
        const data = skeletonData.pathConstraints[index];
        for (const timelineName in constraintMap) {
          const timelineMap = constraintMap[timelineName];
          if (timelineName === "position" || timelineName === "spacing") {
            let timeline = null;
            let timelineScale = 1;
            if (timelineName === "spacing") {
              timeline = new PathConstraintSpacingTimeline(timelineMap.length);
              if (data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed)
                timelineScale = scale;
            } else {
              timeline = new PathConstraintPositionTimeline(timelineMap.length);
              if (data.positionMode == PositionMode.Fixed)
                timelineScale = scale;
            }
            timeline.pathConstraintIndex = index;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), this.getValue(valueMap, timelineName, 0) * timelineScale);
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * PathConstraintPositionTimeline.ENTRIES]);
          } else if (timelineName === "mix") {
            const timeline = new PathConstraintMixTimeline(timelineMap.length);
            timeline.pathConstraintIndex = index;
            let frameIndex = 0;
            for (let i = 0; i < timelineMap.length; i++) {
              const valueMap = timelineMap[i];
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), this.getValue(valueMap, "rotateMix", 1), this.getValue(valueMap, "translateMix", 1));
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[(timeline.getFrameCount() - 1) * PathConstraintMixTimeline.ENTRIES]);
          }
        }
      }
    }
    if (map.deform) {
      for (const deformName in map.deform) {
        const deformMap = map.deform[deformName];
        const skin = skeletonData.findSkin(deformName);
        if (skin == null) {
          if (settings2.FAIL_ON_NON_EXISTING_SKIN) {
            throw new Error(`Skin not found: ${deformName}`);
          } else {
            continue;
          }
        }
        for (const slotName in deformMap) {
          const slotMap = deformMap[slotName];
          const slotIndex = skeletonData.findSlotIndex(slotName);
          if (slotIndex == -1)
            throw new Error(`Slot not found: ${slotMap.name}`);
          for (const timelineName in slotMap) {
            const timelineMap = slotMap[timelineName];
            const attachment = skin.getAttachment(slotIndex, timelineName);
            if (attachment == null)
              throw new Error(`Deform attachment not found: ${timelineMap.name}`);
            const weighted = attachment.bones != null;
            const vertices = attachment.vertices;
            const deformLength = weighted ? vertices.length / 3 * 2 : vertices.length;
            const timeline = new DeformTimeline(timelineMap.length);
            timeline.slotIndex = slotIndex;
            timeline.attachment = attachment;
            let frameIndex = 0;
            for (let j = 0; j < timelineMap.length; j++) {
              const valueMap = timelineMap[j];
              let deform;
              const verticesValue = this.getValue(valueMap, "vertices", null);
              if (verticesValue == null)
                deform = weighted ? Utils.newFloatArray(deformLength) : vertices;
              else {
                deform = Utils.newFloatArray(deformLength);
                const start = this.getValue(valueMap, "offset", 0);
                Utils.arrayCopy(verticesValue, 0, deform, start, verticesValue.length);
                if (scale != 1) {
                  for (let i = start, n = i + verticesValue.length; i < n; i++)
                    deform[i] *= scale;
                }
                if (!weighted) {
                  for (let i = 0; i < deformLength; i++)
                    deform[i] += vertices[i];
                }
              }
              timeline.setFrame(frameIndex, this.getValue(valueMap, "time", 0), deform);
              this.readCurve(valueMap, timeline, frameIndex);
              frameIndex++;
            }
            timelines.push(timeline);
            duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
          }
        }
      }
    }
    let drawOrderNode = map.drawOrder;
    if (drawOrderNode == null)
      drawOrderNode = map.draworder;
    if (drawOrderNode != null) {
      const timeline = new DrawOrderTimeline(drawOrderNode.length);
      const slotCount = skeletonData.slots.length;
      let frameIndex = 0;
      for (let j = 0; j < drawOrderNode.length; j++) {
        const drawOrderMap = drawOrderNode[j];
        let drawOrder = null;
        const offsets = this.getValue(drawOrderMap, "offsets", null);
        if (offsets != null) {
          drawOrder = Utils.newArray(slotCount, -1);
          const unchanged = Utils.newArray(slotCount - offsets.length, 0);
          let originalIndex = 0;
          let unchangedIndex = 0;
          for (let i = 0; i < offsets.length; i++) {
            const offsetMap = offsets[i];
            const slotIndex = skeletonData.findSlotIndex(offsetMap.slot);
            if (slotIndex == -1)
              throw new Error(`Slot not found: ${offsetMap.slot}`);
            while (originalIndex != slotIndex)
              unchanged[unchangedIndex++] = originalIndex++;
            drawOrder[originalIndex + offsetMap.offset] = originalIndex++;
          }
          while (originalIndex < slotCount)
            unchanged[unchangedIndex++] = originalIndex++;
          for (let i = slotCount - 1; i >= 0; i--)
            if (drawOrder[i] == -1)
              drawOrder[i] = unchanged[--unchangedIndex];
        }
        timeline.setFrame(frameIndex++, this.getValue(drawOrderMap, "time", 0), drawOrder);
      }
      timelines.push(timeline);
      duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
    }
    if (map.events) {
      const timeline = new EventTimeline(map.events.length);
      let frameIndex = 0;
      for (let i = 0; i < map.events.length; i++) {
        const eventMap = map.events[i];
        const eventData = skeletonData.findEvent(eventMap.name);
        if (eventData == null)
          throw new Error(`Event not found: ${eventMap.name}`);
        const event = new Event(Utils.toSinglePrecision(this.getValue(eventMap, "time", 0)), eventData);
        event.intValue = this.getValue(eventMap, "int", eventData.intValue);
        event.floatValue = this.getValue(eventMap, "float", eventData.floatValue);
        event.stringValue = this.getValue(eventMap, "string", eventData.stringValue);
        if (event.data.audioPath != null) {
          event.volume = this.getValue(eventMap, "volume", 1);
          event.balance = this.getValue(eventMap, "balance", 0);
        }
        timeline.setFrame(frameIndex++, event);
      }
      timelines.push(timeline);
      duration = Math.max(duration, timeline.frames[timeline.getFrameCount() - 1]);
    }
    if (isNaN(duration)) {
      throw new Error("Error while parsing animation, duration is NaN");
    }
    skeletonData.animations.push(new Animation(name, timelines, duration));
  }
  readCurve(map, timeline, frameIndex) {
    if (!map.hasOwnProperty("curve"))
      return;
    if (map.curve === "stepped")
      timeline.setStepped(frameIndex);
    else {
      const curve = map.curve;
      timeline.setCurve(frameIndex, curve, this.getValue(map, "c2", 0), this.getValue(map, "c3", 1), this.getValue(map, "c4", 1));
    }
  }
  getValue(map, prop, defaultValue) {
    return map[prop] !== void 0 ? map[prop] : defaultValue;
  }
  static blendModeFromString(str) {
    str = str.toLowerCase();
    if (str == "normal")
      return BLEND_MODES.NORMAL;
    if (str == "additive")
      return BLEND_MODES.ADD;
    if (str == "multiply")
      return BLEND_MODES.MULTIPLY;
    if (str == "screen")
      return BLEND_MODES.SCREEN;
    throw new Error(`Unknown blend mode: ${str}`);
  }
  static positionModeFromString(str) {
    str = str.toLowerCase();
    if (str == "fixed")
      return PositionMode.Fixed;
    if (str == "percent")
      return PositionMode.Percent;
    throw new Error(`Unknown position mode: ${str}`);
  }
  static spacingModeFromString(str) {
    str = str.toLowerCase();
    if (str == "length")
      return SpacingMode.Length;
    if (str == "fixed")
      return SpacingMode.Fixed;
    if (str == "percent")
      return SpacingMode.Percent;
    throw new Error(`Unknown position mode: ${str}`);
  }
  static rotateModeFromString(str) {
    str = str.toLowerCase();
    if (str == "tangent")
      return RotateMode.Tangent;
    if (str == "chain")
      return RotateMode.Chain;
    if (str == "chainscale")
      return RotateMode.ChainScale;
    throw new Error(`Unknown rotate mode: ${str}`);
  }
  static transformModeFromString(str) {
    str = str.toLowerCase();
    if (str == "normal")
      return TransformMode.Normal;
    if (str == "onlytranslation")
      return TransformMode.OnlyTranslation;
    if (str == "norotationorreflection")
      return TransformMode.NoRotationOrReflection;
    if (str == "noscale")
      return TransformMode.NoScale;
    if (str == "noscaleorreflection")
      return TransformMode.NoScaleOrReflection;
    throw new Error(`Unknown transform mode: ${str}`);
  }
};
var LinkedMesh2 = class {
  constructor(mesh, skin, slotIndex, parent, inheritDeform) {
    this.mesh = mesh;
    this.skin = skin;
    this.slotIndex = slotIndex;
    this.parent = parent;
    this.inheritDeform = inheritDeform;
  }
};

// node_modules/@pixi-spine/runtime-3.8/lib/Spine.mjs
var Spine = class extends SpineBase {
  createSkeleton(spineData) {
    this.skeleton = new Skeleton(spineData);
    this.skeleton.updateWorldTransform();
    this.stateData = new AnimationStateData(spineData);
    this.state = new AnimationState(this.stateData);
  }
};

// node_modules/@pixi-spine/loader-3.8/lib/index.mjs
var SpineParser = class extends SpineLoaderAbstract {
  createBinaryParser() {
    return new SkeletonBinary(null);
  }
  createJsonParser() {
    return new SkeletonJson(null);
  }
  parseData(parser, atlas, dataToParse) {
    const parserCast = parser;
    parserCast.attachmentLoader = new AtlasAttachmentLoader(atlas);
    return {
      spineData: parserCast.readSkeletonData(dataToParse),
      spineAtlas: atlas
    };
  }
};
new SpineParser().installLoader();
export {
  Animation,
  AnimationState,
  AnimationStateAdapter,
  AnimationStateData,
  AtlasAttachmentLoader,
  Attachment,
  AttachmentTimeline,
  AttachmentType,
  BinaryInput,
  Bone,
  BoneData,
  BoundingBoxAttachment,
  ClippingAttachment,
  Color,
  ColorTimeline,
  ConstraintData,
  CurveTimeline,
  DebugUtils,
  DeformTimeline,
  DrawOrderTimeline,
  Event,
  EventData,
  EventQueue,
  EventTimeline,
  EventType,
  IkConstraint,
  IkConstraintData,
  IkConstraintTimeline,
  IntSet,
  Interpolation,
  JitterEffect,
  MathUtils,
  MeshAttachment,
  MixBlend,
  MixDirection,
  PathAttachment,
  PathConstraint,
  PathConstraintData,
  PathConstraintMixTimeline,
  PathConstraintPositionTimeline,
  PathConstraintSpacingTimeline,
  PointAttachment,
  Pool,
  PositionMode,
  Pow,
  PowOut,
  RegionAttachment,
  RotateMode,
  RotateTimeline,
  ScaleTimeline,
  ShearTimeline,
  Skeleton,
  SkeletonBinary,
  SkeletonBounds,
  SkeletonBoundsBase,
  SkeletonData,
  SkeletonJson,
  Skin,
  SkinEntry,
  Slot,
  SlotData,
  SpacingMode,
  Spine,
  SpineBase,
  SpineDebugRenderer,
  SpineMesh,
  SpineSprite,
  StringSet,
  SwirlEffect,
  TextureAtlas,
  TextureAtlasPage,
  TextureAtlasRegion,
  TextureFilter,
  TextureRegion,
  TextureWrap,
  TimeKeeper,
  TimelineType,
  TrackEntry,
  TransformConstraint,
  TransformConstraintData,
  TransformConstraintTimeline,
  TransformMode,
  TranslateTimeline,
  TwoColorTimeline,
  Utils,
  Vector2,
  VertexAttachment,
  WindowedMean,
  filterFromString,
  settings2 as settings,
  wrapFromString
};
//# sourceMappingURL=@pixi-spine_all-3__8.js.map
