/**
 * Sanitizes a string that is intended to be used as a UUID in a Prisma query.
 * Converts common "all" or "null-like" strings from front-end filters into `undefined`.
 * 
 * @param id The string id to sanitize
 * @returns The sanitized UUID string or undefined if invalid/special
 */
export const sanitizeUUID = (id: string | null | undefined): string | undefined => {
  if (!id) return undefined;
  
  const value = id.toLowerCase().trim();
  const invalidValues = ["all", "undefined", "null", "", "none"];
  
  if (invalidValues.includes(value)) return undefined;
  
  return id;
};

/**
 * Validates if a string is a valid UUID format (basic check)
 * Useful for extra hardening before database queries.
 */
export const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
