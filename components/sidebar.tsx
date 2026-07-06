"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Mail,
  Warehouse,
  Boxes,
  DollarSign,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/vendor-emails", label: "Vendor Emails", icon: Mail },
  { href: "/forwarder", label: "Forwarder", icon: Warehouse },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/exceptions", label: "Exceptions", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="text-sm font-semibold text-zinc-100">Inventory Ops</div>
        <div className="text-[11px] text-zinc-500">US → Taiwan · Phase 0</div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-900 text-sky-300"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      {email ? (
        <div className="border-t border-zinc-800 px-5 py-3 text-[11px] text-zinc-500">
          <div className="truncate">{email}</div>
        </div>
      ) : null}
    </aside>
  );
}
