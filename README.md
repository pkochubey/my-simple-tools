# My Simple Tools

Windows desktop application with a collection of developer utilities.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun.js-orange)

## Features

### Base64 to File
Convert base64 strings to files.
- Extract base64 from JSON or arbitrary text
- Auto-detect file format by magic bytes (PNG, JPG, PDF, ZIP, EXE, etc.)
- Manual format selection for saving
- Drag & drop file support

### File to Base64
Convert files to base64 strings.
- Support for any file format
- Copy result to clipboard

### JWT Decoder
Decode and analyze JWT tokens.
- Display header and payload in formatted JSON
- Check expiration status (expired/valid)
- Show expiration time in human-readable format

### XRay Config Editor
Edit XRay routing configuration via SSH.
- SSH connection to remote server
- Load and save `05_routing.json`
- **Text search** with result navigation
- JSON formatting
- Xkeen control (start/stop/restart)

### Reverse Proxy
Lightweight reverse proxy server.
- Route by path prefix → target URL
- Add/delete/edit routes
- Enable/disable individual routes
- Request logging

## Tech Stack

- **Runtime:** Bun.js
- **Frontend:** React 19, Vite 7, TypeScript
- **Desktop:** webview-bun (native OS webview)
- **SSH:** ssh2

## Development

```bash
# Install dependencies
bun install

# Run backend server
bun run dev

# Run frontend (in another terminal)
bun run dev:frontend
```

## Build

```bash
bun run build
```

Output in `dist/`:
- `my-simple-tools.exe` — executable (GUI, no console window)
- `frontend/` — static frontend files
- `config.json` — configuration

## Configuration

### config.json

Main configuration file:

```json
{
  "tools": {
    "base64": { "enabled": true, "label": "Base64 to File", "icon": "📄" },
    "fileToBase64": { "enabled": true, "label": "File to Base64", "icon": "📁" },
    "jwt": { "enabled": true, "label": "JWT Decoder", "icon": "🔑" },
    "xray": { "enabled": true, "label": "XRay Config", "icon": "⚙️" },
    "proxy": { "enabled": true, "label": "Proxy", "icon": "🔀" }
  },
  "ssh": {
    "host": "192.168.1.1",
    "port": 222,
    "username": "root",
    "password": "",
    "configPath": "/opt/etc/xray/configs/05_routing.json"
  },
  "app": {
    "port": 3001,
    "openBrowser": true
  },
  "base64": {
    "defaultOutputDir": "./output",
    "rememberLastFormat": true,
    "lastUsedFormat": "bin"
  }
}
```

### Environment Variables

For SSH password, use a `.env` file (recommended for security):

```bash
# .env
SSH_PASSWORD=your_password_here
```

Copy `.env.example` to `.env` and set your password. The `.env` file is included in `.gitignore`.

## Usage

1. Place `config.json` and `.env` next to `my-simple-tools.exe`
2. Run `my-simple-tools.exe`
3. The application will open in a native window

## Requirements

- Windows 10/11
- For building: Bun.js 1.0+
