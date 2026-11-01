"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SellerProtectedRoute from "@/components/seller/SellerProtectedRoute";

const links = [
  { href: "/seller/dashboard", label: "Overview", exact: true },
  { href: "/seller/dashboard/products", label: "Products" },
  { href: "/seller/dashboard/store", label: "Store settings" },
  { href: "/seller/dashboard/profile", label: "Profile" }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SellerProtectedRoute>
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
              <Link href="/seller/dashboard/products/new" className="sidebar-link whitespace-nowrap">
                + New product
              </Link>
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </SellerProtectedRoute>
  );
}
