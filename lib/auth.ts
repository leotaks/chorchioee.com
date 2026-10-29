import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSettingJSON, setSettingJSON, sessionSecret } from "./db";
import { hashPassword, verifyPassword } from "./password";

const COOKIE = "cc_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 天

function sign(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function makeToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function tokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return tokenValid(store.get(COOKIE)?.value);
}

/** 在后台页面 / 服务端动作开头调用；未登录直接跳转登录页 */
export async function requireLogin(): Promise<void> {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

export async function startSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export function checkPassword(password: string): boolean {
  const stored = getSettingJSON<string>("admin_password", "");
  if (!stored) return false;
  return verifyPassword(password, stored);
}

export function setPassword(password: string): void {
  setSettingJSON("admin_password", hashPassword(password));
  setSettingJSON("admin_password_is_default", false);
}

export function passwordIsDefault(): boolean {
  return getSettingJSON<boolean>("admin_password_is_default", false);
}
