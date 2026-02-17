# My Simple Tools — Project Context

## Overview
Windows desktop application providing developer utilities with a modern dark UI.
Built with **Bun.js** (backend) + **React** (frontend) + **webview-bun** (native window).

## Architecture

### Single-exe model (production)
One compiled `my-simple-tools.exe` serves both roles via environment variable `MST_SERVER_MODE`:
1. **Launcher mode** (default): spawns itself as subprocess with `MST_SERVER_MODE=1`, waits for HTTP server readiness, then opens a native webview.
2. **Server mode** (`MST_SERVER_MODE=1`): runs the Bun HTTP server serving the built frontend and `/api/*` endpoints.

### Development mode
- `bun run dev` — starts the backend server directly (no webview)
- `bun run dev:frontend` — starts Vite dev server on port 5173
- Frontend fetches API from the backend at relative `/api/*` paths

### Build pipeline
```
vite build → dist/frontend/
bun build server/index.ts --compile → dist/my-simple-tools.exe (includes server-worker)
python fix-subsystem.py → patches EXE to GUI subsystem (no console window)
cp config.json → dist/
```

## Tech Stack
- **Runtime:** Bun.js
- **Frontend:** React 19, Vite 7, TypeScript (strict mode)
- **Desktop:** webview-bun (native OS webview)
- **SSH:** ssh2 library for remote config editing
- **Build:** Bun native compiler (--compile), Python script for PE subsystem patch

## Project Structure
```
config.json              — Runtime configuration (tools, SSH, app settings)
fix-subsystem.py         — Patches compiled EXEs from Console to GUI subsystem
index.html               — Vite entry HTML
vite.config.ts           — Vite config (React plugin, builds to dist/frontend)
tsconfig.json            — Shared TS config (ESNext, react-jsx, strict)

server/
  index.ts               — Launcher: starts server.exe + opens webview
  server-worker.ts       — HTTP server: static files + API routes
  config.ts              — Config types & load/save from config.json
  base64.ts              — Base64 extraction, format detection, file conversion
  jwt.ts                 — JWT decoding (manual base64url, no external lib)
  ssh.ts                 — SSH operations via ssh2 (read/write XRay config)
  proxy.ts               — Reverse proxy server (start/stop, route management)

src/
  main.tsx               — React entry point
  App.tsx                — Main app with sidebar navigation
  styles.css             — Global styles (dark theme, CSS variables)
  components/
    Base64Tool.tsx       — Base64→File converter UI
    JwtTool.tsx          — JWT decoder UI
    XrayConfig.tsx       — XRay routing config editor via SSH
    ProxyTool.tsx        — Reverse proxy manager UI
```

## Tools (features)
1. **Base64 to File** — Extract base64 from JSON/text, detect file format by magic bytes, save to disk
2. **JWT Decoder** — Decode JWT tokens, show header/payload, check expiration
3. **XRay Config Editor** — SSH to router, read/edit XRay routing JSON config
4. **Reverse Proxy** — Lightweight reverse proxy with route-based forwarding (path prefix → target URL), request logging, and start/stop control

## Configuration (`config.json`)
- `tools.*` — Enable/disable tools, set labels and icons
- `ssh.*` — SSH connection details for XRay config editing
- `app.port` — Server port (default 3001)
- `app.openBrowser` — Flag (currently unused, reserved)
- `base64.*` — Default output dir, format preferences

## Key Conventions
- All API routes are under `/api/` with JSON request/response
- Config is loaded from `config.json` next to the executable (or CWD in dev)
- Frontend uses fetch with relative URLs (`/api/...`)
- No authentication — local-only tool
- TypeScript strict mode with `verbatimModuleSyntax`
- React components use `import type { FC } from 'react'` pattern
- Server binds to `127.0.0.1` only (localhost)

## Known Considerations
- `tsconfig.json` has `"lib": ["ESNext"]` without `"DOM"` — frontend DOM types are handled by Vite/IDE separately; expect DOM-related type errors in the shared tsconfig context
- `app.openBrowser` config field exists but is not yet implemented
- `base64.rememberLastFormat` config field exists but format persistence is not implemented in frontend
- The `public/` directory is empty but referenced by `vite.config.ts`
