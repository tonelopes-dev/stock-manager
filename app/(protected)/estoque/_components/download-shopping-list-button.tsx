"use client";

import { useAction } from "next-safe-action/hooks";
import { getInventoryAlerts } from "@/app/_actions/inventory/get-inventory-alerts";
import { Button } from "@/app/_components/ui/button";
import { ShoppingCart, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const DownloadShoppingListButton = () => {
  const { executeAsync, isPending } = useAction(getInventoryAlerts);

  const handleDownload = async () => {
    try {
      const result = await executeAsync({});
      
      if (!result?.data || result.data.length === 0) {
        toast.info("Nenhum item com estoque baixo encontrado.");
        return;
      }

      // Filter only inventory/low stock alerts
      const lowStockItems = result.data.filter((alert: any) => alert.type === "inventory");

      if (lowStockItems.length === 0) {
        toast.info("Nenhum produto precisa de reposição no momento.");
        return;
      }

      // 1. Sort items: Primary by Supplier, Secondary by Name
      const sortedItems = [...lowStockItems].sort((a: any, b: any) => {
        const supA = a.metadata.supplierName.toLowerCase();
        const supB = b.metadata.supplierName.toLowerCase();
        
        if (supA < supB) return -1;
        if (supA > supB) return 1;
        
        const nameA = a.metadata.name.toLowerCase();
        const nameB = b.metadata.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      // 2. Load ExcelJS dynamically (to keep bundle size small if used on other pages)
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Lista de Compras");

      // 3. Define Columns
      worksheet.columns = [
        { header: "Item", key: "name", width: 35 },
        { header: "Categoria", key: "category", width: 20 },
        { header: "Estoque Atual", key: "stock", width: 15 },
        { header: "Estoque Mínimo", key: "minStock", width: 15 },
        { header: "Sugestão", key: "suggestion", width: 15 },
        { header: "Último Custo", key: "cost", width: 15 },
        { header: "Fornecedor", key: "supplier", width: 25 },
        { header: "Status", key: "status", width: 15 },
      ];

      // 4. Style Header Row (Purple Light Background + Purple Dark Bold Font)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEDE9FE" }, // Tailwind violet-100
        };
        cell.font = {
          bold: true,
          color: { argb: "FF4C1D95" }, // Tailwind violet-900
          size: 11,
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "medium" },
          right: { style: "thin" },
        };
      });

      // 5. Add Data Rows
      const formatCurrency = (value: number) => 
        Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

      sortedItems.forEach((alert: any) => {
        const p = alert.metadata;
        
        const minStockValue = p.minStock > 0 ? p.minStock : 0;
        const suggestionValue = minStockValue - p.stock;
        const suggestion = suggestionValue > 0 ? `${suggestionValue} ${p.unit}` : "Repor";

        const row = worksheet.addRow({
          name: p.name,
          category: p.category,
          stock: `${p.stock} ${p.unit}`,
          minStock: p.minStock > 0 ? p.minStock : "Não definido",
          suggestion: suggestion,
          cost: formatCurrency(p.cost),
          supplier: p.supplierName,
          status: "⬜ Aberto", // Initial state
        });

        // Add Data Validation to Status Cell (Dropdown)
        const statusCell = row.getCell("status");
        statusCell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ["\"⬜ Aberto,✅ Comprado\""],
          showErrorMessage: true,
          errorTitle: "Opção inválida",
          error: "Escolha uma opção da lista.",
        };

        // Align cells
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // 6. Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `lista_de_compras_${new Date().toISOString().split("T")[0]}.xlsx`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Lista de compras gerada com excelência!");
    } catch (error) {
      toast.error("Erro ao gerar a lista de compras.");
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload} 
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <ShoppingCart size={16} />
      )}
      Baixar Lista de Compras
    </Button>
  );
};
