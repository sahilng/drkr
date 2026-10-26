/* Shared by the popup and isolated content scripts. */
globalThis.DrkrSettings = (() => {
  const defaults = { mode: "on", sites: {}, respectDark: true };
  function normalize(value = {}) {
    if (!value || typeof value !== "object") value = {};
    return {
      mode: ["on", "off", "system"].includes(value.mode) ? value.mode : defaults.mode,
      sites: Object.fromEntries(Object.entries(value.sites && typeof value.sites === "object" && !Array.isArray(value.sites) ? value.sites : {}).filter(([host, mode]) => host && ["on", "off"].includes(mode))),
      respectDark: value.respectDark !== false
    };
  }
  function enabled(settings, host, systemDark) {
    const mode = Object.prototype.hasOwnProperty.call(settings.sites, host) ? settings.sites[host] : settings.mode;
    return mode === "on" || (mode === "system" && systemDark);
  }
  function hostname(url) {
    try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname : null; }
    catch { return null; }
  }
  return { defaults, normalize, enabled, hostname };
})();
