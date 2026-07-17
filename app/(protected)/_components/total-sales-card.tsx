import { getTotalSales } from "@/app/_data-access/dashboard/get-total-sales";
import { ShoppingCartIcon } from "lucide-react";
import { SummaryCard } from "./summary-card";

const TotalSalesCard = async () => {
  const totalSales = await getTotalSales();
  return (
    <SummaryCard title="Vendas Totais" icon={ShoppingCartIcon}>
      <p className="text-3xl font-bold">{totalSales}</p>
    </SummaryCard>
  );
};

export default TotalSalesCard;
