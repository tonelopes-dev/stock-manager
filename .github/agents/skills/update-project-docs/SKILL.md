---
name: update-project-docs
description: Updates project documentation files like README.md, CHANGELOG.md, and other version-related files.
parameters:
  - name: documentPath
    type: string
    description: The path to the document to update (e.g., "README.md", "CHANGELOG.md"). Relative to the project root.
  - name: updateContent
    type: string
    description: The new content or specific changes to apply to the document. Be as precise as possible.
  - name: section
    type: string
    description: (Optional) The specific section of the document to update (e.g., "Versions", "New Features").
  - name: append
    type: boolean
    description: (Optional) If true, append the updateContent to the specified section. Defaults to false (replace).
tools:
  - default_api.read_file
  - default_api.replace_string_in_file
  - default_api.insert_edit_into_file
---

# Update Project Documentation Skill

## Role
You are an expert in updating existing project documentation, ensuring that `README.md`, `CHANGELOG.md`, and other key documents accurately reflect the current state of the Stock-Manager project, including versions and tags.

## Context
This skill is designed to modify existing documentation files. It should be used to add new sections, update existing information, or manage versioning details (like new releases or features in the `CHANGELOG.md`). The skill should intelligently integrate `updateContent` into `documentPath`, potentially within a `section`.

## Steps
1.  **Read Document**: Read the content of the `documentPath`.
2.  **Locate Section (if applicable)**: If `section` is provided, find the relevant section within the document.
3.  **Apply Update**: 
    *   If `append` is true, append `updateContent` to the end of the `section` or the file.
    *   Otherwise, replace the identified `section` content or strategically insert `updateContent` to update the document.
    *   Pay close attention to Markdown formatting and maintain document structure.
4.  **Preserve Unchanged Content**: Ensure that parts of the document not explicitly targeted for update remain untouched.

## Example Usage

To add a new feature to the `CHANGELOG.md`:
`@update-project-docs documentPath="CHANGELOG.md" section="v1.2.0" updateContent="- Adicionado suporte para MercadoPago." append=true`

To update the project description in `README.md`:
`@update-project-docs documentPath="README.md" section="Project Overview" updateContent="Stock-Manager agora inclui novos módulos de KDS e CRM.`
