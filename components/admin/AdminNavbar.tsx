"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import NotificationBell from "@/components/NotificationBell";

export default function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-steel-dark">MarketLoop</span>
          <span className="rounded-sm bg-steel px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-paper">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-4">
          <Link href="/" className="hidden text-sm text-ink/70 hover:text-steel sm:inline-block">
            Shop
          </Link>
          <Link href="/seller" className="hidden text-sm text-ink/70 hover:text-steel sm:inline-block">
            Seller Hub
          </Link>
          <NotificationBell />
          {admin && (
            <>
              <span className="hidden max-w-[180px] truncate text-xs text-ink/50 md:inline-block">
                {admin.email}
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/admin/login");
                }}
                className="text-sm text-ink/70 hover:text-steel"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
