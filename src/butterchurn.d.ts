declare module 'butterchurn' {
  interface VisualizerOptions {
    width: number;
    height: number;
    pixelRatio?: number;
    textureRatio?: number;
  }

  interface Visualizer {
    connectAudio(audioNode: AudioNode): void;
    loadPreset(preset: object, blendTime?: number): void;
    setRendererSize(width: number, height: number): void;
    render(): void;
    launchSongTitleAnim(title: string): void;
  }

  function createVisualizer(
    audioContext: AudioContext,
    canvas: HTMLCanvasElement,
    options: VisualizerOptions
  ): Visualizer;

  export default { createVisualizer };
}

declare module 'butterchurn-presets' {
  function getPresets(): Record<string, object>;
  export default { getPresets };
}

declare module 'milkdrop-preset-converter-aws' {
  export function convertPreset(presetText: string): Promise<object>;
  export function convertShader(shaderText: string): Promise<string>;
}
