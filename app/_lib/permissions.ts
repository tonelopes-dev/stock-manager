
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
