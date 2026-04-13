"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { EditIcon, CheckIcon, XIcon, Loader2Icon, ImageIcon, Trash2Icon, CameraIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { upsertProduct } from "@/app/_actions/product/upsert-product";
import { toast } from "sonner";
import { cn } from "@/app/_lib/utils";

interface InlineProductImageProps {
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    [key: string]: any;
  };
}

export default function InlineProductImage({ product }: InlineProductImageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(product.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  const { execute: executeUpdate, isPending } = useAction(upsertProduct, {
    onSuccess: () => {
      toast.success("Imagem atualizada!");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao salvar imagem."),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const imageCompression = (await import("browser-image-compression")).default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 800,
      });
      const response = await fetch(`/api/upload?filename=${compressedFile.name}`, {
        method: "POST",
        body: compressedFile,
      });
      if (!response.ok) throw new Error("Upload failed");
      const blob = await response.json();
      setImageUrl(blob.url);
      toast.success("Foto carregada!");
    } catch (error) {
      toast.error("Erro no upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    executeUpdate({
      ...product,
      id: product.id,
      imageUrl: imageUrl || "",
      // Map other fields to ensure schema validity
      name: product.name || "Produto",
      type: (product.type as any) || "REVENDA",
      unit: (product.unit as any) || "UN",
      price: product.price || 0,
      cost: product.cost || 0,
      stock: product.stock || 0,
      minStock: product.minStock || 0,
      sku: product.sku || null,
      categoryId: product.categoryId || null,
      environmentId: product.environmentId || null,
      trackExpiration: !!product.trackExpiration,
      expirationDate: product.expirationDate ? new Date(product.expirationDate) : null,
    });
  };

  return (
    <Card className={cn(
      "border-none bg-white rounded-[2rem] shadow-sm transition-all duration-300",
      isEditing && "ring-2 ring-primary/10 shadow-xl"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/5 text-primary">
            <CameraIcon size={18} />
          </div>
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mt-1">
            Foto do Produto
          </CardTitle>
        </div>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(true)} 
            className="h-8 w-8 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg"
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
      <CardContent className="p-6 pt-2">
        <div className="relative group overflow-hidden rounded-[2.5rem] border-none shadow-xl w-full aspect-square max-w-[240px] mx-auto flex items-center justify-center bg-slate-50 transition-all duration-300 ring-4 ring-slate-100/50">
           {imageUrl ? (
              <>
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                      <ImageIcon size={24} />
                      <input type="file" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                    <button onClick={() => setImageUrl("")} className="ml-3 p-3 rounded-full bg-white/10 hover:bg-destructive/80 text-white backdrop-blur-md">
                       <Trash2Icon size={24} />
                    </button>
                  </div>
                )}
              </>
           ) : (
              <label className={cn(
                "flex flex-col items-center gap-3 text-muted-foreground/30 px-6 text-center",
                isEditing && "cursor-pointer hover:text-primary transition-colors"
              )}>
                <div className="p-5 rounded-full bg-slate-100 text-slate-300">
                  <ImageIcon size={48} strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-black tracking-[0.2em] leading-relaxed uppercase opacity-40">
                  {isEditing ? "Upload" : "Sem Foto"}
                </p>
                <input type="file" className="hidden" onChange={handleImageUpload} disabled={!isEditing || isUploading} />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2Icon size={32} className="animate-spin text-primary" />
                  </div>
                )}
              </label>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
