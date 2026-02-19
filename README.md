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

### Generator

UUID and Password/Secret generation.

- Generate UUID v4
- Configurable password length (8-64)
- Customizable character sets (Uppercase, Numbers, Symbols)
- One-click copy to clipboard

### Unix Timestamp Converter

Bidirectional date-time conversion.

- Timestamp ↔ Human-readable date
- Support for Seconds and Milliseconds
- Current time display and "Use Current" feature
- Support for ISO and local formats

### Cron Expression Explainer

Human-readable cron descriptions.

- Instant translation of cron expressions
- 24-hour format support
- Predefined common examples
- Real-time syntax validation

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
- **Request Inspector** (view headers and body)
- **Repeat Request** functionality
- Real-time request logging

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
