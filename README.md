# My Simple Tools

Windows desktop-приложение с набором утилит для разработчиков.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun.js-orange)

## Features

### Base64 to File
Конвертация base64-строк в файлы.
- Извлечение base64 из JSON или произвольного текста
- Автоопределение формата по magic bytes (PNG, JPG, PDF, ZIP, EXE и др.)
- Ручной выбор формата сохранения
- Drag & drop файлов

### File to Base64
Обратная конвертация файлов в base64.
- Поддержка любых форматов файлов
- Копирование результата в буфер обмена

### JWT Decoder
Декодирование и анализ JWT токенов.
- Отображение header и payload в форматированном JSON
- Проверка срока действия (expired/valid)
- Отображение времени истечения в читаемом формате

### XRay Config Editor
Редактирование XRay routing конфигурации через SSH.
- SSH подключение к удалённому серверу
- Загрузка и сохранение `05_routing.json`
- **Поиск по тексту** с навигацией по результатам
- Форматирование JSON
- Управление Xkeen (start/stop/restart)

### Reverse Proxy
Лёгкий reverse proxy сервер.
- Маршрутизация по path prefix → target URL
- Добавление/удаление/редактирование маршрутов
- Включение/отключение отдельных маршрутов
- Логирование запросов

## Tech Stack

- **Runtime:** Bun.js
- **Frontend:** React 19, Vite 7, TypeScript
- **Desktop:** webview-bun (native OS webview)
- **SSH:** ssh2

## Development

```bash
# Установка зависимостей
bun install

# Запуск backend сервера
bun run dev

# Запуск frontend (в другом терминале)
bun run dev:frontend
```

## Build

```bash
bun run build
```

Результат в `dist/`:
- `my-simple-tools.exe` — исполняемый файл (GUI, без консоли)
- `frontend/` — статические файлы интерфейса
- `config.json` — конфигурация

## Configuration

### config.json

Основной файл конфигурации:

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

Для SSH пароля используйте `.env` файл (рекомендуется для безопасности):

```bash
# .env
SSH_PASSWORD=your_password_here
```

Скопируйте `.env.example` в `.env` и укажите свой пароль. Файл `.env` добавлен в `.gitignore`.

## Usage

1. Поместите `config.json` и `.env` рядом с `my-simple-tools.exe`
2. Запустите `my-simple-tools.exe`
3. Приложение откроется в нативном окне

## Requirements

- Windows 10/11
- Для сборки: Bun.js 1.0+
