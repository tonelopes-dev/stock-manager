import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { Skeleton } from "../../_components/ui/skeleton";

const ProductsLoading = () => {
  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Produtos</HeaderSubtitle>
          <HeaderTitle>Produtos</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <Skeleton className="h-10 w-32" />
        </HeaderRight>
      </Header>
      
      <div className="rounded-md border">
        <div className="h-12 border-b bg-muted/50" />
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsLoading;
