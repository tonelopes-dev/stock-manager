import { test, expect } from "@playwright/test";
import { fakerPT_BR as faker } from "@faker-js/faker";

// Deliberate error removed: const syntax_error = ;

test.describe("Stale Code Audit", () => {
  test("should fail with syntax error", async ({ page }) => {
     console.log("THIS SHOULD NEVER RUN");
  });
});
