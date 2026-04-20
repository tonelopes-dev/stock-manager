import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // This handles the error message sent to the client
  handleServerError(e) {
    if (e instanceof Error) {
      // Prisma unique constraint error
      if (e.message.includes("Unique constraint failed") || e.message.includes("P2002")) {
        if (e.message.includes("name")) {
          // Check if it's a Supplier constraint (often mentions model name or fields)
          if (e.message.toLowerCase().includes("supplier")) {
            return "Já existe um fornecedor com este nome cadastrado.";
          }
          return "Já existe um item (produto ou insumo) com este nome nesta empresa.";
        }
        if (e.message.includes("sku")) {
          return "Já existe um item com este SKU cadastrado nesta empresa.";
        }
        return "Já existe um registro com estes dados.";
      }

      // Prisma Foreign Key constraint error (P2003)
      if (e.message.includes("Foreign key constraint failed") || e.message.includes("P2003")) {
        return "Erro de integridade: Um registro relacionado (como fornecedor ou categoria) não foi encontrado ou está associado a outros dados.";
      }

      // Prisma Record Not Found (P2025)
      if (e.message.includes("Record to update not found") || e.message.includes("P2025")) {
        return "O registro solicitado não foi encontrado para esta operação.";
      }

      // Evitar expor erros brutos de invocação do Prisma
      if (e.message.includes("Invalid `prisma") || e.message.includes("invocation")) {
        console.error("[PRISMA ERROR]", e.message);
        return "Erro interno no banco de dados. Por favor, verifique os dados informados.";
      }

      return e.message;
    }
    return "Ocorreu um erro inesperado.";
  },
})
  // Centralized Logging Middleware
  .use(async ({ next, clientInput, metadata }) => {
    const start = Date.now();
    const result = await next();
    const end = Date.now();
    const duration = end - start;

    // 1. Log Validation Errors (Zod)
    if (!result.success && result.validationErrors) {
      console.warn(
        `[VALIDATION ERROR] Action execution failed due to input validation errors.`,
        {
          duration: `${duration}ms`,
          validationErrors: result.validationErrors,
          clientInput,
          metadata,
        }
      );
    }

    // 2. Log Server Side Errors (Uncaught exceptions)
    if (!result.success && result.serverError) {
      console.error(
        `[SERVER ACTION ERROR] An unhandled exception occurred during action execution.`,
        {
          duration: `${duration}ms`,
          serverError: result.serverError,
          clientInput,
          metadata,
        }
      );
    }

    return result;
  });