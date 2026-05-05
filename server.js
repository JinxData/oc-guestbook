const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'guestbook.db');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// SQLite Datenbank
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Tabellen erstellen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES entries(id)
  )`);
});

// API: Alle Einträge holen (neueste zuerst)
app.get('/api/entries', (req, res) => {
  db.all(`
    SELECT 
      e.id, e.name, e.message, e.created_at,
      COUNT(CASE WHEN r.emoji = '👍' THEN 1 END) as likes,
      COUNT(CASE WHEN r.emoji = '❤️' THEN 1 END) as hearts,
      COUNT(CASE WHEN r.emoji = '🔥' THEN 1 END) as fires,
      COUNT(CASE WHEN r.emoji = '😂' THEN 1 END) as laughs
    FROM entries e
    LEFT JOIN reactions r ON e.id = r.entry_id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: Neuen Eintrag erstellen
app.post('/api/entries', (req, res) => {
  const { name, message } = req.body;
  
  if (!name || !message) {
    res.status(400).json({ error: 'Name und Nachricht erforderlich' });
    return;
  }
  
  if (name.length > 50 || message.length > 500) {
    res.status(400).json({ error: 'Name max 50 Zeichen, Nachricht max 500 Zeichen' });
    return;
  }
  
  db.run(
    'INSERT INTO entries (name, message) VALUES (?, ?)',
    [name.trim(), message.trim()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, message, created_at: new Date().toISOString() });
    }
  );
});

// API: Reaktion hinzufügen
app.post('/api/entries/:id/react', (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  
  const validEmojis = ['👍', '❤️', '🔥', '😂'];
  if (!validEmojis.includes(emoji)) {
    res.status(400).json({ error: 'Ungültige Reaktion' });
    return;
  }
  
  db.run(
    'INSERT INTO reactions (entry_id, emoji) VALUES (?, ?)',
    [id, emoji],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cyberpunk Gästebuch läuft auf http://0.0.0.0:${PORT}`);
});
