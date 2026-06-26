# Categoria vs Ambiente — Kipo (Stock Manager)

> **Documentação de Orientação Operacional e Estrutural para o Rota 360 e Clientes Kipo**

---

## 🌟 Visão Geral

No ecossistema do Kipo, o cadastro de produtos divide as responsabilidades de exibição e produção em dois conceitos fundamentais:
- **Categoria**: Focada no **Cliente** (Experiência de Venda e Navegação).
- **Ambiente**: Focado na **Equipe** (Logística de Produção e KDS).

Compreender e separar esses dois conceitos é a chave para garantir um cardápio digital impecável e uma operação de cozinha ultra veloz.

---

## 📋 Categoria (O Cardápio)

A **Categoria** define como o produto é agrupado e exibido visualmente no Cardápio Digital (QR Code da mesa/delivery) e no painel do PDV dos caixas.

- **Objetivo**: Facilitar a vida do cliente final na hora de procurar o que deseja consumir ou comprar.
- **Exemplos Comuns**: `Entradas`, `Hambúrgueres`, `Bebidas`, `Sobremesas`, `Combos`, `Porções`.
- **Impacto no Sistema**: Altera as abas de navegação do cardápio e a organização visual na tela de vendas.

---

## 🍳 Ambiente (O KDS / Roteamento de Produção)

O **Ambiente** define o roteamento operacional interno do estabelecimento. Ele dita para qual monitor de produção (KDS - *Kitchen Display System*) ou impressora o pedido será enviado no exato segundo em que a comanda for confirmada ou paga.

- **Objetivo**: Organizar a fila de trabalho da equipe interna para que cada setor veja apenas o que precisa produzir.
- **Exemplos Comuns**: `Cozinha`, `Bar`, `Expedição`, `Copa`, `Parrilla`.
- **Impacto no Sistema**: Garante que o chapeiro não receba pedidos de suco e o bartender não receba pedidos de batata frita.

---

## 💡 Exemplos Práticos no Rota 360

Para ilustrar com total clareza a harmonia entre os dois campos no cadastro:

### 🍹 1. Caipirinha de Limão
- **Categoria**: `Drinks` (Para o cliente encontrar rapidamente na seção de coquetéis do cardápio digital).
- **Ambiente**: `Bar` (Para o pedido ser disparado diretamente no monitor do bartender, longe da chapa de lanches).

### 🍔 2. Hambúrguer Caseiro
- **Categoria**: `Salgados / Burgers` (Para destaque no menu principal).
- **Ambiente**: `Cozinha` (Para aparecer instantaneamente na tela do chapeiro no KDS).

### 🍰 3. Petit Gâteau
- **Categoria**: `Sobremesas` (Posicionado no fim da jornada de consumo do cliente).
- **Ambiente**: `Cozinha` ou `Copa` (Dependendo de qual setor faz a montagem do prato no restaurante).

---

## ⚠️ Regra de Ouro da Operação
> **Nunca cadastre "Cozinha" como Categoria ou "Bebidas" como Ambiente.** Lembre-se sempre: **Categoria é a Vitrine do Cliente. Ambiente é a Estação da Equipe.**
