# Mock Data Guidelines

## Purpose

This repository uses front-end mock data as a long-term prototype mechanism, not as a temporary backend placeholder.

The goal is to keep prototype pages:

- easy to extend
- visually realistic
- behaviorally consistent
- safe from ad hoc data sprawl

## Core Rules

1. No real API wiring by default

- Do not add real endpoints.
- Do not add backend host assumptions.
- Do not create fake REST layers unless the user explicitly asks for backend-shaped mocks.

2. Separate mock data from pages

- Do not leave large arrays, detail objects, or workflow fixtures directly in page `.tsx` files.
- Small display-only constants are acceptable only when they are truly local and tiny.

3. Use feature-local mock files

Recommended structure:

```text
src/features/<domain>/<role>/
  pages/
  mocks/
  services/
```

Example:

```text
src/features/order/admin/
  pages/AvailableDealerManagementPage.tsx
  mocks/availableDealerManagement.mock.ts
  services/availableDealerManagement.mock-service.ts
```

4. Use mock services for interaction

If a page includes any of the following, prefer a mock service function:

- query
- filter
- approval
- export
- upload
- status update
- create/edit flow

Examples:

```ts
getAvailableDealers(filters)
approveDistributor(id)
createExportTask(payload)
uploadOffTake(file)
```

5. Keep mock behavior stateful when needed

For prototype credibility, these interactions should be able to change state:

- approval status changes
- export task status changes
- list filters affect results
- create/edit actions update visible data

Use one of these:

- page-local reducer/state
- feature mock service with in-memory state
- `localStorage` for persistence across refresh

6. Use localStorage selectively

Allowed uses:

- login state
- theme mode
- export task history
- simple draft or configuration persistence
- persistent prototype workflow states

Do not store everything in `localStorage` by default.

7. Placeholder page policy

If a menu exists but the page is not yet implemented:

- keep the menu visible
- use a clear placeholder page
- include page purpose and next-step description

Do not:

- hide the menu
- leave the route blank
- return an accidental 404

## Recommended Implementation Pattern

For each new business page:

1. Add or confirm menu node
2. Create page component
3. Create feature-local mock data file
4. Create feature-local mock service if the page has interactions
5. Register page in `src/registry/pageRegistry.tsx`
6. Keep page component focused on composition and interaction only

## Default List Page Design Rule

Unless a page has user-specified exceptions, list pages in this repository should reuse the same baseline structure as the current admin order E-distributor list page:

1. No extra hero banner or summary cards by default.
2. A filter section sits above the table.
3. The table container itself should not rely on a left-side title label.
4. Page-level actions live in a compact toolbar aligned to the top-right of the table area.
5. Only keep actions that are currently valid for the page; do not add future features as visible placeholder buttons.
6. Default to text-style page actions without icons unless the user explicitly wants icons.
7. When the table is wide, keep the operation column fixed on the right and tune widths/ellipsis to avoid broken layout.
8. If the user later gives a page-specific visual adjustment, that page may diverge from the baseline.

## Things To Avoid

- giant mock arrays inside JSX files
- mixing filters, fake business rules, and table markup in one file
- changing existing menu semantics just to match a quick mock
- inventing backend response contracts unless explicitly needed

## Default Principle

This project should behave like a believable front-end prototype system:

- menu is real
- page behavior is believable
- data is mock
- structure stays maintainable

## Menu Constraints

Menu work in this repository must also follow these constraints:

1. Menu is the only navigation source for a given `role + system`.
2. Menus are maintained by role and system only:

```text
src/menu/pc/
  admin/
  dealer/
  distributor/
```

3. Menu nodes are navigation-only and must not contain:

- component references
- route handler functions
- request URLs
- permissions
- hidden/detail/routeOnly style flags
- dialog or page behavior logic

4. Allowed menu node fields:

```ts
type MenuNode = {
  id: string;
  label: string;
  kind: "group" | "records" | "approval" | "dashboard" | "schema";
  children?: MenuNode[];
  entity?: string;
};
```

5. `id` rules:

- use `kebab-case`
- keep ids unique within the same `role + system`
- do not casually rename ids once a page is registered

6. Registry rules:

- pages must not be imported in menu files
- pages are linked through `src/registry/pageRegistry.tsx`
- the registry key format is always `role.system.moduleId`

7. Routing rules:

- use `/:role/:system` and `/:role/:system/:moduleId`
- entering `/:role/:system` must redirect to the first leaf node from that menu tree
- detail and edit routes may exist, but must not be added to the menu tree
