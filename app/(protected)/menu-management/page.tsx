import { getMenuManagementData } from "@/app/_data-access/menu/get-menu-management-data";
import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { MenuSharingHub } from "./_components/menu-sharing-hub";
import { MenuCategorySection } from "./_components/menu-category-section";
import { Eye, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

const MenuManagementPage = async () => {
  const { categories, companyId } = await getMenuManagementData();

  const totalProducts = categories.reduce(
    (acc, cat) => acc + cat.products.length,
    0,
  );
  const visibleProducts = categories.reduce(
    (acc, cat) => acc + cat.products.filter((p) => p.isVisibleOnMenu).length,
    0,
  );
  const promoProducts = categories.reduce(
    (acc, cat) => acc + cat.products.filter((p) => p.isPromotion).length,
    0,
  );

  return (
    <div className="m-8 space-y-6 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Modo Operação</HeaderSubtitle>
          <HeaderTitle>Gestão de Cardápio</HeaderTitle>
        </HeaderLeft>
      </Header>

      {/* Sharing Hub */}
      <MenuSharingHub companyId={companyId} />

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-black text-slate-800">{totalProducts}</span>
          <span className="text-slate-500">produtos cadastrados</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2 text-xs">
          <Eye className="h-3.5 w-3.5 text-green-600" />
          <span className="font-black text-green-700">{visibleProducts}</span>
          <span className="text-slate-500">visíveis no cardápio</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2 text-xs">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-black text-orange-600">{promoProducts}</span>
          <span className="text-slate-500">em promoção</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-green-600" />
          <span>Visível no Menu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>Promoção</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm text-slate-500">
            Nenhum produto cadastrado. Crie produtos e categorias na página de{" "}
            <a href="/products" className="font-bold text-primary underline">
              Produtos
            </a>{" "}
            para começar!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <MenuCategorySection key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuManagementPage;
