import React from "react";
import PillButton from "./PillButton";
import { categories } from "../../data/Categories";
import { methods } from "../../data/Methods";
import { useTranslation } from "../../TranslationContext";

function CategoryStep({ selectedCategoryId, onCategorySelect, onMethodSelect }) {
  const { t } = useTranslation();

  // מחפשים את הקטגוריה שנבחרה לפי id
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  // פונקציה לעיצוב שם הקטגוריה לפי המפתח ב-trans.json
  const getCategoryLabel = (cat) =>
    t(`interpretationCategories.${cat.id}.label`);

  // פונקציה לעיצוב שם השיטה לפי המפתח ב-trans.json
  const getMethodLabel = (method) => t(`methods.${method.id}.label`);

  // מצב 1: עוד לא נבחרה קטגוריה → מציגים את הקטגוריות
  if (!selectedCategory) {
    return (
      <div className="mt-4">
        <p className="mb-2 text-sm">
          {t("categoryStep.chooseCategory")}
        </p>
        <div className="flex flex-wrap">
          {categories.map((cat) => (
            <PillButton key={cat.id} onClick={() => onCategorySelect(cat.id)}>
              {getCategoryLabel(cat)}
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

  const selectedCategoryLabel = getCategoryLabel(selectedCategory);

  return (
    <div className="mt-4">
     <p className="mb-2 text-sm">
  {t("categoryStep.chooseMethod", { category: selectedCategoryLabel })}
</p>

      <div className="flex flex-wrap">
        {categoryMethods.map((method) => (
          <PillButton
            key={method.id}
            onClick={() => onMethodSelect(method.id)}
          >
            {getMethodLabel(method)}
          </PillButton>
        ))}
      </div>
    </div>
  );
}

export default CategoryStep;
