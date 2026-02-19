import { getProducts } from "../../_data-access/product/get-products";
import AddProductButton from "./_components/create-product-button";
import { ProductStatusFilter } from "./_components/status-filter";
import { ProductDataTable } from "./_components/product-data-table";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";

import { Suspense } from "react";
import { ProductTableSkeleton } from "./_components/table-skeleton";

interface ProductsPageProps {
  searchParams: {
    status?: string;
  };
}

// Page requires session for company filtering
export const dynamic = "force-dynamic";

import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  const statusParam = searchParams?.status?.toUpperCase();
  const status = (["ACTIVE", "INACTIVE", "ALL"].includes(statusParam || "")
    ? statusParam
    : "ACTIVE") as "ACTIVE" | "INACTIVE" | "ALL";

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Suspense key={status} fallback={<ProductTableSkeleton />}>
        <ProductTableWrapper status={status} />
      </Suspense>
    </div>
  );
};

const ProductTableWrapper = async ({ status }: { status: "ACTIVE" | "INACTIVE" | "ALL" }) => {
  const products = await getProducts(30, status);
  const role = await getCurrentUserRole();
  const isManagement = role === UserRole.OWNER || role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Produtos</HeaderSubtitle>
          <HeaderTitle>Produtos</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
             <ProductStatusFilter />
             {isManagement && <AddProductButton />}
          </div>
        </HeaderRight>
      </Header>

      <ProductDataTable products={products} userRole={role as UserRole} />
    </div>
  );
};


export default ProductsPage;