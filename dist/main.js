if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

const year = document.querySelector('#year');
const status = document.querySelector('#status');
const form = document.querySelector('#prefs-form');
const hourInput = document.querySelector('#pref-hora');
const msgInput = document.querySelector('#pref-msg');
const themeBtn = document.querySelector('#toggle-theme');
const root = document.documentElement;

function updateYear() {
  year.textContent = new Date().getFullYear();
}

function loadPrefs() {
  const prefs = JSON.parse(localStorage.getItem('debora:prefs') || '{}');
  if (prefs.hour) hourInput.value = prefs.hour;
  if (prefs.msg) msgInput.value = prefs.msg;
  if (prefs.theme === 'light') {
    root.dataset.theme = 'light';
    themeBtn.setAttribute('aria-pressed', 'true');
  }
}

function savePrefs(hour, msg) {
  localStorage.setItem('debora:prefs', JSON.stringify({
    hour,
    msg,
    theme: root.dataset.theme || 'dark',
    savedAt: new Date().toISOString(),
  }));
}

function toggleTheme() {
  if (root.dataset.theme === 'light') {
    root.dataset.theme = '';
    themeBtn.setAttribute('aria-pressed', 'false');
  } else {
    root.dataset.theme = 'light';
    themeBtn.setAttribute('aria-pressed', 'true');
  }
  savePrefs(hourInput.value, msgInput.value || '');
}

themeBtn.addEventListener('click', toggleTheme);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const hour = hourInput.value;
  const msg = (msgInput.value || '').trim();
  if (!hour) {
    status.textContent = 'Escolha uma hora para salvar o lembrete.';
    return;
  }
  savePrefs(hour, msg);
  status.textContent = 'Preferências salvas com sucesso.';
});

loadPrefs();
updateYear();
