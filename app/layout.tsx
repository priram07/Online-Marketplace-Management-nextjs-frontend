import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "MarketLoop",
    template: "%s · MarketLoop"
  },
  description: "Shop, sell and manage the MarketLoop marketplace."
};

// The root layout is intentionally just <html>, <body> and providers.
// Each portal supplies its own shell (navbar/footer/sidebar) in its own
// layout: app/(shop), app/seller and app/admin.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
