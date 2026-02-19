import { notFound } from "next/navigation";
import { getProductById } from "@/app/_data-access/product/get-product-by-id";
import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { Badge } from "@/app/_components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import {
  ArrowLeftIcon,
  PackageIcon,
  BeakerIcon,
  DollarSignIcon,
  BarChart3Icon,
  BoxIcon,
} from "lucide-react";
import Link from "next/link";
import RecipeTable from "./_components/recipe-table";
import AddIngredientForm from "./_components/add-ingredient-form";
import ProduceBatchModal from "./_components/produce-batch-modal";
import { getIngredients } from "@/app/_data-access/ingredient/get-ingredients";

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PRODUCT_TYPE_LABELS: Record<string, { label: string; variant: "default" | "secondary" }> = {
  RESELL: { label: "Revenda", variant: "secondary" },
  PREPARED: { label: "Produção Própria", variant: "default" },
};

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

const ProductDetailsPage = async ({ params }: ProductDetailsPageProps) => {
  const { id } = await params;
  const [product, ingredients] = await Promise.all([
    getProductById(id),
    getIngredients(),
  ]);

  if (!product) {
    notFound();
  }

  const typeConfig = PRODUCT_TYPE_LABELS[product.type] || PRODUCT_TYPE_LABELS.RESELL;
  const isPrepared = product.type === "PREPARED";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Header>
        <HeaderLeft>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link href="/products">
                <ArrowLeftIcon size={16} />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <HeaderTitle>{product.name}</HeaderTitle>
                <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
              </div>
              <HeaderSubtitle>
                {product.sku ? `SKU: ${product.sku}` : "Detalhes do produto"}
              </HeaderSubtitle>
            </div>
          </div>
        </HeaderLeft>
        {isPrepared && product.recipes.length > 0 && (
          <ProduceBatchModal
            productId={product.id}
            productName={product.name}
            productStock={product.stock}
            recipeCost={product.recipeCost}
            recipes={product.recipes}
          />
        )}
      </Header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSignIcon size={14} />
              <span className="text-xs font-medium">Preço de Venda</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PackageIcon size={14} />
              <span className="text-xs font-medium">
                {isPrepared ? "Custo (Receita)" : "Custo"}
              </span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(product.cost)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3Icon size={14} />
              <span className="text-xs font-medium">Margem</span>
            </div>
            <p className="text-lg font-bold">{product.margin}%</p>
          </CardContent>
        </Card>

        {!isPrepared && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BoxIcon size={14} />
                <span className="text-xs font-medium">Estoque</span>
              </div>
              <p className="text-lg font-bold">{product.stock}</p>
              <p className="text-xs text-muted-foreground">Mín: {product.minStock}</p>
            </CardContent>
          </Card>
        )}

        {isPrepared && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BoxIcon size={14} />
                <span className="text-xs font-medium">Estoque Produzido</span>
              </div>
              <p className="text-lg font-bold">{product.stock}</p>
              <p className="text-xs text-muted-foreground">unidades disponíveis</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recipe Section - Only for PREPARED products */}
      {isPrepared && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BeakerIcon size={18} />
              Receita
            </CardTitle>
            <CardDescription>
              Insumos necessários para a produção deste produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecipeTable recipes={product.recipes} recipeCost={product.recipeCost} />
            <AddIngredientForm
              productId={product.id}
              ingredientOptions={ingredients.map((i) => ({
                value: i.id,
                label: `${i.name} (${i.unitLabel})`,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductDetailsPage;