"use server";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, setSettingJSON, UPLOAD_DIR } from "@/lib/db";
import {
  checkPassword,
  endSession,
  isLoggedIn,
  setPassword,
  startSession,
} from "@/lib/auth";
import { stringifyLoc, type Loc } from "@/lib/types";

/* ---------- 工具 ---------- */

async function guard() {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

function loc(fd: FormData, prefix: string): string {
  const v: Loc = {
    zh: String(fd.get(`${prefix}.zh`) ?? ""),
    en: String(fd.get(`${prefix}.en`) ?? ""),
    fr: String(fd.get(`${prefix}.fr`) ?? ""),
  };
  return stringifyLoc(v);
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function bool(fd: FormData, key: string): number {
  return fd.get(key) ? 1 : 0;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

function slugify(input: string, fallback: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9一-龥-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}

/** 同一张表里把某行上移 / 下移 */
function moveRow(table: "product_lines" | "products" | "cards", id: number, dir: -1 | 1, group?: string) {
  const conn = db();
  const where = group ? "WHERE group_key = ?" : "";
  const rows = (
    group
      ? conn.prepare(`SELECT id FROM ${table} ${where} ORDER BY sort, id`).all(group)
      : conn.prepare(`SELECT id FROM ${table} ORDER BY sort, id`).all()
  ) as { id: number }[];
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const next = idx + dir;
  if (next < 0 || next >= rows.length) return;
  [rows[idx], rows[next]] = [rows[next], rows[idx]];
  const upd = conn.prepare(`UPDATE ${table} SET sort = ? WHERE id = ?`);
  conn.transaction(() => rows.forEach((r, i) => upd.run((i + 1) * 10, r.id)))();
}

/* ---------- 登录 ---------- */

export type LoginState = { error?: string };

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const password = String(fd.get("password") ?? "");
  if (!password) return { error: "请输入密码" };
  if (!checkPassword(password)) return { error: "密码不对，再试一次" };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function changePassword(_prev: LoginState, fd: FormData): Promise<LoginState> {
  await guard();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (!checkPassword(current)) return { error: "当前密码不对" };
  if (next.length < 8) return { error: "新密码至少 8 位" };
  if (next !== confirm) return { error: "两次输入的新密码不一致" };
  setPassword(next);
  refresh();
  return { error: "" };
}

/* ---------- 全局设置 ---------- */

export async function saveSettings(fd: FormData) {
  await guard();
  setSettingJSON("announce", JSON.parse(loc(fd, "announce")));
  setSettingJSON("announce_enabled", Boolean(fd.get("announce_enabled")));
  setSettingJSON("brand_name", str(fd, "brand_name"));
  setSettingJSON("brand_sub", str(fd, "brand_sub"));
  setSettingJSON("edition", str(fd, "edition"));
  setSettingJSON("scroll_cue", JSON.parse(loc(fd, "scroll_cue")));
  setSettingJSON("back_to_top", JSON.parse(loc(fd, "back_to_top")));
  setSettingJSON("footer_links", JSON.parse(loc(fd, "footer_links")));
  setSettingJSON("copyright", str(fd, "copyright"));
  setSettingJSON("icp", str(fd, "icp"));
  setSettingJSON("default_lang", str(fd, "default_lang") || "en");
  setSettingJSON("seo_title", JSON.parse(loc(fd, "seo_title")));
  setSettingJSON("seo_description", JSON.parse(loc(fd, "seo_description")));
  refresh();
}

/* ---------- 首页模块 ---------- */

export async function saveSection(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  db()
    .prepare(
      `UPDATE sections SET published = ?, eyebrow = ?, title = ?, title2 = ?, body = ?,
         cta_label = ?, cta_href = ?, image = ?, image2 = ?, video = ?
       WHERE id = ?`,
    )
    .run(
      bool(fd, "published"),
      loc(fd, "eyebrow"),
      loc(fd, "title"),
      loc(fd, "title2"),
      loc(fd, "body"),
      loc(fd, "cta_label"),
      str(fd, "cta_href"),
      str(fd, "image"),
      str(fd, "image2"),
      str(fd, "video"),
      id,
    );
  refresh();
}

/* ---------- 导航 / 分类 / 服务（卡片组） ---------- */

export async function saveCard(fd: FormData) {
  await guard();
  const id = Number(fd.get("id") ?? 0);
  const group = str(fd, "group_key");
  if (id > 0) {
    db()
      .prepare(
        `UPDATE cards SET published = ?, eyebrow = ?, title = ?, body = ?, href = ?, image = ? WHERE id = ?`,
      )
      .run(
        bool(fd, "published"),
        loc(fd, "eyebrow"),
        loc(fd, "title"),
        loc(fd, "body"),
        str(fd, "href"),
        str(fd, "image"),
        id,
      );
  } else {
    const max = db()
      .prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM cards WHERE group_key = ?")
      .get(group) as { m: number };
    db()
      .prepare(
        `INSERT INTO cards (group_key, sort, published, eyebrow, title, body, href, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        group,
        max.m + 10,
        bool(fd, "published"),
        loc(fd, "eyebrow"),
        loc(fd, "title"),
        loc(fd, "body"),
        str(fd, "href"),
        str(fd, "image"),
      );
  }
  refresh();
}

export async function deleteCard(fd: FormData) {
  await guard();
  db().prepare("DELETE FROM cards WHERE id = ?").run(Number(fd.get("id")));
  refresh();
}

export async function moveCard(fd: FormData) {
  await guard();
  moveRow("cards", Number(fd.get("id")), Number(fd.get("dir")) as -1 | 1, str(fd, "group_key"));
  refresh();
}

/* ---------- 产品线 ---------- */

export async function saveLine(fd: FormData) {
  await guard();
  const id = Number(fd.get("id") ?? 0);
  const slug = slugify(str(fd, "slug") || str(fd, "title.en"), `line-${Date.now()}`);
  if (id > 0) {
    db()
      .prepare(
        `UPDATE product_lines SET slug = ?, published = ?, number = ?, eyebrow = ?, title = ?,
           body = ?, cta_label = ?, cta_href = ?, image = ? WHERE id = ?`,
      )
      .run(
        slug,
        bool(fd, "published"),
        str(fd, "number"),
        loc(fd, "eyebrow"),
        loc(fd, "title"),
        loc(fd, "body"),
        loc(fd, "cta_label"),
        str(fd, "cta_href"),
        str(fd, "image"),
        id,
      );
  } else {
    const max = db().prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM product_lines").get() as {
      m: number;
    };
    db()
      .prepare(
        `INSERT INTO product_lines (slug, sort, published, number, eyebrow, title, body, cta_label, cta_href, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        slug,
        max.m + 10,
        bool(fd, "published"),
        str(fd, "number"),
        loc(fd, "eyebrow"),
        loc(fd, "title"),
        loc(fd, "body"),
        loc(fd, "cta_label"),
        str(fd, "cta_href"),
        str(fd, "image"),
      );
  }
  refresh();
  redirect("/admin/lines");
}

export async function deleteLine(fd: FormData) {
  await guard();
  db().prepare("DELETE FROM product_lines WHERE id = ?").run(Number(fd.get("id")));
  refresh();
  redirect("/admin/lines");
}

export async function moveLine(fd: FormData) {
  await guard();
  moveRow("product_lines", Number(fd.get("id")), Number(fd.get("dir")) as -1 | 1);
  refresh();
}

/* ---------- 产品 ---------- */

export async function saveProduct(fd: FormData) {
  await guard();
  const id = Number(fd.get("id") ?? 0);
  const slug = slugify(str(fd, "slug") || str(fd, "name.en"), `product-${Date.now()}`);
  const lineId = Number(fd.get("line_id")) || null;
  if (id > 0) {
    db()
      .prepare(
        `UPDATE products SET slug = ?, line_id = ?, published = ?, name = ?, category = ?,
           badge = ?, body = ?, price = ?, image = ?, href = ? WHERE id = ?`,
      )
      .run(
        slug,
        lineId,
        bool(fd, "published"),
        loc(fd, "name"),
        loc(fd, "category"),
        loc(fd, "badge"),
        loc(fd, "body"),
        str(fd, "price"),
        str(fd, "image"),
        str(fd, "href"),
        id,
      );
  } else {
    const max = db().prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM products").get() as {
      m: number;
    };
    db()
      .prepare(
        `INSERT INTO products (slug, line_id, sort, published, name, category, badge, body, price, image, href)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        slug,
        lineId,
        max.m + 10,
        bool(fd, "published"),
        loc(fd, "name"),
        loc(fd, "category"),
        loc(fd, "badge"),
        loc(fd, "body"),
        str(fd, "price"),
        str(fd, "image"),
        str(fd, "href"),
      );
  }
  refresh();
  redirect("/admin/products");
}

export async function deleteProduct(fd: FormData) {
  await guard();
  db().prepare("DELETE FROM products WHERE id = ?").run(Number(fd.get("id")));
  refresh();
  redirect("/admin/products");
}

export async function moveProduct(fd: FormData) {
  await guard();
  moveRow("products", Number(fd.get("id")), Number(fd.get("dir")) as -1 | 1);
  refresh();
}

/* ---------- 媒体库 ---------- */

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
]);
const MAX_BYTES = 64 * 1024 * 1024; // 64MB

export async function uploadMedia(fd: FormData) {
  await guard();
  const files = fd.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ins = db().prepare(
    `INSERT OR IGNORE INTO media (url, title, alt, mime, size, builtin, created_at)
     VALUES (?, ?, '{}', ?, ?, 0, ?)`,
  );

  for (const file of files) {
    if (!ALLOWED.has(file.type) || file.size > MAX_BYTES) continue;
    const ext = path.extname(file.name).toLowerCase() || ".bin";
    const base = slugify(path.basename(file.name, path.extname(file.name)), "file").slice(0, 48);
    const name = `${base}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    ins.run(`/uploads/${name}`, file.name, file.type, file.size, Date.now());
  }
  refresh();
}

export async function saveMediaTitle(fd: FormData) {
  await guard();
  db()
    .prepare("UPDATE media SET title = ?, alt = ? WHERE id = ?")
    .run(str(fd, "title"), loc(fd, "alt"), Number(fd.get("id")));
  refresh();
}

export async function deleteMedia(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const row = db().prepare("SELECT url, builtin FROM media WHERE id = ?").get(id) as
    | { url: string; builtin: number }
    | undefined;
  if (!row || row.builtin === 1) return; // 内置素材不删
  db().prepare("DELETE FROM media WHERE id = ?").run(id);
  if (row.url.startsWith("/uploads/")) {
    const target = path.resolve(UPLOAD_DIR, row.url.slice("/uploads/".length));
    if (target.startsWith(path.resolve(UPLOAD_DIR) + path.sep) && fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }
  refresh();
}
