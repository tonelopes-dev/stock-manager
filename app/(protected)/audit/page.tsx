import "server-only";

import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { DataTable } from "../../_components/ui/data-table";
import { HistoryIcon } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";
import { Suspense } from "react";
import { Skeleton } from "../../_components/ui/skeleton";
import { getStockMovements } from "@/app/_data-access/stock-movement/get-stock-movements";
import { stockMovementTableColumns } from "./_components/table-columns";
import { getUserRoleInCompany } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: {
    page?: string;
    pageSize?: string;
  };
}

const AuditPage = async ({ searchParams }: AuditPageProps) => {
  // 1. Role Guard - Enterprise Style (Server Side)
  const role = await getUserRoleInCompany();
  if (!role || (role !== UserRole.OWNER && role !== UserRole.ADMIN)) {
    redirect("/dashboard");
  }

  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 30;

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <div className="space-y-6">
        <Header>
          <HeaderLeft>
            <HeaderSubtitle>Auditoria e Rastreabilidade</HeaderSubtitle>
            <HeaderTitle>Movimentações de Estoque</HeaderTitle>
          </HeaderLeft>
        </Header>

        <Suspense fallback={<AuditTableSkeleton />}>
          <AuditTableWrapper page={page} pageSize={pageSize} />
        </Suspense>
      </div>
    </div>
  );
};

const AuditTableWrapper = async ({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) => {
  const { data: movements, total } = await getStockMovements({ page, pageSize });

  return (
    <DataTable
      columns={stockMovementTableColumns}
      data={movements}
      pagination={{
        total,
        page,
        pageSize,
      }}
      emptyMessage={
        <EmptyState
          icon={HistoryIcon}
          title="Nenhuma movimentação encontrada"
          description="Ainda não há registros de movimentações de estoque para sua empresa."
        />
      }
    />
  );
};

const AuditTableSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
};

export default AuditPage;
