"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { ADMIN_PAGES } from "@/lib/admin-schema";

const ITEMS = [{ slug: "", label: "Resumen", icon: "dashboard" }, ...ADMIN_PAGES];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones del panel" className="overflow-x-auto px-3 pb-3 lg:overflow-visible lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map((item) => {
          const href = item.slug ? `/admin/${item.slug}` : "/admin";
          const active = item.slug ? pathname.startsWith(href) : pathname === "/admin";
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`admin-focus flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-white text-ink" : "text-foam/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
