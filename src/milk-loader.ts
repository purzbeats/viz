// Runtime .milk file loader - converts presets in the browser
import { convertPreset } from 'milkdrop-preset-converter-aws';

export interface LoadedPreset {
  name: string;
  preset: object;
}

export async function loadMilkFile(file: File): Promise<LoadedPreset> {
  const content = await file.text();
  const name = file.name.replace(/\.milk$/i, '');

  try {
    const preset = await convertPreset(content);
    return { name, preset };
  } catch (e) {
    throw new Error(`Failed to convert ${name}: ${(e as Error).message}`);
  }
}

export async function loadMilkFiles(files: FileList | File[]): Promise<LoadedPreset[]> {
  const results: LoadedPreset[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    if (file.name.endsWith('.milk')) {
      try {
        const loaded = await loadMilkFile(file);
        results.push(loaded);
      } catch (e) {
        console.warn(`Skipped ${file.name}:`, e);
      }
    }
  }

  return results;
}
