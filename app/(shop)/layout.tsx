import type { Metadata } from "next";
import Navbar from "@/components/shop/Navbar";
import Footer from "@/components/shop/Footer";

export const metadata: Metadata = {
  title: {
    default: "MarketLoop — Customer Marketplace",
    template: "%s · MarketLoop"
  },
  description: "Browse listings and manage orders on MarketLoop."
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal="shop" className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
