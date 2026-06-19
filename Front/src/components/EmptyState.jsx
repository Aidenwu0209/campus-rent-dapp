import { Plus } from "lucide-react";

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-visual" aria-hidden="true">
        <span className="empty-orbit">
          <Plus size={38} strokeWidth={2.7} />
        </span>
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="empty-action primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
