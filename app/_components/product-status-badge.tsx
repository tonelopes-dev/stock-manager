import { ProductStatusDto } from "../_data-access/product/get-products";
import { Badge } from "./ui/badge";

const getStatusLabel = (status: string) => {
  if (status === "IN_STOCK") {
    return "Em estoque";
  }
  if (status === "LOW_STOCK") {
    return "Estoque baixo";
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
          : status === "LOW_STOCK"
          ? "destructive"
          : "outline"
      }
      className={`gap-1.5 ${status === "LOW_STOCK" ? "bg-orange-500 hover:bg-orange-600 border-none text-white" : ""}`}
    >
      {label}
    </Badge>
  );
};

export default ProductStatusBadge;