import { UserRole } from "@prisma/client";

/**
 * Constantes de Permissões (Capabilities)
 * Define todas as ações granulares que podem ser atribuídas a um usuário.
 */
export const PERMISSIONS = {
  // Gestão de Produtos
  PRODUCT_CREATE: "product:create",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",
  
  // Vendas e Comandas
  SALE_CREATE: "sale:create",
  SALE_CANCEL: "sale:cancel",
  SALE_VIEW: "sale:view",
  
  // Estoque
  STOCK_VIEW: "stock:view",
  STOCK_ADJUST: "stock:adjust",
  
  // KDS (Cozinha)
  KDS_VIEW: "kds:view",
  KDS_MANAGE: "kds:manage",
  
  // Configurações e Equipe
  TEAM_MANAGE: "team:manage",
  AUDIT_VIEW: "audit:view",
  COMPANY_UPDATE: "company:update",

  // Acesso a Áreas (Views)
  BILLING_VIEW: "billing:view",
  REPORTS_VIEW: "reports:view",
  SETTINGS_VIEW: "settings:view",
  INTEGRATIONS_VIEW: "integrations:view",
  COMPANY_SETTINGS_VIEW: "settings:company:view",
  TEAM_SETTINGS_VIEW: "settings:team:view",

  // Mutações Administrativas (Write Capabilities)
  COMPANY_SETTINGS_UPDATE: "settings:company:update",
  INTEGRATIONS_MANAGE: "integrations:manage",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Rótulos amigáveis para as permissões na UI
 */
export const PERMISSION_LABELS: Record<keyof typeof PERMISSIONS, string> = {
  PRODUCT_CREATE: "Criar Produtos",
  PRODUCT_UPDATE: "Editar Produtos",
  PRODUCT_DELETE: "Excluir Produtos",
  SALE_CREATE: "Criar Vendas",
  SALE_CANCEL: "Cancelar Vendas",
  SALE_VIEW: "Visualizar Vendas",
  STOCK_VIEW: "Visualizar Estoque",
  STOCK_ADJUST: "Ajustar Estoque",
  KDS_VIEW: "Visualizar Cozinha (KDS)",
  KDS_MANAGE: "Gerenciar Cozinha (KDS)",
  TEAM_MANAGE: "Gerenciar Equipe",
  AUDIT_VIEW: "Ver Logs de Auditoria",
  COMPANY_UPDATE: "Editar Dados da Empresa",
  BILLING_VIEW: "Ver Faturamento",
  REPORTS_VIEW: "Ver Relatórios",
  SETTINGS_VIEW: "Ver Configurações",
  INTEGRATIONS_VIEW: "Ver Integrações",
  COMPANY_SETTINGS_VIEW: "Ver Configurações da Empresa",
  TEAM_SETTINGS_VIEW: "Ver Configurações de Equipe",
  COMPANY_SETTINGS_UPDATE: "Editar Configurações da Empresa",
  INTEGRATIONS_MANAGE: "Gerenciar Integrações",
};

/**
 * Explicações simples para cada permissão (ajuda usuários leigos)
 */
export const PERMISSION_DESCRIPTIONS: Record<keyof typeof PERMISSIONS, string> = {
  PRODUCT_CREATE: "Permite cadastrar novos itens, insumos ou combos no sistema.",
  PRODUCT_UPDATE: "Permite alterar preços, nomes e composições dos produtos.",
  PRODUCT_DELETE: "Permite excluir produtos permanentemente. Use com cautela.",
  SALE_CREATE: "Permite abrir comandas e registrar vendas no caixa.",
  SALE_CANCEL: "Permite cancelar vendas ou estornar pagamentos feitos por erro.",
  SALE_VIEW: "Permite ver a lista de vendas realizadas e detalhes dos pedidos.",
  STOCK_VIEW: "Permite visualizar as quantidades atuais em estoque.",
  STOCK_ADJUST: "Permite dar entrada em mercadorias ou corrigir o estoque manual.",
  KDS_VIEW: "Permite visualizar a tela de pedidos da cozinha em tempo real.",
  KDS_MANAGE: "Permite dar baixa nos pedidos (marcar como pronto) na cozinha.",
  TEAM_MANAGE: "Permite convidar novos colaboradores ou gerenciar a equipe.",
  AUDIT_VIEW: "Permite ver o histórico de quem realizou cada ação no sistema.",
  COMPANY_UPDATE: "Permite editar as configurações principais da sua empresa.",
  BILLING_VIEW: "Permite visualizar planos e informações de faturamento.",
  REPORTS_VIEW: "Permite acessar relatórios gerenciais e de desempenho.",
  SETTINGS_VIEW: "Permite acessar as configurações gerais da empresa.",
  INTEGRATIONS_VIEW: "Permite acessar e gerenciar integrações externas.",
  COMPANY_SETTINGS_VIEW: "Permite visualizar e editar as configurações gerais da empresa.",
  TEAM_SETTINGS_VIEW: "Permite visualizar e gerenciar os membros da equipe.",
  COMPANY_SETTINGS_UPDATE: "Permite salvar alterações nas configurações da empresa.",
  INTEGRATIONS_MANAGE: "Permite ativar, desativar e configurar integrações externas.",
};

/**
 * Presets de Permissões para seleção rápida na UI
 */
export const PERMISSION_PRESETS = {
  COZINHA: [
    PERMISSIONS.KDS_VIEW,
    PERMISSIONS.KDS_MANAGE,
    PERMISSIONS.STOCK_VIEW,
  ],
  ATENDIMENTO: [
    PERMISSIONS.SALE_CREATE,
    PERMISSIONS.SALE_VIEW,
    PERMISSIONS.KDS_VIEW,
  ],
  GERENCIA: Object.values(PERMISSIONS),
};

/**
 * Função utilitária pura (sem I/O, sem DB) para verificar capabilities.
 * Pode ser usada tanto em Server Components quanto em Client Components.
 *
 * Regras:
 * - OWNER tem bypass total (retorna true independente da permissão)
 * - Para demais roles, verifica se a permissão existe no array de userPermissions
 *
 * @param userPermissions - Array de permissões do UserCompany
 * @param userRole - Role do usuário na empresa
 * @param requiredCapability - A permissão que se deseja verificar
 */
export function hasCapability(
  userPermissions: string[],
  userRole: UserRole,
  requiredCapability: string,
): boolean {
  if (userRole === UserRole.OWNER) return true;
  return userPermissions.includes(requiredCapability);
}
