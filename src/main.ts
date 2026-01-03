import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { loadMilkFiles, LoadedPreset } from './milk-loader';

let visualizer: ReturnType<typeof butterchurn.createVisualizer> | null = null;
let audioContext: AudioContext | null = null;
let sourceNode: AudioNode | null = null;
let audioElement: HTMLAudioElement | null = null;
let gainNode: GainNode | null = null;

// Preset management
const builtInPresets = butterchurnPresets.getPresets();
const customPresets: Record<string, object> = {};
let allPresetKeys: string[] = Object.keys(builtInPresets).sort();
let currentPresetIndex = 0;

function getAllPresets(): Record<string, object> {
  return { ...builtInPresets, ...customPresets };
}

function refreshPresetKeys(): void {
  allPresetKeys = [...Object.keys(builtInPresets), ...Object.keys(customPresets)].sort();
}

// Canvas setup
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

// UI elements
const micBtn = document.getElementById('mic-btn') as HTMLButtonElement;
const fileBtn = document.getElementById('file-btn') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const milkBtn = document.getElementById('milk-btn') as HTMLButtonElement;
const milkInput = document.getElementById('milk-input') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLElement;
const presetSearch = document.getElementById('preset-search') as HTMLInputElement;
const presetList = document.getElementById('preset-list') as HTMLElement;
const presetCount = document.getElementById('preset-count') as HTMLElement;
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
const volumeValue = document.getElementById('volume-value') as HTMLElement;

// Initialize Butterchurn
async function initButterchurn(): Promise<void> {
  audioContext = new AudioContext();

  // Create gain node for volume control
  gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = parseInt(volumeSlider.value) / 100;

  visualizer = butterchurn.createVisualizer(audioContext, canvas, {
    width: canvas.width,
    height: canvas.height,
    pixelRatio: window.devicePixelRatio || 1,
    textureRatio: 1,
  });

  // Load initial preset
  loadPreset(0);
  renderPresetList();
  updatePresetCount();
  updateStatus('Select an audio source to begin');
}

function loadPreset(index: number, blend = 2.7): void {
  if (index >= 0 && index < allPresetKeys.length && visualizer) {
    currentPresetIndex = index;
    const presetName = allPresetKeys[index];
    const allPresets = getAllPresets();
    visualizer.loadPreset(allPresets[presetName], blend);
    updatePresetHighlight();
    statusEl.textContent = presetName;
  }
}

function loadPresetByName(name: string, blend = 2.7): void {
  const index = allPresetKeys.indexOf(name);
  if (index !== -1) {
    loadPreset(index, blend);
  }
}

function nextPreset(): void {
  loadPreset((currentPresetIndex + 1) % allPresetKeys.length);
}

function prevPreset(): void {
  loadPreset((currentPresetIndex - 1 + allPresetKeys.length) % allPresetKeys.length);
}

function randomPreset(): void {
  loadPreset(Math.floor(Math.random() * allPresetKeys.length));
}

// Render the preset list
function renderPresetList(filter = ''): void {
  presetList.innerHTML = '';
  const filterLower = filter.toLowerCase();
  const customKeys = new Set(Object.keys(customPresets));

  allPresetKeys.forEach((name, index) => {
    if (filter && !name.toLowerCase().includes(filterLower)) return;

    const item = document.createElement('div');
    item.className = 'preset-item' + (index === currentPresetIndex ? ' active' : '');
    if (customKeys.has(name)) {
      item.className += ' custom';
    }
    item.textContent = name;
    item.dataset.index = String(index);

    item.addEventListener('click', () => {
      loadPreset(index, 1.5);
    });

    presetList.appendChild(item);
  });
}

function updatePresetHighlight(): void {
  const items = presetList.querySelectorAll('.preset-item');
  items.forEach((item) => {
    const idx = parseInt((item as HTMLElement).dataset.index || '-1');
    item.classList.toggle('active', idx === currentPresetIndex);
  });

  const active = presetList.querySelector('.preset-item.active');
  if (active) {
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function updatePresetCount(): void {
  const customCount = Object.keys(customPresets).length;
  const builtInCount = Object.keys(builtInPresets).length;
  if (customCount > 0) {
    presetCount.textContent = `${builtInCount} built-in + ${customCount} custom`;
  } else {
    presetCount.textContent = `${builtInCount} presets`;
  }
}

// Add custom presets
async function addCustomPresets(loaded: LoadedPreset[]): Promise<void> {
  for (const { name, preset } of loaded) {
    customPresets[name] = preset;
  }
  refreshPresetKeys();
  renderPresetList(presetSearch.value);
  updatePresetCount();
}

// Audio connection
async function connectMicrophone(): Promise<void> {
  if (!audioContext) await initButterchurn();
  if (audioContext!.state === 'suspended') await audioContext!.resume();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    if (sourceNode) sourceNode.disconnect();
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }

    sourceNode = audioContext!.createMediaStreamSource(stream);
    visualizer?.connectAudio(sourceNode);

    micBtn.classList.add('active');
    fileBtn.classList.remove('active');
    updateStatus('Listening to microphone...');
  } catch {
    updateStatus('Microphone access denied');
  }
}

async function loadAudioFile(file: File): Promise<void> {
  if (!audioContext) await initButterchurn();
  if (audioContext!.state === 'suspended') await audioContext!.resume();

  if (sourceNode) sourceNode.disconnect();
  if (audioElement) {
    audioElement.pause();
  }

  const url = URL.createObjectURL(file);
  audioElement = new Audio();
  audioElement.src = url;
  audioElement.loop = true;

  const source = audioContext!.createMediaElementSource(audioElement);
  source.connect(gainNode!);
  sourceNode = source;

  visualizer?.connectAudio(source);
  await audioElement.play();

  micBtn.classList.remove('active');
  fileBtn.classList.add('active');
  updateStatus(`Playing: ${file.name}`);
}

async function handleMilkFiles(files: FileList | File[]): Promise<void> {
  const milkFiles = Array.from(files).filter(f => f.name.endsWith('.milk'));
  if (milkFiles.length === 0) return;

  updateStatus(`Converting ${milkFiles.length} preset(s)...`);

  try {
    const loaded = await loadMilkFiles(milkFiles);
    await addCustomPresets(loaded);
    updateStatus(`Added ${loaded.length} preset(s)`);

    // Load the first new preset
    if (loaded.length > 0) {
      loadPresetByName(loaded[0].name, 1.5);
    }
  } catch (e) {
    updateStatus(`Error: ${(e as Error).message}`);
  }
}

function updateStatus(msg: string): void {
  statusEl.textContent = msg;
}

// Event listeners
micBtn.addEventListener('click', connectMicrophone);
fileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadAudioFile(file);
});

milkBtn?.addEventListener('click', () => milkInput?.click());
milkInput?.addEventListener('change', async (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files) await handleMilkFiles(files);
});

presetSearch.addEventListener('input', (e) => {
  renderPresetList((e.target as HTMLInputElement).value);
});

volumeSlider.addEventListener('input', (e) => {
  const value = parseInt((e.target as HTMLInputElement).value);
  volumeValue.textContent = `${value}%`;
  if (gainNode) {
    gainNode.gain.value = value / 100;
  }
});

// Drag & drop for .milk files
document.body.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('drag-over');
});

document.body.addEventListener('dragleave', () => {
  document.body.classList.remove('drag-over');
});

document.body.addEventListener('drop', async (e) => {
  e.preventDefault();
  document.body.classList.remove('drag-over');

  const files = e.dataTransfer?.files;
  if (files) {
    // Check if audio or milk files
    const audioFile = Array.from(files).find(f =>
      f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name)
    );
    const milkFiles = Array.from(files).filter(f => f.name.endsWith('.milk'));

    if (milkFiles.length > 0) {
      await handleMilkFiles(milkFiles);
    }
    if (audioFile) {
      await loadAudioFile(audioFile);
    }
  }
});

// Toggle UI button
const toggleBtn = document.getElementById('toggle-ui') as HTMLButtonElement;
const ui = document.getElementById('ui')!;

toggleBtn.addEventListener('click', () => {
  ui.classList.remove('hidden');
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.target === presetSearch) return;

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault();
      nextPreset();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevPreset();
      break;
    case 'r':
      randomPreset();
      break;
    case 'h':
      ui.classList.toggle('hidden');
      break;
    case 'Escape':
      ui.classList.add('hidden');
      break;
  }
});

// Resize handling
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  visualizer?.setRendererSize(canvas.width, canvas.height);
});

// Animation loop
function animate(): void {
  requestAnimationFrame(animate);
  visualizer?.render();
}

// Initialize
initButterchurn().then(() => {
  animate();
  console.log(`Loaded ${allPresetKeys.length} Butterchurn presets`);
});
