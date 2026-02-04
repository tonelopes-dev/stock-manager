import { getTotalInStock } from "@/app/_data-access/dashboard/get-total-in-stock";
import { SummaryCard } from "./summary-card";

const TotalInStockCard = async () => {
  const totalInStock = await getTotalInStock();
  return (
    <SummaryCard title="Itens em Estoque">
      <p className="text-3xl font-bold">{totalInStock}</p>
    </SummaryCard>
  );
};

export default TotalInStockCard;
