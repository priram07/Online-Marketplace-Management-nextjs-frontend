import type { Metadata } from "next";
import AdminNavbar from "@/components/admin/AdminNavbar";

export const metadata: Metadata = {
  title: {
    default: "Admin — MarketLoop",
    template: "%s · MarketLoop Admin"
  },
  description: "Manage customers, sellers, products, orders and categories.",
  // Back-office pages shouldn't be indexed.
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal="admin" className="flex min-h-screen flex-col">
      <AdminNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line py-5 text-center text-xs text-ink/40">
        &copy; {new Date().getFullYear()} MarketLoop Admin
      </footer>
    </div>
  );
}
