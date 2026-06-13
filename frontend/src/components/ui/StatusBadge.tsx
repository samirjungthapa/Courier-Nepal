type Props = {
  status: string;
};

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING_PICKUP:    { label: "Pending Pickup",    className: "status-badge status-badge-pending" },
  PICKED:            { label: "Picked Up",        className: "status-badge status-badge-picked" },
  IN_TRANSIT:        { label: "In Transit",        className: "status-badge status-badge-transit" },
  OUT_FOR_DELIVERY:  { label: "Out for Delivery",  className: "status-badge status-badge-delivery" },
  DELIVERED:         { label: "Delivered",          className: "status-badge status-badge-delivered" },
};

export default function StatusBadge({ status }: Props) {
  const mapped = statusMap[status];
  if (!mapped) {
    return <span className="status-badge status-badge-default">{status}</span>;
  }
  return <span className={mapped.className}>{mapped.label}</span>;
}
