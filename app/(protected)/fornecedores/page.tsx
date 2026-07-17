import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { TruckIcon } from "lucide-react";
import { Suspense } from "react";
import { getSuppliers } from "../../_actions/supplier/get-suppliers";
import { EmptyState } from "../../_components/empty-state";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { DataTable } from "../../_components/ui/data-table";
import { Skeleton } from "../../_components/ui/skeleton";
import CreateSupplierButton from "./_components/create-supplier-button";
import { supplierTableColumns } from "./_components/table-columns";

export const dynamic = "force-dynamic";

const SuppliersPage = async () => {
  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-background p-8">
      <Suspense fallback={<SupplierTableSkeleton />}>
        <SupplierTableWrapper />
      </Suspense>
    </div>
  );
};

const SupplierTableWrapper = async () => {
  const companyId = await getCurrentCompanyId();
  const suppliers = await getSuppliers(companyId);

  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Fornecedores</HeaderSubtitle>
          <HeaderTitle>Fornecedores</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
            <CreateSupplierButton />
          </div>
        </HeaderRight>
      </Header>

      <DataTable
        columns={supplierTableColumns}
        data={suppliers}
        emptyMessage={
          <EmptyState
            icon={TruckIcon}
            title="Nenhum fornecedor encontrado"
            description="Você ainda não cadastrou nenhum fornecedor. Comece adicionando seus parceiros de entrega de insumos."
          />
        }
      />
    </div>
  );
};

const SupplierTableSkeleton = () => {
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

export default SuppliersPage;
