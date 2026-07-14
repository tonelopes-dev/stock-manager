# Análise: Produto sem Categoria e sem Ambiente no Cardápio Digital e KDS

Baseado na arquitetura atual do sistema (banco de dados, listagens do KDS e motores de status), segue a análise do que acontece quando você cadastra um produto sem `categoryId` e sem `environmentId`, mas o deixa ativo para o cardápio digital:

### 1. O que acontece na criação e exibição no Menu?
O esquema do banco de dados (`schema.prisma`) permite que `categoryId` e `environmentId` sejam nulos. Portanto, o produto será criado com sucesso. Ao ativar a opção `isVisibleOnMenu`, ele aparecerá no cardápio digital. Dependendo de como a UI do menu agrupa produtos sem categoria, ele pode aparecer solto no final da lista ou sob um cabeçalho padrão.

### 2. Em qual ambiente ele vai aparecer no KDS?
- **Fallback de Nome:** Ao puxar os dados do banco (`get-kds-orders.ts`), o sistema detecta que o produto não tem um ambiente atrelado. Como regra de fallback codificada no sistema, ele automaticamente atribui o nome **"Cozinha"** para esse item.
- **Visibilidade nas Abas (Tabs):** O item **só aparecerá na aba principal "EXPEDIÇÃO" (all)**. Como não existe um ambiente real cadastrado no banco chamado "Cozinha" vinculado a esse item (o ID é `null`), nenhuma aba específica (como "Cozinha Fria", "Churrasqueira", etc.) vai exibir esse produto. Se um funcionário estiver olhando apenas a aba de uma praça específica, ele **não verá** esse item do pedido.

### 3. Como funciona o status do pedido e como mudá-lo?
- O ciclo de vida do pedido (Pendente → Preparando → Pronto → Entregue) funcionará perfeitamente.
- Para mudar o status desse item ou do pedido que o contém, o usuário do KDS precisará obrigatoriamente estar na aba de **"EXPEDIÇÃO"**. Nela, ele poderá clicar nos botões normais das colunas (Iniciar, Pronto, Entregar) ou abrir os detalhes da comanda para mudar o status de itens individuais.
- O motor de status do KDS (`kds-engine.ts`) vai contabilizar o status desse produto normalmente para calcular se a comanda inteira já pode ser considerada "Pronta".

### 4. Qual o nome do "status por praça" que vai aparecer nele?
No rodapé do card da comanda no KDS (onde aparece o resumo de itens prontos por praça), a praça desse produto aparecerá com o nome exato de **"Cozinha"**. O sistema agrupará todos os produtos sem ambiente declarado sob esse mesmo rótulo para fazer a contagem de itens pendentes/prontos.

---
**Resumo de Risco Operacional:** 
Se o seu restaurante usa telas separadas por praça (ex: uma tela na Cozinha Quente e outra no Bar), os funcionários **podem deixar de fazer esse produto**, pois ele não vai aparecer na tela da praça deles. Apenas o "Expedidor" que visualiza a tela completa ("Expedição") conseguirá ver e dar andamento nesse item.
