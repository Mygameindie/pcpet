// Adapted from Pet_template_toy2 / outfit_presets.js (branch: claude/wind-clothing-physics-lgy26g)
// Desktop changes: button goes into #button-bar, panel uses document flow, IPC for window resize.

window.OUTFIT_PRESETS = [
  {
    name: "Casual",
    emoji: "👕",
    clothes: { top: "top1", bottom: "pants1", shoes: "shoes1" },
    colors:  { bottom: "Blue" },
  },
  {
    name: "Skirt Day",
    emoji: "🌸",
    clothes: { top: "top1", bottom: "skirt1", shoes: "shoes1", hat: "hat1" },
    colors:  { top: "Pink", bottom: "Purple" },
  },
  {
    name: "Party Dress",
    emoji: "🎀",
    clothes: { dress: "dress1", shoes: "shoes1", hat: "hat1" },
    colors:  { dress: "Red", hat: "Yellow" },
  },
  {
    name: "Comfy",
    emoji: "🩲",
    clothes: { topUnderwear: "topunderwear1", bottomUnderwear: "bottomunderwear1" },
  },
  {
    name: "Swimsuit",
    emoji: "🩱",
    clothes: { onepieceUnderwear: "onepieceunderwear1" },
    colors:  { onepieceUnderwear: "Cyan" },
  },
  {
    name: "Birthday Suit",
    emoji: "🚫",
    clothes: {},
  },
];

(() => {
  const DEFAULT_COLOR = "Original";

  function categoryKeys() {
    if (window.OUTFIT_CONFIG && Array.isArray(window.OUTFIT_CONFIG.categories)) {
      return window.OUTFIT_CONFIG.categories.map(c => c.key);
    }
    return Object.keys((window.selectedClothes && window.selectedClothes[0]) || {});
  }

  function resolveItemForPet(p, category, id) {
    if (id === 0 || id === "0" || id == null) return 0;
    const items = window.dressUpCatalog?.[p]?.[category]?.items || null;
    if (!items) return id;
    if (items[id]) return id;
    if (items[id + "_2"]) return id + "_2";
    const stripped = String(id).replace(/_2$/, "");
    if (items[stripped]) return stripped;
    return 0;
  }

  function applyPreset(preset) {
    if (!preset) return;
    if (!Array.isArray(window.selectedClothes)) window.selectedClothes = [{}];
    if (!Array.isArray(window.clothingColors))  window.clothingColors  = [{}];
    const p   = (typeof window.activePetIndex === "number") ? window.activePetIndex : 0;
    const sel = (window.selectedClothes[p] = window.selectedClothes[p] || {});
    const col = (window.clothingColors[p]  = window.clothingColors[p]  || {});
    const clothes = preset.clothes || {};
    const colors  = preset.colors  || {};
    categoryKeys().forEach(k => {
      sel[k] = (clothes[k] != null) ? resolveItemForPet(p, k, clothes[k]) : 0;
      col[k] = colors[k] || DEFAULT_COLOR;
    });
    if (typeof window.refreshDressUpUI === "function") window.refreshDressUpUI();
  }

  window.applyOutfitPreset = function (name) {
    const preset = (window.OUTFIT_PRESETS || []).find(p => p?.name === name);
    applyPreset(preset);
    return !!preset;
  };

  // ---- UI ------------------------------------------------------------------
  let presetBtn = document.getElementById("preset-btn");
  if (!presetBtn) {
    presetBtn = document.createElement("button");
    presetBtn.id = "preset-btn";
    presetBtn.textContent = "🎀 Outfits";
    presetBtn.style.cssText = "flex:1;padding:8px 6px;font-size:12px;cursor:pointer;border:none;background:rgba(255,255,255,.95);white-space:nowrap;";
    (document.getElementById("button-bar") || document.body).appendChild(presetBtn);
  }

  let panel = document.getElementById("preset-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "preset-panel";
    panel.style.cssText = "max-height:270px;overflow-y:auto;display:none;padding:10px;background:rgba(255,255,255,.97);box-shadow:0 4px 16px rgba(0,0,0,.18);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;scrollbar-width:thin;";
    (document.getElementById("pet-container") || document.body).appendChild(panel);
  }

  function renderPanel() {
    panel.innerHTML = "";
    const title = document.createElement("div");
    title.style.cssText = "font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;";
    title.innerHTML = "<span>Outfit Presets</span>";
    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.cssText = "border:0;border-radius:9px;padding:4px 8px;background:rgba(0,0,0,.08);cursor:pointer;";
    close.onclick = () => { panel.style.display = "none"; window.electronAPI.closeOutfitPanel(); };
    title.appendChild(close); panel.appendChild(title);

    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:6px;";
    (window.OUTFIT_PRESETS || []).forEach(preset => {
      if (!preset?.name) return;
      const b = document.createElement("button");
      b.textContent = `${preset.emoji ? preset.emoji + " " : ""}${preset.name}`;
      b.style.cssText = "text-align:left;border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:9px 12px;background:#fff;cursor:pointer;font-size:14px;";
      b.onmouseenter = () => { b.style.background = "#fff7e6"; b.style.borderColor = "#f59e0b"; };
      b.onmouseleave = () => { b.style.background = "#fff";    b.style.borderColor = "rgba(0,0,0,.12)"; };
      b.onclick = () => { applyPreset(preset); };
      list.appendChild(b);
    });
    panel.appendChild(list);

    const note = document.createElement("div");
    note.textContent = "Edit looks in outfit_presets.js.";
    note.style.cssText = "font-size:11px;opacity:.6;margin-top:8px;";
    panel.appendChild(note);
  }

  // Toggle: close dress-up panel if open, then expand/collapse the preset panel
  presetBtn.onclick = () => {
    const dressPanel = document.getElementById("dressup-panel");
    if (dressPanel && dressPanel.style.display !== "none") {
      dressPanel.style.display = "none";
    }
    const opening = panel.style.display === "none";
    panel.style.display = opening ? "block" : "none";
    if (opening) { renderPanel(); window.electronAPI.openOutfitPanel(); }
    else { window.electronAPI.closeOutfitPanel(); }
  };
})();
