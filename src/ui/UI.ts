import { AudioEngine } from '../audio/AudioEngine';
import { PresetManager } from '../presets/PresetManager';

export class UI {
  private engine: AudioEngine;
  private presetManager: PresetManager;

  private micBtn: HTMLButtonElement;
  private fileBtn: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private presetsContainer: HTMLElement;
  private statusEl: HTMLElement;

  constructor(engine: AudioEngine, presetManager: PresetManager) {
    this.engine = engine;
    this.presetManager = presetManager;

    // Get DOM elements
    this.micBtn = document.getElementById('mic-btn') as HTMLButtonElement;
    this.fileBtn = document.getElementById('file-btn') as HTMLButtonElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.presetsContainer = document.getElementById('presets') as HTMLElement;
    this.statusEl = document.getElementById('status') as HTMLElement;

    this.setupEventListeners();
    this.renderPresets();
    this.updateStatus();
  }

  private setupEventListeners(): void {
    // Microphone button
    this.micBtn.addEventListener('click', async () => {
      try {
        await this.engine.connectMicrophone();
        this.updateAudioButtons();
        this.updateStatus();
      } catch (err) {
        this.statusEl.textContent = 'Microphone access denied';
      }
    });

    // File button
    this.fileBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    // File input
    this.fileInput.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await this.engine.loadAudioFile(file);
          this.updateAudioButtons();
          this.updateStatus();
        } catch (err) {
          this.statusEl.textContent = 'Failed to load audio file';
        }
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        this.presetManager.next();
        this.renderPresets();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.presetManager.previous();
        this.renderPresets();
      }
    });
  }

  private renderPresets(): void {
    this.presetsContainer.innerHTML = '';

    this.presetManager.all.forEach((preset, index) => {
      const btn = document.createElement('button');
      btn.textContent = preset.name;
      btn.className = preset.name === this.presetManager.currentName ? 'active' : '';

      btn.addEventListener('click', () => {
        this.presetManager.select(index);
        this.renderPresets();
      });

      this.presetsContainer.appendChild(btn);
    });
  }

  private updateAudioButtons(): void {
    const source = this.engine.currentSource;
    this.micBtn.classList.toggle('active', source === 'microphone');
    this.fileBtn.classList.toggle('active', source === 'file');
  }

  private updateStatus(): void {
    const source = this.engine.currentSource;
    if (source === 'none') {
      this.statusEl.textContent = 'Select an audio source to begin';
    } else if (source === 'microphone') {
      this.statusEl.textContent = 'Listening to microphone...';
    } else {
      this.statusEl.textContent = 'Playing audio file...';
    }
  }
}
