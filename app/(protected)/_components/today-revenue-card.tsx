import { getTodayRevenue } from "@/app/_data-access/dashboard/get-today-revenue";
import { SummaryCard } from "./summary-card";

const TodayRevenueCard = async () => {
  const todayRevenue = await getTodayRevenue();
  return (
    <SummaryCard title="Receita Hoje">
      <p className="text-3xl font-bold">
        {Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(todayRevenue)}
      </p>
    </SummaryCard>
  );
};

export default TodayRevenueCard;
