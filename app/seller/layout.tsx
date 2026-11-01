import type { Metadata } from "next";
import SellerNavbar from "@/components/seller/SellerNavbar";
import SellerFooter from "@/components/seller/SellerFooter";

export const metadata: Metadata = {
  title: {
    default: "Seller Hub — MarketLoop for Sellers",
    template: "%s · Seller Hub"
  },
  description: "Manage your MarketLoop store, publish listings and track stock."
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal="seller" className="flex min-h-screen flex-col">
      <SellerNavbar />
      <main className="flex-1">{children}</main>
      <SellerFooter />
    </div>
  );
}
