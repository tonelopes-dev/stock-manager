"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/_components/ui/select";
import { EditIcon, CheckIcon, XIcon, Loader2Icon, InfoIcon, TagIcon, LayersIcon, MapPinIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { upsertProduct } from "@/app/_actions/product/upsert-product";
import { toast } from "sonner";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { cn } from "@/app/_lib/utils";

interface InlineAdditionalInfoProps {
  product: {
    id: string;
    sku: string | null;
    categoryId: string | null;
    environmentId: string | null;
    [key: string]: any;
  };
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
}

export default function InlineAdditionalInfo({ 
  product, 
  categories, 
  environments 
}: InlineAdditionalInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [sku, setSku] = useState(product.sku || "");
  const [categoryId, setCategoryId] = useState(product.categoryId || "none");
  const [environmentId, setEnvironmentId] = useState(product.environmentId || "none");

  const { execute: executeUpdate, isPending } = useAction(upsertProduct, {
    onSuccess: () => {
      toast.success("Informações atualizadas.");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao salvar informações."),
  });

  const handleSave = () => {
    executeUpdate({
      ...product,
      id: product.id,
      sku: sku || null,
      categoryId: categoryId === "none" ? null : categoryId,
      environmentId: environmentId === "none" ? null : environmentId,
      // Map other fields to ensure schema validity
      unit: product.unit as any,
      type: product.type as any,
      price: product.price,
      cost: product.cost,
      name: product.name,
      stock: product.stock,
      minStock: product.minStock,
      trackExpiration: product.trackExpiration,
      expirationDate: product.expirationDate ? new Date(product.expirationDate) : null,
      imageUrl: product.imageUrl || "",
    });
  };

  const categoryName = categories.find(c => c.id === categoryId)?.name || "N/A";
  const environmentName = environments.find(e => e.id === environmentId)?.name || "Padrão";

  return (
    <Card className={cn(
      "border border-border/40 bg-card rounded-xl shadow-sm transition-all duration-300",
      isEditing && "ring-1 ring-primary/20 border-primary/30 shadow-md"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <InfoIcon size={16} />
          </div>
          <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Informações Adicionais
          </CardTitle>
        </div>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(true)} 
            className="h-8 w-8 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg"
            aria-label="Editar Informações"
          >
            <EditIcon size={14} />
          </Button>
        ) : (
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={isPending} className="h-7 w-7 text-muted-foreground hover:bg-white rounded-lg">
              <XIcon size={14} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isPending} className="h-7 w-7 text-primary hover:bg-white rounded-lg shadow-sm">
              {isPending ? <Loader2Icon size={14} className="animate-spin" /> : <CheckIcon size={14} />}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-5">
        <div className="flex justify-between items-center group/item h-12 border-b border-border/20 last:border-0">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-md bg-muted/30 text-muted-foreground opacity-60">
               <TagIcon size={14} />
             </div>
             <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">SKU</span>
          </div>
          {isEditing ? (
            <Input 
              value={sku} 
              onChange={(e) => setSku(e.target.value)} 
              placeholder="Opcional"
              className="h-9 w-40 text-right bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/10 font-bold text-xs"
            />
          ) : (
            <span className="font-bold text-sm text-foreground/80 tracking-tight">{sku || "N/A"}</span>
          )}
        </div>

        <div className="flex justify-between items-center group/item h-12 border-b border-border/20 last:border-0">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-md bg-muted/30 text-muted-foreground opacity-60">
               <LayersIcon size={14} />
             </div>
             <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Categoria</span>
          </div>
          {isEditing ? (
            <Select onValueChange={setCategoryId} value={categoryId}>
              <SelectTrigger className="h-9 w-40 bg-muted/20 border-none font-bold text-xs shadow-none">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="border-none shadow-2xl">
                <SelectItem value="none">Nenhuma</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-bold text-sm text-foreground/80 tracking-tight">{categoryName}</span>
          )}
        </div>

        <div className="flex justify-between items-center group/item h-12">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-md bg-muted/30 text-muted-foreground opacity-60">
               <MapPinIcon size={14} />
             </div>
             <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Ambiente</span>
          </div>
          {isEditing ? (
            <Select onValueChange={setEnvironmentId} value={environmentId}>
              <SelectTrigger className="h-9 w-40 bg-muted/20 border-none font-bold text-xs shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-none shadow-2xl">
                <SelectItem value="none">Padrão</SelectItem>
                {environments.map(env => <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-bold text-sm text-foreground/80 tracking-tight">{environmentName}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
