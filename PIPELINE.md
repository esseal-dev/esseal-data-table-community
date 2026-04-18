# Code Review — EssealDataTable

## What's Good

**API design** — `DataGridProps` is well thought out. The `initialState` / `onStateChange` pattern for persistence is ergonomic and mirrors how libraries like React Hook Form handle controlled/uncontrolled state. Consumers can opt in or out cleanly.

**Zero dependencies** — Good call for a library. No risk of peer dependency conflicts for consumers.

**CSS custom properties** — Theming via `--dg-*` variables in `:root` is the right approach. Easy to override without specificity battles.

**Data pipeline** — The `filterRows → sortRows → groupRows → flattenTree → paginate → virtualize` chain is clean and easy to follow.

**Virtualization from scratch** — Avoids adding a dependency like `react-virtual`. The implementation is straightforward.

---

## What Needs to Be Fixed

### Bugs

**1. Pagination doesn't reset when filters change**

When a user is on page 3 and types in a filter, `currentPage` stays at 3. If the filtered result has fewer pages, the table shows nothing. Add this effect:

```ts
useEffect(() => {
  setCurrentPage(1);
}, [filters]);
```

**2. Mouse event listener leak during column resize**

`handleMouseUp` is a plain function (not `useCallback`), so its reference changes on every render. The `removeEventListener` call inside it won't match the reference that was added — the global `mousemove` listener leaks if the component re-renders during a drag. Also, if the component unmounts mid-drag, neither listener is ever cleaned up.

Fix with a `useEffect`-based approach or at minimum wrap `handleMouseUp` in `useCallback` and manage listeners in a `useEffect` with a cleanup.

**3. `/* eslint-disable */` is masking real issues**

This disables all lint rules for the entire file, which hides `react-hooks/exhaustive-deps` violations and `any` type warnings. Remove it and fix what surfaces — it's likely pointing at the two issues above.

---

### Architecture

**4. The entire library is one 629-line file**

This works now but becomes hard to maintain as features are added. Natural split:

```
src/
  types.ts               # all exported interfaces
  utils.ts               # filterRows, sortRows, groupRows, flattenTree
  components/
    ActionCell.tsx
  hooks/
    useColumnResize.ts
  EssealDataTable.tsx    # just the main component
```

**5. `cols` state doesn't sync if the `columns` prop changes**

```ts
const [cols, setCols] = useState(initialColumns);
```

If the parent re-renders with different columns (e.g., dynamic column config), the table ignores the update. Either rename the prop to `initialColumns` to signal this is intentional, or sync with a `useEffect`.

**6. `onStateChange` will over-fire if the consumer doesn't memoize it**

It's in the `useEffect` dependency array. Every parent re-render that creates a new function reference will trigger the effect even though state didn't actually change. Document this requirement, or derive a stable ref internally:

```ts
const onStateChangeRef = useRef(onStateChange);
useEffect(() => { onStateChangeRef.current = onStateChange; });
// use onStateChangeRef.current(...) inside the effect
```

---

### UX Issues

**7. Grouping + pagination produces broken UX**

Pagination currently slices the *flattened tree*, so a single page can contain the tail of one group and the start of another. Group rows get split across pages in a confusing way. Pagination and grouping should either be mutually exclusive (throw a warning), or pagination should happen at the group level before flattening.

**8. No accessibility**

The layout uses `div`s for performance reasons (CSS grid), which is valid — but there are no ARIA roles at all. At minimum: `role="grid"` on the container, `role="row"`, `role="columnheader"`, `role="gridcell"`, and `aria-sort` on sortable headers. There's also no keyboard navigation (Tab, Arrow keys, Enter/Space on rows), which makes the component unusable without a mouse.

---

### Minor

**9. Heavy `as any` casting in the render**

`(row as any)[col.field]`, `(row as any)[currentKey]`, etc. appear ~8 times. This is mostly a symptom of `field: keyof T | string` — the `| string` escape hatch forces the casts. Consider whether the string escape is necessary or if stricter typing would work for your use cases.

**10. Magic numbers in the actions column width**

```ts
width: 60 + (maxVisibleActions * 35)
```

These numbers should be named constants, and ideally match the actual button dimensions from the CSS (`padding: 4px 8px`).

---

## Priority Summary

| Priority | Issue | Status |
|---|---|---|
| Fix now | Pagination not resetting on filter change | ✅ Resolved |
| Fix now | Resize listener leak / no unmount cleanup | ✅ Resolved |
| Fix now | Remove `eslint-disable` | ⏭️ Skipped |
| Soon | File structure — split into modules | ✅ Resolved |
| Soon | Grouping + pagination interaction | ⏭️ Skipped |
| Soon | `onStateChange` over-firing | ✅ Resolved |
| Later | ARIA / keyboard nav | ✅ Resolved (roles + aria attrs; keyboard nav deferred) |
| Later | `cols` prop sync | ✅ Resolved |
| Later | Type safety / `as any` | ⏭️ Skipped |
