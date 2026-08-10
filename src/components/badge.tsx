const ITEM_TYPE_STYLES: Record<string, string> = {
  lost: "bg-amber-100 text-amber-800",
  found: "bg-emerald-100 text-emerald-800",
};

const ITEM_STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  claimed: "bg-amber-100 text-amber-800",
  returned: "bg-zinc-200 text-zinc-700",
  closed: "bg-zinc-200 text-zinc-700",
};

const CLAIM_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <Badge
      label={type}
      className={ITEM_TYPE_STYLES[type] ?? "bg-zinc-100 text-zinc-700"}
    />
  );
}

export function ItemStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      label={status}
      className={ITEM_STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700"}
    />
  );
}

export function ClaimStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      label={status}
      className={CLAIM_STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700"}
    />
  );
}
