# Guia de Tipos de Produtos 🏷️

Ao cadastrar um novo produto no Stock Manager, a escolha do **Tipo de Produto** é fundamental para que o sistema gerencie corretamente o estoque, os custos e a visibilidade no cardápio.

Abaixo, explicamos detalhadamente as 4 opções disponíveis:

---

## 1. Revenda 🥤
Produtos que você compra prontos de um fornecedor e vende exatamente como vieram, sem transformações.

- **Comportamento do Estoque:** O estoque é controlado diretamente para o produto. Se você tem 10 unidades e vende 1, sobrará 9.
- **Exemplo Prático:** Uma lata de Coca-Cola, um saco de batata palha fechado, ou uma garrafa de água. 
- **Quando usar:** Sempre que o produto não depender de outros ingredientes para existir no seu estoque.

## 2. Produção Própria 👨‍🍳
Produtos fabricados ou preparados por você dentro do seu estabelecimento. Este é o tipo mais versátil do sistema.

- **Comportamento do Estoque:** Pode ser gerido de duas formas:
    - **Feito na Hora (MTO):** O produto não tem estoque físico "próprio". O sistema desconta automaticamente os ingredientes da Ficha Técnica no momento da venda. (Ex: Um café expresso ou um lanche montado na hora).
    - **Produção em Lote:** Você produz uma quantidade (ex: 50 pães) e registra a entrada no estoque. A venda desconta desse saldo físico.
- **Exemplo Prático:** Um sanduíche artesanal, um suco natural, ou um bolo caseiro.
- **Quando usar:** Quando o produto é transformado por você e possui uma Ficha Técnica (composição).

## 3. Combo 🍱
Um agrupamento de vários produtos que já existem no seu catálogo, vendidos como uma única oferta.

- **Comportamento do Estoque:** O combo nunca possui estoque próprio. A disponibilidade dele é baseada na disponibilidade individual de cada item que o compõe.
- **Exemplo Prático:** "Combo Família" (1 Pizza Grande + 1 Refrigerante 2L + 1 Borda Recheada).
- **Quando usar:** Para estratégias de marketing, promoções de "pague menos e leve mais" ou kits festas.

## 4. Insumo 📦
Itens que você não vende diretamente para o cliente final, mas utiliza para produzir outros produtos.

- **Comportamento do Estoque:** O estoque é controlado rigorosamente para garantir que a produção nunca pare. Ele é "consumido" automaticamente pelos produtos de *Produção Própria* ou *Combos*.
- **Exemplo Prático:** Farinha de trigo, leite, grão de café, guardanapos, embalagens.
- **Quando usar:** Para tudo o que entra na sua cozinha/estoque como custo de produção e precisa ser monitorado, mas nunca aparece sozinho no cardápio comercial.

---

> [!TIP]
> **Dica de Ouro: Inventário Híbrido**
> Se você marcar um produto como **Produção Própria** e ativar a flag **"Feito na Hora"**, o sistema ignorará o estoque manual e focará 100% na Ficha Técnica. Isso evita que você precise "ajustar estoque" de algo que é produzido sob demanda!
