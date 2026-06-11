export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">+</span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
