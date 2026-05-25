# Como Usar os Agentes Personalizados do Stock-Manager

Este guia explica como interagir com os agentes de IA personalizados do projeto Stock-Manager para otimizar suas tarefas de desenvolvimento.

## Visão Geral dos Agentes

Você tem quatro agentes especializados para diferentes tipos de tarefas:

1.  **Clean Project Agent**: Para refatoração, limpeza de código, organização de imports e correção de erros de tipo.
2.  **Design System Agent**: Para construção de componentes UI, garantia de consistência de design, criação de componentes shadcn/ui, estilos TailwindCSS e testes de componentes.
3.  **Data Access Agent**: Para criação e modificação de camadas de dados, Server Actions, schemas Prisma, migrações de banco de dados e enforcement de multi-tenancy e RBAC.
4.  **Documentation Agent**: Para criação de documentação de projeto, guias, explicações de arquitetura e atualização de READMEs.

## Como Invocar um Agente

Para usar um agente, você deve invocá-lo explicitamente em sua conversa usando a sintaxe `@` seguida do nome do agente (sem espaços).

**Exemplo:**
`@Clean Project Agent refatore este arquivo para remover código morto.`

Ao invocar um agente, seja o mais claro e detalhado possível sobre a tarefa que você quer que ele execute.

## Detalhes e Melhores Práticas para Cada Agente

### 1. Clean Project Agent

*   **Propósito**: Garantir a qualidade, legibilidade e manutenibilidade do código.
*   **Quando usar**:
    *   Quando precisar remover código não utilizado (funções, variáveis, arquivos).
    *   Para corrigir erros de tipagem TypeScript ou problemas de lint.
    *   Para organizar e otimizar imports.
    *   Ao simplificar a lógica de uma função ou componente.
    *   Para aplicar padrões de código específicos do Stock-Manager (ex: safe-action, DTOs).
*   **Melhores Práticas**:
    *   Especifique o arquivo ou a área do código a ser limpa.
    *   Descreva o tipo de "limpeza" desejado (ex: "remova todos os `any` types", "organize os imports deste arquivo").

### 2. Design System Agent

*   **Propósito**: Construir componentes UI consistentes, acessíveis e bem estilizados, além de garantir sua qualidade através de testes.
*   **Quando usar**:
    *   Ao criar um novo componente React (seja shadcn/ui ou customizado).
    *   Para estilizar componentes usando TailwindCSS.
    *   Quando precisar garantir a acessibilidade (WCAG) de um componente.
    *   Para escrever testes de unidade ou snapshot para um componente.
    *   Para documentar o uso e as propriedades de um componente.
*   **Melhores Práticas**:
    *   Forneça os requisitos exatos do componente (props, funcionalidades, interações).
    *   Mencione se o componente deve ser baseado em shadcn/ui ou customizado.
    *   Indique a localização esperada do novo componente e seus testes.

### 3. Data Access Agent

*   **Propósito**: Garantir que a camada de dados seja robusta, segura, escalável e siga os padrões de multi-tenancy e RBAC do projeto.
*   **Quando usar**:
    *   Ao criar um novo Server Action para operações de negócio.
    *   Para criar ou modificar funções de acesso a dados (Data Access Layer).
    *   Quando precisar fazer mudanças no schema Prisma (`schema.prisma`).
    *   Para gerar e aplicar migrações de banco de dados.
    *   Ao implementar ou revisar verificações de RBAC (`assertCapability()`).
    *   Para otimizar queries do Prisma e evitar problemas N+1.
*   **Melhores Práticas**:
    *   Descreva claramente a operação de negócio que o Server Action deve realizar.
    *   Especifique quais dados precisam ser retornados e em que formato (DTO).
    *   Mencione se há verificações de permissão necessárias.
    *   Forneça exemplos de entrada esperada (que serão validados com Zod).

### 4. Documentation Agent

*   **Propósito**: Criar e manter documentação clara e abrangente para o projeto.
*   **Quando usar**:
    *   Ao escrever guias de arquitetura ou de recursos.
    *   Para explicar como uma funcionalidade específica funciona (fluxos de usuário, pontos de integração).
    *   Para documentar Server Actions, seus parâmetros e tratamento de erros.
    *   Ao criar ou atualizar guias de configuração e deploy.
    *   Para escrever artigos sobre melhores práticas de código no projeto.
*   **Melhores Práticas**:
    *   Especifique o tópico da documentação e o nível de detalhe esperado.
    *   Mencione a audiência-alvo (desenvolvedores, usuários finais).
    *   Indique se você tem alguma estrutura ou template em mente.
    *   Aponte para arquivos de código ou documentação existente que possam servir como referência.

## Dicas Gerais para Otimizar o Uso dos Agentes

*   **Seja Específico**: Quanto mais detalhes você fornecer, melhor o agente poderá executar a tarefa.
*   **Contexto**: Se a tarefa for complexa ou envolver arquivos múltiplos, mencione os arquivos relevantes ou o contexto geral do projeto.
*   **Iteração**: Se o resultado inicial não for perfeito, não hesite em fornecer feedback e pedir refinamentos. Os agentes aprendem com suas interações.
*   **Propósito Único**: Tente dar a cada agente uma tarefa que se alinha perfeitamente com sua especialidade. Se uma tarefa abrange múltiplas áreas (ex: criar componente e documentá-lo), você pode usar um agente para cada parte ou pedir para o agente principal coordenar.

Aproveite ao máximo seus agentes personalizados para acelerar o desenvolvimento e manter a qualidade do seu projeto Stock-Manager!
