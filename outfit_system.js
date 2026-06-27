// Adapted from Pet_template_toy2 / outfit_system_single_sprite.js (branch: claude/wind-clothing-physics-lgy26g)
// Desktop changes:
//   - Button injected into #button-bar (document flow, not position:fixed).
//   - Panel appended to body below the button bar (not position:fixed).
//   - Opening/closing sends IPC so Electron resizes the window.
//   - Shower-mode lifecycle hooks removed (not used in pcpet).
//   - ClothWind and all outfit logic kept identical to the source.
(() => {
  const DEFAULT_COLOR = "Original";
  const COLORS = {
    Original: null,
    Red: "#ff3b30", Orange: "#ff9500", Yellow: "#ffcc00",
    Green: "#34c759", Cyan: "#32ade6", Blue: "#007aff",
    Purple: "#af52de", Pink: "#ff2d55",
  };

  const FALLBACK_CONFIG = {
    categories: [
      { key: "topUnderwear",      label: "Top Underwear",             z: 60  },
      { key: "bottomUnderwear",   label: "Bottom Underwear / Boxers", z: 50  },
      { key: "onepieceUnderwear", label: "One-Piece Underwear",       z: 65  },
      { key: "top",               label: "Top",                       z: 120 },
      { key: "bottom",            label: "Pants / Skirt",             z: 110 },
      { key: "dress",             label: "Dress",                     z: 130 },
      { key: "shoes",             label: "Shoes",                     z: 90  },
      { key: "hat",               label: "Hat",                       z: 180 },
    ],
    pet1: {},
    defaults: { pet1: {} },
  };

  function img(src) {
    const im = new Image();
    im._failed = false;
    im.onerror = () => { im._failed = true; };
    im.src = src;
    return im;
  }

  function humanize(id) {
    const base = String(id).replace(/_\d+$/, "");
    const m = base.match(/^([a-zA-Z]+?)(\d+)$/);
    if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1) + " " + m[2];
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  function normItem(entry) {
    if (entry === null || entry === undefined) return null;
    if (typeof entry === "string" || typeof entry === "number") {
      const id = String(entry);
      return { id, label: humanize(id), prefix: id };
    }
    const id = entry.id || entry.prefix;
    if (!id) return null;
    return { id: String(id), label: entry.label || humanize(id), prefix: String(entry.prefix || id) };
  }

  function emptyCat(def) {
    return { label: def.label || def.key, z: Number(def.z) || 100, items: { 0: { id: 0, label: "None", img: null } } };
  }

  const cfg = (window.OUTFIT_CONFIG && Array.isArray(window.OUTFIT_CONFIG.categories))
    ? window.OUTFIT_CONFIG : FALLBACK_CONFIG;

  const cats = cfg.categories.map(c => ({ key: c.key, label: c.label || c.key, z: Number(c.z) || 100 }));

  const PETS = [0, 1];
  const wardrobeFor = p => (p === 1 ? cfg.pet2 : cfg.pet1) || {};
  const defaultsFor = p => (cfg.defaults && (p === 1 ? cfg.defaults.pet2 : cfg.defaults.pet1)) || {};

  function buildCatalog() {
    const catalog = {};
    PETS.forEach(p => { catalog[p] = {}; cats.forEach(c => { catalog[p][c.key] = emptyCat(c); }); });
    PETS.forEach(p => {
      const wardrobe = wardrobeFor(p);
      cats.forEach(c => {
        const list = wardrobe[c.key];
        if (!Array.isArray(list)) return;
        list.forEach(entry => {
          const it = normItem(entry);
          if (it) catalog[p][c.key].items[it.id] = { id: it.id, label: it.label, img: img(`${it.prefix}.png`) };
        });
      });
    });
    return catalog;
  }

  const defaults = (() => {
    const out = {};
    PETS.forEach(p => {
      out[p] = {};
      const src = defaultsFor(p);
      cats.forEach(c => { out[p][c.key] = src[c.key] != null ? src[c.key] : 0; });
    });
    return out;
  })();

  window.dressUpCatalog = buildCatalog();
  if (typeof window.activePetIndex !== "number") window.activePetIndex = 0;

  function makeSelected() {
    return PETS.map(p => { const o = {}; cats.forEach(c => { o[c.key] = defaults[p][c.key] != null ? defaults[p][c.key] : 0; }); return o; });
  }
  function makeColors() {
    return PETS.map(() => { const o = {}; cats.forEach(c => { o[c.key] = DEFAULT_COLOR; }); return o; });
  }

  window.selectedClothes = window.selectedClothes || makeSelected();
  window.clothingColors  = window.clothingColors  || makeColors();
  window.currentOutfits  = PETS.map(() => 0);
  window.currentOutfit   = 0;

  function activePet() {
    const p = window.activePetIndex;
    return PETS.includes(p) ? p : 0;
  }

  function catKeys(p = activePet()) {
    const catalog = window.dressUpCatalog[p] || window.dressUpCatalog[0] || {};
    return cats.map(c => c.key).filter(k => {
      const cat = catalog[k];
      return cat && Object.keys(cat.items || {}).length > 1;
    });
  }

  function normalizeState() {
    const sel = makeSelected(); const cols = makeColors();
    PETS.forEach(p => {
      window.selectedClothes[p] = window.selectedClothes[p] || {};
      window.clothingColors[p]  = window.clothingColors[p]  || {};
      cats.forEach(c => {
        if (window.selectedClothes[p][c.key] === undefined) window.selectedClothes[p][c.key] = sel[p][c.key];
        if (window.clothingColors[p][c.key]  === undefined) window.clothingColors[p][c.key]  = cols[p][c.key];
      });
    });
  }

  // ---- Clothing rules -------------------------------------------------------
  function setNumberFromId(id) {
    const m = String(id || "").match(/(\d+)(?:_\d+)?$/);
    return m ? m[1] : null;
  }
  function findItemBySetNumber(p, category, n) {
    if (!n) return 0;
    const items = (window.dressUpCatalog[p]?.[category]?.items) || {};
    const ids = Object.keys(items).filter(id => id !== "0");
    return ids.find(id => setNumberFromId(id) === String(n)) || 0;
  }
  function applyUnderwearRules(p, category, id) {
    if (id === 0 || id === "0") return;
    const sc = window.selectedClothes[p];
    if (category === "onepieceUnderwear") { sc.topUnderwear = 0; sc.bottomUnderwear = 0; return; }
    if (category === "topUnderwear" || category === "bottomUnderwear") {
      const cameFromOnepiece = sc.onepieceUnderwear && sc.onepieceUnderwear !== "0";
      sc.onepieceUnderwear = 0;
      if (cameFromOnepiece) {
        const other = (category === "topUnderwear") ? "bottomUnderwear" : "topUnderwear";
        const match = findItemBySetNumber(p, other, setNumberFromId(id));
        if (match) sc[other] = match;
      }
    }
  }
  function applyDressRules(p, category, id) {
    if (id === 0 || id === "0") return;
    const sc = window.selectedClothes[p];
    if (category === "dress" || category === "bodysuit") {
      sc.top = 0; sc.bottom = 0;
      sc.dress    = (category === "dress")    ? sc.dress    : 0;
      sc.bodysuit = (category === "bodysuit") ? sc.bodysuit : 0;
      return;
    }
    if (category === "top" || category === "bottom") { sc.dress = 0; sc.bodysuit = 0; }
  }
  function applyClothingRules(p, category, id) {
    applyUnderwearRules(p, category, id);
    applyDressRules(p, category, id);
  }

  // ---- Cloth wind (troll blower effect) ------------------------------------
  window.ClothWind = window.ClothWind || {
    _strength: {},
    set(p, s) { this._strength[p] = Math.max(0, Math.min(1, s || 0)); },
    get(p)    { return this._strength[p] || 0; },
    reset()   { this._strength = {}; },
  };
  function isSkirtLike(key, id) { return key === "dress" || /skirt/i.test(String(id)); }
  function windVariant(image) {
    if (!image || !image.src) return null;
    if (!image._windImg) image._windImg = img(image.src.replace(/\.png(\?.*)?$/i, "_w.png$1"));
    return image._windImg;
  }

  // ---- Colour tinting -------------------------------------------------------
  const tintCache = new Map();
  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }
  function tintedImage(source, hex) {
    if (!hex || !source || source._failed || !source.complete || !source.naturalWidth) return source;
    const key = `${source.src}|${hex}`;
    if (tintCache.has(key)) return tintCache.get(key);
    const rgb = hexToRgb(hex); if (!rgb) return source;
    const cv = document.createElement("canvas");
    cv.width = source.naturalWidth; cv.height = source.naturalHeight;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    try {
      cx.drawImage(source, 0, 0);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const lum   = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        const shade = Math.max(0.18, Math.min(1.25, lum * 1.35));
        d[i]     = Math.min(255, rgb.r * shade);
        d[i + 1] = Math.min(255, rgb.g * shade);
        d[i + 2] = Math.min(255, rgb.b * shade);
      }
      cx.putImageData(new ImageData(d, cv.width, cv.height), 0, 0);
    } catch (_) { return source; }
    const out = new Image(); out.src = cv.toDataURL("image/png");
    tintCache.set(key, out); return out;
  }
  function safeDraw(ctx, image, x, y, w, h) {
    if (!image || image._failed || !image.complete || !image.naturalWidth) return false;
    ctx.drawImage(image, x, y, w, h); return true;
  }

  // ---- UI ------------------------------------------------------------------
  let selectedCategory = catKeys()[0] || (cats[0]?.key) || "top";
  const btnCss = "border:0;border-radius:9px;padding:7px 10px;margin:3px;background:rgba(0,0,0,.08);cursor:pointer;font-size:13px;white-space:nowrap;";
  function btn(text) { const b = document.createElement("button"); b.textContent = text; b.style.cssText = btnCss; return b; }

  // Button injected into #button-bar (document flow)
  let dressBtn = document.getElementById("dressup-btn");
  if (!dressBtn) {
    dressBtn = document.createElement("button");
    dressBtn.id = "dressup-btn";
    dressBtn.style.cssText = "flex:1;padding:8px 6px;font-size:12px;cursor:pointer;border:none;border-right:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.95);white-space:nowrap;";
    (document.getElementById("button-bar") || document.body).appendChild(dressBtn);
  }
  window.clothesBtn = dressBtn;

  // Panel in document flow below the button bar
  let panel = document.getElementById("dressup-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "dressup-panel";
    panel.style.cssText = "max-height:270px;overflow-y:auto;display:none;padding:10px;background:rgba(255,255,255,.97);box-shadow:0 4px 16px rgba(0,0,0,.18);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;scrollbar-width:thin;";
    (document.getElementById("pet-container") || document.body).appendChild(panel);
  }

  function updateButtonLabel() {
    const p = activePet();
    const count = catKeys(p).map(k => window.selectedClothes[p]?.[k]).filter(v => v !== 0 && v !== "0" && v != null).length;
    dressBtn.textContent = `👗 Dress Up (${count})`;
  }

  function itemThumb(it, active, onClick) {
    const b = document.createElement("button");
    b.title = it.label || String(it.id);
    b.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;width:66px;height:78px;padding:5px;cursor:pointer;border-radius:10px;border:2px solid ${active ? "#f59e0b" : "rgba(0,0,0,.12)"};background:${active ? "#fff7e6" : "#fff"};`;
    function emojiFallback() { const d = document.createElement("div"); d.textContent = "👕"; d.style.cssText = "flex:1;display:flex;align-items:center;font-size:24px;opacity:.55;"; return d; }
    if (it.id === 0 || it.id === "0") {
      const icon = document.createElement("div"); icon.textContent = "🚫"; icon.style.cssText = "flex:1;display:flex;align-items:center;font-size:24px;opacity:.7;"; b.appendChild(icon);
    } else if (it.img && !it.img._failed) {
      const im = document.createElement("img"); im.src = it.img.src; im.alt = it.label || ""; im.draggable = false; im.style.cssText = "flex:1;width:48px;height:48px;object-fit:contain;"; im.onerror = () => { im.replaceWith(emojiFallback()); }; b.appendChild(im);
    } else { b.appendChild(emojiFallback()); }
    const lab = document.createElement("div"); lab.textContent = it.label || String(it.id); lab.style.cssText = "font-size:10px;line-height:1.1;text-align:center;max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"; b.appendChild(lab);
    b.onclick = onClick; return b;
  }

  function renderPanel() {
    const p = activePet();
    const catalog = window.dressUpCatalog[p] || window.dressUpCatalog[0] || {};
    const keys = catKeys(p);
    if (!keys.includes(selectedCategory)) selectedCategory = keys[0] || cats[0]?.key;
    panel.innerHTML = "";

    // Title + close
    const title = document.createElement("div");
    title.style.cssText = "font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;gap:8px;align-items:center;";
    title.innerHTML = "<span>Dress Up</span>";
    const closeBtn = btn("✕"); closeBtn.style.padding = "4px 8px";
    closeBtn.onclick = () => { panel.style.display = "none"; window.electronAPI.closeOutfitPanel(); };
    title.appendChild(closeBtn); panel.appendChild(title);

    // Character switcher
    const petRow = document.createElement("div"); petRow.style.cssText = "display:flex;gap:6px;margin-bottom:8px;";
    PETS.forEach(pi => {
      const b = btn(`🐾 Pet ${pi + 1}`);
      if (pi === p) b.style.cssText += "background:#fff7e6;border:2px solid #f59e0b;font-weight:700;";
      b.onclick = () => { if (typeof window.setActivePet === "function") window.setActivePet(pi); };
      petRow.appendChild(b);
    });
    panel.appendChild(petRow);

    // Category tabs
    const row = document.createElement("div"); row.style.cssText = "display:flex;overflow-x:auto;padding-bottom:4px;margin-bottom:8px;";
    keys.forEach(k => {
      const b = btn(catalog[k].label || k);
      if (k === selectedCategory) b.style.cssText += "background:rgba(0,0,0,.22);font-weight:700;";
      b.onclick = () => { selectedCategory = k; renderPanel(); };
      row.appendChild(b);
    });
    panel.appendChild(row);

    const cat = catalog[selectedCategory]; if (!cat) return;

    // Items
    const itemTitle = document.createElement("div"); itemTitle.textContent = "Item"; itemTitle.style.cssText = "font-weight:600;margin:4px 0;"; panel.appendChild(itemTitle);
    const items = document.createElement("div"); items.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;";
    Object.entries(cat.items || {}).forEach(([id, it]) => {
      const active = String(window.selectedClothes[p]?.[selectedCategory]) === String(id);
      items.appendChild(itemThumb(it, active, () => {
        window.selectedClothes[p][selectedCategory] = id === "0" ? 0 : id;
        applyClothingRules(p, selectedCategory, window.selectedClothes[p][selectedCategory]);
        renderPanel(); updateButtonLabel();
      }));
    });
    panel.appendChild(items);

    // Colours
    const colorTitle = document.createElement("div"); colorTitle.textContent = "Color"; colorTitle.style.cssText = "font-weight:600;margin:8px 0 4px;"; panel.appendChild(colorTitle);
    const colorRow = document.createElement("div"); colorRow.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;";
    Object.entries(COLORS).forEach(([name, hex]) => {
      const active = (window.clothingColors[p]?.[selectedCategory] || DEFAULT_COLOR) === name;
      const b = btn(name === DEFAULT_COLOR ? DEFAULT_COLOR : ""); b.title = name;
      b.style.cssText += `min-width:${name === DEFAULT_COLOR ? "72px" : "30px"};height:30px;border:${active ? "2px solid #111" : "1px solid rgba(0,0,0,.2)"};background:${hex || "linear-gradient(45deg,#fff,#ddd)"};`;
      b.onclick = () => { window.clothingColors[p][selectedCategory] = name; renderPanel(); };
      colorRow.appendChild(b);
    });
    panel.appendChild(colorRow);

    const note = document.createElement("div"); note.textContent = "Add clothes in outfit_config.js — drop PNGs in images/ and add names to the list."; note.style.cssText = "font-size:11px;opacity:.6;margin-top:8px;"; panel.appendChild(note);
    updateButtonLabel();
  }

  // Toggle: close preset panel if open, then expand/collapse the outfit panel
  dressBtn.onclick = () => {
    const presetPanel = document.getElementById("preset-panel");
    if (presetPanel && presetPanel.style.display !== "none") {
      presetPanel.style.display = "none";
    }
    const opening = panel.style.display === "none";
    panel.style.display = opening ? "block" : "none";
    if (opening) { renderPanel(); window.electronAPI.openOutfitPanel(); }
    else { window.electronAPI.closeOutfitPanel(); }
  };

  // ---- Public API ----------------------------------------------------------
  window.refreshDressUpUI = function () { normalizeState(); renderPanel(); updateButtonLabel(); };

  window.drawOutfitOverlay = function (ctx, state, x, y, w, h, petIndex) {
    const p       = typeof petIndex === "number" ? petIndex : activePet();
    const catalog = window.dressUpCatalog[p] || window.dressUpCatalog[0] || {};
    let drew = false;
    catKeys(p).slice().sort((a, b) => (catalog[a].z || 0) - (catalog[b].z || 0)).forEach(k => {
      const id = window.selectedClothes[p]?.[k] ?? 0;
      if (id === 0 || id === "0") return;
      const it = catalog[k]?.items?.[id];
      if (!it?.img || it.img._failed) return;
      const hex = COLORS[window.clothingColors[p]?.[k] || DEFAULT_COLOR] || null;
      let baseImg = it.img;
      if (window.ClothWind?.get(p) > 0.02 && isSkirtLike(k, id)) {
        const wImg = windVariant(it.img);
        if (wImg && !wImg._failed && wImg.complete && wImg.naturalWidth) baseImg = wImg;
      }
      const drawImg = hex ? tintedImage(baseImg, hex) : baseImg;
      if (safeDraw(ctx, drawImg, x, y, w, h)) drew = true;
    });
    return drew;
  };

  window.setActivePet = function (petIndex) {
    window.activePetIndex = PETS.includes(petIndex) ? petIndex : 0;
    renderPanel(); updateButtonLabel();
  };

  normalizeState();
  updateButtonLabel();
})();
