import { ProductStatusDto } from "../_data-access/product/get-products";
import { Badge } from "./ui/badge";

const getStatusLabel = (status: string) => {
  if (status === "IN_STOCK") {
    return "Em estoque";
  }
  if (status === "LOW_STOCK") {
    return "Estoque baixo";
  }
  if (status === "SLOW_MOVING") {
    return "Sem saída";
  }
  return "Fora de estoque";
};

interface ProductStatusBadgeProps {
  status: ProductStatusDto;
}

const ProductStatusBadge = ({ status }: ProductStatusBadgeProps) => {
  const label = getStatusLabel(status);
  return (
    <Badge
      variant={
        status === "IN_STOCK"
          ? "default"
          : status === "LOW_STOCK" || status === "SLOW_MOVING"
          ? "destructive"
          : "outline"
      }
      className={`gap-1.5 ${
        status === "LOW_STOCK"
          ? "bg-orange-500 hover:bg-orange-600 border-none text-white"
          : status === "SLOW_MOVING"
          ? "bg-blue-500 hover:bg-blue-600 border-none text-white"
          : ""
      }`}
    >
      {label}
    </Badge>
  );
};

export default ProductStatusBadge;