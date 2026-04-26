# Getting Started

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| React | 18 or later |
| react-dom | 18 or later |
| TypeScript (optional) | 4.9 or later |

React and react-dom are **peer dependencies** — they must already be in your project.
esseal-data-table does not bundle its own copy.

---

## Installation

```bash
# npm
npm install esseal-data-table

# yarn
yarn add esseal-data-table

# pnpm
pnpm add esseal-data-table
```

---

## Import the stylesheet

Import the CSS once in your application entry point. Without it, the table renders
without any visual styling.

```ts
// In your main.tsx, App.tsx, or global stylesheet entry
import 'esseal-data-table/style.css';
```

If you use a CSS bundler that processes imports, this also works:

```css
@import 'esseal-data-table/style.css';
```

---

## Hello World

The table requires two props: `rows` (your data array) and `columns` (your column
definitions). Every row must have a unique `id` field of type `string | number`, or you
must provide a `getRowId` function.

```tsx
import { EssealDataTable } from 'esseal-data-table';
import 'esseal-data-table/style.css';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const rows: Product[] = [
  { id: 1, name: 'Keyboard',   price: 79.99,  category: 'Electronics' },
  { id: 2, name: 'Mouse',      price: 49.99,  category: 'Electronics' },
  { id: 3, name: 'Desk lamp',  price: 34.50,  category: 'Furniture'   },
];

const columns = [
  { field: 'id',       headerName: 'ID',       width: 60  },
  { field: 'name',     headerName: 'Name',      width: 180 },
  { field: 'price',    headerName: 'Price',     width: 100 },
  { field: 'category', headerName: 'Category',  width: 140 },
];

export default function ProductsPage() {
  return (
    <div style={{ height: 400 }}>
      <EssealDataTable rows={rows} columns={columns} />
    </div>
  );
}
```

The table fills `100%` of its parent's height by default. The `div` with `height: 400`
above is essential — without a parent height, the table collapses to zero. You can also
pass a `height` prop directly:

```tsx
<EssealDataTable rows={rows} columns={columns} height={400} />
```

---

## Enabling common features

### Pagination

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  pagination
  pageSize={10}
/>
```

Pass an array to `pageSize` to show a page-size selector in the footer:

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  pagination
  pageSize={[10, 25, 50]}
/>
```

### Sorting and filtering

Both are enabled by default for every column. To disable sorting or filtering on a
specific column, set `sortable: false` or `filterable: false` in the column definition:

```tsx
{ field: 'id', headerName: 'ID', width: 60, sortable: false, filterable: false }
```

### Row selection

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  checkboxSelection
  onSelectionChange={(ids) => console.log('Selected:', ids)}
/>
```

### Row grouping (client-side)

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  groupBy={['category']}
/>
```

### Server-side pagination

See [api-reference.md](api-reference.md#mode-2--server-side-pagination) for the full
`onServerRequest` callback signature.

```tsx
const [rows, setRows] = useState([]);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(false);

<EssealDataTable
  rows={rows}
  columns={columns}
  pagination
  pageSize={25}
  paginationMode="server"
  rowCount={total}
  loading={loading}
  onServerRequest={async ({ page, pageSize, sortModel, filterModel }) => {
    setLoading(true);
    const data = await fetch(`/api/products?page=${page}&limit=${pageSize}`).then(r => r.json());
    setRows(data.rows);
    setTotal(data.total);
    setLoading(false);
  }}
/>
```

---

## Common setup mistakes

### Table appears empty with zero height

**Cause:** The parent container has no defined height and the table defaults to `height: '100%'`.

**Fix:** Give the parent a height, or pass `height` directly:

```tsx
// Option A: parent height
<div style={{ height: '600px' }}>
  <EssealDataTable rows={rows} columns={columns} />
</div>

// Option B: direct height prop
<EssealDataTable rows={rows} columns={columns} height={600} />
```

### "Could not resolve a row ID" error

**Cause:** Your row objects do not have an `id` field.

**Fix:** Provide `getRowId`:

```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.userId}
/>
```

### Styles are missing

**Cause:** The CSS import was not added.

**Fix:** Add `import 'esseal-data-table/style.css'` to your app entry point.

### TypeScript error on `rowCount` / `onServerRequest`

**Cause:** These props are required when `paginationMode="server"` and must not be passed
when using client mode. TypeScript enforces this via a discriminated union.

**Fix:** Ensure you pass both `rowCount` and `onServerRequest` when using server mode, and
remove them when switching back to client mode.

### `onStateChange` fires on every keystroke

**Cause:** The callback reference changes on every render, which causes a stale closure
and can trigger unexpected behaviour.

**Fix:** Wrap `onStateChange` in `useCallback`:

```tsx
const handleStateChange = useCallback((state: TableState) => {
  saveToStorage(state);
}, []);

<EssealDataTable onStateChange={handleStateChange} ... />
```
