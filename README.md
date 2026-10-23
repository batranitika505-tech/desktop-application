# Newton Athena

**AI-Assisted Examination Integrity System**

## Purpose

Newton Athena is a desktop examination-proctoring application designed to ensure examination integrity through AI-assisted monitoring. This project is being developed incrementally through verifiable milestones.

## Technology Stack

| Layer      | Technology        |
|------------|-------------------|
| Desktop    | Electron          |
| UI         | React 18          |
| Bundler    | Vite              |
| Language   | JavaScript (ES6+) |
| Styling    | Vanilla CSS       |

## Development Commands

```bash
# Install dependencies
npm install

# Start Vite dev server + Electron together
npm run electron:dev

# Start Vite dev server only (browser preview)
npm run dev

# Production build (Vite)
npm run build

# Launch Electron pointing to existing dev server
npm run electron:start
```

## Architecture Overview

```
desktop-application/
├── electron/
│   ├── main.cjs          # Electron main process (window creation, IPC)
│   └── preload.cjs        # Preload script (contextBridge, safe IPC)
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Root React component (landing screen)
│   ├── App.css            # App-specific styles
│   └── index.css          # Global styles & CSS custom properties
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json           # Dependencies & scripts
└── vite.config.js         # Vite configuration
```

### Security Model

- `contextIsolation: true` — renderer runs in an isolated context
- `nodeIntegration: false` — no direct Node.js access in renderer
- `sandbox: true` — renderer process is sandboxed
- IPC communication goes through `contextBridge` in the preload script

## Current Milestone

**Foundation** — Clean Electron + React + Vite desktop application that starts successfully in development mode.
