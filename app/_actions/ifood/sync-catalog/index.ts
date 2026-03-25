"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { IfoodCatalogService } from "@/app/_services/ifood/catalog-service";
import { BusinessError } from "@/app/_lib/errors";

export const syncIfoodCatalogAction = async () => {
  try {
    const companyId = await getCurrentCompanyId();
    
    if (!companyId) {
      throw new BusinessError("Empresa não identificada.");
    }

    const result = await IfoodCatalogService.syncItems(companyId);

    revalidatePath("/(protected)/products", "page");
    
    return { 
      success: true, 
      message: `${result?.count || 0} itens sincronizados com sucesso!` 
    };
  } catch (error) {
    console.error("[Action] Erro ao sincronizar catálogo iFood:", error);
    
    if (error instanceof BusinessError) {
      return { success: false, message: error.message };
    }
    
    return { 
      success: false, 
      message: "Erro inesperado ao sincronizar com iFood. Verifique suas credenciais." 
    };
  }
};
