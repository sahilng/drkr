const toggle = document.getElementById('demo-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const dark = document.getElementById('demo-page').classList.toggle('dark');
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.textContent = dark ? 'Dark mode on' : 'Dark mode off';
  });
}
