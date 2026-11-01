// One badge component for every status the admin panel shows: order
// statuses (pending → delivered/cancelled) and account states
// (active / inactive).
const styles: Record<string, string> = {
  pending: "border-marigold/40 text-marigold-dark",
  processing: "border-plum/30 text-plum",
  shipped: "border-steel/30 text-steel",
  delivered: "border-moss/30 text-moss",
  cancelled: "border-rust/30 text-rust",
  active: "border-moss/30 text-moss",
  inactive: "border-rust/30 text-rust"
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge capitalize ${styles[status] ?? ""}`}>{status}</span>;
}
