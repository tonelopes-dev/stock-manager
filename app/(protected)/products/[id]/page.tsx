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
} from "lucide-react";
import Link from "next/link";
import RecipeTable from "./_components/recipe-table";
import AddIngredientForm from "./_components/add-ingredient-form";
import ProduceBatchModal from "./_components/produce-batch-modal";
import InlineFinancialSummary from "./_components/inline-financial-summary";
import InlineStockStatus from "./_components/inline-stock-status";
import InlineAdditionalInfo from "./_components/inline-additional-info";
import InlineProductHeader from "./_components/inline-product-header";
import InlineProductImage from "./_components/inline-product-image";
import { getIngredients } from "@/app/_data-access/ingredient/get-ingredients";
import { getProductCategories } from "@/app/_data-access/product/get-product-categories";
import { getEnvironments } from "@/app/_data-access/product/get-environments";

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const PRODUCT_TYPE_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "premium" }
> = {
  REVENDA: { label: "Revenda", variant: "secondary" },
  PRODUCAO_PROPRIA: { label: "Produção Própria", variant: "default" },
  COMBO: { label: "Combo", variant: "premium" as any },
  INSUMO: { label: "Insumo", variant: "outline" as any },
};

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

const ProductDetailsPage = async ({ params }: ProductDetailsPageProps) => {
  const { id } = await params;
  const [product, ingredients, categories, environments] = await Promise.all([
    getProductById(id),
    getIngredients(),
    getProductCategories(),
    getEnvironments(),
  ]);

  if (!product) {
    notFound();
  }

  const typeConfig =
    PRODUCT_TYPE_LABELS[product.type] || PRODUCT_TYPE_LABELS.REVENDA;
  const isPrepared = 
    product.type === "PRODUCAO_PROPRIA" || 
    product.type === "COMBO";

  return (
    <div className="mx-auto w-full max-w-6xl p-8 space-y-8">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 border shadow-sm hover:bg-muted">
          <Link href="/products">
            <ArrowLeftIcon size={18} className="text-muted-foreground" />
          </Link>
        </Button>
        <div className="flex-1">
          <InlineProductHeader product={product as any} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Main Content - Left Column (2/3) */}
        <div className="space-y-10 lg:col-span-2">
          {/* Financial Summary Block (Inline Editable) */}
          <InlineFinancialSummary product={product as any} />


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
                  <h4 className="mb-4 text-sm font-medium">Adicionar Item à Composição</h4>
                  <AddIngredientForm
                    productId={product.id}
                    ingredientOptions={ingredients
                      .filter((i) => i.id !== product.id)
                      .map((i) => ({
                        value: i.id,
                        label: `${i.name} (${i.unitLabel})`,
                        unit: i.unit,
                      }))}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/30 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <PackageIcon className="mb-4 text-muted-foreground/30" size={64} />
                <CardTitle className="text-xl font-bold">Produto Simples</CardTitle>
                <CardDescription className="max-w-[400px] text-base mt-2">
                  Produtos do tipo <strong>Revenda</strong> ou <strong>Insumo</strong> 
                  não possuem ficha técnica pois não são compostos por outros itens.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-10">
          {/* Product Image Card (Sidebar Top) */}
          <InlineProductImage product={product as any} />

          {/* Stock Status Block (Inline Editable) */}
          <InlineStockStatus product={product as any} />

          {/* Additional Info Block (Inline Editable) */}
          <InlineAdditionalInfo 
            product={product as any} 
            categories={categories} 
            environments={environments} 
          />
          
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
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
