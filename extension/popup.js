(() => {
  const api = globalThis.browser || globalThis.chrome;
  const S = DrkrSettings;
  const $ = id => document.getElementById(id);
  let settings, host, tab;
  let writes = Promise.resolve();
  let statusTimer;
  function render() {
    document.querySelector(`input[name="mode"][value="${settings.mode}"]`).checked = true;
    $("respect-dark").checked = settings.respectDark;
    $("site-mode").value = Object.prototype.hasOwnProperty.call(settings.sites, host) ? settings.sites[host] : "default";
    $("site-mode").disabled = !host;
    $("hostname").textContent = host || "Unavailable on this page";
    const enabled = S.enabled(settings, host, matchMedia("(prefers-color-scheme: dark)").matches);
    $("badge").textContent = host ? enabled ? "Dark mode" : "Original" : "System page";
    $("site-note").textContent = host ? "Changes apply to open pages automatically." : "Open a website to change its appearance. Safari’s built-in pages cannot be themed.";
  }
  async function refreshStatus() {
    if (!host) return;
    try {
      const status = await api.tabs.sendMessage(tab.id, { type: "drkr-status" }, { frameId: 0 });
      if (status?.nativeDark) $("badge").textContent = "Already dark";
      else if (status && !status.active && S.enabled(settings, host, matchMedia("(prefers-color-scheme: dark)").matches)) $("site-note").textContent = "Dark mode is starting. If needed, reload this page.";
    } catch { $("site-note").textContent = "Allow Drkr access to this website in Safari, then reload the page."; }
  }
  function save(update) {
    // Serialize read/modify/write so separate popup controls preserve each other.
    writes = writes.catch(() => {}).then(async () => {
      const latest = S.normalize((await api.storage.local.get("settings")).settings);
      update(latest);
      await api.storage.local.set({ settings: latest });
      settings = latest;
      render();
      $("feedback").textContent = "Saved. Open pages update automatically.";
      clearTimeout(statusTimer);
      statusTimer = setTimeout(refreshStatus, 200);
    }).catch(() => { $("feedback").textContent = "Couldn’t save. Please reopen Drkr and try again."; });
  }
  async function init() {
    try {
      const [stored, tabs] = await Promise.all([api.storage.local.get("settings"), api.tabs.query({ active: true, currentWindow: true })]);
      settings = S.normalize(stored.settings);
      tab = tabs[0];
      host = S.hostname(tab?.url);
      render();
      document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener("change", () => save(s => { s.mode = input.value; })));
      $("respect-dark").addEventListener("change", event => { const value = event.target.checked; save(s => { s.respectDark = value; }); });
      $("site-mode").addEventListener("change", event => {
        const value = event.target.value;
        save(s => { if (value === "default") delete s.sites[host]; else s.sites[host] = value; });
      });
      refreshStatus();
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { render(); refreshStatus(); });
    } catch { $("feedback").textContent = "Couldn’t load extension settings. Reopen Drkr to try again."; }
  }
  init();
})();
