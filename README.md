# esseal-data-table

A fast, fully-featured React data table with zero dependencies. Virtualized rendering, multi-level grouping, column pinning, per-column filtering, state persistence, and full TypeScript support — all in a single lightweight package.

Built by [Esseal](https://esseal.co.uk).

---

## Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [API Reference](#api-reference)
  - [EssealDataTable Props](#essealdata-table-props)
  - [GridColDef](#gridcoldef)
  - [GridAction](#gridaction)
  - [TableState](#tablestate)
- [Guides](#guides)
  - [Custom Cell Rendering](#custom-cell-rendering)
  - [Nested / Computed Values](#nested--computed-values)
  - [Row Grouping](#row-grouping)
  - [Row Actions](#row-actions)
  - [State Persistence](#state-persistence)
  - [Custom Toolbar](#custom-toolbar)
  - [Conditional Row & Cell Styling](#conditional-row--cell-styling)
- [Styling & Theming](#styling--theming)
- [TypeScript](#typescript)

---

## Installation

```bash
npm install esseal-data-table
```

```bash
yarn add esseal-data-table
```

React 18+ is required as a peer dependency.

---

## Quick Start

```tsx
import { EssealDataTable } from 'esseal-data-table';
import 'esseal-data-table/style.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const rows: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Engineer' },
  { id: 2, name: 'Bob Smith',     email: 'bob@example.com',   role: 'Designer' },
];

const columns = [
  { field: 'id',    headerName: 'ID',    width: 70  },
  { field: 'name',  headerName: 'Name',  width: 180 },
  { field: 'email', headerName: 'Email', width: 220 },
  { field: 'role',  headerName: 'Role',  width: 130 },
];

export default function App() {
  return <EssealDataTable rows={rows} columns={columns} />;
}
```

> **Note:** The table needs a unique ID for each row. By default it reads the `id` field. If your data uses a different key, provide `getRowId`:
> ```tsx
> <EssealDataTable
>   rows={rows}
>   columns={columns}
>   getRowId={(row) => row.userId}
> />
> ```

---

## Features

| Feature | Description |
|---|---|
| Virtualized rendering | Only visible rows are rendered — handles large datasets smoothly |
| Sorting | Click any column header to sort ascending or descending |
| Per-column filtering | Search inputs built into each column header |
| Multi-level grouping | Group rows by one or more fields with expand/collapse |
| Pagination | Built-in page navigation with configurable page size |
| Column pinning | Pin any column to the left or right edge |
| Column resizing | Drag the edge of any column header to resize |
| Column visibility | Show/hide columns via the built-in Columns menu |
| Checkbox selection | Multi-row selection with a select-all control |
| Row actions | Per-row action buttons with icon, tooltip, and overflow menu |
| Custom toolbar | Inject your own buttons or controls into the toolbar |
| Loading overlay | Block the table with a loading state |
| State persistence | Save and restore the full table state across sessions |
| `valueGetter` | Extract display values from nested or computed fields |
| Custom cell rendering | Render any React node inside a cell |
| Conditional row styling | Apply a CSS class to any row based on its data |
| Conditional cell styling | Apply a CSS class to any cell based on its row data, configured per column |
| Full TypeScript support | Generic component with end-to-end type safety |

---

## API Reference

### EssealDataTable Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` | `T[]` | — | **Required.** Array of row data. Each object must have an `id: string \| number` field, or you must provide `getRowId`. |
| `getRowId` | `(row: T) => string \| number` | — | Derives a unique ID from each row. Required when your row data does not have an `id` field. |
| `columns` | `GridColDef<T>[]` | — | **Required.** Column definitions. |
| `height` | `number \| string` | `'100%'` | Height of the table. Defaults to `'100%'` — fills the parent container. Pass a pixel number (e.g. `600`) or any CSS string (e.g. `'50vh'`) for a fixed height. The parent must have a defined height when using the default. |
| `getRowClassName` | `(row: T) => string` | — | Returns a CSS class name to apply to the entire row. Use this to conditionally style rows based on their data. See [Conditional Row & Cell Styling](#conditional-row--cell-styling). |
| `rowHeight` | `number` | `40` | Height of each row in pixels. |
| `loading` | `boolean` | `false` | Shows a loading overlay over the table. |
| `pagination` | `boolean` | `false` | Enables pagination controls. |
| `pageSize` | `number` | `10` | Number of rows per page. Only applies when `pagination` is `true`. |
| `checkboxSelection` | `boolean` | `false` | Adds a checkbox column for multi-row selection. |
| `groupBy` | `(keyof T)[]` | `[]` | Fields to group rows by. Multiple fields create nested groups in array order. |
| `rowActions` | `(row: T) => GridAction<T>[]` | — | Returns the list of actions for a given row. |
| `maxVisibleActions` | `number` | `1` | Number of action buttons shown inline per row. Extra actions collapse into an overflow menu. |
| `toolbar` | `ReactNode` | — | Custom content rendered on the right side of the toolbar. |
| `disableColumnMenu` | `boolean` | `false` | Hides the built-in Columns visibility button from the toolbar. |
| `initialState` | `Partial<TableState>` | — | Seeds the table with a previously saved state on first render. |
| `onStateChange` | `(state: TableState) => void` | — | Called whenever the table state changes (sort, filter, page, pinning, etc.). |
| `onSelectionChange` | `(ids: (string \| number)[]) => void` | — | Called whenever the row selection changes. |

---

### GridColDef

Defines a single column.

```ts
interface GridColDef<T> {
  field:        keyof T | string;
  headerName:   string;
  width:        number;
  pinned?:      'left' | 'right' | false;
  hide?:        boolean;
  sortable?:    boolean;
  filterable?:  boolean;
  valueGetter?:    (row: T) => string | number;
  renderCell?:     (params: GridRenderCellParams<T>) => ReactNode;
  cellClassName?:  (row: T) => string;
}
```

| Property | Type | Default | Description |
|---|---|---|---|
| `field` | `keyof T \| string` | — | **Required.** The key of the row object this column reads from. |
| `headerName` | `string` | — | **Required.** Text displayed in the column header. |
| `width` | `number` | — | **Required.** Initial column width in pixels. Users can resize at runtime. |
| `pinned` | `'left' \| 'right' \| false` | `false` | Pins the column to the left or right edge on initial render. Users can also change pinning at runtime via the pin icon in the header. |
| `hide` | `boolean` | `false` | Hides the column by default. Users can reveal it via the Columns menu. |
| `sortable` | `boolean` | `true` | Enables sorting by this column when clicking its header. |
| `filterable` | `boolean` | `true` | Shows a filter input inside the column header. |
| `valueGetter` | `(row: T) => string \| number` | — | Extracts the cell value from the row. Use this for nested fields or computed values. See [Nested / Computed Values](#nested--computed-values). |
| `renderCell` | `(params: GridRenderCellParams<T>) => ReactNode` | — | Renders custom React content inside the cell. See [Custom Cell Rendering](#custom-cell-rendering). |
| `cellClassName` | `(row: T) => string` | — | Returns a CSS class name to apply to this column's cells. Called per row, so the class can vary based on the row's data. See [Conditional Row & Cell Styling](#conditional-row--cell-styling). |

---

### GridAction

Defines a single action for a row.

```ts
interface GridAction<T> {
  label:        string;
  icon?:        ReactNode;
  tooltipText?: string;
  onClick:      (row: T) => void;
  disabled?:    boolean;
}
```

| Property | Type | Description |
|---|---|---|
| `label` | `string` | **Required.** Text label for the action. Shown in the overflow menu and used as the accessible name when no icon is present. |
| `icon` | `ReactNode` | Icon rendered inside the action button. |
| `tooltipText` | `string` | Tooltip shown on hover. Defaults to `label` if not provided. |
| `onClick` | `(row: T) => void` | **Required.** Called when the action is clicked. Receives the full row object. |
| `disabled` | `boolean` | Disables the action. The button is still rendered but cannot be clicked. |

---

### TableState

The full serialisable state of the table. Returned by `onStateChange` and accepted by `initialState`.

```ts
interface TableState {
  page:             number;
  sortModel:        { field: string; direction: 'asc' | 'desc' } | null;
  filterModel:      Record<string, string>;
  expandedGroups:   Record<string, boolean>;
  columnVisibility: Record<string, boolean>;
  pinnedColumns:    Record<string, 'left' | 'right' | false>;
}
```

| Field | Description |
|---|---|
| `page` | Current page number (1-indexed). |
| `sortModel` | Active sort column and direction, or `null` if unsorted. |
| `filterModel` | Map of field name → filter string for all active column filters. |
| `expandedGroups` | Map of group ID → expanded state for all groups. |
| `columnVisibility` | Map of field name → visible state for all columns. |
| `pinnedColumns` | Map of field name → pin direction for all pinned columns. |

---

## Guides

### Custom Cell Rendering

Use `renderCell` to display any React node in a cell. The `params` object provides the resolved `value`, the full `row` object, and the `field` name.

```tsx
const columns = [
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ value }) => (
      <span style={{
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        background: value === 'Active' ? '#dcfce7' : '#fee2e2',
        color:      value === 'Active' ? '#16a34a' : '#dc2626',
      }}>
        {value}
      </span>
    ),
  },
];
```

---

### Nested / Computed Values

When a field is a nested object or a computed value, use `valueGetter` to extract the display value. The returned value is used for display, sorting, filtering, and grouping — so you only need to define the extraction logic once.

```tsx
interface Employee {
  id: number;
  name: string;
  department: { id: number; name: string };
}

const columns = [
  {
    field: 'department',
    headerName: 'Department',
    width: 150,
    valueGetter: (row) => row.department.name,
  },
];
```

`valueGetter` and `renderCell` can be used together. When both are present, `renderCell` receives the result of `valueGetter` as its `value`:

```tsx
{
  field: 'department',
  headerName: 'Department',
  width: 150,
  valueGetter: (row) => row.department.name,
  renderCell: ({ value }) => <strong>{value}</strong>,
}
```

---

### Row Grouping

Pass an array of field keys to `groupBy` to group rows. Multiple fields create nested groups — the order of the array controls the nesting hierarchy.

```tsx
// Single level — group by department
<EssealDataTable rows={rows} columns={columns} groupBy={['department']} />

// Two levels — group by department, then by role within each department
<EssealDataTable rows={rows} columns={columns} groupBy={['department', 'role']} />
```

Group rows are collapsible. Each group header shows the field name, the group value, and the row count.

If the grouping field uses a `valueGetter`, the extracted value is used as the group label automatically — no extra configuration required.

---

### Row Actions

Provide a `rowActions` function that returns an array of `GridAction` objects per row. The first `maxVisibleActions` actions are shown as inline icon buttons; additional actions collapse into an overflow (`⋮`) menu.

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  maxVisibleActions={2}
  rowActions={(row) => [
    {
      label: 'Edit',
      icon: <EditIcon />,
      tooltipText: 'Edit this record',
      onClick: (r) => openEditModal(r),
    },
    {
      label: 'Archive',
      icon: <ArchiveIcon />,
      onClick: (r) => archive(r.id),
    },
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      tooltipText: row.protected ? 'This record is protected' : 'Delete',
      disabled: row.protected,
      onClick: (r) => deleteRow(r.id),
    },
  ]}
/>
```

Actions are evaluated per row, so `disabled`, `tooltipText`, and even which actions are returned can vary based on each row's data.

---

### State Persistence

Use `onStateChange` and `initialState` together to persist and restore the full table state — across page reloads, navigation, or user sessions.

```tsx
import { useCallback, useMemo } from 'react';
import { EssealDataTable, TableState } from 'esseal-data-table';
import 'esseal-data-table/style.css';

const STORAGE_KEY = 'my-table-state';

function MyPage() {
  const savedState = useMemo<Partial<TableState> | undefined>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  }, []);

  const handleStateChange = useCallback((state: TableState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  return (
    <EssealDataTable
      rows={rows}
      columns={columns}
      initialState={savedState}
      onStateChange={handleStateChange}
    />
  );
}
```

`TableState` is fully serialisable — it contains only plain objects and primitives. Store it anywhere: `localStorage`, a database, a URL query string, or a remote API.

> **Tip:** Wrap `onStateChange` in `useCallback` so its reference stays stable across renders.

---

### Custom Toolbar

Pass any React node to the `toolbar` prop to add custom controls to the right side of the toolbar, alongside the built-in Columns button.

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  toolbar={
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={exportToCsv}>Export CSV</button>
      <button onClick={refreshData}>Refresh</button>
    </div>
  }
/>
```

To remove the built-in Columns button and use only your own toolbar content, add `disableColumnMenu`:

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  disableColumnMenu
  toolbar={<MyCustomToolbar />}
/>
```

### Conditional Row & Cell Styling

Apply CSS classes conditionally based on row data using `getRowClassName` (table prop) and `cellClassName` (column prop).

**Row-level** — highlight an entire row:

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  getRowClassName={(row) => row.status === 'Inactive' ? 'row-inactive' : ''}
/>
```

```css
.row-inactive .dg-cell {
  background: #fff1f2;
}
```

**Cell-level** — highlight individual cells in a specific column:

```tsx
const columns = [
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    cellClassName: (row) => row.status === 'On Leave' ? 'cell-on-leave' : '',
  },
];
```

```css
.cell-on-leave {
  background: #fefce8;
}
```

Both props can be used together. `cellClassName` is defined per column, so different columns can apply different classes independently.

---

## Styling & Theming

Import the stylesheet once in your application entry point:

```ts
import 'esseal-data-table/style.css';
```

All visual properties are controlled via CSS custom properties. Override them globally or scope them to a specific container:

```css
/* Global override */
:root {
  --dg-primary:       #6366f1;
  --dg-primary-hover: #4f46e5;
  --dg-primary-light: #eef2ff;
  --dg-selection-bg:  #f5f3ff;
}

/* Scoped to one instance */
.my-table-wrapper {
  --dg-primary: #10b981;
}
```

### Available CSS Variables

| Variable | Default | Description |
|---|---|---|
| `--dg-primary` | `#0ea5e9` | Accent colour — sort indicators, focus rings, active states |
| `--dg-primary-hover` | `#0284c7` | Hover state of the accent colour |
| `--dg-primary-light` | `#e0f2fe` | Light tint — group row backgrounds, active menu items |
| `--dg-selection-bg` | `#f0f9ff` | Background colour of selected rows |
| `--dg-surface` | `#ffffff` | Default background for cells and toolbar |
| `--dg-surface-alt` | `#f8fafc` | Header row background |
| `--dg-surface-hover` | `#f1f5f9` | Row and menu item hover background |
| `--dg-border` | `#e2e8f0` | Primary border colour |
| `--dg-border-light` | `#f1f5f9` | Subtle borders between cells |
| `--dg-text-primary` | `#0f172a` | Main cell text colour |
| `--dg-text-secondary` | `#64748b` | Header and secondary text colour |
| `--dg-text-muted` | `#94a3b8` | Placeholder and disabled text |

---

## TypeScript

The component is fully generic over `T` (the row type). TypeScript infers `T` from the `rows` prop automatically in most cases, or you can supply it explicitly:

```tsx
<EssealDataTable<Employee> rows={employees} columns={columns} />
```

All public types are exported from the package:

```ts
import type {
  GridColDef,
  GridAction,
  GridRenderCellParams,
  TableState,
  SortModel,
  FilterModel,
  DataGridProps,
} from 'esseal-data-table';
```

---

## License

MIT © [Esseal](https://esseal.co.uk)
