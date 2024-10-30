import TAILWIND_CLASSES, { TailwindClass, TAILWIND_GLOSSARY } from "../../data";

export interface TailwindClassResult {
  class: string;
  web: boolean;
  native: boolean;
  route: string;
}

export function searchTailwindClasses(query: string): TailwindClassResult[] {
  const results: TailwindClassResult[] = [];

  const lowercaseQuery = query.toLowerCase();

  Object.entries(TAILWIND_CLASSES).forEach(([categoryKey, category]) => {
    const glossaryCategory = TAILWIND_GLOSSARY[categoryKey as keyof typeof TAILWIND_GLOSSARY];

    if (glossaryCategory) {
      Object.entries(category).forEach(([subCategoryKey, subCategory]) => {
        subCategory.forEach((twClass: TailwindClass) => {
          
          if (twClass.class.toLowerCase().includes(lowercaseQuery)) {
            const glossarySubCategory = glossaryCategory.categories.find(
              (cat) => cat.route.includes(subCategoryKey)
            );

            if (glossarySubCategory) {
              results.push({
                class: twClass.class,
                web: twClass.web,
                native: twClass.native,
                route: glossarySubCategory.route,
              });
            }
          }
        });
      });
    }
  });

  return results;
}