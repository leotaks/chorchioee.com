import Link from "next/link";
import { requireLogin, passwordIsDefault } from "@/lib/auth";
import { logout } from "../actions";
import NavLinks from "./nav-links";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  await requireLogin();
  const mustChangePassword = passwordIsDefault();

  return (
    <div className="shell">
      <aside className="side">
        <div className="brandMark">
          CHOR CHIOÉE
          <small>ADMIN</small>
        </div>
        <NavLinks />
        <div className="sideFoot">
          <Link href="/" target="_blank">
            查看官网 ↗
          </Link>
          <form action={logout}>
            <button type="submit" className="btn tiny ghost">
              退出登录
            </button>
          </form>
        </div>
      </aside>
      <main className="main">
        {mustChangePassword ? (
          <div className="notice">
            当前仍在使用默认密码 <code>chorchioee</code>，请到「账号设置」立即修改。
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
