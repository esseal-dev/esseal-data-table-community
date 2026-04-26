# Configuration

## CSS import

All visual styling is shipped as a single extracted CSS file. Import it once:

```ts
import 'esseal-data-table/style.css';
```

If your bundler does not support bare CSS imports, use the full path:

```ts
import 'esseal-data-table/dist/esseal-data-table.css';
```

---

## CSS custom properties (theming)

Every visual property is controlled by CSS custom properties declared on `:root`. Override
them globally or scope overrides to a specific container.

### Global override

```css
:root {
  --dg-primary:       #6366f1;
  --dg-primary-hover: #4f46e5;
  --dg-primary-light: #eef2ff;
  --dg-selection-bg:  #f5f3ff;
}
```

### Scoped to one table instance

Wrap the table in a container and override the variables on that container:

```tsx
<div className="my-table">
  <EssealDataTable rows={rows} columns={columns} />
</div>
```

```css
.my-table {
  --dg-primary:    #10b981;
  --dg-surface:    #f0fdf4;
  --dg-border:     #d1fae5;
}
```

---

## Available CSS variables

### Colour — brand

| Variable | Default | Used for |
|---|---|---|
| `--dg-primary` | `#0ea5e9` | Sort indicators, focus rings, active states |
| `--dg-primary-hover` | `#0284c7` | Hover state on primary-coloured elements |
| `--dg-primary-light` | `#e0f2fe` | Group row background, active menu item highlight |
| `--dg-selection-bg` | `#f0f9ff` | Background of selected (checkbox) rows |

### Colour — surfaces

| Variable | Default | Used for |
|---|---|---|
| `--dg-surface` | `#ffffff` | Cell background, toolbar background, pinned cell background |
| `--dg-surface-alt` | `#f8fafc` | Header row background, alternating (even) row background |
| `--dg-surface-hover` | `#f1f5f9` | Row hover background, menu item hover background |

### Colour — borders

| Variable | Default | Used for |
|---|---|---|
| `--dg-border` | `#e2e8f0` | Column separators, footer border, menu borders |
| `--dg-border-light` | `#f1f5f9` | Subtle horizontal separators between rows |

### Colour — text

| Variable | Default | Used for |
|---|---|---|
| `--dg-text-primary` | `#0f172a` | Cell content, header titles |
| `--dg-text-secondary` | `#64748b` | Footer text, secondary labels |
| `--dg-text-muted` | `#94a3b8` | Filter input placeholder, disabled states, load-more spinner |

---

## Dark mode example

```css
@media (prefers-color-scheme: dark) {
  :root {
    --dg-primary:        #38bdf8;
    --dg-primary-hover:  #7dd3fc;
    --dg-primary-light:  #0c4a6e;
    --dg-selection-bg:   #0c4a6e;

    --dg-surface:        #1e293b;
    --dg-surface-alt:    #0f172a;
    --dg-surface-hover:  #334155;

    --dg-border:         #334155;
    --dg-border-light:   #1e293b;

    --dg-text-primary:   #f1f5f9;
    --dg-text-secondary: #94a3b8;
    --dg-text-muted:     #64748b;
  }
}
```

---

## CSS class names

All component-internal class names use the `.dg-` prefix. You can target them directly
in your own CSS for structural overrides that go beyond colour changes.

| Class | Element |
|---|---|
| `.dg-container` | Root table container |
| `.dg-toolbar` | Toolbar bar across the top |
| `.dg-viewport` | Scrollable body area |
| `.dg-header-row` | The fixed header row |
| `.dg-header-cell` | Individual header cell |
| `.dg-header-title` | Clickable sort area inside a header |
| `.dg-column-filter` | Filter `<input>` in the header |
| `.dg-resizer` | Drag-resize handle on the right edge of a header |
| `.dg-body` | Virtualised row container |
| `.dg-row` | A data row |
| `.dg-row.selected` | A selected data row |
| `.dg-cell` | A data cell |
| `.dg-cell.pinned-left` | Left-pinned data cell |
| `.dg-cell.pinned-right` | Right-pinned data cell |
| `.dg-group-row` | A group header row |
| `.dg-load-more-row` | The load-more / loading / error row inside an expanded server group |
| `.dg-load-more-btn` | "Load more" and "Retry" buttons |
| `.dg-load-more-error` | Error state modifier on `.dg-load-more-btn` |
| `.dg-load-more-spinner` | "Loading…" text during group fetch |
| `.dg-footer` | Pagination footer |
| `.dg-page-btn` | Prev / Next buttons |
| `.dg-page-size-select` | Page-size `<select>` in the footer |
| `.dg-selection-count` | "N selected" label in the footer |
| `.dg-overlay` | Full-table loading overlay |
| `.dg-no-rows` | "No rows found" empty state |
| `.dg-menu` | Column-visibility and pin menus |
| `.dg-menu-item` | Item inside a `.dg-menu` |
| `.dg-action-btn` | Inline row action button |
| `.dg-action-dropdown` | Overflow action menu (portalled to `document.body`) |
| `.dg-dropdown-item` | Item inside the overflow menu |
| `.dg-checkbox` | Checkbox `<input>` in the checkbox column and select-all header |
| `.dg-pin-icon` | Pin icon button in the column header |
| `.dg-toolbar-btn` | Built-in Columns button in the toolbar |

> ⚠️ These class names are implementation details. They may change between minor
> versions. Where possible, prefer CSS variables for theming and only target class
> names for structural changes that have no variable equivalent.

---

## Module resolution

The package ships three artefacts:

| Format | Path | Use case |
|---|---|---|
| ESM | `dist/esseal-data-table.js` | Vite, Next.js, modern bundlers (resolved via `"module"` / `"exports"`) |
| UMD | `dist/esseal-data-table.umd.cjs` | CommonJS environments, older bundlers |
| CSS | `dist/esseal-data-table.css` | Imported via `esseal-data-table/style.css` |
| Types | `dist/index.d.ts` | TypeScript declarations (rolled-up into a single file) |

React and react-dom are **peer dependencies** and are not bundled. Your project's copy
is used at runtime.
