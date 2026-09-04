type StepNumber = 1 | 2 | 3;

interface PhotoCandidate { file: File; objectUrl: string; score: number; }
interface CreateCelebrationResponse { error?: string; url?: string; }

function requireElement<ElementType extends Element>(selector: string): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  return element;
}

const form = requireElement<HTMLFormElement>('#celebration-form');
const photoInput = requireElement<HTMLInputElement>('#photos');
const photoPreview = requireElement<HTMLElement>('#photo-preview');
const createButton = requireElement<HTMLButtonElement>('#create-button');
const formStatus = requireElement<HTMLElement>('#form-status');
const steps = [...document.querySelectorAll<HTMLElement>('[data-step]')];
const progressButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-go-step]')];
let activeStep: StepNumber = 1;
let photos: PhotoCandidate[] = [];

function showStep(nextStep: StepNumber): void {
  activeStep = nextStep;
  steps.forEach((step) => {
    const isActive = Number(step.dataset.step) === activeStep;
    step.classList.toggle('is-active', isActive);
    step.hidden = !isActive;
  });
  progressButtons.forEach((button) => button.classList.toggle('is-active', Number(button.dataset.goStep) <= activeStep));
}

function validateActiveStep(): boolean {
  const currentStep = steps.find((step) => Number(step.dataset.step) === activeStep);
  const fields = [...(currentStep?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select') ?? [])];
  const invalidField = fields.find((field) => !field.checkValidity());
  invalidField?.reportValidity();
  return !invalidField;
}

function setPreview(sourceSelector: string, targetSelector: string, fallback: string): void {
  const source = requireElement<HTMLInputElement | HTMLTextAreaElement>(sourceSelector);
  const target = requireElement<HTMLElement>(targetSelector);
  const refresh = (): void => { target.textContent = source.value.trim() || fallback; };
  source.addEventListener('input', refresh);
  refresh();
}

async function inspectPhoto(file: File): Promise<PhotoCandidate> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = objectUrl;
  await image.decode().catch(() => undefined);
  const pixels = image.naturalWidth * image.naturalHeight;
  const portraitBonus = image.naturalHeight >= image.naturalWidth ? 1.15 : 1;
  return { file, objectUrl, score: pixels * portraitBonus };
}

function releasePhotos(): void {
  photos.forEach((photo) => URL.revokeObjectURL(photo.objectUrl));
  photos = [];
}

function chooseCover(index: number): void {
  const selected = photos[index];
  if (!selected) return;
  photos = [selected, ...photos.filter((_, photoIndex) => photoIndex !== index)];
  renderPhotos();
}

function renderPhotos(): void {
  photoPreview.replaceChildren();
  photos.forEach((photo, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    const badge = document.createElement('span');
    button.type = 'button';
    button.className = `photo-card${index === 0 ? ' is-cover' : ''}`;
    button.ariaLabel = index === 0 ? 'Foto de capa selecionada' : 'Usar esta foto como capa';
    image.src = photo.objectUrl;
    image.alt = '';
    badge.textContent = index === 0 ? 'capa' : 'escolher';
    button.append(image, badge);
    button.addEventListener('click', () => chooseCover(index));
    photoPreview.append(button);
  });
}

async function handlePhotoSelection(): Promise<void> {
  releasePhotos();
  const selectedFiles = [...(photoInput.files ?? [])].slice(0, 10);
  photos = await Promise.all(selectedFiles.map(inspectPhoto));
  photos.sort((left, right) => right.score - left.score);
  renderPhotos();
}

function buildPayload(): FormData {
  const payload = new FormData(form);
  payload.delete('photos');
  photos.forEach((photo) => payload.append('photos', photo.file));
  payload.set('coverPhotoIndex', '0');
  return payload;
}

async function submitCelebration(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!validateActiveStep()) return;
  createButton.disabled = true;
  formStatus.textContent = 'Transformando sua história em uma página única...';
  try {
    const response = await fetch('/api/celebrations', { method: 'POST', body: buildPayload() });
    const result = await response.json() as CreateCelebrationResponse;
    if (!response.ok || !result.url) throw new Error(result.error ?? 'Não foi possível criar a página.');
    window.location.assign(result.url);
  } catch (error) {
    formStatus.textContent = error instanceof Error ? error.message : 'Não foi possível criar a página.';
    createButton.disabled = false;
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-next]').forEach((button) => button.addEventListener('click', () => {
  if (validateActiveStep() && activeStep < 3) showStep((activeStep + 1) as StepNumber);
}));
document.querySelectorAll<HTMLButtonElement>('[data-back]').forEach((button) => button.addEventListener('click', () => showStep(Math.max(1, activeStep - 1) as StepNumber)));
progressButtons.forEach((button) => button.addEventListener('click', () => {
  const requestedStep = Number(button.dataset.goStep) as StepNumber;
  if (requestedStep <= activeStep || validateActiveStep()) showStep(requestedStep);
}));
setPreview('#recipient', '#preview-name', 'alguém especial');
setPreview('#occasion', '#preview-occasion', 'Uma ocasião especial');
setPreview('#story-prompt', '#preview-message', 'A sua história vai transformar esta página.');
setPreview('#signature', '#preview-signature', 'com carinho');
photoInput.addEventListener('change', handlePhotoSelection);
form.addEventListener('submit', submitCelebration);
window.addEventListener('pagehide', releasePhotos);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}
