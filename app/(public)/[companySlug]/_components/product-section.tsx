import { MenuProductDto } from "@/app/_data-access/menu/get-menu-data";
import { ProductCard } from "./product-card";

interface ProductSectionProps {
  id: string;
  title: string;
  products: MenuProductDto[];
  onProductClick: (product: MenuProductDto) => void;
}

export const ProductSection = ({
  id,
  title,
  products,
  onProductClick,
}: ProductSectionProps) => {
  return (
    <section id={id} className="scroll-mt-32 space-y-6">
      <h2 className="text-xl font-black tracking-tight text-gray-900">{title}</h2>
      <div className="grid gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={onProductClick}
          />
        ))}
      </div>
    </section>
  );
};
