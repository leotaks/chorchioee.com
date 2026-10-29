import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { seedIfEmpty } from "./seed";

/**
 * 数据目录。默认在项目根目录下的 data/，可用 DATA_DIR 环境变量指向别处
 * （例如服务器上的 /var/www/chorchioee-data，这样重新部署代码不会动到内容）。
 */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "content.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL DEFAULT '',
  alt         TEXT NOT NULL DEFAULT '{}',
  mime        TEXT NOT NULL DEFAULT '',
  size        INTEGER NOT NULL DEFAULT 0,
  builtin     INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL DEFAULT '',
  sort        INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  eyebrow     TEXT NOT NULL DEFAULT '{}',
  title       TEXT NOT NULL DEFAULT '{}',
  title2      TEXT NOT NULL DEFAULT '{}',
  body        TEXT NOT NULL DEFAULT '{}',
  cta_label   TEXT NOT NULL DEFAULT '{}',
  cta_href    TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  image2      TEXT NOT NULL DEFAULT '',
  video       TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key   TEXT NOT NULL,
  sort        INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  eyebrow     TEXT NOT NULL DEFAULT '{}',
  title       TEXT NOT NULL DEFAULT '{}',
  body        TEXT NOT NULL DEFAULT '{}',
  href        TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_cards_group ON cards(group_key, sort);

CREATE TABLE IF NOT EXISTS product_lines (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  sort        INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  number      TEXT NOT NULL DEFAULT '',
  eyebrow     TEXT NOT NULL DEFAULT '{}',
  title       TEXT NOT NULL DEFAULT '{}',
  body        TEXT NOT NULL DEFAULT '{}',
  cta_label   TEXT NOT NULL DEFAULT '{}',
  cta_href    TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  line_id     INTEGER REFERENCES product_lines(id) ON DELETE SET NULL,
  sort        INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL DEFAULT '{}',
  category    TEXT NOT NULL DEFAULT '{}',
  badge       TEXT NOT NULL DEFAULT '{}',
  body        TEXT NOT NULL DEFAULT '{}',
  price       TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  href        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort);
`;

export type DB = Database.Database;

let _db: DB | null = null;

export function db(): DB {
  if (_db) return _db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const conn = new Database(DB_FILE);
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA);

  _db = conn;
  seedIfEmpty(conn);
  ensureSecret(conn);
  return conn;
}

/* ---------- settings 读写 ---------- */

export function getSettingRaw(key: string): string | null {
  const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setSettingRaw(key: string, value: string): void {
  db()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value, Date.now());
}

export function getSettingJSON<T>(key: string, fallback: T): T {
  const raw = getSettingRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setSettingJSON(key: string, value: unknown): void {
  setSettingRaw(key, JSON.stringify(value));
}

/** 会话签名密钥：优先读环境变量，否则首次启动时自动生成并存库 */
function ensureSecret(conn: DB) {
  const row = conn.prepare("SELECT value FROM settings WHERE key = 'session_secret'").get() as
    | { value: string }
    | undefined;
  if (!row) {
    conn
      .prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)")
      .run("session_secret", crypto.randomBytes(32).toString("hex"), Date.now());
  }
}

export function sessionSecret(): string {
  return process.env.SESSION_SECRET || getSettingRaw("session_secret") || "chor-chioee-dev-secret";
}
