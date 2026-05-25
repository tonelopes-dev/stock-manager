---
name: create-server-action
description: Creates a new Server Action, its Zod schema, and basic structure following Stock-Manager conventions.
parameters:
  - name: featureName
    type: string
    description: The name of the feature (e.g., "product", "user") where the action will be created.
  - name: actionName
    type: string
    description: The name of the action (e.g., "create", "update", "delete").
  - name: inputFields
    type: string
    description: A comma-separated list of input fields for the Zod schema (e.g., "id:z.string(), name:z.string().min(3)").
  - name: capability
    type: string
    description: (Optional) The RBAC capability required for this action (e.g., "product:create").
tools:
  - default_api.create_file
  - default_api.read_file
  - default_api.insert_edit_into_file
---

# Create Server Action Skill

## Role
You are an expert in generating new Server Actions for the Stock-Manager project, ensuring adherence to the defined architecture, security, and typing standards.

## Context
This skill automates the creation of a new Server Action, its corresponding Zod schema, and integrates it with the `actionClient` wrapper. It ensures multi-tenancy (`companyId`) and RBAC (`assertCapability`) are considered.

## Steps
1.  **Determine File Paths**: Calculate the absolute file paths for the schema and action based on `featureName` and `actionName`.
    *   Schema Path: `c:\Projetos\stock-manager\app\_actions\{{featureName}}\schema.ts`
    *   Action Path: `c:\Projetos\stock-manager\app\_actions\{{featureName}}\{{actionType}}.ts` (where `actionType` is `mutations` for create/update/delete or `queries` for fetch actions)
2.  **Create/Update Zod Schema File**: 
    *   Read the existing schema file if it exists. If not, create a new one.
    *   Add or append a new Zod object schema named `{{actionName}}InputSchema` based on `inputFields`.
    *   Ensure `import { z } from "zod"` is present.
3.  **Create/Update Server Action File**: 
    *   Read the existing action file (mutations or queries) if it exists. If not, create a new one.
    *   Add the new action function `{{actionName}}Action` using `actionClient.schema(...).action(...)`.
    *   Include imports for `actionClient`, `getCurrentCompanyId`, `assertCapability` (if `capability` is provided), and the newly created schema.
    *   Add boilerplate logic including `companyId` extraction and `assertCapability` call (if `capability` is provided).
    *   Add a `TODO` comment for the actual business logic.

## Example Usage

To create a server action to create a product:
`@create-server-action featureName=product actionName=create inputFields="name:z.string(), price:z.number()" capability="product:create"`

To create a server action to get a product by ID:
`@create-server-action featureName=product actionName=getById inputFields="id:z.string().uuid()" actionType=queries`
