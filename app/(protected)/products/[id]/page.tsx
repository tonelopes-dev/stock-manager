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
import { getOverheadSettings } from "@/app/_data-access/company/get-overhead-settings";

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
  const [product, ingredients, categories, environments, overheadSettings] = await Promise.all([
    getProductById(id),
    getIngredients(),
    getProductCategories(),
    getEnvironments(),
    getOverheadSettings(),
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
    <div className="relative min-h-full w-full bg-slate-50/50 p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex items-center gap-6 bg-white/40 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/60 shadow-sm">
        <Button variant="ghost" size="icon" asChild className="h-12 w-12 border-none shadow-none bg-slate-100/50 hover:bg-slate-100 rounded-2xl transition-all">
          <Link href="/products">
            <ArrowLeftIcon size={20} className="text-slate-600" />
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
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <BeakerIcon size={18} />
                    Ficha Técnica
                  </CardTitle>
                  <CardDescription>
                    Insumos necessários para a produção deste produto
                  </CardDescription>
                </div>
                <ProduceBatchModal
                  productId={product.id}
                  productName={product.name}
                  productStock={product.stock}
                  recipeCost={product.recipeCost}
                  recipes={product.recipes}
                />
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
            <Card className="border-none bg-white shadow-sm overflow-hidden rounded-[2.5rem]">
              <div className="flex flex-col items-center justify-center py-24 text-center px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-100 via-primary/20 to-slate-100 opacity-50" />
                <div className="mb-6 rounded-3xl bg-slate-50 p-6 text-primary shadow-inner">
                  <PackageIcon size={48} className="opacity-80" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">Produto para Revenda ou Insumo</CardTitle>
                <CardDescription className="max-w-[440px] text-base mt-4 font-medium text-muted-foreground/80 leading-relaxed">
                  Este item é classificado como <strong>simples</strong>. 
                  Diferente de produtos de <strong>Produção Própria</strong>, ele não requer uma ficha técnica pois não é composto por outros insumos.
                </CardDescription>
              </div>
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
          
        </div>
      </div>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
