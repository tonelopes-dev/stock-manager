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
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const PRODUCT_TYPE_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" }
> = {
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

  const typeConfig =
    PRODUCT_TYPE_LABELS[product.type] || PRODUCT_TYPE_LABELS.RESELL;
  const isPrepared = product.type === "PREPARED";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/products">
            <ArrowLeftIcon size={16} />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <Badge variant={typeConfig.variant} className="h-fit">
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Financial Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Preço de Venda</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isPrepared ? "Custo (Receita)" : "Custo Fixo"}
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(product.cost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className="text-xl font-bold text-primary">
                    {product.margin}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Composition / Recipe Section */}
          {isPrepared ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BeakerIcon size={18} />
                  Ficha Técnica
                </CardTitle>
                <CardDescription>
                  Insumos necessários para a produção deste produto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RecipeTable
                  recipes={product.recipes}
                  recipeCost={product.recipeCost}
                />
                <div className="rounded-lg border border-dashed p-4">
                  <h4 className="mb-4 text-sm font-medium">Adicionar Insumo</h4>
                  <AddIngredientForm
                    productId={product.id}
                    ingredientOptions={ingredients.map((i) => ({
                      value: i.id,
                      label: `${i.name} (${i.unitLabel})`,
                      unit: i.unit,
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <PackageIcon className="mb-2 text-muted-foreground" size={40} />
                <CardTitle className="text-base">Produto de Revenda</CardTitle>
                <CardDescription className="max-w-[300px]">
                  Este produto não possui ficha técnica por ser um item de
                  revenda direta de fornecedor.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                    {product.stock.toString()}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">
                    {product.unit}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Disponível em estoque</p>
              </div>

              <div className="flex items-center justify-between rounded-md bg-background p-3 text-sm border">
                <span className="text-muted-foreground">Estoque Mínimo:</span>
                <span className="font-semibold">
                  {product.minStock} {product.unit}
                </span>
              </div>

              {isPrepared && (
                <div className="pt-2">
                  <ProduceBatchModal
                    productId={product.id}
                    productName={product.name}
                    productStock={product.stock}
                    recipeCost={product.recipeCost}
                    recipes={product.recipes}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span>{product.sku || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
