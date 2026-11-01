"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" }
];

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminProtectedRoute>
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start">
            <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
              {links.map((link) => {
                const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={isActive ? "sidebar-link-active whitespace-nowrap" : "sidebar-link whitespace-nowrap"}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
