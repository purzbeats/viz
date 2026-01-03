# VIZ

A WebGL audio visualizer powered by Butterchurn (Milkdrop for the web). Supports 100+ built-in presets and can load custom `.milk` preset files.

## Features

- **Butterchurn Engine** - WebGL implementation of Milkdrop 2
- **100+ Built-in Presets** - Classic Milkdrop visualizations ready to go
- **Custom Preset Loading** - Drag & drop or browse for `.milk` files
- **Real-time Conversion** - Converts Milkdrop presets (HLSL) to WebGL (GLSL) in the browser
- **Audio Sources** - Microphone input or audio file playback
- **Searchable Preset List** - Filter through presets quickly

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

| Key | Action |
|-----|--------|
| `←` `→` or `Space` | Navigate presets |
| `R` | Random preset |
| `H` | Toggle UI |
| `Esc` | Hide UI |

**Drag & Drop:**
- `.milk` files - Adds custom presets
- Audio files - Plays and visualizes

## Loading Custom Presets

1. Click **"Load .milk Presets"** button
2. Select one or more `.milk` files
3. Presets are converted and added to the list (marked with cyan indicator)

Or simply drag & drop `.milk` files onto the window.

## Tech Stack

- **Vite** - Build tooling
- **TypeScript** - Type safety
- **Butterchurn** - Milkdrop WebGL renderer
- **milkdrop-preset-converter-aws** - HLSL to GLSL preset conversion

## Project Structure

```
viz/
├── src/
│   ├── main.ts              # Application entry point
│   ├── milk-loader.ts       # .milk file loading & conversion
│   ├── butterchurn.d.ts     # Type declarations
│   └── ...
├── index.html               # UI and styles
├── package.json
└── vite.config.ts
```

## Credits

- [Butterchurn](https://github.com/jberg/butterchurn) by Jordan Berg
- [Milkdrop](https://en.wikipedia.org/wiki/MilkDrop) by Ryan Geiss
- Preset authors from the Milkdrop community
