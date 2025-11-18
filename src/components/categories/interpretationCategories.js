// קובץ מידע – לא קומפוננטת React

export const INTERPRETATION_CATEGORIES = [
  {
    id: "psychological",
    label: "פסיכולוגית",
    shortDescription: "ניתוח החלום דרך תהליכים נפשיים, לא־מודע ודפוסי אישיות.",
    methods: [
      {
        id: "freud",
        label: "פסיכואנליזה (פרויד)",
        description: "ניתוח החלום כגילוי משאלות ותכנים מודחקים."
      },
      {
        id: "jung",
        label: "פסיכולוגיה אנליטית (יונג)",
        description: "התמקדות בארכיטיפים, סמלים קולקטיביים ותהליך האינדיבידואציה."
      }
    ]
  },
  {
    id: "spiritual",
    label: "רוחנית",
    shortDescription: "התבוננות בחלום כמסר רוחני או אנרגטי.",
    methods: [
      { id: "kabbalah", label: "פרשנות קבלית / מיסטית", description: "" },
      { id: "intuitive", label: "קריאה אינטואיטיבית", description: "" }
    ]
  },
  {
    id: "symbolic",
    label: "סימבולית / ארכיטיפית",
    shortDescription: "התמקדות בסמלים, דימויים ותבניות מיתולוגיות.",
    methods: [
      { id: "mythic", label: "מיתולוגית / ארכיטיפית", description: "" },
      { id: "personal-symbols", label: "מילון סמלים אישי", description: "" }
    ]
  },
  {
    id: "experiential",
    label: "חווייתית / יום־יומית",
    shortDescription: "המשך של חוויות, מתחים ורגשות מהיומיום.",
    methods: [
      { id: "day-residue", label: "שאריות היום", description: "" },
      { id: "scenario-rehearsal", label: "תרגול מצבים עתידיים", description: "" }
    ]
  }
];
