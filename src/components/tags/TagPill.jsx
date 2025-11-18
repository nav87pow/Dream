// src/components/tags/TagPill.jsx
export default function TagPill({ type, value, onRemove }) {
  return (
    <div className="tag-pill">
      <span>{value}</span>
      <button
        type="button"
        className="tag-pill__remove"
        onClick={() => onRemove(type, value)}
      >
        ✕
      </button>
    </div>
  );
}
