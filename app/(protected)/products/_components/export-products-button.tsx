"use client";

import { Button } from "@/app/_components/ui/button";
import { DownloadIcon } from "lucide-react";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { toast } from "sonner";

interface ExportProductsButtonProps {
  products: ProductDto[];
}

export const ExportProductsButton = ({ products }: ExportProductsButtonProps) => {
  const handleExport = () => {
    try {
      if (products.length === 0) {
        toast.error("Nenhum produto para exportar.");
        return;
      }

      const headers = [
        "Nome",
        "SKU",
        "Estoque",
        "Estoque Mínimo",
        "Preço de Venda",
        "Custo",
        "Margem (%)",
        "Status",
      ];

      const csvRows = products.map((product) => {
        return [
          `"${product.name}"`,
          `"${product.sku}"`,
          product.stock,
          product.minStock,
          product.price.toFixed(2),
          product.cost.toFixed(2),
          (product.margin * 100).toFixed(2),
          `"${product.status}"`,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `stockly-produtos-${date}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Produtos exportados com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar produtos.");
    }
  };

  return (
    <Button 
        variant="outline" 
        size="sm" 
        className="h-9 gap-2 text-slate-600 font-medium border-slate-200 hover:bg-slate-50"
        onClick={handleExport}
    >
      <DownloadIcon className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
};
