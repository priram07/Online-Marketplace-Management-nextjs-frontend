import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-dim">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-plum">MarketLoop</p>
          <p className="mt-3 max-w-xs text-sm text-ink/60">
            A marketplace where independent sellers list real goods and
            customers find things worth buying twice.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li>
              <Link href="/products" className="hover:text-plum">
                All products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-plum">
                Your cart
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Account</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li>
              <Link href="/login" className="hover:text-plum">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-plum">
                Create an account
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-plum">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/seller" className="hover:text-plum">
                Sell on MarketLoop
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/40">
        &copy; {new Date().getFullYear()} MarketLoop. Built for a course project.{" "}
        <Link href="/admin" className="ml-2 hover:text-plum">
          Admin
        </Link>
      </div>
    </footer>
  );
}
