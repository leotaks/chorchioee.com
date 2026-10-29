"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string }[] = [
  { href: "/admin", label: "概览" },
  { href: "/admin/sections", label: "首页模块" },
  { href: "/admin/lines", label: "产品线" },
  { href: "/admin/products", label: "产品" },
  { href: "/admin/media", label: "媒体库" },
  { href: "/admin/texts", label: "导航与服务" },
  { href: "/admin/settings", label: "站点设置" },
  { href: "/admin/account", label: "账号设置" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="sideNav">
      {ITEMS.map((item) => {
        const on = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={on ? "on" : ""}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
