# Hooks de Feature — Vendas

Esta pasta destina-se a abrigar hooks customizados do React que encapsulam o estado e a lógica de negócio específicos da funcionalidade de Vendas.

## Padrões recomendados:
- **Redução de God Components**: Componentes grandes com muito estado local e chamadas de API/Server Actions devem ser divididos, extraindo a lógica para hooks nesta pasta.
- **Acoplamento**: Hooks de feature devem conter lógica específica para esta feature. Se for lógica reutilizável globalmente, coloque em `app/_hooks/`.
