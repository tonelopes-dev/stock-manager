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
import { BeakerIcon } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";
import { Suspense } from "react";
import { Skeleton } from "../../_components/ui/skeleton";

export const dynamic = "force-dynamic";

const IngredientsPage = async () => {
  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Suspense fallback={<IngredientTableSkeleton />}>
        <IngredientTableWrapper />
      </Suspense>
    </div>
  );
};

const IngredientTableWrapper = async () => {
  const ingredients = await getIngredients();
  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Insumos</HeaderSubtitle>
          <HeaderTitle>Insumos</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
            <CreateIngredientButton />
          </div>
        </HeaderRight>
      </Header>

      <DataTable
        columns={ingredientTableColumns}
        data={ingredients}
        emptyMessage={
          <EmptyState
            icon={BeakerIcon}
            title="Nenhum insumo encontrado"
            description="Você ainda não cadastrou nenhum insumo. Comece adicionando matérias-primas como carnes, bebidas e temperos."
          />
        }
      />
    </div>
  );
};

const IngredientTableSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
};

export default IngredientsPage;
