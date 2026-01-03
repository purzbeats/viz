export type AudioSource = 'none' | 'microphone' | 'file';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioNode | null = null;
  private audioElement: HTMLAudioElement | null = null;

  private frequencyData: Uint8Array = new Uint8Array(1024);
  private timeDomainData: Uint8Array = new Uint8Array(1024);

  private _currentSource: AudioSource = 'none';

  get currentSource(): AudioSource {
    return this._currentSource;
  }

  get isReady(): boolean {
    return this.analyser !== null;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private createAnalyser(ctx: AudioContext): AnalyserNode {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(analyser.frequencyBinCount);
    return analyser;
  }

  private cleanup(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }

  async connectMicrophone(): Promise<void> {
    this.cleanup();

    const ctx = await this.ensureContext();
    this.analyser = this.createAnalyser(ctx);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = ctx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      this._currentSource = 'microphone';
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw err;
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    this.cleanup();

    const ctx = await this.ensureContext();
    this.analyser = this.createAnalyser(ctx);

    const url = URL.createObjectURL(file);
    this.audioElement = new Audio();
    this.audioElement.src = url;
    this.audioElement.loop = true;

    const source = ctx.createMediaElementSource(this.audioElement);
    source.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.source = source;

    await this.audioElement.play();
    this._currentSource = 'file';
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  getTimeDomainData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
    }
    return this.timeDomainData;
  }

  get sampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  get frequencyBinCount(): number {
    return this.analyser?.frequencyBinCount ?? 1024;
  }
}
