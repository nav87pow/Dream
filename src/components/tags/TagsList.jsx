// src/components/tags/TagsList.jsx
import TagPill from "./TagPill";
import TagsInput from "./TagsInput";

export default function TagsList({ tags, setTags }) {
  if (!tags) return null;

  // מחיקת תגית אחת
  const handleRemove = (type, value) => {
    const next = {
      ...tags,
      [type]: (tags[type] || []).filter((t) => t !== value),
    };
    setTags(next); // 👈 שולחים אובייקט חדש, לא פונקציה
  };

  // הוספת תגית לקטגוריה "other"
  const handleAdd = (value) => {
    const next = {
      ...tags,
      other: [...(tags.other || []), value],
    };
    setTags(next); // 👈 שוב – אובייקט חדש
  };

  const flattened = [
    ...(tags.places || []).map((t) => ({ type: "places", value: t })),
    ...(tags.people || []).map((t) => ({ type: "people", value: t })),
    ...(tags.objects || []).map((t) => ({ type: "objects", value: t })),
    ...(tags.symbols || []).map((t) => ({ type: "symbols", value: t })),
    ...(tags.colors || []).map((t) => ({ type: "colors", value: t })),
    ...(tags.other || []).map((t) => ({ type: "other", value: t })),
  ];

  return (
    <div className="tags-block">
      <div className="tags-block__pills">
        {flattened.map((tag, i) => (
          <TagPill
            key={`${tag.type}-${tag.value}-${i}`}
            type={tag.type}
            value={tag.value}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <TagsInput onAdd={handleAdd} />
    </div>
  );
}
