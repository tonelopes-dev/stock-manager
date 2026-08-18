"use client";

import { upsertEnvironment } from "@/app/_actions/product/upsert-environment";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface QuickEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickEnvironmentDialog({ open, onOpenChange }: QuickEnvironmentDialogProps) {
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsPending(true);
    try {
      const result = await upsertEnvironment({ name });
      if (result?.validationErrors || result?.serverError) {
        toast.error(result?.serverError || "Erro de validação");
      } else {
        toast.success("Praça criada com sucesso!");
        setName("");
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro ao criar praça");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Praça</DialogTitle>
          <DialogDescription>
            Crie uma nova praça de produção (Ex: Cozinha Fria, Bar, Churrasqueira).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Praça</Label>
            <Input
              id="name"
              placeholder="Ex: Bar, Cozinha Quente..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
