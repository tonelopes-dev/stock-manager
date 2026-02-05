import { getTotalRevenue } from "@/app/_data-access/dashboard/get-total-revenue";
import { SummaryCard } from "./summary-card";
import { DollarSignIcon } from "lucide-react";

const TotalRevenueCard = async () => {
  const totalRevenue = await getTotalRevenue();
  return (
    <SummaryCard title="Receita Total" icon={DollarSignIcon}>
      <p className="text-3xl font-bold">
        {Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(totalRevenue)}
      </p>
    </SummaryCard>
  );
};

export default TotalRevenueCard;
