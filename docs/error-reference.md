# Error Reference

This page documents every error esseal-data-table can produce — both thrown exceptions
and handled failure states rendered in the UI.

---

## Runtime exceptions

### `[EssealDataTable] Could not resolve a row ID.`

**Type:** `Error` (thrown at runtime)

**Source:** `src/EssealDataTable.tsx` — the `resolveId` function, called on every visible
row during rendering.

**Message:**
```
[EssealDataTable] Could not resolve a row ID.
Add an `id` field to your row data or provide the `getRowId` prop.
```

**Cause:** The component needs a stable, unique identifier for every row to power
virtualization, selection, and group tracking. It reads `row.id` by default. This error
fires when:

- Your row type does not have an `id` field, **and**
- You have not provided the `getRowId` prop.

**Example stack trace:**
```
Error: [EssealDataTable] Could not resolve a row ID.
  at resolveId (EssealDataTable.tsx)
  at processedRows (EssealDataTable.tsx)
  at EssealDataTable (EssealDataTable.tsx)
```

**How to fix:**

Option A — add an `id` field to your data:
```ts
interface MyRow {
  id: number;  // ← add this
  name: string;
  // ...
}
```

Option B — provide `getRowId`:
```tsx
<EssealDataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.userId}
/>
```

TypeScript also enforces this at compile time: if your row type does not have
`id: string | number`, the `getRowId` prop is required and TypeScript will report
an error if it is absent.

---

## Handled failure states

These are not thrown exceptions — they are rendered in the UI and can be recovered from
without a page reload.

### Group load failure

**Where it appears:** Inside an expanded server-managed group row.

**Rendered as:**
```
Failed to load — Retry
```
(a clickable button)

**Cause:** The `onLoadGroupData` callback returned a rejected Promise (i.e. your fetch
threw an error or the server returned an error response that your code re-threw).

**Internal state:** `groupLoadingState[groupId] === 'error'`

**Recovery:** The user clicks "Retry". The component calls `onLoadGroupData` again with
the same `groupId`, `currentlyLoaded: 0`, and `cursor: ''` (it does not advance the
cursor on failure). If the retry succeeds, the error state clears and rows are displayed
normally.

**How to prevent:** Wrap your fetch in a try/catch and handle known error cases (e.g. 404
→ return `{ rows: [] }`) rather than re-throwing. Only re-throw for unexpected errors
you want the retry UI to handle.

```ts
onLoadGroupData: async ({ groupId, currentlyLoaded }) => {
  try {
    const data = await api.getGroupRows(groupId, { offset: currentlyLoaded });
    return { rows: data.rows, nextCursor: data.nextCursor };
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { rows: [] }; // treat missing group as empty — no retry shown
    }
    throw err; // unexpected error — show retry button
  }
}
```

---

## TypeScript compile-time errors

These are not runtime errors but TypeScript violations that indicate misconfiguration.

### Missing `getRowId`

```
Type '{ rows: MyRow[]; columns: ...; }' is not assignable to type 'DataGridProps<MyRow>'.
  Property 'getRowId' is missing.
```

**Cause:** `MyRow` does not have `id: string | number` and `getRowId` was not provided.

**Fix:** See the runtime exception section above.

### `rowCount` required in server mode

```
Property 'rowCount' is missing in type '{ paginationMode: "server"; ... }'.
```

**Cause:** `paginationMode="server"` was set but `rowCount` was not provided.

**Fix:**
```tsx
<EssealDataTable
  paginationMode="server"
  rowCount={totalRows}     // ← required
  onServerRequest={...}    // ← also required
  ...
/>
```

### `onServerRequest` required in server mode

```
Property 'onServerRequest' is missing in type '{ paginationMode: "server"; rowCount: ...; }'.
```

**Cause:** `paginationMode="server"` and `rowCount` were set but `onServerRequest` was
not provided.

**Fix:** Provide the `onServerRequest` callback.

### `onLoadGroupData` required with `serverGroups`

```
Property 'onLoadGroupData' is missing in type '{ serverGroups: ...; }'.
```

**Cause:** `serverGroups` was passed without `onLoadGroupData`.

**Fix:**
```tsx
<EssealDataTable
  serverGroups={groups}
  onLoadGroupData={fetchGroupRows}  // ← required when serverGroups is set
  ...
/>
```

### Cannot use `groupBy` and `serverGroups` together

```
Types of property 'groupBy' are incompatible.
  Type '...' is not assignable to type 'never'.
```

**Cause:** Both `groupBy` and `serverGroups` were passed. These are mutually exclusive —
`groupBy` drives client-side grouping, `serverGroups` drives server-side grouping.

**Fix:** Remove one of them.

### Cannot pass server pagination props in client mode

```
Types of property 'rowCount' are incompatible.
  Type 'number' is not assignable to type 'never'.
```

**Cause:** `rowCount` or `onServerRequest` was passed without `paginationMode="server"`.
In client mode these props are typed as `never`.

**Fix:** Either add `paginationMode="server"` or remove the server-mode props.
