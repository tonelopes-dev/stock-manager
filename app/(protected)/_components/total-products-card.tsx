import { getTotalProducts } from "@/app/_data-access/dashboard/get-total-products";
import { SummaryCard } from "./summary-card";
import { BoxIcon } from "lucide-react";

const TotalProductsCard = async () => {
  const totalProducts = await getTotalProducts();
  return (
    <SummaryCard title="Produtos" icon={BoxIcon}>
      <p className="text-3xl font-bold">{totalProducts}</p>
    </SummaryCard>
  );
};

export default TotalProductsCard;
