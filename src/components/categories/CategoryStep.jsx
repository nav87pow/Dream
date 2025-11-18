import React from "react";
import PillButton from "./PillButton";
import { categories } from "../../data/Categories";
import { methods } from "../../data/Methods";

function CategoryStep({ selectedCategoryId, onCategorySelect, onMethodSelect }) {
  // מחפשים את הקטגוריה שנבחרה לפי id
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  // מצב 1: עוד לא נבחרה קטגוריה → מציגים את הקטגוריות
  if (!selectedCategory) {
    return (
      <div className="mt-4">
        <p className="mb-2 text-sm">
In what approach would you like to interpret the dream?        </p>
        <div className="flex flex-wrap">
          {categories.map((cat) => (
            <PillButton key={cat.id} onClick={() => onCategorySelect(cat.id)}>
              {cat.label}
            </PillButton>
          ))}
        </div>
      </div>
    );
  }

  // מצב 2: נבחרה קטגוריה → מסננים את השיטות השייכות לה
  const categoryMethods = methods.filter(
    (method) => method.categoryId === selectedCategoryId
  );

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm">
        בחר/י שיטת ניתוח בתוך הקטגוריה: {selectedCategory.label}
      </p>
      <div className="flex flex-wrap">
        {categoryMethods.map((method) => (
          <PillButton
            key={method.id}
            onClick={() => onMethodSelect(method.id)}
          >
            {method.label}
          </PillButton>
        ))}
      </div>
    </div>
  );
}

export default CategoryStep;
