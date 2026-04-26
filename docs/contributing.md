# Contributing

## Project overview

esseal-data-table is a zero-dependency React component library. The entire component
lives in `src/EssealDataTable.tsx`. Supporting files:

| File | Purpose |
|---|---|
| `src/types.ts` | All exported and internal TypeScript types |
| `src/utils.ts` | Pure functions: `filterRows`, `sortRows`, `groupRows`, `flattenTree` |
| `src/components/ActionCell.tsx` | Row-actions overflow menu (portal-based) |
| `src/hooks/useColumnResize.ts` | Mouse-drag column resize logic |
| `src/EssealDataTable.css` | All styles — CSS custom properties + class rules |
| `src/index.ts` | Public package entry — re-exports component and types |
| `dev/App.tsx` | Development playground (not shipped in the package) |

---

## Running the project locally

**Requirements:** Node.js 18+, npm 9+

```bash
# Clone
git clone <repo-url>
cd data-table

# Install dev dependencies (React, Vite, TypeScript, ESLint)
npm install

# Start the dev server — opens the playground at http://localhost:5173
npm run dev
```

The playground (`dev/App.tsx`) demonstrates the full feature set. Use it to manually
test changes before opening a PR.

---

## Build

```bash
# Type-check + build library output to dist/
npm run build
```

Build outputs:

| File | Format |
|---|---|
| `dist/esseal-data-table.js` | ESM |
| `dist/esseal-data-table.umd.cjs` | UMD (CommonJS-compatible) |
| `dist/esseal-data-table.css` | Extracted CSS |
| `dist/index.d.ts` | Rolled-up TypeScript declarations |

Always run `npm run build` and confirm zero errors before pushing.

---

## Linting

```bash
npm run lint
```

The project uses ESLint with `typescript-eslint`, `eslint-plugin-react-hooks`, and
`eslint-plugin-react-refresh`. The `/* eslint-disable */` comment at the top of
`EssealDataTable.tsx` suppresses some rules that conflict with the component's
intentional patterns (e.g. the empty-deps `useEffect` for mount-fire).

---

## Tests

There are currently no automated tests. Correctness is verified manually using the
playground (`npm run dev`) and by running the TypeScript compiler (`tsc`).

If you add tests in the future, place them alongside the files they test
(`src/utils.test.ts`, etc.) and add a `test` script to `package.json`.

---

## Architecture constraints

**Zero runtime dependencies.** The bundle must not import anything that isn't a peer
dependency (React). If you need a utility (debounce, deep-equal, etc.), implement it
inline with `useRef` / `setTimeout` patterns. The current debounce for server-mode
filter inputs uses a `useRef<ReturnType<typeof setTimeout>>` directly.

**Single-file component.** The component logic lives in `EssealDataTable.tsx`. Avoid
splitting it into sub-components unless they are clearly reusable across future
components (as `ActionCell` and `useColumnResize` are).

**CSS custom properties only.** All visual customisation must be achievable via CSS
variables declared on `:root`. Do not hardcode colours or spacing values in the
component inline styles — use `var(--dg-*)` references or CSS classes from
`EssealDataTable.css`.

**Virtualization accuracy.** The virtualisation loop (`startIndex`, `endIndex`,
`offsetY`) depends on every row having exactly `rowHeight` pixels. If you add
variable-height rows or load-more nodes that are taller than `rowHeight`, the scroll
position calculations will break. The `LoadMoreNode` rows deliberately use `rowHeight`
as their height to stay compatible.

---

## Adding a new feature

1. **Check existing patterns first.** The `processedRows` memo, the `rowsToRender` memo,
   and the handler pattern (`handleFilterChange`, `handleSortChange`, etc.) establish
   the architecture. New features should integrate with these rather than add parallel
   data flows.

2. **Types first.** Add new prop types to `src/types.ts`. Use discriminated unions
   (see `PaginationConfig`, `GroupingConfig`) to make mutually exclusive options
   TypeScript-safe.

3. **Export new types.** Add any new public types to the re-export block in
   `EssealDataTable.tsx` (lines 9–25) **and** to `src/index.ts`.

4. **No double-firing.** If your feature triggers an async callback (like server
   requests), handle all state mutations that should happen together inside a single
   named handler rather than chaining `useEffect`s. The `handleFilterChange` function
   is the reference implementation for this pattern.

5. **Test manually.** Open the playground, add your feature to `dev/App.tsx`, and
   verify it works across all four pagination/grouping modes.

6. **Update the changelog.** Add an entry to `docs/changelog.md` under a new `[x.y.z]`
   header following Keep a Changelog format.

7. **Update the docs.** If your feature adds new props or types, update
   `docs/api-reference.md`. If it introduces new CSS classes, update
   `docs/configuration.md`.

---

## Branch and commit conventions

| Branch prefix | Use |
|---|---|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation-only changes |
| `chore/` | Build, deps, tooling |

Commit messages should be lowercase imperative phrases:
```
add server-side grouping with lazy expand
fix double onServerRequest on filter change
update api-reference for pageSize array support
```

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Patch** (`x.y.Z`): bug fixes, documentation, internal refactors with no API change.
- **Minor** (`x.Y.0`): new features that are backwards-compatible.
- **Major** (`X.0.0`): breaking changes to existing prop names, types, or behaviour.

Before releasing a new version:
1. Update `version` in `package.json`.
2. Add a `[x.y.z]` section to `docs/changelog.md`.
3. Run `npm run build` and confirm zero errors.
4. Publish: `npm publish`.
