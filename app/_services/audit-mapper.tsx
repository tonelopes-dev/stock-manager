import { AuditEventType, Prisma } from "@prisma/client";
import { 
  UserPlus, 
  UserMinus, 
  Settings, 
  ShieldAlert, 
  Trash2, 
  RefreshCcw, 
  Package, 
  ShoppingCart, 
  CreditCard,
  AlertTriangle,
  Info
} from "lucide-react";
import { ReactNode } from "react";

export interface MappedAuditLog {
  title: string;
  description: string;
  icon: ReactNode;
  variant: "info" | "warning" | "critical";
}

export class AuditMapper {
  static map(type: AuditEventType, metadata: Prisma.JsonValue, actorName: string | null): MappedAuditLog {
    const actor = actorName || "Sistema";
    const meta = (metadata && typeof metadata === "object" && !Array.isArray(metadata)) 
      ? metadata as Record<string, unknown> 
      : {};

    switch (type) {
      // Account Lifecycle
      case AuditEventType.COMPANY_SOFT_DELETED:
        return {
          title: "Empresa desativada",
          description: `${actor} iniciou o processo de exclusão da empresa.`,
          icon: <Trash2 className="h-4 w-4" />,
          variant: "critical",
        };
      case AuditEventType.COMPANY_RESTORED:
        return {
          title: "Empresa restaurada",
          description: `${actor} restaurou o acesso à empresa.`,
          icon: <RefreshCcw className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.OWNERSHIP_TRANSFERRED:
        return {
          title: "Transferência de posse",
          description: `${actor} transferiu a propriedade da empresa para outro administrador.`,
          icon: <ShieldAlert className="h-4 w-4" />,
          variant: "warning",
        };

      // Team
      case AuditEventType.MEMBER_INVITED:
        return {
          title: "Membro convidado",
          description: `${actor} enviou um convite para ${String(meta.email || "novo membro")}.`,
          icon: <UserPlus className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.MEMBER_REMOVED:
        return {
          title: "Membro removido",
          description: `${actor} removeu um membro da equipe.`,
          icon: <UserMinus className="h-4 w-4" />,
          variant: "warning",
        };
      case AuditEventType.ROLE_UPDATED:
        return {
          title: "Permissão alterada",
          description: `${actor} alterou o nível de acesso de um membro.`,
          icon: <Settings className="h-4 w-4" />,
          variant: "info",
        };

      // Business
      case AuditEventType.STOCK_ADJUSTED:
        return {
          title: "Ajuste de estoque",
          description: `${actor} alterou manualmente o estoque de um produto.`,
          icon: <Package className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.SALE_CANCELED:
        return {
          title: "Venda cancelada",
          description: `${actor} cancelou a venda #${String(meta.saleId || "")}.`,
          icon: <ShoppingCart className="h-4 w-4" />,
          variant: "warning",
        };
      case AuditEventType.SALE_CREATED:
        return {
          title: "Venda realizada",
          description: `${actor} registrou uma nova venda no valor de R$ ${Number(meta.totalAmount || 0).toFixed(2)}.`,

          icon: <ShoppingCart className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.SALE_UPDATED:
        return {
          title: "Venda editada",
          description: `${actor} alterou os dados da venda #${String(meta.saleId || "")}.`,
          icon: <ShoppingCart className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.SALE_DELETED:
        return {
          title: "Venda excluída",
          description: `${actor} removeu permanentemente a venda #${String(meta.saleId || "")}.`,
          icon: <Trash2 className="h-4 w-4" />,
          variant: "warning",
        };
      case AuditEventType.PRODUCT_CREATED:
        return {
          title: "Produto criado",
          description: `${actor} adicionou o produto "${String(meta.name || "Sem nome")}" ao catálogo.`,
          icon: <Package className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.PRODUCT_UPDATED:
        return {
          title: "Produto atualizado",
          description: `${actor} editou as informações do produto "${String(meta.name || "Sem nome")}".`,
          icon: <Package className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.PRODUCT_DELETED:
        return {
          title: "Produto desativado",
          description: `${actor} desativou o produto "${String(meta.name || "Sem nome")}" do catálogo.`,
          icon: <Trash2 className="h-4 w-4" />,
          variant: "warning",
        };



      // Billing
      case AuditEventType.SUBSCRIPTION_ACTIVATED:
        return {
          title: "Plano ativado",
          description: "A assinatura da empresa foi ativada com sucesso.",
          icon: <CreditCard className="h-4 w-4" />,
          variant: "info",
        };
      case AuditEventType.BILLING_REQUIRED:
        return {
          title: "Ação de faturamento necessária",
          description: "O sistema detectou um problema com a cobrança recorrente.",
          icon: <AlertTriangle className="h-4 w-4" />,
          variant: "critical",
        };

      default:
        return {
          title: "Evento do sistema",
          description: `Ação registrada: ${type}`,
          icon: <Info className="h-4 w-4" />,
          variant: "info",
        };
    }
  }
}
