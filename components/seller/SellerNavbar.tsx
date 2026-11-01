"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSellerAuth } from "@/context/SellerAuthContext";
import NotificationBell from "@/components/NotificationBell";

export default function SellerNavbar() {
  const { seller, logout } = useSellerAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/seller" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight text-clay-dark">Seller Hub</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/seller"
            className={`text-sm transition-colors hover:text-clay ${
              pathname === "/seller" ? "text-clay font-medium" : "text-ink/70"
            }`}
          >
            Home
          </Link>
          <Link href="/" className="text-sm text-ink/70 transition-colors hover:text-clay">
            Shop
          </Link>
          {seller && (
            <Link
              href="/seller/dashboard"
              className={`text-sm transition-colors hover:text-clay ${
                pathname.startsWith("/seller/dashboard") ? "text-clay font-medium" : "text-ink/70"
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <NotificationBell />

          {seller ? (
            <button
              onClick={() => {
                logout();
                router.push("/seller");
              }}
              className="hidden text-sm text-ink/70 hover:text-clay sm:inline-block"
            >
              Log out
            </button>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/seller/login" className="text-sm text-ink/70 hover:text-clay">
                Log in
              </Link>
              <Link href="/seller/register" className="btn-primary py-2 text-sm">
                Become a seller
              </Link>
            </div>
          )}

          <button
            className="rounded p-2 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-paper px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/seller" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            {seller ? (
              <>
                <Link href="/seller/dashboard" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button
                  className="text-left text-rust"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    router.push("/seller");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/seller/login" onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link href="/seller/register" onClick={() => setMenuOpen(false)}>
                  Become a seller
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
