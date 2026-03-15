# Project Instructions

## Mock Data Rules

This project is a long-term prototype system and is not expected to connect to real backend APIs.

When implementing or updating pages in this repository, follow these rules:

1. Do not introduce real API integrations, request URLs, or backend environment assumptions.
2. Do not place large mock datasets directly inside page components.
3. Keep mock data separate from UI components under feature-local `mocks/` folders whenever possible.
4. Keep prototype interaction logic separate from raw mock data.
5. Prefer stable, reusable mock service functions for page actions such as query, approve, export, upload, and update.
6. Use local state or `localStorage` only when the prototype needs persistent interactive behavior.
7. Do not silently change existing mock business semantics without matching the menu/module context provided by the user.
8. For unimplemented menu pages, prefer explicit placeholder pages over ad hoc fake content.

## Menu Rules

1. Menu must remain the single navigation source for each `role + system`.
2. Menu files must stay under `src/menu/pc/<role>/<system>.ts`.
3. Menu nodes may only contain navigation fields:
   - `id`
   - `label`
   - `kind`
   - `children`
   - `entity`
4. Do not place page components, route functions, request logic, permission logic, or form logic inside menu files.
5. Menu ids must use `kebab-case`.
6. Within the same `role + system` menu tree, every `id` must be unique.
7. Page lookup keys must remain `role.system.moduleId`.
8. Detail pages, edit pages, create pages, approval detail pages, and intermediate redirect pages must not be added to menu trees.
9. If a menu node is added before its page is built, keep the menu and use a placeholder page.
10. Do not create a second full menu source in page files, JSON copies, or separate shortcut trees.

## Preferred Mock Structure

For a new feature page, prefer this shape:

- `src/features/<domain>/<role>/pages/...`
- `src/features/<domain>/<role>/mocks/<page>.mock.ts`
- `src/features/<domain>/<role>/services/<page>.mock-service.ts`

## Page Implementation Boundary

- Menu files must stay navigation-only.
- Page registration must stay in `src/registry/pageRegistry.tsx`.
- Mock data should support prototype interaction, but should not pretend to be real backend contracts unless explicitly requested.
- Default route behavior for `/:role/:system` must come from the first leaf node in that menu tree.

## Default List Page Pattern

Unless the user explicitly asks for a special layout, all subsequent list pages should follow the current list-page pattern established in the admin order E-distributor list:

1. Keep the page focused on the business list itself, without redundant hero descriptions or summary statistic cards.
2. Use a filter card above the table.
3. Use a plain table card without a left-side title label.
4. Put current page actions in a compact toolbar aligned to the right above the table.
5. Only expose actions that are truly needed on the current page now; do not pre-add future actions just as placeholders.
6. Prefer text buttons for page-level actions unless the user explicitly asks for icons.
7. Use right-fixed operation columns when the table is horizontally scrollable, and proactively manage widths and overflow so the fixed column remains readable.
8. If a specific list page needs a different structure or extra modules, follow the user's page-specific instructions for that page only.
