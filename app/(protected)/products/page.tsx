import { getProducts } from "../../_data-access/product/get-products";
import AddProductButton from "./_components/create-product-button";
import { ProductStatusFilter } from "./_components/status-filter";
import { ProductVisualCatalog } from "./_components/product-visual-catalog";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { getEnvironments } from "@/app/_data-access/product/get-environments";

import { Suspense } from "react";
import { ProductTableSkeleton } from "./_components/table-skeleton";
import { getOnboardingStats } from "@/app/_data-access/onboarding/get-onboarding-stats";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { getProductCategories } from "@/app/_data-access/product/get-product-categories";
import { getOverheadSettings } from "@/app/_data-access/company/get-overhead-settings";

interface ProductsPageProps {
  searchParams: Promise<{
    status?: string;
    environmentId?: string;
  }>;
}

// Page requires session for company filtering
export const dynamic = "force-dynamic";

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  const resolvedSearchParams = await searchParams;
  const statusParam = resolvedSearchParams?.status?.toUpperCase();
  const status = (
    ["ACTIVE", "INACTIVE", "ALL"].includes(statusParam || "")
      ? statusParam
      : "ACTIVE"
  ) as "ACTIVE" | "INACTIVE" | "ALL";
  const environmentId = resolvedSearchParams?.environmentId;

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-background p-8">
      {/* 
        The Suspense boundary was moved deeper into ProductVisualCatalog 
        to allow the Header and Toolbar to render immediately.
      */}
      <ProductTableWrapper status={status} environmentId={environmentId} />
    </div>
  );
};

const ProductTableWrapper = async ({
  status,
  environmentId,
}: {
  status: "ACTIVE" | "INACTIVE" | "ALL";
  environmentId?: string;
}) => {
  // Start fetching products immediately (non-blocking)
  const productsPromise = getProducts(30, status, environmentId);
  
  // Fetch metadata in parallel
  const [role, onboardingStats, categories, environments, overheadSettings] = await Promise.all([
    getCurrentUserRole(),
    getOnboardingStats(),
    getProductCategories(),
    getEnvironments(),
    getOverheadSettings(),
  ]);

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
            {isManagement && (
              <AddProductButton
                hasProducts={onboardingStats?.hasProducts ?? true}
                categories={categories}
                environments={environments}
                overheadSettings={overheadSettings}
              />
            )}
          </div>
        </HeaderRight>
      </Header>

      <ProductVisualCatalog
        productsPromise={productsPromise}
        userRole={role as UserRole}
        categories={categories}
        environments={environments}
        overheadSettings={overheadSettings}
      />
    </div>
  );
};

export default ProductsPage;
