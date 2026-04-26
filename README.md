# esseal-data-table

[![npm version](https://img.shields.io/npm/v/esseal-data-table)](https://www.npmjs.com/package/esseal-data-table)
[![license](https://img.shields.io/npm/l/esseal-data-table)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/esseal-data-table)](https://bundlephobia.com/package/esseal-data-table)

A fast, fully-featured React data table with **zero runtime dependencies**. Handles both
client-side and server-side data with a single component — switch modes by changing one prop.

Built by [Esseal](https://esseal.co.uk).

---

## Install

```bash
npm install esseal-data-table
# or
yarn add esseal-data-table
# or
pnpm add esseal-data-table
```

React 18 or later is required as a peer dependency.

---

## Quick start

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
  return (
    <div style={{ height: 400 }}>
      <EssealDataTable rows={rows} columns={columns} />
    </div>
  );
}
```

> ⚠️ The table fills its parent's height by default. Always wrap it in a container with a
> defined height, or pass a `height` prop directly.

---

## Features

| Feature | Notes |
|---|---|
| Virtualized rendering | Only visible rows render — handles large datasets without lag |
| Sorting | Click any header to sort ascending / descending |
| Per-column filtering | Search inputs built into each column header |
| Client pagination | Built-in page navigation; supports a page-size selector |
| **Server-side pagination** | Delegate filtering, sorting, and paging to your API |
| **Server-side grouping** | Lazy-load group rows on expand; load-more within groups |
| Client-side grouping | Multi-level expand/collapse grouping on in-memory data |
| Column pinning | Pin columns to left or right; runtime-configurable via the pin icon |
| Column resizing | Drag-resize any column header |
| Column visibility | Toggle columns via the built-in Columns menu |
| Checkbox selection | Multi-row selection that persists across page changes |
| Row actions | Inline buttons + overflow (`⋮`) menu with portal positioning |
| Custom toolbar | Inject your own controls into the toolbar |
| Loading overlay | Block the table while data is in flight |
| State persistence | Save and restore full table state via `onStateChange` / `initialState` |
| `valueGetter` | Extract display values from nested or computed fields |
| Custom cell rendering | Render any React node inside any cell |
| Conditional styling | Apply CSS classes to rows or individual cells based on row data |
| Full TypeScript support | Generic component with end-to-end type safety |
| Zero dependencies | No lodash, no date libraries, nothing — React only |

---

## Pagination modes at a glance

| | Client (default) | Server |
|---|---|---|
| Prop | *(omit `paginationMode`)* | `paginationMode="server"` |
| Filtering | In-memory | Your API |
| Sorting | In-memory | Your API |
| Total count | Computed from `rows` | `rowCount` prop |
| Grouping | `groupBy` — client-side | `serverGroups` — lazy expand |

---

## Documentation

| File | Description |
|---|---|
| [docs/getting-started.md](docs/getting-started.md) | Installation walkthrough and first steps |
| [docs/api-reference.md](docs/api-reference.md) | Every prop, type, and interface |
| [docs/configuration.md](docs/configuration.md) | CSS variables and theming |
| [docs/examples/](docs/examples/) | Runnable examples for common patterns |
| [docs/error-reference.md](docs/error-reference.md) | All errors this package can produce |
| [docs/changelog.md](docs/changelog.md) | Version history |
| [docs/contributing.md](docs/contributing.md) | How to run and contribute to the project |

---

## License

MIT © [Esseal](https://esseal.co.uk)
