(() => {
  "use strict";
  const api = globalThis.browser || globalThis.chrome;
  const S = DrkrSettings, C = DrkrColors;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const attribute = "data-drkr-node", readyAttribute = "data-drkr-ready";
  const roots = new Map(), dirty = new Map(), removed = new Set();
  const skip = new Set(["SCRIPT", "STYLE", "LINK", "META", "HEAD", "TITLE", "IMG", "VIDEO", "AUDIO", "CANVAS", "PICTURE", "SOURCE", "IFRAME"]);
  const properties = [
    ["background-color", "background"], ["color", "text"],
    ["border-top-color", "border"], ["border-right-color", "border"],
    ["border-bottom-color", "border"], ["border-left-color", "border"],
    ["outline-color", "border"], ["text-decoration-color", "text"],
    ["-webkit-text-fill-color", "text"], ["caret-color", "text"]
  ];
  const base = ':root {color-scheme:dark!important;background-color:#141619!important;color:#e0e3e7!important}body{background-color:#141619!important;color:#e0e3e7!important}::selection{background:#565ba3!important;color:white!important}' + (globalThis.DrkrSiteRules?.css(location.hostname) || "");
  let settings, active = false, nativeDark = false, timer, counter = 0, full = true;
  let scans = 0, lastScanMs = 0, processed = 0;
  const ownSheets = new WeakSet();
  function reveal() { document.documentElement?.setAttribute(readyAttribute, ""); }
  const startupTimeout = setTimeout(reveal, 1500);
  function finishStartup(force = false) {
    if (force || document.readyState !== "loading") { clearTimeout(startupTimeout); reveal(); }
  }
  function own(node) { return node && (ownSheets.has(node) || ownSheets.has(node.parentNode)); }
  function observe(root) { observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true }); }
  function rootState(root) {
    if (roots.has(root)) return roots.get(root);
    const style = document.createElement("style");
    if (root === document) style.id = "drkr-theme";
    style.setAttribute("data-drkr-sheet", "");
    ownSheets.add(style);
    (root === document ? document.documentElement : root).append(style);
    style.disabled = true;
    const state = { root, style, nodes: new Map(), groups: new Map(), unused: 0 };
    roots.set(root, state);
    if (root !== document) observe(root);
    return state;
  }
  function isNativeDark() {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const bg = C.parse(getComputedStyle(el).backgroundColor);
      if (bg && bg[3] > .9) return C.luminance(bg) < .08;
    }
    return false;
  }
  function queue(node, deep = true) {
    if (node?.nodeType === 1 && !own(node)) dirty.set(node, deep || dirty.get(node) || false);
  }
  function collect(el, deep, elements) {
    if (!el || own(el)) return;
    if (el.nodeType === 1) {
      elements.add(el);
      if (el.shadowRoot) {
        rootState(el.shadowRoot);
        for (const child of el.shadowRoot.children) collect(child, true, elements);
      }
    }
    if (deep) for (const child of el.children || []) collect(child, true, elements);
  }
  function release(state, el) {
    const old = state.nodes.get(el);
    if (!old) return;
    if (--old.count === 0) state.unused++;
    state.nodes.delete(el);
  }
  function prune() {
    if (!removed.size) return;
    for (const state of roots.values()) {
      if (state.root !== document && !state.root.host.isConnected) {
        state.style.remove();
        roots.delete(state.root);
        continue;
      }
      for (const el of state.nodes.keys()) {
        if (!el.isConnected || el.getRootNode() !== state.root) release(state, el);
      }
    }
    removed.clear();
  }
  function declarations(style, preserve = false, fallbackBackground = null) {
    const result = [];
    // Do not replace the transparent text used to reveal a clipped gradient.
    const clippedText = style.backgroundClip === "text" || style.webkitBackgroundClip === "text";
    // Background artwork may contain a light panel or text. Keep its foreground
    // colors rather than blindly putting white lettering over an unknown image.
    const artwork = /url\(/i.test(style.backgroundImage);
    const mask = (style.maskImage && style.maskImage !== "none") || (style.webkitMaskImage && style.webkitMaskImage !== "none");
    for (const [property, role] of properties) {
      if (!preserve && (clippedText || artwork) && role === "text") continue;
      const value = preserve ? style.getPropertyValue(property) : C.map(style.getPropertyValue(property), mask && property === "background-color" ? "text" : role);
      if (value) result.push(`${property}:${value}!important`);
    }
    if (fallbackBackground) result.push(`background-color:${fallbackBackground}!important`);
    const image = preserve ? null : C.gradient(style.backgroundImage, clippedText ? "text" : "background");
    if (image && image !== style.backgroundImage) result.push(`background-image:${image}!important`);
    return result.join(";");
  }
  function originalSurface(el, contexts) {
    if (!el) return false;
    if (contexts.has(el)) return contexts.get(el);
    const parent = el.parentElement || el.getRootNode().host;
    const inherited = originalSurface(parent, contexts);
    const important = ["color", "-webkit-text-fill-color", "background-color", "background-image"].some(p => el.style.getPropertyPriority(p) === "important");
    const artwork = /url\(/i.test(getComputedStyle(el).backgroundImage);
    const preserve = inherited || important || artwork;
    contexts.set(el, preserve);
    return preserve;
  }
  function originalBackground(el) {
    for (let parent = el; parent; parent = parent.parentElement || parent.getRootNode().host) {
      const value = getComputedStyle(parent).backgroundColor, color = C.parse(value);
      if (color && color[3] > .9) return value;
    }
    return "rgb(255, 255, 255)";
  }
  function svgIcon(el, contexts, icons) {
    const svg = el.ownerSVGElement || el;
    let eligible = icons.get(svg);
    if (eligible === undefined) {
      const control = svg.closest('button,a,[role="button"],[role="menuitem"]');
      const bounds = control ? svg.getBoundingClientRect() : null;
      eligible = Boolean(bounds && bounds.width > 0 && bounds.height > 0 && bounds.width <= 48 && bounds.height <= 48 && !originalSurface(svg.parentElement, contexts));
      icons.set(svg, eligible);
    }
    if (!eligible) return null;
    const style = getComputedStyle(el), values = [];
    for (const property of ["fill", "stroke"]) {
      const value = style.getPropertyValue(property), color = C.parse(value);
      // Only neutral, dark UI paint is changed. Colored illustrations, large
      // charts, gradients, and decorative SVGs outside controls are untouched.
      if (!color || !color[3] || C.luminance(color) >= .45 || Math.max(...color.slice(0, 3)) - Math.min(...color.slice(0, 3)) > 18 || el.style.getPropertyPriority(property) === "important") continue;
      values.push(`${property}:${C.map(value, "text")}!important`);
    }
    return [values.join(";"), "", ""];
  }
  function snapshot(el, contexts, icons) {
    if (el.namespaceURI === "http://www.w3.org/2000/svg") return svgIcon(el, contexts, icons);
    if (skip.has(el.tagName) || el.namespaceURI !== "http://www.w3.org/1999/xhtml") return null;
    const style = getComputedStyle(el), preserve = originalSurface(el, contexts);
    const parent = el.parentElement || el.getRootNode().host;
    const boundary = preserve && !originalSurface(parent, contexts);
    const bg = C.parse(style.backgroundColor);
    const fallback = boundary && (!bg || bg[3] < .9) && !/url\(/i.test(style.backgroundImage) ? originalBackground(el) : null;
    const parts = [declarations(style, preserve, fallback)];
    for (const pseudo of ["::before", "::after"]) {
      const style = getComputedStyle(el, pseudo);
      parts.push(style.content && !["none", "normal"].includes(style.content) ? declarations(style, preserve) : "");
    }
    return parts;
  }
  function groupRules(group) {
    const selector = `[${attribute}="${group.id}"]`;
    return group.parts.flatMap((part, index) => part ? [`${selector}${["", "::before", "::after"][index]}{${part}}`] : []);
  }
  function commit(state, el, parts) {
    const signature = parts.join("\n"), old = state.nodes.get(el);
    if (old?.signature === signature) {
      // Some frameworks clone or overwrite our marker attributes.
      if (el.getAttribute(attribute) !== old.id) el.setAttribute(attribute, old.id);
      return;
    }
    release(state, el);
    if (!parts.some(Boolean)) { el.removeAttribute(attribute); return; }
    let group = state.groups.get(signature);
    if (!group) {
      group = { id: String(++counter), signature, parts, count: 0 };
      state.groups.set(signature, group);
      for (const rule of groupRules(group)) state.style.sheet.insertRule(rule, state.style.sheet.cssRules.length);
    } else if (!group.count) state.unused--;
    group.count++;
    state.nodes.set(el, group);
    el.setAttribute(attribute, group.id);
  }
  function compact(state) {
    if (state.unused < 128) return;
    for (const [key, group] of state.groups) if (!group.count) state.groups.delete(key);
    state.style.textContent = (state.root === document ? base : ':host{color-scheme:dark!important}') + [...state.groups.values()].flatMap(groupRules).join("\n");
    state.unused = 0;
    state.style.disabled = true;
  }
  function scan() {
    timer = null;
    if (!settings || !document.documentElement) return;
    const start = performance.now();
    const wanted = S.enabled(settings, location.hostname, media.matches);
    if (wanted) observe(document);
    const wasActive = active;
    // Take a consistent snapshot of author styles across document/shadow roots.
    for (const state of roots.values()) state.style.disabled = true;
    try {
      nativeDark = wanted && settings.respectDark && isNativeDark();
      active = wanted && !nativeDark;
      prune();
      if (!active) {
        dirty.clear(); full = true;
        finishStartup(!wanted);
        if (!wanted) observer.disconnect();
        return;
      }
      rootState(document);
      for (const state of roots.values()) {
        if (state.style.isConnected) continue;
        // A page can replace its entire root or remove injected style nodes.
        // CSSOM-only rules disappear on detachment, so regenerate their groups.
        (state.root === document ? document.documentElement : state.root).append(state.style);
        state.style.disabled = true;
        state.nodes.clear(); state.groups.clear(); state.unused = 0; state.initialized = false;
        full = true;
      }
      const elements = new Set();
      if (full || !wasActive) {
        observe(document);
        for (const state of roots.values()) if (state.root !== document) observe(state.root);
        collect(document.documentElement, true, elements);
      } else {
        // Drop nested dirty subtrees: scan each affected element at most once.
        for (const [node, deep] of dirty) {
          if (!node.isConnected) continue;
          let covered = false;
          for (let parent = node.parentElement; parent; parent = parent.parentElement) {
            if (dirty.get(parent)) { covered = true; break; }
          }
          if (!covered) collect(node, deep, elements);
        }
      }
      full = false;
      dirty.clear();
      // Complete ALL computed-style reads before writing any marker attributes.
      // Interleaving reads and writes forces repeated document style recalculation.
      const pending = [], contexts = new WeakMap(), icons = new WeakMap();
      for (const el of elements) {
        const parts = snapshot(el, contexts, icons);
        if (parts) pending.push([rootState(el.getRootNode()), el, parts]);
      }
      for (const [state, el, parts] of pending) commit(state, el, parts);
      for (const state of roots.values()) {
        if (!state.initialized) {
          const initial = state.root === document ? base : ':host{color-scheme:dark!important}';
          // Base rules precede element-specific rules of equal specificity.
          const rules = initial.match(/[^{}]+\{[^{}]*\}/g) || [];
          rules.forEach((rule, index) => state.style.sheet.insertRule(rule, index));
          state.initialized = true;
        }
        compact(state);
        state.style.disabled = false;
      }
      processed = pending.length;
      finishStartup();
    } catch (error) {
      // An unsupported page must stay usable, even if theme generation fails.
      active = false;
      for (const state of roots.values()) state.style.disabled = true;
      finishStartup(true);
      console.warn("drkr could not theme this page", error);
    } finally { scans++; lastScanMs = performance.now() - start; }
  }
  function schedule(all = false) {
    full ||= all;
    if (!timer) timer = setTimeout(scan, 80);
  }
  const observer = new MutationObserver(records => {
    let changed = false;
    for (const record of records) {
      if (own(record.target)) continue;
      if (record.type === "attributes" && [attribute, readyAttribute].includes(record.attributeName)) continue;
      if (record.type === "childList") {
        const nodes = [...record.addedNodes, ...record.removedNodes].filter(node => !own(node));
        if ([...record.removedNodes].some(node => ownSheets.has(node) && [...roots.values()].some(state => state.style === node && (state.root === document || state.root.host.isConnected)))) {
          full = true; changed = true;
        }
        if (!nodes.length) continue;
        for (const node of record.addedNodes) if (!own(node)) queue(node);
        for (const node of record.removedNodes) if (!own(node)) removed.add(node);
        // Revisit immediate neighbours for first/last-child selectors, without
        // rescanning an entire growing feed when one card is appended.
        queue(record.target, false);
        queue(record.previousSibling, false); queue(record.nextSibling, false);
        if (nodes.some(node => node.nodeName === "STYLE" || node.nodeName === "LINK")) full = true;
      } else if (record.type === "characterData") {
        queue(record.target.parentElement);
      } else {
        queue(record.target);
        if (record.target === document.documentElement || record.target === document.body) full = true;
      }
      if (record.target.nodeName === "STYLE" || record.target.nodeName === "LINK") full = true;
      changed = true;
    }
    if (changed) schedule();
  });
  observe(document);
  document.addEventListener("DOMContentLoaded", () => {
    if (timer) { clearTimeout(timer); timer = null; }
    full = true; scan();
  }, { once: true });
  document.addEventListener("load", event => { if (event.target.tagName === "LINK") schedule(true); }, true);
  // Hover/focus states need a fresh author-style snapshot even without DOM edits.
  for (const event of ["pointerover", "pointerout", "focusin", "focusout"]) {
    document.addEventListener(event, e => {
      if (!active) return;
      const target = e.composedPath()[0];
      queue(target, false);
      for (const child of target?.children || []) queue(child, false);
      // Hover rules often live on a button/card ancestor.
      for (let parent = target?.parentElement, depth = 0; parent && depth < 2; parent = parent.parentElement, depth++) queue(parent, false);
      schedule();
    }, { capture: true, passive: true });
  }
  media.addEventListener("change", () => schedule(true));
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) { settings = S.normalize(changes.settings.newValue); schedule(true); }
  });
  api.runtime.onMessage.addListener(message => {
    if (message.type === "drkr-status") return Promise.resolve({ active, nativeDark });
    if (message.type === "drkr-diagnostics") return Promise.resolve({ scans, lastScanMs, processed, groups: [...roots.values()].reduce((n, state) => n + state.groups.size, 0) });
  });
  api.storage.local.get("settings").then(data => { settings = S.normalize(data.settings); full = true; scan(); })
    .catch(error => { finishStartup(true); console.warn("drkr could not load preferences", error); });
})();
