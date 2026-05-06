
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/app/_components/ui/button";
import { Loader2Icon, CameraIcon, XIcon, ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/app/_lib/utils";

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  category?: string;
  companySlug?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 🖼️ COMPONENTE: ImagePicker Reutilizável
 * Encapsula Compressão, Upload (Vercel Blob) e Preview.
 */
export function ImagePicker({ 
  value, 
  onChange, 
  category = "others", 
  companySlug,
  className,
  disabled
}: ImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // 1. Compressão
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);

      // 2. Upload para a API Route centralizada
      const urlParams = new URLSearchParams({
        filename: compressedFile.name,
        category,
      });
      if (companySlug) urlParams.append("companySlug", companySlug);

      const response = await fetch(`/api/upload?${urlParams.toString()}`, {
        method: "POST",
        body: compressedFile,
      });

      if (!response.ok) throw new Error("Upload failed");

      const blob = await response.json();
      
      // 3. Callback com a URL final
      onChange(blob.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("ImagePicker Error:", error);
      toast.error("Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("relative group", className)}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      
      <div 
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative h-32 w-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
          value ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 bg-muted/30 hover:border-primary/40 hover:bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "animate-pulse"
        )}
      >
        {value ? (
          <>
            <Image 
              src={value} 
              alt="Preview" 
              fill 
              className="object-cover"
              sizes="128px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <CameraIcon size={24} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
            {isUploading ? (
              <Loader2Icon size={24} className="animate-spin text-primary" />
            ) : (
              <ImageIcon size={24} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isUploading ? "Enviando..." : "Foto"}
            </span>
          </div>
        )}
      </div>

      {value && !disabled && !isUploading && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
          onClick={clearImage}
        >
          <XIcon size={12} />
        </Button>
      )}
    </div>
  );
}
