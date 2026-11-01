import Link from "next/link";

export default function SellerFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-dim">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-clay-dark">Seller Hub</p>
          <p className="mt-3 max-w-xs text-sm text-ink/60">
            The companion app for MarketLoop sellers — manage your store,
            publish listings and watch orders roll in.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Manage</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li>
              <Link href="/seller/dashboard/products" className="hover:text-clay">
                Your products
              </Link>
            </li>
            <li>
              <Link href="/seller/dashboard/store" className="hover:text-clay">
                Store settings
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Account</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li>
              <Link href="/seller/login" className="hover:text-clay">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/seller/register" className="hover:text-clay">
                Become a seller
              </Link>
            </li>
            <li>
              <Link href="/seller/dashboard/profile" className="hover:text-clay">
                Your profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/40">
        &copy; {new Date().getFullYear()} Seller Hub. Built for a course project.{" "}
        <Link href="/" className="ml-2 hover:text-clay">
          Shop MarketLoop
        </Link>
        <Link href="/admin" className="ml-2 hover:text-clay">
          Admin
        </Link>
      </div>
    </footer>
  );
}
