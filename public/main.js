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
const themePlayer = document.querySelector('#theme-player');
const songEmpty = document.querySelector('#song-empty');
const songUpdated = document.querySelector('#song-updated');
const uploadForm = document.querySelector('#audio-upload-form');
const audioFile = document.querySelector('#audio-file');
const uploadKey = document.querySelector('#upload-key');
const uploadButton = document.querySelector('#audio-upload-button');
const uploadStatus = document.querySelector('#audio-upload-status');

function updateYear() {
  year.textContent = new Date().getFullYear();
}

function showAvailableSong(updatedAt) {
  themePlayer.src = `/api/theme-song?v=${encodeURIComponent(updatedAt)}`;
  themePlayer.hidden = false;
  songEmpty.hidden = true;
  songUpdated.textContent = 'Gravação disponível para ouvir.';
}

async function loadThemeSong() {
  try {
    const response = await fetch('/api/theme-song/meta', { cache: 'no-store' });
    const song = await response.json();
    if (song.available) showAvailableSong(song.updatedAt);
  } catch {
    songUpdated.textContent = 'O player será carregado assim que a conexão voltar.';
  }
}

async function publishThemeSong(file, key) {
  return fetch('/api/theme-song', {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'audio/mpeg', 'X-Upload-Key': key },
    body: file,
  });
}

async function handleAudioUpload(event) {
  event.preventDefault();
  const file = audioFile.files?.[0];
  if (!file || file.size > 60 * 1024 * 1024) {
    uploadStatus.textContent = 'Escolha um áudio de até 60 MB.';
    return;
  }

  uploadButton.disabled = true;
  uploadStatus.textContent = 'Enviando a gravação com segurança...';
  try {
    const response = await publishThemeSong(file, uploadKey.value);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar.');
    showAvailableSong(result.updatedAt);
    uploadStatus.textContent = 'Gravação publicada. O player já está atualizado.';
    uploadForm.reset();
  } catch (error) {
    uploadStatus.textContent = error.message;
  } finally {
    uploadButton.disabled = false;
  }
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

uploadForm.addEventListener('submit', handleAudioUpload);

loadPrefs();
loadThemeSong();
updateYear();
