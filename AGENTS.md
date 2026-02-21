# AGENTS.md — Working guide for LLM agents

This file is the default operational guide for the whole repository.

## 1) Project at a glance

- Product: **desktop utility app for Windows** with multiple developer tools in one UI.
- Runtime: **Bun**.
- Frontend: **React + Vite + TypeScript (strict)**.
- Desktop shell: **webview-bun**.
- Backend/API: Bun HTTP server in `server/server-worker.ts`.
- Packaging target: single executable `dist/my-simple-tools.exe` + `dist/frontend` + `dist/config.json`.

## 2) Architecture you must preserve

### Two-mode executable model

`server/index.ts` behaves differently depending on `MST_SERVER_MODE`:

1. **Launcher mode** (default): starts a subprocess of itself with `MST_SERVER_MODE=1`, waits until backend is ready, then opens webview.
2. **Server mode** (`MST_SERVER_MODE=1`): runs Bun API/static server from `server/server-worker.ts`.

Implication for changes:

- If you touch startup, process management, or ports, verify both modes still work.
- Do not hardcode assumptions that only dev mode exists.

### Frontend/backend coupling

- Frontend always calls relative endpoints `/api/*`.
- API routes are centralized in `server/server-worker.ts` and delegated to small modules (`base64.ts`, `jwt.ts`, `proxy.ts`, `ssh.ts`, `json.ts`, `config.ts`).

Implication for changes:

- New feature touching UI almost always needs matching backend endpoint changes.
- Keep response shape backward-compatible where possible (`{ success, ... }` pattern is used widely).

## 3) Repository map (high signal)

- `src/App.tsx` — sidebar navigation and tool tab mounting.
- `src/components/*` — one component per tool.
- `src/styles.css` — global dark theme + shared classes.
- `server/server-worker.ts` — HTTP API router + static file serving.
- `server/proxy.ts` — reverse proxy runtime state + routing + request logs/repeat.
- `server/ssh.ts` — remote XRay file read/write and xkeen actions.
- `server/config.ts` + root `config.json` — runtime configuration contract.
- `fix-subsystem.py` — post-build EXE patching to GUI subsystem.

## 3.1) Source of truth and drift policy

- Keep this file as the single LLM-facing operational guide.
- If `README.md` or other context docs diverge from implementation, trust code first and update docs in the same change.
- Avoid duplicating long project context in multiple files unless there is a clear audience split.

## 4) Dev workflow (preferred commands)

- Install deps: `bun install`
- Backend dev server: `bun run dev`
- Frontend dev server: `bun run dev:frontend`
- Full build: `bun run build`

Notes:

- In local development, run backend and frontend in separate terminals.
- Build includes frontend bundle + exe compile + subsystem patch + config copy.

## 5) Coding conventions for this repo

### TypeScript/React

- Keep strict typing; avoid introducing `any` unless absolutely unavoidable.
- Use functional components + hooks (existing pattern).
- Prefer small state transitions and explicit error messages for user-facing operations.
- Existing components follow API call pattern with `fetch`, `try/catch`, and status message state — keep consistent UX.

### Backend (Bun server)

- Add endpoints in `handleAPI` with explicit method checks.
- Validate payloads defensively and return clear 4xx errors for invalid input.
- Preserve existing JSON contract style:
  - Success: `{ success: true, ... }`
  - Failure: `{ success: false, error: string }`

### CSS/UI

- Reuse existing CSS variables from `:root` before adding new hardcoded colors.
- Keep dark theme consistency (secondary/tertiary background blocks, accent for primary actions).

## 6) Safe change patterns

When adding a new tool:

1. Add backend logic module if needed in `server/`.
2. Register endpoint(s) in `server/server-worker.ts`.
3. Add React component in `src/components/`.
4. Wire tab + conditional rendering in `src/App.tsx`.
5. Add default tool config fallback in `App.tsx` catch branch.
6. Update `config.json` schema/data if tool is toggleable.

When modifying existing API contracts:

- Search all frontend callers first (`rg "/api/<path>" src`).
- Keep old fields if possible; if not possible, update all call sites in one commit.

## 7) Validation checklist before commit

Run what is applicable:

1. `bun run build` (most reliable integration check).
2. If change is frontend-only and fast iteration is needed: at minimum ensure `bun run dev:frontend` starts without TS/Vite errors.
3. For backend endpoint changes, manually hit the endpoint path from tool UI or quick script.

If any check cannot run in environment, document exact limitation in final report.

## 8) Common pitfalls (learned from code structure)

- The app has **two runtime contexts** (launcher vs server). Breaking one can still leave the other seemingly fine.
- `config.json` drives which tools appear in sidebar; missing fallback fields can hide UI unexpectedly.
- Proxy and SSH features are stateful and can fail due to environment/network; always show actionable user-facing errors.
- Static file resolution differs in dev/prod paths; avoid assumptions tied only to `dist/frontend`.

## 8.1) Known implementation considerations

- `app.openBrowser` exists in config as a reserved field; treat as optional/non-authoritative unless you implement its behavior.
- `base64.rememberLastFormat` exists in config, but format persistence may be incomplete in UI flow; verify end-to-end before claiming support.
- `vite.config.ts` references `public/`; do not assume that directory contains required runtime assets.
- Shared TypeScript settings can produce frontend DOM typing friction depending on tooling context; validate with the actual project scripts before refactoring tsconfig defaults.

## 8.2) API/runtime conventions worth preserving

- Keep API routes under `/api/*` and prefer JSON contracts for request/response payloads.
- Frontend should use relative API URLs (`/api/...`) to remain compatible across dev/prod launch modes.
- Treat the app as a local desktop utility (no auth layer by default) unless a task explicitly introduces security boundaries.

## 9) Change communication standard for agents

In final summary, include:

- What changed and why.
- Which layer(s) were touched (frontend/backend/config/build).
- Exact validation commands run and their results.
- Any intentionally deferred work or known limitations.

---
If you create nested `AGENTS.md` files in subdirectories, they override this file for their subtree.
