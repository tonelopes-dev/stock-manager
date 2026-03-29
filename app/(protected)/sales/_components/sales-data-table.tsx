"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DataTable } from "@/app/_components/ui/data-table";
import { saleTableColumns } from "./table-columns";
import { SaleDto } from "@/app/_data-access/sale/get-sales";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { EmptyState } from "@/app/_components/empty-state";
import { ShoppingCartIcon } from "lucide-react";
import { UserRole } from "@prisma/client";
import { Sheet } from "@/app/_components/ui/sheet";
import UpsertSheetContent from "./upsert-sheet-content";

interface SaleTableColumn extends SaleDto {
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
}
interface SalesDataTableProps {
  sales: SaleTableColumn[];
  total: number;
  page: number;
  pageSize: number;
  userRole: UserRole;
  customerOptions: ComboboxOption[];
  companyId: string;
  preFetchedSale?: SaleDto | null;
}

export const SalesDataTable = ({
  sales,
  total,
  page,
  pageSize,
  userRole,
  customerOptions,
  companyId,
  preFetchedSale,
}: SalesDataTableProps) => {
  return (
    <Suspense fallback={null}>
      <SalesSearchHandler
        sales={sales}
        customerOptions={customerOptions}
        companyId={companyId}
        preFetchedSale={preFetchedSale}
      />
      <DataTable
        columns={saleTableColumns(userRole, customerOptions, companyId)}
        data={sales}
        pagination={{
          total,
          page,
          pageSize,
        }}
        emptyMessage={
          <EmptyState
            icon={ShoppingCartIcon}
            title="Nenhuma venda encontrada"
            description="Você ainda não realizou nenhuma venda. Que tal começar agora?"
          />
        }
      />
    </Suspense>
  );
};

// Internal component to handle search params and modal cleanup for sales
const SalesSearchHandler = ({
  sales,
  customerOptions,
  companyId,
  preFetchedSale,
}: {
  sales: SaleTableColumn[];
  customerOptions: ComboboxOption[];
  companyId: string;
  preFetchedSale?: SaleDto | null;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedSale, setSelectedSale] = useState<SaleTableColumn | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saleId = searchParams.get("saleId");
    
    // Priority 1: Pre-fetched sale from server
    if (saleId && preFetchedSale && preFetchedSale.id === saleId) {
      // Find extra info from currently loaded sales if available, or use defaults
      const currentSaleInList = sales.find(s => s.id === saleId);
      
      const saleToUse: SaleTableColumn = {
        ...preFetchedSale,
        products: currentSaleInList?.products || [],
        productOptions: currentSaleInList?.productOptions || [],
        customerOptions: customerOptions,
      };
      
      setSelectedSale(saleToUse);
      setIsOpen(true);
      return;
    }

    // Priority 2: Look in current list (for backward compatibility or local navigation)
    if (saleId) {
      const sale = sales.find((s) => s.id === saleId);
      if (sale) {
        setSelectedSale(sale);
        setIsOpen(true);
        return;
      }
    }

    // Handle old format if still needed (mostly for customers/products but also sales)
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    if (action === "edit" && id) {
      const sale = sales.find((s) => s.id === id);
      if (sale) {
        setSelectedSale(sale);
        setIsOpen(true);
      }
    }
  }, [searchParams, sales, preFetchedSale, customerOptions]);

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      params.delete("id");
      params.delete("saleId");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
      setSelectedSale(null);
    }
  };

  if (!selectedSale) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <UpsertSheetContent
        saleId={selectedSale.id}
        saleDate={selectedSale.date}
        customerId={selectedSale.customerId}
        paymentMethod={selectedSale.paymentMethod}
        tipAmount={Number(selectedSale.tipAmount)}
        isOpen={isOpen}
        productOptions={selectedSale.productOptions}
        customerOptions={customerOptions}
        products={selectedSale.products}
        setSheetIsOpen={setIsOpen}
        companyId={companyId}
        defaultSelectedProducts={selectedSale.saleItems.map((item) => {
          const product = selectedSale.products.find((p) => p.id === item.productId);
          return {
            id: item.productId,
            quantity: Number(item.quantity),
            name: item.product.name,
            price: Number(item.unitPrice),
            stock: product?.stock ?? 0,
          };
        })}
      />
    </Sheet>
  );
};
