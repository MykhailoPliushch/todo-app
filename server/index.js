const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

// --- Инициализация БД ---
const db = new sqlite3.Database("todo.db");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- Сервер Express ---
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- REST API ---
app.get("/todos", (req, res) => {
  db.all("SELECT * FROM todos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/todos", (req, res) => {
  const { text } = req.body;
  db.run("INSERT INTO todos (text) VALUES (?)", [text], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM todos WHERE id = ?", [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      io.emit("todo_created", row);
      res.json(row);
    });
  });
});

app.put("/todos/:id", (req, res) => {
  const { text, done } = req.body;
  const id = req.params.id;
  db.run(
    "UPDATE todos SET text=?, done=? WHERE id=?",
    [text, done ? 1 : 0, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT * FROM todos WHERE id=?", [id], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        io.emit("todo_updated", row);
        res.json(row);
      });
    }
  );
});

app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM todos WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    io.emit("todo_deleted", { id });
    res.json({ id });
  });
});

io.on("connection", (s) => console.log("🔌 Client connected:", s.id));

const PORT = 3000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));