# API Reference

## `EssealDataTable<T>`

The single exported component. Generic over `T`, the row data type.

```tsx
import { EssealDataTable } from 'esseal-data-table';
import 'esseal-data-table/style.css';
```

TypeScript infers `T` from the `rows` prop in most cases. You can also supply it
explicitly:

```tsx
<EssealDataTable<Employee> rows={employees} columns={columns} />
```

---

## Props

### Core

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `rows` | `T[]` | Yes | — | Array of row data objects. |
| `columns` | `GridColDef<T>[]` | Yes | — | Column definitions. |
| `getRowId` | `(row: T) => string \| number` | Conditional | — | Derives a unique ID from each row. Required when `T` does not have an `id: string \| number` field. |
| `height` | `number \| string` | No | `'100%'` | Table height. Accepts a pixel number or any CSS string (`'50vh'`, `'calc(100% - 64px)'`). |
| `rowHeight` | `number` | No | `40` | Row height in pixels. Must be a positive integer. Virtualization depends on this value being accurate. |
| `loading` | `boolean` | No | `false` | Renders a full-table loading overlay when `true`. |

### Pagination

Pagination mode is selected via a discriminated union. TypeScript enforces which props
are required or forbidden depending on the mode.

#### Client mode (default)

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `pagination` | `boolean` | No | `false` | Enables page navigation controls in the footer. |
| `pageSize` | `number \| number[]` | No | `10` | Rows per page. Pass a number array to show a page-size selector in the footer (e.g. `[10, 25, 50]`). |
| `paginationMode` | `'client'` | No | `'client'` | Explicitly sets client mode. Omitting this prop is equivalent. |

#### Server mode

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `paginationMode` | `'server'` | Yes | — | Switches to server-side pagination. Filtering and sorting are also delegated to the server. |
| `rowCount` | `number` | Yes | — | Total number of rows in the dataset (not just the current page). Used for the footer count and page calculation. |
| `onServerRequest` | `(params: ServerRequestParams) => void` | Yes | — | Called on mount, and whenever page, sort, filter, or page size changes. See [`ServerRequestParams`](#serverrequestparams). |
| `filterDebounceMs` | `number` | No | `300` | Delay in milliseconds before `onServerRequest` fires after a filter input change. Has no effect in client mode. |
| `pagination` | `boolean` | No | `false` | Still required to show footer controls in server mode. |
| `pageSize` | `number \| number[]` | No | `10` | Rows per page sent to `onServerRequest`. |

> ⚠️ In server mode, `rows` must contain **only the current page's data**. The component
> does not slice, filter, or sort `rows` — it renders them as-is.

### Grouping

Grouping mode is also a discriminated union. `groupBy` and `serverGroups` are mutually
exclusive — passing both is a TypeScript error.

#### Client grouping

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `groupBy` | `(keyof T)[]` | No | `[]` | Fields to group rows by. Multiple fields create nested groups in array order. Grouping runs client-side on the `rows` prop. |

#### Server grouping

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `serverGroups` | `ServerGroupDef<T>[]` | Yes | — | Pre-computed group definitions from the server. Each entry describes one grouping field and its list of values with counts. See [`ServerGroupDef`](#servergroupdeft). |
| `onLoadGroupData` | `(params: LoadGroupDataParams) => Promise<LoadGroupDataResult<T>>` | Yes | — | Called when a group row is expanded (and on "Load more"). Returns rows for that group. See [`LoadGroupDataParams`](#loadgroupdataparams) and [`LoadGroupDataResult`](#loadgroupdataresultt). |

> Server grouping + server pagination (both props set) enables **paged** group loading
> (Mode 3). Server grouping without `paginationMode="server"` enables **unpaged** group
> loading (Mode 4 — loads all rows for a group at once when expanded).

### Selection

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `checkboxSelection` | `boolean` | No | `false` | Adds a checkbox column. Enables multi-row selection with a select-all control in the header. |
| `onSelectionChange` | `(ids: (string \| number)[]) => void` | No | — | Called whenever the set of selected row IDs changes. Receives the full current selection, not a diff. Selection persists across page changes. |

### Row actions

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `rowActions` | `(row: T) => GridAction<T>[]` | No | — | Returns the action list for a given row. Called per visible row on every render — keep it pure and fast. |
| `maxVisibleActions` | `number` | No | `1` | Number of action buttons shown inline. Additional actions collapse into an overflow (`⋮`) button whose menu is portalled to `document.body`. |

### Toolbar

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `toolbar` | `ReactNode` | No | — | Custom content rendered in the toolbar, to the right of the built-in Columns button. |
| `disableColumnMenu` | `boolean` | No | `false` | Hides the built-in Columns visibility button. |

### Styling

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `getRowClassName` | `(row: T) => string` | No | — | Returns a CSS class name applied to the row's container `div`. Return `''` for no class. |

### State persistence

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `initialState` | `Partial<TableState>` | No | — | Seeds internal state on first render. Fields omitted from the partial use their defaults. Has no effect after mount. |
| `onStateChange` | `(state: TableState) => void` | No | — | Called after every state change (sort, filter, page, column visibility, pinning, group expand). Not called on the initial render. Wrap in `useCallback` to keep the reference stable. |

---

## Type Definitions

### `GridColDef<T>`

Defines a single column.

```ts
import type { GridColDef } from 'esseal-data-table';
```

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `field` | `keyof T \| string` | Yes | — | The key on the row object this column reads. |
| `headerName` | `string` | Yes | — | Text shown in the column header. |
| `width` | `number` | Yes | — | Initial column width in pixels. Minimum enforced at runtime is 50px (drag resize). |
| `pinned` | `'left' \| 'right' \| false` | No | `false` | Pins the column on initial render. Can be changed at runtime via the pin icon. |
| `hide` | `boolean` | No | `false` | Hides the column by default. Users can reveal it via the Columns menu. |
| `sortable` | `boolean` | No | `true` | Clicking the header sorts by this column. |
| `filterable` | `boolean` | No | `true` | Shows a filter input in the column header. |
| `valueGetter` | `(row: T) => string \| number` | No | — | Extracts the display value. Used for rendering, sorting, filtering, and client-side grouping. When both `valueGetter` and `renderCell` are present, `renderCell` receives the `valueGetter` result as `params.value`. |
| `renderCell` | `(params: GridRenderCellParams<T>) => ReactNode` | No | — | Renders custom React content in the cell. |
| `cellClassName` | `(row: T) => string` | No | — | Returns a CSS class applied to cells in this column. Called per row so the class can vary. |

```tsx
const columns: GridColDef<Employee>[] = [
  {
    field: 'department',
    headerName: 'Department',
    width: 150,
    valueGetter: (row) => row.department.name,
    renderCell: ({ value }) => <strong>{value}</strong>,
    cellClassName: (row) => row.department.name === 'Engineering' ? 'dept-eng' : '',
  },
];
```

---

### `GridRenderCellParams<T>`

Passed to `renderCell`.

```ts
import type { GridRenderCellParams } from 'esseal-data-table';
```

| Property | Type | Description |
|---|---|---|
| `value` | `any` | The resolved cell value — the result of `valueGetter` if defined, otherwise `row[field]`. |
| `row` | `T` | The full row data object. |
| `field` | `string` | The column's `field` name as a string. |

---

### `GridAction<T>`

Defines one action in a row's action menu.

```ts
import type { GridAction } from 'esseal-data-table';
```

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Action label. Shown in the overflow menu and used as the accessible name when `icon` is not provided. |
| `icon` | `ReactNode` | No | — | Icon rendered inside the inline button. |
| `tooltipText` | `string` | No | `label` | Tooltip on hover. Defaults to `label`. |
| `onClick` | `(row: T) => void` | Yes | — | Called when the action is activated. Receives the full row object. |
| `disabled` | `boolean` | No | `false` | Renders the action as disabled. The button is still visible but cannot be clicked. |

```tsx
rowActions={(row) => [
  {
    label: 'Delete',
    icon: <TrashIcon />,
    tooltipText: row.protected ? 'Cannot delete a protected record' : 'Delete',
    disabled: row.protected,
    onClick: (r) => handleDelete(r.id),
  },
]}
```

---

### `TableState`

The complete serialisable state of the table. Returned by `onStateChange` and accepted by
`initialState`.

```ts
import type { TableState } from 'esseal-data-table';
```

| Field | Type | Description |
|---|---|---|
| `page` | `number` | Current page number (1-indexed). |
| `sortModel` | `SortModel \| null` | Active sort column and direction, or `null` when unsorted. |
| `filterModel` | `FilterModel` | Map of `field → filter string` for all column filters. Keys are present even for empty filters. |
| `expandedGroups` | `Record<string, boolean>` | Map of group ID → expanded state. |
| `columnVisibility` | `Record<string, boolean>` | Map of field name → visibility state. |
| `pinnedColumns` | `Record<string, 'left' \| 'right' \| false>` | Map of field name → pin direction. |

`TableState` contains only plain objects and primitives — it is safe to serialise with
`JSON.stringify` and store anywhere (localStorage, URL, database).

---

### `SortModel`

```ts
import type { SortModel } from 'esseal-data-table';

interface SortModel {
  field: string;
  direction: 'asc' | 'desc';
}
```

---

### `FilterModel`

```ts
import type { FilterModel } from 'esseal-data-table';

type FilterModel = Record<string, string>;
// e.g. { name: 'alice', department: 'eng' }
```

---

### `ServerRequestParams`

Passed to `onServerRequest` whenever the server needs to re-fetch data.

```ts
import type { ServerRequestParams } from 'esseal-data-table';
```

| Field | Type | Description |
|---|---|---|
| `page` | `number` | Current page number (1-indexed). Compute `offset = (page - 1) * pageSize` for offset-based APIs. |
| `pageSize` | `number` | Rows per page (the resolved effective page size). |
| `sortModel` | `SortModel \| null` | Active sort, or `null`. |
| `filterModel` | `FilterModel` | Active column filters. |
| `direction` | `'first' \| 'next' \| 'prev'` | Navigation direction. `'first'` on mount, filter change, sort change, and page-size change. `'next'`/`'prev'` on explicit page navigation only. Use this to decide which cursor to send to a cursor-based API. |

**Offset-based example:**
```ts
onServerRequest: ({ page, pageSize, sortModel, filterModel }) => {
  fetchData({ offset: (page - 1) * pageSize, limit: pageSize, sort: sortModel, filter: filterModel });
}
```

**Cursor-based example:**
```ts
const [cursors, setCursors] = useState({ next: '', prev: '' });

onServerRequest: ({ direction, pageSize }) => {
  const cursor = direction === 'next' ? cursors.next
               : direction === 'prev' ? cursors.prev
               : ''; // 'first' — reset cursor state
  fetchData({ cursor, limit: pageSize }).then(data => {
    setRows(data.rows);
    setCursors({ next: data.nextCursor, prev: data.prevCursor });
  });
}
```

---

### `ServerGroupDef<T>`

Describes one grouping field and its groups. Passed to `serverGroups`.

```ts
import type { ServerGroupDef, ServerGroupValue } from 'esseal-data-table';
```

```ts
interface ServerGroupDef<T> {
  field: keyof T | string;
  groups: ServerGroupValue[];
}

interface ServerGroupValue {
  value: string;   // the group label shown in the header
  count: number;   // row count shown in the header — does not need to match loaded rows
}
```

```tsx
serverGroups={[
  {
    field: 'department',
    groups: [
      { value: 'Engineering', count: 450 },
      { value: 'Sales',       count: 230 },
      { value: 'Finance',     count: 88  },
    ],
  },
]}
```

---

### `LoadGroupDataParams`

Passed to `onLoadGroupData` when a group is expanded or "Load more" is clicked.

```ts
import type { LoadGroupDataParams } from 'esseal-data-table';
```

| Field | Type | Description |
|---|---|---|
| `groupId` | `string` | Internally generated group identifier (`__field-value` chain). Stable across renders as long as `serverGroups` does not change. |
| `currentlyLoaded` | `number` | Number of rows already loaded for this group. Use as the offset for offset-based backends. `0` on first expansion. |
| `cursor` | `string` | The `nextCursor` returned by the previous call for this group. Empty string on first expansion. Use for cursor-based backends. |

---

### `LoadGroupDataResult<T>`

The value your `onLoadGroupData` callback must resolve with.

```ts
import type { LoadGroupDataResult } from 'esseal-data-table';
```

| Field | Type | Required | Description |
|---|---|---|---|
| `rows` | `T[]` | Yes | Rows to add for this group. Appended to any previously loaded rows. |
| `nextCursor` | `string` | No | Cursor for the next page within this group. If omitted or empty, the "Load more" button is hidden. |

If there are no more rows, resolve without `nextCursor` (or set it to `''`):

```ts
onLoadGroupData: async ({ groupId, currentlyLoaded }) => {
  const data = await api.getGroupRows(groupId, { offset: currentlyLoaded, limit: 50 });
  return {
    rows: data.rows,
    nextCursor: data.hasMore ? String(currentlyLoaded + 50) : undefined,
  };
}
```

---

### `LoadMoreNode`

A virtual node injected after the loaded rows of every expanded server-managed group.
Drives the "Loading…", "Load more", and "Failed to load — Retry" UI states.

```ts
import type { LoadMoreNode } from 'esseal-data-table';

type LoadMoreNode = {
  type: 'load-more';
  groupId: string;
  state: 'loading' | 'idle' | 'error';
};
```

You do not create these nodes directly — the component manages them internally.

---

## Mode 2 — Server-side pagination

When `paginationMode="server"`, the component:

1. Fires `onServerRequest` immediately on mount with `direction: 'first'` — no separate
   `useEffect` needed for the initial load.
2. Skips all client-side `filterRows` and `sortRows` processing — `rows` is rendered
   as-is.
3. Does not slice `rows` for pagination — pass only the current page's data.
4. Resets to page 1 (with `direction: 'first'`) whenever filters or sort change.
5. Debounces filter input changes by `filterDebounceMs` (default 300 ms) before calling
   `onServerRequest` — prevents a request on every keystroke.
6. Cancels any pending filter debounce when a sort or page change fires, so only one
   request is in flight.
7. Advances the sort indicator in the column header **only after `loading` transitions
   from `true` to `false`** — the arrow does not appear until the new data is visible.

## Mode 3 — Server-paged grouping

Requires both `serverGroups` and `paginationMode="server"`. Each expanded group loads
rows in pages via `onLoadGroupData`. A "Load more" button appears at the bottom of each
expanded group if `nextCursor` is returned. Clicking it calls `onLoadGroupData` again
with the updated `currentlyLoaded` and `cursor`.

## Mode 4 — Server-unpaged grouping

Uses `serverGroups` and `onLoadGroupData` without `paginationMode="server"`. On first
expand, all rows for that group are fetched at once. No "Load more" button appears
(because you return no `nextCursor`). Outer pagination (client or server) still works
independently.

---

## Behaviour notes

### Row ID resolution

If your row type has `id: string | number`, `getRowId` is optional. If it does not, you
**must** provide `getRowId`. Failing to do so throws at runtime:

```
[EssealDataTable] Could not resolve a row ID.
Add an `id` field to your row data or provide the `getRowId` prop.
```

### Column width expansion

If the total defined column widths are less than the container's width, the extra space
is distributed evenly across all columns. Widths are recalculated on container resize.

### Minimum column width

The drag-resize handle enforces a minimum of 50px. Columns set narrower than 50px in the
definition are not clamped — only drag operations are.

### Virtualization

Rows are virtualised by scroll position. Only `floor((containerHeight / rowHeight) + 4)`
rows are rendered at any time. The `rowHeight` prop must match the actual rendered row
height for virtualization to be accurate; mismatches cause visual gaps or overlapping rows.

### Overflow action menu

The row-actions overflow (`⋮`) menu is rendered via `createPortal` directly into
`document.body`. It positions itself above the trigger button when there is insufficient
space below. The menu closes on click-outside, scroll, or window resize.

### `onStateChange` is not called on mount

The first render is intentionally skipped. Only subsequent state changes trigger the
callback. Use `initialState` to seed state — not `onStateChange`.
