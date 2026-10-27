const toggle = document.getElementById('demo-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const dark = document.getElementById('demo-page').classList.toggle('dark');
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.textContent = dark ? 'Dark mode on' : 'Dark mode off';
  });
}

const appearanceToggle = document.getElementById('appearance-toggle');
if (appearanceToggle) {
  appearanceToggle.addEventListener('click', () => {
    const dark = document.documentElement.dataset.appearance !== 'dark';
    document.documentElement.dataset.appearance = dark ? 'dark' : 'light';
    appearanceToggle.textContent = dark ? 'Use light appearance' : 'Use dark appearance';
  });
}
