import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "mtc-secret-key-2026";

// Khởi tạo Database
const db = new Database("worktrack.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'employee',
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try { db.prepare("SELECT note FROM time_logs LIMIT 1").get(); } 
catch (e) { db.exec("ALTER TABLE time_logs ADD COLUMN note TEXT"); }

// TỰ ĐỘNG TẠO TÀI KHOẢN ADMIN NẾU CHƯA CÓ
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@worktrack.com");
if (!adminExists) {
  const hashedPw = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)").run(
    "admin@worktrack.com",
    hashedPw,
    "Quản Trị Viên",
    "admin",
    "Ban Giám Đốc"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  app.post("/api/register", (req, res) => {
    const { email, password, name, department } = req.body;
    try {
      const hashedPw = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)").run(email, hashedPw, name, 'employee', department || 'Nhân viên');
      const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, department: user.department }, JWT_SECRET);
      res.json({ token, user });
    } catch (err) { res.status(400).json({ error: "Email đã tồn tại" }); }
  });

  app.post("/api/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      
      // Sửa lỗi sập server nếu user không tồn tại
      if (!user) {
        return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
      }
      
      if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, department: user.department }, JWT_SECRET);
        res.json({ token, user });
      } else { 
        res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" }); 
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
  });

  app.post("/api/track", authenticateToken, (req: any, res) => {
    const { type, note } = req.body;
    db.prepare("INSERT INTO time_logs (user_id, type, note) VALUES (?, ?, ?)").run(req.user.id, type, note || "");
    res.json({ success: true });
  });

  app.get("/api/logs", authenticateToken, (req: any, res) => {
    const logs = db.prepare("SELECT * FROM time_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100").all(req.user.id);
    res.json(logs);
  });

  app.get("/api/users", authenticateToken, (req: any, res) => {
    const users = db.prepare("SELECT id, name, email, department, role FROM users ORDER BY name ASC").all();
    res.json(users);
  });

  app.get("/api/stats/today", authenticateToken, (req: any, res) => {
    const today = new Date().toISOString().split('T')[0];
    const count = db.prepare(`SELECT COUNT(*) as count FROM time_logs WHERE user_id = ? AND date(timestamp) = date(?)`).get(req.user.id, today);
    res.json(count);
  });

  app.get("/api/export", authenticateToken, (req: any, res) => {
    const logs = db.prepare("SELECT u.name, u.email, u.department, t.type, t.note, t.timestamp FROM time_logs t JOIN users u ON t.user_id = u.id ORDER BY t.timestamp DESC").all();
    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=logs.xlsx");
    res.send(buffer);
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();