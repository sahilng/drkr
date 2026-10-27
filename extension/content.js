(() => {
  "use strict";
  const api = globalThis.browser || globalThis.chrome;
  const S = DrkrSettings, C = DrkrColors;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const attribute = "data-drkr-node", readyAttribute = "data-drkr-ready", transitionAttribute = "data-drkr-transition";
  const roots = new Map(), dirty = new Map(), removed = new Set();
  const skip = new Set(["SCRIPT", "STYLE", "LINK", "META", "HEAD", "TITLE", "IMG", "VIDEO", "AUDIO", "CANVAS", "PICTURE", "SOURCE", "IFRAME"]);
  const properties = [
    ["background-color", "background"], ["color", "text"],
    ["border-top-color", "border"], ["border-right-color", "border"],
    ["border-bottom-color", "border"], ["border-left-color", "border"],
    ["outline-color", "border"], ["text-decoration-color", "text"],
    ["-webkit-text-fill-color", "text"], ["caret-color", "text"]
  ];
  const pendingControls = ':is(#drkr-override#drkr-theme,input:not([data-drkr-node]),select:not([data-drkr-node]),textarea:not([data-drkr-node]),[role="combobox"]:not([data-drkr-node]),.ui.selection.dropdown:not([data-drkr-node])){background-color:#131313!important;color:#e0e0e0!important;color-scheme:dark!important}';
  const base = ':root {color-scheme:dark!important;background-color:#141619!important;color:#e0e3e7!important}body{background-color:#141619!important;color:#e0e3e7!important}::selection{background:#565ba3!important;color:white!important}' + (globalThis.DrkrSiteRules?.css(location.hostname) || "") + pendingControls;
  let settings, active = false, nativeDark = false, timer, counter = 0, full = true, framePending = false;
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
    // Safari can reject DOM style elements under a page's style-src policy.
    // A constructed sheet keeps extension styling local without changing CSP.
    let constructed = null;
    if (!style.sheet && typeof CSSStyleSheet === "function" && "adoptedStyleSheets" in root) {
      constructed = new CSSStyleSheet();
      constructed.disabled = true;
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, constructed];
    }
    const state = { root, style, constructed, nodes: new Map(), groups: new Map(), unused: 0 };
    roots.set(root, state);
    if (root !== document) observe(root);
    return state;
  }
  function sheet(state) { return state.constructed || state.style.sheet; }
  function disable(state, value) {
    const current = sheet(state);
    if (current) current.disabled = value;
  }
  const transitionGroups = new Map();
  let transitionCounter = 0, nonPaintProperties;
  function cssList(value) {
    const parts = []; let depth = 0, start = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "(") depth++;
      else if (value[i] === ")") depth--;
      else if (value[i] === "," && !depth) { parts.push(value.slice(start, i).trim()); start = i + 1; }
    }
    parts.push(value.slice(start).trim());
    return parts;
  }
  function paintProperty(property) {
    return /(?:color|shadow)$/.test(property) || ["fill", "stroke", "background", "background-image"].includes(property);
  }
  function transitionGroup(style) {
    const properties = cssList(style.transitionProperty);
    const durations = cssList(style.transitionDuration), delays = cssList(style.transitionDelay);
    if (!(durations.some(v => parseFloat(v) > 0) || delays.some(v => parseFloat(v) > 0)) || !properties.some(p => p === "all" || paintProperty(p))) return null;
    const timing = cssList(style.transitionTimingFunction), behavior = cssList(style.getPropertyValue("transition-behavior") || "normal");
    const key = [properties, durations, delays, timing, behavior].map(v => v.join("|")).join("\n");
    if (transitionGroups.has(key)) return transitionGroups.get(key);
    nonPaintProperties ||= Array.from(style).filter(p => !paintProperty(p) && !p.startsWith("transition"));
    const entries = [];
    properties.forEach((p, i) => {
      // A background shorthand also includes position/size animations. Keep
      // those while suppressing its color/image interpolation during reads.
      for (const property of p === "all" ? nonPaintProperties : p === "background" ? ["background-position", "background-size"] : paintProperty(p) || p === "none" ? [] : [p]) {
        entries.push([property, durations[i % durations.length], delays[i % delays.length], timing[i % timing.length], behavior[i % behavior.length]]);
      }
    });
    const list = column => {
      const values = entries.map(e => e[column]);
      return values.every(v => v === values[0]) ? values[0] : values.join(",");
    };
    const css = entries.length ? `transition-property:${entries.map(e => e[0]).join(",")}!important;transition-duration:${list(1)}!important;transition-delay:${list(2)}!important;transition-timing-function:${list(3)}!important;transition-behavior:${list(4)}!important` : 'transition-property:none!important';
    const group = { id: String(++transitionCounter), css };
    if (transitionGroups.size >= 256) transitionGroups.clear();
    transitionGroups.set(key, group);
    return group;
  }
  function prepareTransitions(elements) {
    // Read transition metadata before enabling measurement rules. Only watched
    // transitions and dirty nodes are revisited on incremental updates.
    const targets = new Set(elements);
    for (const state of roots.values()) for (const el of state.transitions?.keys() || []) targets.add(el);
    for (const el of targets) {
      if (!el.isConnected) continue;
      const state = rootState(el.getRootNode());
      state.transitions ||= new Map();
      const group = transitionGroup(getComputedStyle(el));
      if (group) {
        state.transitions.set(el, group);
        if (el.getAttribute(transitionAttribute) !== group.id) el.setAttribute(transitionAttribute, group.id);
      } else {
        state.transitions.delete(el);
        el.removeAttribute(transitionAttribute);
      }
    }
  }
  function transitionGuard(state, enabled) {
    if (!state.transitions?.size && !state.guard) return;
    if (!state.guard && enabled) {
      const style = document.createElement("style");
      style.setAttribute("data-drkr-sheet", ""); ownSheets.add(style);
      (state.root === document ? document.documentElement : state.root).append(style);
      let constructed = null;
      if (!style.sheet && typeof CSSStyleSheet === "function" && "adoptedStyleSheets" in state.root) {
        constructed = new CSSStyleSheet();
        state.root.adoptedStyleSheets = [...state.root.adoptedStyleSheets, constructed];
      }
      state.guard = { style, constructed, css: "" };
    }
    const guard = state.guard;
    if (!guard) return;
    if (enabled) {
      if (!guard.style.isConnected) (state.root === document ? document.documentElement : state.root).append(guard.style);
      if (guard.constructed && !state.root.adoptedStyleSheets.includes(guard.constructed)) state.root.adoptedStyleSheets = [...state.root.adoptedStyleSheets, guard.constructed];
      const groups = new Set();
      for (const [el, group] of state.transitions || []) {
        if (!el.isConnected || el.getRootNode() !== state.root) state.transitions.delete(el);
        else groups.add(group);
      }
      const css = [...groups].map(g => `:is(#drkr-override#drkr-theme,[${transitionAttribute}="${g.id}"]){${g.css}}`).join("\n");
      if (css !== guard.css) {
        if (guard.constructed) guard.constructed.replaceSync(css);
        else guard.style.textContent = css;
        guard.css = css;
      }
    }
    disable(guard, !enabled);
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
        state.guard?.style.remove();
        if (state.guard?.constructed) state.root.adoptedStyleSheets = state.root.adoptedStyleSheets.filter(s => s !== state.guard.constructed);
        if (state.constructed) state.root.adoptedStyleSheets = state.root.adoptedStyleSheets.filter(s => s !== state.constructed);
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
      const value = preserve ? style.getPropertyValue(property) : C.map(style.getPropertyValue(property), mask && property === "background-color" ? "text" : role, role === "text" ? .7 : 0);
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
    const important = ["color", "-webkit-text-fill-color", "background-color", "background-image"].some(p =>
      el.style.getPropertyPriority(p) === "important" && !(p === "color" || p === "-webkit-text-fill-color" ? /^(inherit|unset|currentcolor)$/i : /^(inherit|initial|unset)$/i).test(el.style.getPropertyValue(p).trim()));
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
    if (!preserve && ["INPUT", "TEXTAREA"].includes(el.tagName)) {
      const placeholder = getComputedStyle(el, "::placeholder"), color = C.parse(placeholder.color);
      const value = color && color[3] > 0 ? C.map(`rgb(${color.slice(0, 3).join(",")})`, "text") : null;
      parts.push(value ? `color:${value}!important;-webkit-text-fill-color:${value}!important;opacity:.75!important` : "");
    }
    return parts;
  }
  function groupRules(group) {
    // Two mutually exclusive IDs raise specificity without matching another node.
    // This keeps stylesheet !important backgrounds and their text in sync.
    const selector = `:is(#drkr-override#drkr-theme,[${attribute}="${group.id}"])`;
    return group.parts.flatMap((part, index) => part ? [`${selector}${["", "::before", "::after", "::placeholder"][index]}{${part}}`] : []);
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
      for (const rule of groupRules(group)) sheet(state).insertRule(rule, sheet(state).cssRules.length);
    } else if (!group.count) state.unused--;
    group.count++;
    state.nodes.set(el, group);
    el.setAttribute(attribute, group.id);
  }
  function compact(state) {
    if (state.unused < 128) return;
    for (const [key, group] of state.groups) if (!group.count) state.groups.delete(key);
    const css = (state.root === document ? base : ':host{color-scheme:dark!important}' + pendingControls) + [...state.groups.values()].flatMap(groupRules).join("\n");
    if (state.constructed) state.constructed.replaceSync(css);
    else state.style.textContent = css;
    state.unused = 0;
    disable(state, true);
  }
  function scan() {
    timer = null; framePending = false;
    if (!settings || !document.documentElement) return;
    const start = performance.now();
    const wanted = S.enabled(settings, location.hostname, media.matches);
    if (wanted) observe(document);
    const wasActive = active;
    // Prepare paint-only transition protection while author metadata is intact.
    const transitionTargets = new Set();
    if (wanted) {
      if (full || !wasActive) collect(document.documentElement, true, transitionTargets);
      else for (const [node, deep] of dirty) if (node.isConnected) collect(node, deep, transitionTargets);
    }
    prepareTransitions(transitionTargets);
    for (const state of roots.values()) transitionGuard(state, true);
    for (const state of roots.values()) disable(state, true);
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
        if (state.constructed && !state.root.adoptedStyleSheets.includes(state.constructed)) {
          state.root.adoptedStyleSheets = [...state.root.adoptedStyleSheets, state.constructed];
          full = true;
        }
        if (state.style.isConnected) continue;
        // A page can replace its entire root or remove injected style nodes.
        // CSSOM-only rules disappear on detachment, so regenerate their groups.
        (state.root === document ? document.documentElement : state.root).append(state.style);
        disable(state, true);
        if (state.constructed) state.constructed.replaceSync("");
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
      for (const state of roots.values()) transitionGuard(state, true);
      const pending = [], contexts = new WeakMap(), icons = new WeakMap();
      for (const el of elements) {
        const parts = snapshot(el, contexts, icons);
        if (parts) pending.push([rootState(el.getRootNode()), el, parts]);
      }
      for (const [state, el, parts] of pending) commit(state, el, parts);
      for (const state of roots.values()) {
        if (!state.initialized) {
          const initial = state.root === document ? base : ':host{color-scheme:dark!important}' + pendingControls;
          // Base rules precede element-specific rules of equal specificity.
          const rules = initial.match(/[^{}]+\{[^{}]*\}/g) || [];
          rules.forEach((rule, index) => sheet(state).insertRule(rule, index));
          state.initialized = true;
        }
        compact(state);
        disable(state, false);
      }
      processed = pending.length;
      finishStartup();
    } catch (error) {
      // An unsupported page must stay usable, even if theme generation fails.
      active = false;
      for (const state of roots.values()) disable(state, true);
      finishStartup(true);
      console.warn("drkr could not theme this page", error);
    } finally {
      // Resolve final themed styles while transitions are still suppressed, then
      // restore author transitions. No temporary light state reaches a frame.
      if (roots.size) document.documentElement.getBoundingClientRect();
      for (const state of roots.values()) transitionGuard(state, false);
      scans++; lastScanMs = performance.now() - start;
    }
  }
  function cancelScan() {
    if (!timer) return;
    if (framePending) cancelAnimationFrame(timer);
    else clearTimeout(timer);
    timer = null; framePending = false;
  }
  function schedule(all = false, urgent = false) {
    full ||= all;
    if (timer) {
      if (!urgent || framePending) return;
      cancelScan();
    }
    framePending = urgent;
    timer = urgent ? requestAnimationFrame(scan) : setTimeout(scan, 80);
  }
  const observer = new MutationObserver(records => {
    let changed = false, urgent = false;
    for (const record of records) {
      if (own(record.target)) continue;
      if (record.type === "attributes" && [attribute, readyAttribute, transitionAttribute].includes(record.attributeName)) continue;
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
        if (nodes.some(node => node.nodeName === "STYLE" || node.nodeName === "LINK")) { full = true; urgent = true; }
        if (record.target === document.documentElement || record.target === document.body) urgent = true;
      } else if (record.type === "characterData") {
        queue(record.target.parentElement);
      } else {
        queue(record.target);
        if (record.target === document.documentElement || record.target === document.body) { full = true; urgent = true; }
      }
      if (record.target.nodeName === "STYLE" || record.target.nodeName === "LINK") { full = true; urgent = true; }
      changed = true;
    }
    if (changed) schedule(false, urgent);
  });
  observe(document);
  document.addEventListener("DOMContentLoaded", () => {
    cancelScan();
    full = true; scan();
  }, { once: true });
  document.addEventListener("load", event => { if (event.target.tagName === "LINK") schedule(true, true); }, true);
  // Hover/focus states need a fresh author-style snapshot even without DOM edits.
  for (const event of ["pointerover", "pointerout", "focusin", "focusout"]) {
    document.addEventListener(event, e => {
      if (!active) return;
      const target = e.composedPath()[0];
      // Ancestor :hover/:focus-within rules can restyle a whole nested menu,
      // including siblings of the target. Keep the scope below body/html.
      for (let el = target, depth = 0; el && depth < 4; el = el.parentElement, depth++) {
        if (el === document.body || el === document.documentElement) { queue(el, false); break; }
        queue(el, true);
      }
      schedule(false, true);
    }, { capture: true, passive: true });
  }
  media.addEventListener("change", () => schedule(true, true));
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) { settings = S.normalize(changes.settings.newValue); schedule(true, true); }
  });
  api.runtime.onMessage.addListener(message => {
    if (message.type === "drkr-status") return Promise.resolve({ active, nativeDark });
    if (message.type === "drkr-diagnostics") return Promise.resolve({ scans, lastScanMs, processed, groups: [...roots.values()].reduce((n, state) => n + state.groups.size, 0) });
  });
  window.addEventListener("pageshow", event => { if (event.persisted) schedule(true, true); });
  api.storage.local.get("settings").then(data => { settings = S.normalize(data.settings); full = true; scan(); })
    .catch(error => { finishStartup(true); console.warn("drkr could not load preferences", error); });
})();
