import { ITEM_STATUS_LABELS, RENTAL_STATUS_LABELS } from "../models/status.js";

export default function StatusBadge({ type = "item", status }) {
  const labels = type === "rental" ? RENTAL_STATUS_LABELS : ITEM_STATUS_LABELS;
  const label = labels[Number(status)] ?? "未知状态";

  return <span className={`status-badge status-${Number(status)}`}>{label}</span>;
}
