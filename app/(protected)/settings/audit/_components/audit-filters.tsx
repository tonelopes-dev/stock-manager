"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AuditEventType } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function AuditFilters({ actors }: { actors: { id: string, name: string | null, email: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([name, value]) => {
        if (value === null || value === "") {
          newParams.delete(name);
        } else {
          newParams.set(name, value);
        }
      });

      // Reset page when filtering
      newParams.delete("cursor");
      
      return newParams.toString();
    },
    [searchParams]
  );

  const handleFilter = (name: string, value: string | null) => {
    startTransition(() => {
      router.push(`?${createQueryString({ [name]: value })}`);
    });
  };

  const clearFilters = () => {
    router.push("/settings/audit");
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-1.5 min-w-[200px]">
        <Label className="text-xs">Tipo de Evento</Label>
        <Select 
          value={searchParams.get("type") || "all"} 
          onValueChange={(val) => handleFilter("type", val === "all" ? null : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.values(AuditEventType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-[200px]">
        <Label className="text-xs">Usuário (Ator)</Label>
        <Select 
          value={searchParams.get("actor") || "all"} 
          onValueChange={(val) => handleFilter("actor", val === "all" ? null : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Qualquer usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.name || actor.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Data Inicial</Label>
        <Input 
          type="date" 
          value={searchParams.get("start") || ""} 
          onChange={(e) => handleFilter("start", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Data Final</Label>
        <Input 
          type="date" 
          value={searchParams.get("end") || ""} 
          onChange={(e) => handleFilter("end", e.target.value)}
          className="w-40"
        />
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={clearFilters}
        className="h-9 w-9"
        title="Limpar filtros"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
