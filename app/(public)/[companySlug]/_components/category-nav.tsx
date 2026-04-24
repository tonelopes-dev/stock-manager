import { MenuDataDto } from "@/app/_data-access/menu/get-menu-data";

interface CategoryNavProps {
  categories: MenuDataDto["categories"];
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
}

export const CategoryNav = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: CategoryNavProps) => {
  return (
    <nav className="sticky top-0 z-30 border-b border-gray-50 bg-white/95 px-2 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-bold transition-all ${
              selectedCategoryId === category.id
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </nav>
  );
};
