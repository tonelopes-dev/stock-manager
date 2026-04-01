"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/_components/ui/select";
import { Badge } from "@/app/_components/ui/badge";
import { EditIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { upsertProduct } from "@/app/_actions/product/upsert-product";
import { toast } from "sonner";
import { UnitType } from "@prisma/client";
import { cn } from "@/app/_lib/utils";

interface InlineProductHeaderProps {
  product: {
    id: string;
    name: string;
    type: string;
    unit: UnitType;
    [key: string]: any;
  };
}

const PRODUCT_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  REVENDA: { label: "Revenda", className: "bg-blue-50 text-blue-700 border-blue-200" },
  PRODUCAO_PROPRIA: { label: "Produção Própria", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMBO: { label: "Combo", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  INSUMO: { label: "Insumo", className: "bg-slate-50 text-slate-700 border-slate-200" },
};

export default function InlineProductHeader({ product }: InlineProductHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [type, setType] = useState(product.type);
  const [unit, setUnit] = useState<UnitType>(product.unit);

  const { execute: executeUpdate, isPending } = useAction(upsertProduct, {
    onSuccess: () => {
      toast.success("Produto atualizado.");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao salvar alterações."),
  });

  const handleSave = () => {
    executeUpdate({
      ...product,
      id: product.id,
      name,
      type: type as any,
      unit,
      // Map other fields to ensure schema validity
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      sku: product.sku,
      categoryId: product.categoryId,
      environmentId: product.environmentId,
      trackExpiration: product.trackExpiration,
      expirationDate: product.expirationDate ? new Date(product.expirationDate) : null,
      imageUrl: product.imageUrl || "",
    });
  };

  const typeConfig = PRODUCT_TYPE_LABELS[type] || PRODUCT_TYPE_LABELS.REVENDA;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="space-y-1">
            {isEditing ? (
              <div className="space-y-4">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="h-auto p-0 text-3xl font-black tracking-tight bg-transparent border-none focus-visible:ring-0 shadow-none hover:bg-muted/10 transition-colors"
                  placeholder="Nome do produto"
                  autoFocus
                />
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Tipo</p>
                    <Select onValueChange={setType} value={type}>
                      <SelectTrigger className="h-9 w-44 bg-muted/40 border-none font-bold text-xs ring-0 shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-none shadow-xl">
                        <SelectItem value="REVENDA">Revenda</SelectItem>
                        <SelectItem value="PRODUCAO_PROPRIA">Produção Própria</SelectItem>
                        <SelectItem value="COMBO">Combo</SelectItem>
                        <SelectItem value="INSUMO">Insumo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Unidade</p>
                    <Select onValueChange={(val) => setUnit(val as UnitType)} value={unit}>
                      <SelectTrigger className="h-9 w-20 bg-muted/40 border-none font-bold text-xs ring-0 shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-none shadow-xl">
                        <SelectItem value={UnitType.UN}>UN</SelectItem>
                        <SelectItem value={UnitType.KG}>KG</SelectItem>
                        <SelectItem value={UnitType.G}>G</SelectItem>
                        <SelectItem value={UnitType.L}>L</SelectItem>
                        <SelectItem value={UnitType.ML}>ML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-foreground">{name}</h1>
                <div className="flex items-center gap-2">
                  <Badge className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", typeConfig.className)}>
                    {typeConfig.label}
                  </Badge>
                  <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider opacity-60">
                    {product.unit}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ml-4">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 h-10 px-4 rounded-xl border-border/60 hover:bg-primary hover:text-white transition-all duration-300" aria-label="Editar Nome e Tipo">
              <EditIcon size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Identificação</span>
            </Button>
          ) : (
            <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isPending} className="h-9 w-9 p-0 rounded-xl hover:bg-white text-muted-foreground shadow-sm" aria-label="Cancelar Edição">
                <XIcon size={18} />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending} className="h-9 px-4 rounded-xl shadow-lg bg-primary hover:primary/90 transition-all font-bold text-xs uppercase tracking-wider" aria-label="Salvar Alterações">
                {isPending ? <Loader2Icon size={16} className="animate-spin" /> : <CheckIcon size={16} className="mr-2" />}
                Salvar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
