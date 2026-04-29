# Changelog

All notable changes to `esseal-data-table` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.5.1] — 2026-04-28

### Fixed
- Group labels now render in title case with spaces: `in_progress` → `In Progress`,
  `on-leave` → `On Leave`. Underscores and hyphens are treated as word separators.
- Rows with a `null`, `undefined`, or empty value for the group field are collected into
  an `Ungrouped` group, always placed at the end of the group list.

---

## [2.5.0] — 2026-04-28

### Added
- **Row expansion.** New `expandable` prop accepts `{ render: (row: T) => ReactNode }`.
  A chevron column is injected on the left; clicking it expands a full-width panel below
  the row that renders whatever the caller returns. Expanded row IDs are included in
  `TableState` (`expandedRows`) and can be seeded via `initialState`.
- **`ExpandableConfig<T>` type** exported for typed usage of the `expandable` prop.

### Changed
- Virtualization is automatically disabled while any row is expanded so that expansion
  panels can take their natural height. It resumes once all rows are collapsed.
- Group row labels no longer show the field key prefix — only the value and count are
  displayed (e.g. `Engineering (4)` instead of `department: Engineering (4)`).

---

## [2.3.1] — 2026-04-26

### Added
- **Server-side pagination (Mode 2).** New `paginationMode="server"` prop delegates
  filtering, sorting, and paging to the caller. `onServerRequest` callback fires on
  mount and on every page, sort, filter, or page-size change. Supports both
  offset-based and cursor-based backends via the `direction` field
  (`'first' | 'next' | 'prev'`).
- **Server-side paged grouping (Mode 3).** When `serverGroups` + `paginationMode="server"`
  are both set, groups are rendered from server-provided summaries and rows are
  lazy-loaded per group on expand. A "Load more" button appears when the `onLoadGroupData`
  callback returns a `nextCursor`.
- **Server-side unpaged grouping (Mode 4).** `serverGroups` without server pagination
  enables lazy group expansion that loads all rows for a group at once — no outer
  pagination required.
- **`serverGroups` prop** (`ServerGroupDef<T>[]`): replaces `groupBy` for server-managed
  grouping. Provides field, group values, and server-computed counts.
- **`onLoadGroupData` callback** (`async (params) => { rows, nextCursor? }`): called on
  group expand and "Load more" clicks. Component owns all loaded-group state internally.
- **`LoadMoreNode` type**: virtual node injected after expanded server-group rows to
  render loading, load-more, and error/retry states.
- **`ServerRequestParams` type**: the full parameter object passed to `onServerRequest`,
  including the `direction` field.
- **`PaginationConfig` type**: exported discriminated union for pagination mode props.
- **`GroupingConfig<T>` type**: exported discriminated union for grouping mode props.
- **Page-size selector**: `pageSize` now accepts `number | number[]`. When an array is
  passed, a `<select>` control appears in the footer allowing the user to change page
  size at runtime.
- **Selection count in footer**: when `checkboxSelection` is enabled and rows are
  selected, the number of selected rows is shown in the pagination footer.
- **Selection persists across page changes** in server mode (was already the case in
  client mode; now explicitly supported in all modes).
- **Non-optimistic sort indicator**: in server mode, the sort arrow in the column header
  only advances after `loading` transitions from `true` to `false`, preventing a
  mismatched indicator during in-flight requests.

### Changed
- `src/index.ts` now exports all new types: `ServerRequestParams`, `PaginationConfig`,
  `GroupingConfig`, `ServerGroupDef`, `ServerGroupValue`, `LoadGroupDataParams`,
  `LoadGroupDataResult`, `LoadMoreNode`.
- Filter-triggered page reset is now handled directly inside `handleFilterChange` (was
  a `useEffect`). This eliminates the double-`onServerRequest` call that would have
  occurred in server mode.
- Sort clicks and page navigation now use named handlers (`handleSortChange`,
  `handlePageChange`) instead of inline `setSortModel`/`setCurrentPage` calls.

---

## [2.1.0] — 2026-04-18

### Added
- **`getRowClassName`** prop: apply CSS classes to entire rows based on row data.
- **`cellClassName`** per-column prop: apply CSS classes to individual cells based on
  row data.
- **`height` prop**: explicit control over table height. Defaults to `'100%'` to fill
  parent. Accepts `number` (pixels) or any CSS string.
- Fixed ActionCell React import issue in UMD build.

---

## [2.0.0] — 2026-04-09

### Added
- **`valueGetter`** per-column prop: extract display values from nested or computed
  fields. The returned value is used for rendering, sorting, filtering, and grouping.
- **`getRowId`** prop: derive row IDs from any field. Previously only `row.id` was
  supported.
- Improved TypeScript: `getRowId` is now required at compile time when the row type
  lacks `id: string | number`.
- Accessibility improvements: ARIA roles, `aria-sort`, `aria-rowcount`, `aria-selected`,
  keyboard-navigable action menus.
- Column width expansion: columns distribute extra container width evenly.
- Restructured source into separate files (`types.ts`, `utils.ts`,
  `components/ActionCell.tsx`, `hooks/useColumnResize.ts`).

### Changed
- Column resize minimum enforced at 50px (drag only; prop values are not clamped).

---

## [1.2.0] — 2026-02-04

### Added
- **`disabled` on `GridAction`**: render row actions as non-interactive based on row
  data.
- **`toolbar` prop**: inject custom React content into the toolbar.

---

## [1.0.0] — 2026-01-21

### Added
- Initial public release.
- Virtualised rendering (scroll-position based, 4-row buffer).
- Sorting (single column, asc/desc toggle).
- Per-column text filtering (case-insensitive substring match, AND across columns).
- Client-side pagination with configurable page size.
- Multi-level row grouping with expand/collapse.
- Column pinning (left/right) — initial value per column, runtime-configurable via pin
  icon.
- Drag-resize column handles.
- Column visibility toggle (Columns menu in toolbar).
- Checkbox multi-row selection with select-all.
- Row actions: inline buttons + overflow (`⋮`) portal menu with smart vertical
  positioning.
- State persistence via `onStateChange` / `initialState`.
- Full CSS custom-property theming with `.dg-` class prefix.
- Zero runtime dependencies.
- ESM + UMD build output with rolled-up TypeScript declarations.
