if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

const intro = document.querySelector('#intro');
const letter = document.querySelector('#letter');
const openButton = document.querySelector('#open-letter');
const player = document.querySelector('#theme-player');
const songEmpty = document.querySelector('#song-empty');
const songUpdated = document.querySelector('#song-updated');
const uploadForm = document.querySelector('#audio-upload-form');
const audioFile = document.querySelector('#audio-file');
const uploadKey = document.querySelector('#upload-key');
const uploadButton = document.querySelector('#audio-upload-button');
const uploadStatus = document.querySelector('#audio-upload-status');

let songAvailable = false;

function showSong(updatedAt) {
  player.src = `/api/theme-song?v=${encodeURIComponent(updatedAt)}`;
  player.hidden = false;
  songEmpty.textContent = 'A música que escolhi está pronta para tocar.';
  songUpdated.textContent = 'Gravação disponível.';
  songAvailable = true;
}

async function loadSong() {
  try {
    const response = await fetch('/api/theme-song/meta', { cache: 'no-store' });
    const song = await response.json();
    if (song.available) showSong(song.updatedAt);
  } catch {
    songUpdated.textContent = 'A música será carregada quando a conexão voltar.';
  }
}

async function openLetter() {
  intro.classList.add('is-open');
  letter.inert = false;
  letter.setAttribute('aria-hidden', 'false');
  if (!songAvailable) return;
  try {
    await player.play();
  } catch {
    document.querySelector('#nossa-musica').scrollIntoView();
  }
}

function uploadSong(file, key) {
  return fetch('/api/theme-song', {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'audio/mpeg', 'X-Upload-Key': key },
    body: file,
  });
}

async function handleUpload(event) {
  event.preventDefault();
  const file = audioFile.files?.[0];
  if (!file || file.size > 60 * 1024 * 1024) {
    uploadStatus.textContent = 'Escolha um áudio de até 60 MB.';
    return;
  }

  uploadButton.disabled = true;
  uploadStatus.textContent = 'Enviando a música...';
  try {
    const response = await uploadSong(file, uploadKey.value);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar.');
    showSong(result.updatedAt);
    uploadStatus.textContent = 'Música publicada.';
    uploadForm.reset();
  } catch (error) {
    uploadStatus.textContent = error.message;
  } finally {
    uploadButton.disabled = false;
  }
}

openButton.addEventListener('click', openLetter);
uploadForm.addEventListener('submit', handleUpload);
player.addEventListener('play', () => document.body.classList.add('is-playing'));
player.addEventListener('pause', () => document.body.classList.remove('is-playing'));

letter.setAttribute('aria-hidden', 'true');
loadSong();
