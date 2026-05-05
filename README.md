# oc-guestbook

Ein Cyberpunk-Gästebuch für dein Heimnetzwerk!

## Features

- 🎨 Neon-Cyberpunk Design
- 📝 Kommentare mit Namen hinterlassen
- 👍 Reaktionen auf Einträge
- 📱 Mobile-responsive
- 🐳 Docker-fähig

## Installation

### Mit Docker

```bash
docker build -t oc-guestbook .
docker run -p 3000:3000 -v $(pwd)/data:/app/data oc-guestbook
```

### Ohne Docker

```bash
npm install
npm start
```

## Nutzung

Öffne `http://localhost:3000` in deinem Browser.

## Datenbank

SQLite wird verwendet. Die Datenbank liegt unter `./data/guestbook.db`.
