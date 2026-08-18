# Apresentação Comercial — Kipo

> **Plataforma de Gestão Inteligente para Restaurantes**

---

## Slide 1 — Capa

# KIPO

### O Cérebro Digital do Seu Restaurante.

**Reduza a operação manual. Veja cada centavo. Cresça com dados.**

*Sistema completo de gestão: do pedido na mesa ao lucro no bolso — em tempo real.*

---

## Slide 2 — Abertura / A Dor do Setor

### O que está custando caro ao seu restaurante — e você nem percebe.

Restaurantes que faturam entre **R$ 30 mil e R$ 150 mil por mês** compartilham 3 dores invisíveis:

| A Dor | O Custo Oculto |
|---|---|
| **💸 Taxas de maquininha escondidas** | Cada venda no cartão paga de 2% a 4,5% de taxa para adquirentes — sem transparência sobre o quanto você realmente perde. |
| **📊 CMV desconhecido** | Sem rastrear o custo real de cada prato (ingredientes + custo operacional), você define preços no achismo e perde margem todo mês. |
| **🐢 Cozinha lenta, cliente irritado** | O pedido sai do salão em papel ou no grito. Atrasos na cozinha geram reclamações, perda de mesas e avaliações negativas. |

> *Se o seu restaurante fatura R$ 100 mil/mês e sua margem real é 10% menor do que você pensa, são R$ 10.000,00 evaporando todo mês.*

---

## Slide 3 — Quem Somos

### Kipo não é um sistema de prateleira. É seu parceiro tecnológico.

Somos uma empresa de tecnologia especializada em restaurantes. Não revendemos software genérico — **construímos cada módulo sob medida** para a realidade do food service brasileiro.

**Nosso diferencial competitivo:**

- 🧠 **Engenharia dedicada** — Seu restaurante tem acesso direto ao time de engenharia. Não há fila de atendimento nível 1, 2, 3. Você fala com quem constrói o sistema.
- ⚡ **Arquitetura Serverless** — Infraestrutura na Vercel + Supabase + PostgreSQL. Zero servidores físicos, custo operacional reduzido, escala automática.
- 🔐 **Segurança nativa** — Criptografia AES-256-GCM para dados sensíveis, validação HMAC-SHA256 em webhooks, auditoria completa de cada ação no sistema.
- 🇧🇷 **Feito para o Brasil** — Toda interface, mensagens e relatórios em português. Integração com PIX, Mercado Pago e padrões brasileiros de operação.

> *Pense na Kipo como o **cérebro da sua operação**: um sistema que conecta salão, cozinha, financeiro e CRM em uma plataforma única.*

---

## Slide 4 — O Problema na Prática

### Um dia típico sem controle de verdade:

#### 🪑 No Salão
- Garçom anota pedido no papel e leva até a cozinha manualmente.
- Sem rastreamento da comanda: "quem pediu o quê?" vira uma adivinhação na hora de fechar a conta.
- Cliente quer dividir a conta em PIX + cartão? Operação manual demorada.

#### 🍳 Na Cozinha
- Pedidos chegam fora de ordem, sem prioridade visual.
- Não há como saber quais pratos estão pendentes, em preparo ou prontos.
- O gerente precisa ir fisicamente até a cozinha para verificar o status.

#### 💰 No Financeiro
- Ao final do mês: "faturei R$ 80 mil, mas quanto sobrou de lucro?" — sem resposta confiável.
- O custo de cada prato nunca é calculado com precisão (ignora custo operacional: gás, embalagem, desperdício).
- Relatórios manuais em planilha, sujeitos a erros e desatualizados.
- Estorno de pagamento? Descoberto dias depois por acaso no extrato bancário.

---

## Slide 5 — A Solução Kipo

### Uma plataforma que resolve da ponta ao fim.

```
┌────────────────────────────────────────────────────────────────┐
│  CLIENTE                                                       │
│  Acessa o Cardápio Digital, faz o pedido, paga online via PIX  │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  SALÃO (PDV)                                                   │
│  Garçom abre comanda digital, associa mesa e cliente           │
│  Pedido enviado com 1 clique → dispara para a Cozinha          │
└──────────────────────────┬─────────────────────────────────────┘
                           │ Supabase Broadcast (Real-time)
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  COZINHA (KDS)                                                 │
│  Tela em tempo real: PENDENTE → EM PREPARO → PRONTO            │
│  Alerta sonoro automático a cada novo pedido                   │
│  Atualização instantânea em todos os dispositivos              │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  FINANCEIRO (Dashboard)                                        │
│  Receita, CMV, Lucro e Margem calculados automaticamente       │
│  Ranking de lucratividade por produto • Contas a Receber       │
│  Relatórios exportáveis em Excel                               │
└────────────────────────────────────────────────────────────────┘
```

**Como funciona na prática:**
1. O pedido é criado no PDV ou pelo cliente no Cardápio Digital.
2. Em **menos de 1 segundo**, o KDS da cozinha recebe o pedido via WebSocket (Supabase Broadcast).
3. Conforme a cozinha atualiza o status (`PENDING` → `PREPARING` → `READY` → `DELIVERED`), o cliente e o salão veem a atualização em tempo real.
4. Ao fechar a conta, o sistema calcula automaticamente o custo de cada item vendido (snapshot de `baseCost` + `operationalCost`), gera a venda com rastreio de margem e atualiza o estoque.

---

## Slide 6 — Os 3 Pilares de Valor

### Pilar 1: Redução de Custos — Checkout Transparente

**O problema das maquininhas:**
Cada venda no cartão cobra de 2% a 4,5% de taxa. Em R$ 100 mil/mês, você perde de **R$ 2.000 a R$ 4.500** — sem transparência sobre o destino dessa taxa.

**A solução Kipo:**
Nosso motor de pagamentos integrado ao **Mercado Pago** via Checkout Transparente (PIX Dinâmico + Bricks) opera com taxas a partir de **1,5% configurável** (`kipoMarketplaceFeeRate`). Você vê exatamente quanto pagou:

| Campo no Sistema | O que Significa para Você |
|---|---|
| `platformFeeRate` | A taxa exata acordada (ex: 1,5%) — sem surpresas |
| `platformFeeAmount` | O valor em reais da taxa naquela venda |
| `netAmount` | O valor líquido que efetivamente entrou no seu caixa |
| `externalPaymentId` | Rastreio de cada transação — prova bancária automática |

**E se o cliente pedir estorno?**
Nosso webhook de pagamentos detecta automaticamente status `charged_back`, `refunded` e `cancelled`. A venda é cancelada no sistema, a taxa de plataforma é zerada e o evento é registrado na trilha de auditoria — tudo sem intervenção humana.

> *Economia estimada: de R$ 500 a R$ 3.000/mês comparado com maquininhas tradicionais.*

---

### Pilar 2: Otimização — KDS em Tempo Real

**O diferencial técnico:**
Enquanto outros sistemas usam polling (consultam o servidor a cada 5-10 segundos), o KDS da Kipo usa **Supabase Broadcast (WebSocket)**, garantindo:

- ⚡ **Latência < 1 segundo** — O pedido aparece na tela da cozinha instantaneamente.
- 🔔 **Alerta sonoro automático** — Notificação audível (Web Audio API, 880Hz) a cada novo pedido. Ninguém perde um ticket.
- 📱 **Multi-dispositivo** — Qualquer tablet ou TV pode ser um KDS. Sem hardware proprietário.
- 🔄 **Atualização otimista** — O status muda imediatamente para quem clicou, sem aguardar a resposta do servidor.

**Fluxo visual do KDS:**

| Coluna | Status | Ação |
|---|---|---|
| 🟡 Pendente | `PENDING` | Pedido acabou de chegar — precisa ser iniciado |
| 🔵 Preparando | `PREPARING` | Em preparo pela cozinha |
| 🟢 Pronto | `READY` | Pronto para ser servido / retirado |
| ✅ Entregue | `DELIVERED` | Concluído e entregue ao cliente |

> *Resultado: menos erros, menos atraso, mais mesas giradas por turno.*

---

### Pilar 3: Segurança e Personalização — RBAC Granular

**Controle total sobre quem faz o quê no sistema:**

Nosso sistema de permissões implementa **RBAC (Role-Based Access Control)** com 3 níveis hierárquicos e **22 permissões granulares**:

| Papel | Nível de Acesso |
|---|---|
| `OWNER` | Acesso total — bypass automático em todas as verificações |
| `ADMIN` | Acesso amplo — configurável por permissão individual |
| `MEMBER` | Acesso restrito — ideal para garçons e cozinheiros |

**Presets prontos para o dia a dia:**

| Preset | Permissões Incluídas |
|---|---|
| 🍳 **Cozinha** | Visualizar KDS, Gerenciar KDS, Visualizar Estoque |
| 🪑 **Atendimento** | Criar Vendas, Visualizar Vendas, Visualizar KDS |
| 📊 **Gerência** | Todas as permissões do sistema |

**Proteção de dados sensíveis (LGPD):**
- Dados de clientes no CRM possuem controle de acesso via `CUSTOMER_VIEW` e `CUSTOMER_MANAGE`.
- Logs de auditoria rastreiam **quem fez o quê, quando e onde** — com trilha de auditoria completa (`AuditEvent` com severidade `INFO`, `WARNING`, `CRITICAL`).
- Tokens de integração criptografados com **AES-256-GCM** — nem o próprio time de suporte tem acesso às credenciais do seu Mercado Pago.

**Personalização sob demanda:**
Como seu suporte é direto com a engenharia, qualquer necessidade específica do seu restaurante pode virar uma feature dedicada — sem burocracia de roadmap genérico.

---

## Slide 7 — Como Funciona (Módulos Reais)

### Tudo conectado em uma plataforma única.

| Módulo | O que faz | Funcionalidades reais |
|---|---|---|
| 🍽️ **Cardápio Digital** | Menu online personalizado com a marca do restaurante | Categorias com ícones, produtos com foto, promoções agendáveis (dia/hora), preço promocional, destaque de itens, cardápio público via `/[slug-do-restaurante]` |
| 📋 **PDV / Comandas** | Abertura e controle de comandas digitais | Comanda por mesa, associação de cliente, adição de itens com observações, desconto/acréscimo, taxa de serviço (10%) configurável, pagamento PIX/Cartão/Dinheiro, status `PENDING → PAID` |
| 🖥️ **KDS (Cozinha)** | Painel da cozinha em tempo real | Cards visuais por pedido, colunas por status, arraste entre colunas, alerta sonoro, atualização WebSocket < 1s, funciona em tablet/TV/celular |
| 📊 **Dashboard Financeiro** | Visão executiva do desempenho | KPIs (Receita, CMV, Lucro, Margem, Gorjetas), gráfico diário de vendas, ranking Top 10 lucratividade, ranking Margem Crítica, contas a receber |
| 📦 **Estoque Inteligente** | Controle de estoque com alertas | Entrada por fornecedor com custo unitário, baixa automática por venda, ajuste manual com motivo, alerta de estoque mínimo, suporte a KG/G/L/ML/UN/PCT, rastreio de validade com reminder |
| 🏭 **Ficha Técnica** | Composição de produtos com custo recursivo | Composição recursiva (produto composto por outros produtos/insumos), cálculo automático de custo por unidade produzida, ordem de produção com rastreamento |
| 👥 **CRM de Clientes** | Gestão do relacionamento com clientes | Cadastro com origem (Manual, iFood, WhatsApp, Cardápio), categorias por tags coloridas, funil Kanban customizável (CRMStage), checklist de atendimento com templates, histórico de pedidos por cliente, lembrete de aniversário |
| 📈 **Metas** | Gestão de objetivos de venda | Metas globais ou por produto, períodos diário/semanal/mensal/customizado, acompanhamento visual no dashboard |
| 🤝 **Fornecedores** | Gestão de fornecedores e compras | Cadastro com CNPJ/CPF, vinculação produto-fornecedor com último custo, entrada de estoque rastreável por NF e lote |
| 🔐 **Auditoria** | Trilha de auditoria completa | 25+ tipos de eventos rastreados, filtro por ator/tipo/data, paginação cursor-based, severidade (Info/Warning/Critical) |
| 📤 **Relatórios** | Exportação de dados gerenciais | Relatório de vendas exportável em Excel (.xlsx), comparativo mensal, relatório de gorjetas |
| 🔔 **Notificações** | Alertas automáticos do sistema | Push Notifications (Web Push API), alertas de estoque baixo, alertas de validade próxima |

---

## Slide 8 — Resultados Esperados

### Antes vs. Depois da Kipo

| Indicador | ❌ Antes da Kipo | ✅ Com a Kipo |
|---|---|---|
| **Taxa de pagamento** | 2% a 4,5% (maquininha) sem transparência | A partir de 1,5% com rastreio total por transação |
| **Tempo do pedido para a cozinha** | 2-5 min (papel/grito) | < 1 segundo (WebSocket em tempo real) |
| **Conhecimento do CMV** | Estimativa genérica ("acho que gasto uns 35%") | Cálculo exato por prato: `baseCost + operationalCost` por item vendido |
| **Controle de estorno** | Descoberto dias depois no extrato | Webhook detecta automaticamente e cancela a venda + zera taxa |
| **Gestão de equipe** | "Todo mundo tem acesso a tudo" | 22 permissões granulares, presets por função, auditoria completa |
| **Dados do cliente** | Caderninho ou nada | CRM com funil Kanban, histórico de compras, tags e checklist |
| **Relatórios** | Planilha manual no fim do mês | Dashboard automático com KPIs em tempo real + export Excel |
| **Controle de metas** | "Vamos ver se vendemos mais esse mês" | Metas por produto/período com progresso visual no dashboard |
| **Segurança de dados** | Credenciais em texto plano | Criptografia AES-256-GCM, validação HMAC, auditoria com severidade |

---

## Slide 9 — Prova Social

### O que dizem nossos clientes

> *[Espaço reservado para depoimentos]*
>
> Em breve: depoimentos reais de restaurantes que operam com a Kipo.
>
> **Próximo passo**: Rota 360 — visita presencial com tour completo pelo sistema em operação real.

---

## Slide 10 — Diferencial da Concorrência

### Sistemas de Prateleira vs. Kipo

| Critério | 🏢 Sistemas Legados | ⚡ Kipo |
|---|---|---|
| **Infraestrutura** | Servidor local que trava, backup manual, depende de técnico | Serverless na nuvem (Vercel + Supabase). Zero manutenção, escala automática |
| **Atualização da cozinha** | Polling a cada 5-10s ou impressora térmica | WebSocket < 1s com broadcast Supabase |
| **Modelo de pagamento** | Maquininha genérica com taxa fixa alta | Checkout Transparente integrado com taxa configurável e auditável |
| **Segurança** | Senha genérica compartilhada | RBAC com 22 capabilities + auditoria + criptografia AES-256 |
| **Suporte** | SAC nível 1, espera de dias | Direto com a engenharia — quem resolve é quem constrói |
| **Personalização** | "O sistema é esse, se adapte" | Feature sob demanda discutida diretamente com a engenharia |
| **CRM** | Inexistente ou básico | Funil Kanban customizável com stages, categorias coloridas e checklist |
| **Controle financeiro** | "Você faturou X" | "Você faturou X, gastou Y de CMV, lucrou Z, sua margem é W%" |
| **Integração** | APIs fechadas ou inexistentes | Webhooks assinados (HMAC-SHA256), eventos idempotentes, arquitetura preparada para integrações |
| **Stack tecnológica** | PHP/Java monolito de 2015 | Next.js 16, React 19, TypeScript estrito, PostgreSQL, Prisma 5, Supabase Real-time |

---

## Slide 11 — Planos e Investimento

### Três pacotes pensados para cada fase do seu restaurante.

> **Taxa de Adesão (Obrigatória):** Inclui configuração completa do sistema, migração de dados, treinamento presencial/online da equipe e suporte de implantação durante os primeiros 30 dias.

---

#### 📦 Plano Essencial
**Para quem precisa do básico bem feito.**

| Módulo | Incluído |
|---|---|
| Cardápio Digital (público, com promoções agendáveis) | ✅ |
| PDV / Comandas digitais com pagamento integrado | ✅ |
| Dashboard Financeiro (Receita, CMV, Lucro, Margem) | ✅ |
| Gestão de Estoque com alertas de mínimo e validade | ✅ |
| Ficha Técnica com composição recursiva | ✅ |
| Relatórios exportáveis (Excel) | ✅ |
| Notificações de estoque e sistema | ✅ |

---

#### 🚀 Plano Plus
**Essencial + a velocidade da cozinha e o controle financeiro que faltavam.**

| Módulo | Incluído |
|---|---|
| Tudo do plano **Essencial** | ✅ |
| KDS em tempo real (WebSocket < 1s, alerta sonoro, multi-dispositivo) | ✅ |
| Controle financeiro avançado (ranking de lucratividade, margem crítica, contas a receber) | ✅ |
| Gestão de Metas (diária, semanal, mensal, por produto) | ✅ |
| Gestão de Fornecedores (cadastro, vinculação, entrada com NF/lote) | ✅ |
| Comparativo mensal de vendas | ✅ |
| Relatório de gorjetas | ✅ |

---

#### 👑 Plano Premium
**O pacote completo para quem quer domínio total da operação.**

| Módulo | Incluído |
|---|---|
| Tudo do plano **Plus** | ✅ |
| CRM completo com funil Kanban customizável | ✅ |
| RBAC Granular (22 permissões, presets por função, auditoria) | ✅ |
| Trilha de Auditoria completa (25+ tipos de eventos) | ✅ |
| Checkout Transparente com Take Rate configurável (PIX Dinâmico + Bricks) | ✅ |
| Proteção automática contra estorno (webhook com cancelamento automático) | ✅ |
| Push Notifications para clientes (Web Push API) | ✅ |
| Suporte prioritário direto com a engenharia | ✅ |
| Features sob demanda e personalização exclusiva | ✅ |
| *Futuras integrações: iFood, WhatsApp Business, Point (Maquininha MP)* | 🔜 |

---

> **Todos os planos incluem:** Hospedagem na nuvem, atualizações automáticas, backup contínuo, suporte via WhatsApp e criptografia AES-256-GCM para dados sensíveis.

---

## Slide 12 — Próximos Passos

### Como começar com a Kipo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Passo 1   │     │   Passo 2   │     │   Passo 3   │     │   Passo 4   │
│             │────▶│             │────▶│             │────▶│             │
│  Agende uma │     │ Tour 360°   │     │ Implantação │     │ Operação    │
│ Demonstração│     │ no seu      │     │ + Treina-   │     │ Assistida   │
│  Gratuita   │     │ restaurante │     │ mento       │     │ (30 dias)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**📅 Agende agora sua demonstração gratuita.**

Vamos até o seu restaurante (ou fazemos via videoconferência) para mostrar o sistema funcionando com **dados reais do seu cardápio**.

Em 30 minutos você verá:
- ✅ Seu cardápio digital publicado e funcionando.
- ✅ Um pedido passando do cliente ao KDS em < 1 segundo.
- ✅ O dashboard calculando custo, receita e margem automaticamente.
- ✅ O sistema de permissões isolando o acesso de cada função da equipe.

> **Sem compromisso. Sem contrato antes de ver valor.**

---

## Slide 13 — Encerramento

### Obrigado pela atenção.

# KIPO

**O Cérebro Digital do Seu Restaurante.**

---

📞 **Telefone / WhatsApp:** [Inserir número]

📧 **E-mail:** contato@kipo.app

🌐 **Site:** [Inserir URL]

📸 **Instagram:** [Inserir @]

---

*"Seu restaurante merece tecnologia de verdade — não um sistema que funciona mais ou menos."*

*— Equipe Kipo*
