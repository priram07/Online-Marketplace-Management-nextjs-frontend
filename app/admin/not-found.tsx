import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-32 text-center">
      <p className="font-display text-7xl text-steel/30">404</p>
      <h1 className="font-display text-2xl text-ink">No such admin page.</h1>
      <Link href="/admin" className="btn-primary mt-2">
        Back to overview
      </Link>
    </div>
  );
}
