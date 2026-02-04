import { getMostSoldProducts } from "@/app/_data-access/dashboard/get-most-sold-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";

const MostSoldProducts = async () => {
  const mostSoldProducts = await getMostSoldProducts();
  return (
    <Card className="min-h-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Produtos mais vendidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-7 overflow-y-auto">
        {mostSoldProducts.map((product) => (
          <div key={product.productId} className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(product.price))}
              </p>
            </div>
            <p className="text-sm font-bold">{product.totalSold} Un.</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const MostSoldProductsSkeleton = () => {
  return (
    <Card className="min-h-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Produtos mais vendidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-7 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MostSoldProducts;
