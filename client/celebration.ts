import type { StoredCelebration } from '../src/celebration.js';

function requireElement<ElementType extends Element>(selector: string): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  return element;
}

function setText(selector: string, value: string): void {
  requireElement<HTMLElement>(selector).textContent = value;
}

function celebrationSlug(): string {
  const slug = window.location.pathname.split('/').filter(Boolean).pop();
  if (!slug) throw new Error('Endereço da página inválido.');
  return slug;
}

function formatSpecialDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`));
}

function renderCover(celebration: StoredCelebration): void {
  const frame = requireElement<HTMLElement>('#cover-frame');
  const cover = requireElement<HTMLImageElement>('#cover-photo');
  const firstPhoto = celebration.photos[0];
  frame.classList.toggle('no-photo', !firstPhoto);
  if (firstPhoto) cover.src = firstPhoto;
  cover.alt = firstPhoto ? `Foto escolhida para homenagear ${celebration.recipient}` : '';
  setText('#cover-caption', `Para ${celebration.recipient}, com carinho.`);
}

function renderGallery(celebration: StoredCelebration): void {
  const memories = requireElement<HTMLElement>('#memories');
  const gallery = requireElement<HTMLElement>('#photo-gallery');
  const galleryPhotos = celebration.photos.slice(1);
  memories.classList.toggle('no-gallery', galleryPhotos.length === 0);
  galleryPhotos.forEach((source, index) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    figure.className = 'gallery-photo';
    image.src = source;
    image.alt = `Lembrança ${index + 1} de ${celebration.recipient}`;
    image.loading = 'lazy';
    figure.append(image);
    gallery.append(figure);
  });
}

function renderMusic(celebration: StoredCelebration): void {
  const section = requireElement<HTMLElement>('#soundtrack');
  const player = requireElement<HTMLAudioElement>('#music-player');
  const link = requireElement<HTMLAnchorElement>('#music-link');
  section.hidden = !celebration.audio && !celebration.musicLink;
  if (celebration.audio) { player.src = celebration.audio; player.hidden = false; }
  if (celebration.musicLink) { link.href = celebration.musicLink; link.hidden = false; }
  player.addEventListener('play', () => document.body.classList.add('is-playing'));
  player.addEventListener('pause', () => document.body.classList.remove('is-playing'));
}

function renderLetter(celebration: StoredCelebration): void {
  const paragraphs = requireElement<HTMLElement>('#message-paragraphs');
  celebration.copy.paragraphs.forEach((paragraphText) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = paragraphText;
    paragraphs.append(paragraph);
  });
  setText('#message-title', celebration.copy.messageTitle);
  setText('#declaration', celebration.copy.declaration);
  setText('#signature', celebration.signature);
  setText('#closing', celebration.copy.closing);
}

function updatePageMetadata(celebration: StoredCelebration): void {
  document.title = `Para ${celebration.recipient} | Laço`;
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const themeColors: Record<StoredCelebration['copy']['theme'], string> = { editorial:'#173f3a', solar:'#b44724', jardim:'#375941', oceano:'#27526c', noite:'#672a36' };
  themeMeta?.setAttribute('content', themeColors[celebration.copy.theme]);
}

function renderCelebration(celebration: StoredCelebration): void {
  document.body.dataset.theme = celebration.copy.theme;
  setText('#intro-name', celebration.recipient);
  setText('#intro-occasion', celebration.occasion);
  setText('#occasion', celebration.copy.kicker);
  setText('#headline', celebration.copy.headline);
  setText('#opening', celebration.copy.opening);
  const specialDate = formatSpecialDate(celebration.celebrationDate);
  const dateElement = requireElement<HTMLElement>('#special-date');
  dateElement.hidden = !specialDate;
  dateElement.textContent = specialDate ?? '';
  renderCover(celebration);
  renderGallery(celebration);
  renderMusic(celebration);
  renderLetter(celebration);
  updatePageMetadata(celebration);
}

function revealLoadedPage(): void {
  document.body.classList.remove('is-loading');
  requireElement<HTMLElement>('#loading').hidden = true;
  requireElement<HTMLElement>('#intro').hidden = false;
}

function showNotFound(): void {
  document.body.classList.remove('is-loading');
  requireElement<HTMLElement>('#loading').hidden = true;
  requireElement<HTMLElement>('#not-found').hidden = false;
}

async function loadCelebration(): Promise<void> {
  const response = await fetch(`/api/celebrations/${encodeURIComponent(celebrationSlug())}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Página não encontrada.');
  const celebration = await response.json() as StoredCelebration;
  renderCelebration(celebration);
  revealLoadedPage();
}

function openCelebration(): void {
  requireElement<HTMLElement>('#intro').classList.add('is-open');
  const celebration = requireElement<HTMLElement>('#celebration');
  celebration.hidden = false;
  celebration.inert = false;
}

async function shareCelebration(): Promise<void> {
  const status = requireElement<HTMLElement>('#share-status');
  try {
    if (navigator.share) await navigator.share({ title: document.title, url: window.location.href });
    else await navigator.clipboard.writeText(window.location.href);
    status.textContent = navigator.share ? 'Página compartilhada.' : 'Link copiado.';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    status.textContent = 'Copie o endereço desta página para compartilhar.';
  }
}

requireElement<HTMLButtonElement>('#open-page').addEventListener('click', openCelebration);
requireElement<HTMLButtonElement>('#share-page').addEventListener('click', shareCelebration);
loadCelebration().catch(showNotFound);
