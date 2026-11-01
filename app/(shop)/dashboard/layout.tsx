"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ProtectedRoute from "@/components/shop/ProtectedRoute";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/orders", label: "Orders" }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="container-page grid gap-8 py-12 sm:grid-cols-[180px_1fr]">
        <aside className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-sm px-3 py-2 text-sm transition ${
                pathname === link.href
                  ? "bg-plum text-white"
                  : "text-ink/65 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </aside>
        <div>{children}</div>
      </div>
    </ProtectedRoute>
  );
}
