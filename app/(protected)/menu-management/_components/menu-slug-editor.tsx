"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateCompanySlug } from "@/app/_actions/company/update-company-slug";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LinkIcon, Loader2Icon, CheckIcon, PencilIcon, XIcon } from "lucide-react";

interface MenuSlugEditorProps {
  initialSlug: string;
}

export const MenuSlugEditor = ({ initialSlug }: MenuSlugEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [slug, setSlug] = useState(initialSlug);
  const router = useRouter();

  const { execute, isPending } = useAction(updateCompanySlug, {
    onSuccess: () => {
      toast.success("URL do cardápio atualizada!");
      setIsEditing(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao atualizar URL.");
    },
  });

  const handleSave = () => {
    if (slug === initialSlug) {
      setIsEditing(false);
      return;
    }
    execute({ slug });
  };

  if (!isEditing) {
    return (
      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-dashed border-border p-3 bg-muted/20">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 bg-background rounded-lg border border-border shrink-0">
            <LinkIcon size={14} className="text-muted-foreground" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Identificador da URL</p>
            <p className="text-xs font-mono font-medium truncate">{initialSlug}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(true)} 
          className="h-8 px-2 gap-1.5 font-bold text-primary hover:text-primary hover:bg-primary/10 shrink-0"
        >
          <PencilIcon size={12} />
          Alterar
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-primary/20 p-4 bg-primary/5 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center gap-2">
         <LinkIcon size={12} className="text-primary" />
         <span className="text-[11px] font-bold text-primary uppercase">Editar URL do Cardápio</span>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input 
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            className="h-9 bg-background font-mono text-xs pr-8"
            placeholder="ex: minha-loja"
            autoFocus
            disabled={isPending}
          />
          {slug !== initialSlug && !isPending && (
            <button 
                onClick={() => setSlug(initialSlug)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
                <XIcon size={14} />
            </button>
          )}
        </div>
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isPending || slug.length < 3}
          className="h-9 px-3 font-bold"
        >
          {isPending ? <Loader2Icon size={14} className="animate-spin" /> : <CheckIcon size={14} />}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSlug(initialSlug);
            setIsEditing(false);
          }}
          className="h-9 px-3 font-bold text-muted-foreground"
          disabled={isPending}
        >
          Sair
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground italic leading-tight">
        Ao salvar, seu cardápio passará a ser: <br />
        <span className="text-primary font-bold">usekipo.com.br/{slug || "..."}</span>
      </p>
    </div>
  );
};
