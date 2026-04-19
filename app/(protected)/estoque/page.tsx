import { DataTable } from "../../_components/ui/data-table";
import { ingredientTableColumns } from "./_components/table-columns";
import { getIngredients } from "../../_data-access/ingredient/get-ingredients";
import CreateIngredientButton from "./_components/create-ingredient-button";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { Boxes } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";
import { Suspense } from "react";
import { Skeleton } from "../../_components/ui/skeleton";

import { getSuppliers } from "../../_actions/supplier/get-suppliers";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import RegisterPurchaseButton from "./_components/register-purchase-button";
import { DownloadShoppingListButton } from "./_components/download-shopping-list-button";
import StockFilters from "./_components/stock-filters";
import StockPagination from "./_components/stock-pagination";

export const dynamic = "force-dynamic";

interface EstoquePageProps {
  searchParams: Promise<{
    search?: string;
    supplierId?: string;
    status?: "ACTIVE" | "INACTIVE" | "ALL";
    stockStatus?: string;
    page?: string;
  }>;
}

const EstoquePage = async ({ searchParams }: EstoquePageProps) => {
  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-background p-8">
      <Suspense fallback={<EstoqueTableSkeleton />}>
        <EstoqueTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

const EstoqueTableWrapper = async ({
  searchParams: searchParamsPromise,
}: {
  searchParams: EstoquePageProps["searchParams"];
}) => {
  const searchParams = await searchParamsPromise;
  const companyId = await getCurrentCompanyId();

  const page = Number(searchParams.page) || 1;
  const search = searchParams.search;
  const supplierId = searchParams.supplierId;
  const status = searchParams.status || "ACTIVE";
  const stockStatus = searchParams.stockStatus as any;

  const { data: ingredients, total } = await getIngredients({
    page,
    search,
    supplierId,
    stockStatus,
    status,
    pageSize: 10,
  });

  // Separate fetch for the dialog to ensure all searchable items are present regardless of table pagination
  const { data: allIngredients } = await getIngredients({
    pageSize: 500,
  });

  const suppliers = await getSuppliers(companyId);

  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Produtos e Insumos</HeaderSubtitle>
          <HeaderTitle>Controle de Estoque</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
            <CreateIngredientButton />
            <RegisterPurchaseButton
              suppliers={suppliers}
              products={allIngredients}
            />
            <DownloadShoppingListButton />
          </div>
        </HeaderRight>
      </Header>

      <StockFilters suppliers={suppliers} />

      <DataTable
        columns={ingredientTableColumns}
        data={ingredients}
        emptyMessage={
          <EmptyState
            icon={Boxes}
            title="Nenhum item encontrado"
            description="Tente ajustar seus filtros ou cadastre um novo produto/insumo físico."
          />
        }
      />

      <StockPagination total={total} pageSize={10} />
    </div>
  );
};

const EstoqueTableSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-3xl" />
      </div>
    </div>
  );
};

export default EstoquePage;
