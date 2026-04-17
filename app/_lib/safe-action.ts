import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  // This handles the error message sent to the client
  handleServerError(e) {
    if (e instanceof Error) {
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