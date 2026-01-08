/* eslint-disable */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// --- CSS Styles (Embedded for Single-File Portability) ---
const gridStyles = `
/* DataGrid Component - EssealTable Theme */
:root {
  --dg-primary: #0ea5e9;
  --dg-primary-hover: #0284c7;
  --dg-primary-light: #e0f2fe;
  --dg-selection-bg: #f0f9ff;

  --dg-surface: #ffffff;
  --dg-surface-alt: #f8fafc;
  --dg-surface-hover: #f1f5f9;

  --dg-border: #e2e8f0;
  --dg-border-light: #f1f5f9;

  --dg-text-primary: #0f172a;
  --dg-text-secondary: #64748b;
  --dg-text-muted: #94a3b8;

  --dg-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --dg-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dg-container {
  background: var(--dg-surface);
  border: 1px solid var(--dg-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--dg-shadow-sm);
  font-family: "Inter", sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Viewport */
.dg-viewport::-webkit-scrollbar { width: 10px; height: 10px; }
.dg-viewport::-webkit-scrollbar-track { background: transparent; }
.dg-viewport::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 5px;
  border: 2px solid var(--dg-surface);
}
.dg-viewport::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Header */
.dg-header-row {
  background: var(--dg-surface-alt);
  border-bottom: 1px solid var(--dg-border);
  font-weight: 600;
  color: var(--dg-text-secondary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  display: grid;
  position: sticky;
  top: 0;
  z-index: 10;
}

.dg-header-cell {
  padding: 8px 12px;
  border-right: 1px solid var(--dg-border-light);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  position: relative;
  background: var(--dg-surface-alt);
  transition: background 0.2s;
}
.dg-header-cell:hover { background: var(--dg-surface-hover); }

.dg-header-main {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  min-height: 20px;
}

/* Column Filter Input */
.dg-column-filter {
  width: 100%;
  box-sizing: border-box; 
  min-width: 0;
  padding: 4px 6px;
  border: 1px solid var(--dg-border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--dg-text-primary);
  margin-top: 2px;
  outline: none;
}
.dg-column-filter:focus { border-color: var(--dg-primary); }

/* Rows */
.dg-body {
  display: grid;
}
.dg-row { display: contents; }
.dg-row:hover .dg-cell { background: var(--dg-surface-hover); }
.dg-row.selected .dg-cell { background: var(--dg-selection-bg); }

.dg-cell {
  padding: 0 12px;
  font-size: 14px;
  color: var(--dg-text-primary);
  border-bottom: 1px solid var(--dg-border-light);
  border-right: 1px solid var(--dg-border-light);
  background: var(--dg-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

/* Group Row */
.dg-group-row {
  background: var(--dg-primary-light);
  border-bottom: 1px solid var(--dg-border);
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--dg-text-primary);
  font-weight: 500;
}

/* Resizer */
.dg-resizer {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
}
.dg-resizer:hover, .dg-resizer:active { background: var(--dg-primary); }

/* Overlays */
.dg-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(1px);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--dg-text-secondary);
  font-weight: 500;
}

.dg-no-rows {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dg-text-muted);
  font-size: 14px;
  padding: 20px;
}

/* Footer */
.dg-footer {
  height: 40px;
  border-top: 1px solid var(--dg-border);
  background: var(--dg-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 13px;
  color: var(--dg-text-secondary);
}
.dg-page-btn {
  border: 1px solid var(--dg-border);
  background: white;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.dg-page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Actions */
.dg-action-btn {
  padding: 4px 8px;
  background: white;
  border: 1px solid var(--dg-border);
  border-radius: 4px;
  cursor: pointer;
}
.dg-action-dropdown {
  position: absolute;
  top: 100%; right: 0;
  background: white;
  border: 1px solid var(--dg-border);
  box-shadow: var(--dg-shadow-md);
  z-index: 100;
  border-radius: 4px;
  padding: 4px;
  min-width: 120px;
}
.dg-dropdown-item {
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 2px;
}
.dg-dropdown-item:hover { background: var(--dg-surface-hover); color: var(--dg-primary); }

/* Pinned Cols */
.pinned-left { position: sticky; left: 0; z-index: 2; border-right: 1px solid #cbd5e1; }
.pinned-right { position: sticky; right: 0; z-index: 2; border-left: 1px solid #cbd5e1; }
.dg-header-cell.pinned-left, .dg-header-cell.pinned-right { z-index: 12; background: var(--dg-surface-alt); }
.dg-cell.pinned-left, .dg-cell.pinned-right { background: var(--dg-surface); }
`;

// --- Types ---

export interface GridRenderCellParams<T = any> {
  value: any;
  row: T;
  field: string;
}

export interface GridColDef<T = any> {
  field: keyof T | string;
  headerName: string;
  width: number;
  pinned?: 'left' | 'right' | false;
  hide?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (params: GridRenderCellParams<T>) => React.ReactNode;
}

export interface GridAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
}

type SortDirection = 'asc' | 'desc';

export interface SortModel {
  field: string;
  direction: SortDirection;
}

export interface FilterModel {
  [field: string]: string;
}

// -- Persistence Types (Updated) --
export interface TableState {
  page: number;
  sortModel: SortModel | null;
  filterModel: FilterModel;
  expandedGroups: Record<string, boolean>;
  groupBy: string[];    // New: Stores which columns are grouped
  rowHeight: number;    // New: Stores density (compact/standard)
}

export interface DataGridProps<T> {
  rows: T[];
  columns: GridColDef<T>[];
  groupBy?: (keyof T)[]; // Treated as default/fallback if passed
  rowHeight?: number;    // Treated as default/fallback if passed
  height?: number;
  loading?: boolean;

  // Persistence Props
  initialState?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;

  // Actions
  rowActions?: (row: T) => GridAction<T>[];
  maxVisibleActions?: number;

  // Features
  checkboxSelection?: boolean;
  pagination?: boolean;
  pageSize?: number;

  // Events
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
}

// Internal node types
type GroupNode<T> = {
  type: 'group';
  id: string;
  field: keyof T;
  value: string;
  depth: number;
  count: number;
  children: (GroupNode<T> | RowNode<T>)[];
};

type RowNode<T> = {
  type: 'row';
  id: string | number;
  data: T;
};

// --- Helper: Action Cell ---
function ActionCell<T>({ row, actions, maxVisible, isOpen, onToggle, onClose }: any) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const visible = actions.slice(0, maxVisible);
  const overflow = actions.slice(maxVisible);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%', position: 'relative' }}>
      {visible.map((a: any, i: number) => (
        <button key={i} className="dg-action-btn" onClick={(e) => { e.stopPropagation(); a.onClick(row); }}>{a.icon || a.label}</button>
      ))}
      {overflow.length > 0 && (
        <div ref={menuRef}>
          <button className="dg-action-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>⋮</button>
          {isOpen && (
            <div className="dg-action-dropdown">
              {overflow.map((a: any, i: number) => (
                <div key={i} className="dg-dropdown-item" onClick={(e) => { e.stopPropagation(); a.onClick(row); onClose(); }}>
                  {a.icon} {a.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Helper: Grouping ---
function groupRows<T extends { id: string | number }>(
  rows: T[],
  groupByKeys: (keyof T)[],
  depth = 0,
  parentId = 'root'
): (GroupNode<T> | RowNode<T>)[] {
  if (!groupByKeys || groupByKeys.length === 0) return rows.map((r) => ({ type: 'row', id: r.id, data: r }));

  const currentKey = groupByKeys[0];
  const groups: Record<string, T[]> = {};

  rows.forEach((row) => {
    const value = String((row as any)[currentKey]);
    if (!groups[value]) groups[value] = [];
    groups[value].push(row);
  });

  return Object.keys(groups).map((groupValue) => ({
    type: 'group',
    id: `${parentId}__${String(currentKey)}-${groupValue}`,
    field: currentKey,
    value: groupValue,
    depth: depth,
    count: groups[groupValue].length,
    children: groupRows(groups[groupValue], groupByKeys.slice(1), depth + 1),
  }));
}

// --- Helper: Flatten Tree ---
function flattenTree<T>(
  nodes: (GroupNode<T> | RowNode<T>)[],
  expandedIds: Record<string, boolean>
): (GroupNode<T> | RowNode<T>)[] {
  let flatList: (GroupNode<T> | RowNode<T>)[] = [];
  nodes.forEach((node) => {
    flatList.push(node);
    if (node.type === 'group' && expandedIds[node.id]) {
      flatList = flatList.concat(flattenTree(node.children, expandedIds));
    }
  });
  return flatList;
}

// --- Helper: Filtering & Sorting ---
function filterRows<T>(rows: T[], filters: FilterModel): T[] {
  const activeFilters = Object.entries(filters).filter(([_, val]) => val.trim() !== '');
  if (activeFilters.length === 0) return rows;
  return rows.filter(row => activeFilters.every(([field, val]) =>
    String((row as any)[field] || '').toLowerCase().includes(val.toLowerCase())
  ));
}

function sortRows<T>(rows: T[], sortModel: SortModel | null): T[] {
  if (!sortModel) return rows;
  return [...rows].sort((a, b) => {
    const valA = (a as any)[sortModel.field];
    const valB = (b as any)[sortModel.field];
    if (valA < valB) return sortModel.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortModel.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// --- Main Component ---
export function EssealTable<T extends { id: string | number }>({
  rows,
  columns: initialColumns,
  groupBy = [],
  rowHeight = 40,
  height = 600,
  loading = false,
  initialState,
  onStateChange,
  rowActions,
  maxVisibleActions = 1,
  checkboxSelection = false,
  pagination = false,
  pageSize = 10,
  onSelectionChange
}: DataGridProps<T>) {

  const [cols, setCols] = useState(initialColumns);

  // -- State Initialization --
  // We prioritize initialState, then fallback to props, then default values.
  const [activeGroupBy, setActiveGroupBy] = useState<string[]>(
    initialState?.groupBy ?? (groupBy as string[]) ?? []
  );

  const [activeRowHeight, setActiveRowHeight] = useState<number>(
    initialState?.rowHeight ?? rowHeight ?? 40
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(initialState?.expandedGroups ?? {});
  const [sortModel, setSortModel] = useState<SortModel | null>(initialState?.sortModel ?? null);
  const [filters, setFilters] = useState<FilterModel>(initialState?.filterModel ?? {});
  const [currentPage, setCurrentPage] = useState(initialState?.page ?? 1);

  const [selection, setSelection] = useState<Set<string | number>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);

  // -- Persistence Effect --
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (onStateChange) {
      const currentState: TableState = {
        page: currentPage,
        sortModel,
        filterModel: filters,
        expandedGroups,
        groupBy: activeGroupBy,   // Persisting Grouping
        rowHeight: activeRowHeight // Persisting Density
      };
      onStateChange(currentState);
    }
  }, [currentPage, sortModel, filters, expandedGroups, activeGroupBy, activeRowHeight, onStateChange]);

  // Inject Styles
  useEffect(() => {
    if (!document.getElementById('esseal-table-styles')) {
      const style = document.createElement('style');
      style.id = 'esseal-table-styles';
      style.textContent = gridStyles;
      document.head.appendChild(style);
    }
  }, []);

  // 1. Column Processing
  const { sortedCols, gridTemplateColumns } = useMemo(() => {
    const visibleCols = cols.filter(c => !c.hide);
    const pinnedLeft = visibleCols.filter(c => c.pinned === 'left');
    const pinnedRight = visibleCols.filter(c => c.pinned === 'right');
    const unpinned = visibleCols.filter(c => !c.pinned);

    if (checkboxSelection) {
      pinnedLeft.unshift({ field: '__checkbox', headerName: '', width: 40, pinned: 'left', sortable: false, filterable: false });
    }

    if (rowActions) {
      pinnedRight.push({
        field: '__actions',
        headerName: 'Actions',
        width: 60 + (maxVisibleActions * 35),
        pinned: 'right',
        sortable: false,
        filterable: false
      });
    }

    const sorted = [...pinnedLeft, ...unpinned, ...pinnedRight];
    return { sortedCols: sorted, gridTemplateColumns: sorted.map(c => `${c.width}px`).join(' ') };
  }, [cols, rowActions, maxVisibleActions, checkboxSelection]);

  // 2. Data Pipeline (Updated to use activeGroupBy from state)
  const processedRows = useMemo(() => {
    let res = filterRows(rows, filters);
    res = sortRows(res, sortModel);
    // Use activeGroupBy instead of the prop
    const tree = groupRows(res, activeGroupBy as (keyof T)[]);
    return flattenTree(tree, expandedGroups);
  }, [rows, filters, sortModel, activeGroupBy, expandedGroups]);

  // 3. Pagination & Virtualization
  const rowsToRender = useMemo(() => {
    if (!pagination) return processedRows;
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, pagination, currentPage, pageSize]);

  const totalPages = pagination ? Math.ceil(processedRows.length / pageSize) : 1;
  const totalContentHeight = rowsToRender.length * activeRowHeight; // Use activeRowHeight

  // Virtualization calculations
  const buffer = 4;
  const startIndex = Math.floor(scrollTop / activeRowHeight);
  const endIndex = Math.min(rowsToRender.length, Math.floor((scrollTop + height) / activeRowHeight) + buffer);
  const visibleRows = rowsToRender.slice(startIndex, endIndex);
  const offsetY = startIndex * activeRowHeight;

  // Handlers
  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSel = e.target.checked ? new Set(rows.map(r => r.id)) : new Set<string | number>();
    setSelection(newSel);
    onSelectionChange?.(Array.from(newSel));
  };

  const handleSelectRow = (id: string | number) => {
    const newSel = new Set(selection);
    if (newSel.has(id)) newSel.delete(id); else newSel.add(id);
    setSelection(newSel);
    onSelectionChange?.(Array.from(newSel));
  };

  // Resize Logic
  const resizingRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);
  const handleMouseDown = (e: React.MouseEvent, field: string, width: number) => {
    e.preventDefault(); e.stopPropagation();
    resizingRef.current = { field, startX: e.clientX, startWidth: width };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { field, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    setCols(prev => prev.map(c => c.field === field ? { ...c, width: Math.max(50, startWidth + diff) } : c));
  }, []);
  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Sticky Logic
  const getStickyStyle = (index: number) => {
    const col = sortedCols[index];
    const style: React.CSSProperties = {};
    if (col.pinned === 'left') {
      style.left = sortedCols.slice(0, index).reduce((acc, c) => acc + c.width, 0);
      style.position = 'sticky'; style.zIndex = 2;
    } else if (col.pinned === 'right') {
      style.right = sortedCols.slice(index + 1).reduce((acc, c) => acc + c.width, 0);
      style.position = 'sticky'; style.zIndex = 2;
    }
    return style;
  };

  return (
    <div className="dg-container" style={{ height }}>
      {/* Loading Overlay */}
      {loading && <div className="dg-overlay">Loading data...</div>}

      <div className="dg-viewport"
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        style={{ overflowY: 'auto', height: pagination ? 'calc(100% - 40px)' : '100%' }}>

        {/* Header */}
        <div className="dg-header-row" style={{ gridTemplateColumns }}>
          {sortedCols.map((col, idx) => {
            const style = getStickyStyle(idx);
            return (
              <div key={String(col.field)} className={`dg-header-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`} style={style}>
                <div className="dg-header-main" onClick={() => col.sortable !== false && setSortModel(p => p?.field === col.field && p.direction === 'asc' ? { field: String(col.field), direction: 'desc' } : { field: String(col.field), direction: 'asc' })}>
                  {col.field === '__checkbox' ? (
                    <input type="checkbox" onChange={handleSelectAll} className="dg-checkbox" />
                  ) : (
                    <>
                      <span>{col.headerName}</span>
                      {sortModel?.field === col.field && <span>{sortModel.direction === 'asc' ? ' ↑' : ' ↓'}</span>}
                    </>
                  )}
                </div>
                {col.filterable !== false && !['__checkbox', '__actions'].includes(String(col.field)) && (
                  <input
                    className="dg-column-filter"
                    placeholder="search..."
                    value={filters[col.field as string] || ''}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setFilters(p => ({ ...p, [col.field as string]: e.target.value }))}
                  />
                )}
                {!['__checkbox', '__actions'].includes(String(col.field)) && (
                  <div className="dg-resizer" onMouseDown={e => handleMouseDown(e, String(col.field), col.width)} onClick={e => e.stopPropagation()} />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ height: totalContentHeight, position: 'relative' }}>
          {processedRows.length === 0 && !loading && (
            <div className="dg-no-rows" style={{ gridTemplateColumns }}>No rows found</div>
          )}
          <div className="dg-body" style={{ gridTemplateColumns, transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map((item) => {
              if (item.type === 'group') {
                return (
                  <div key={item.id} className="dg-group-row" onClick={() => toggleGroup(item.id)}
                    style={{ gridColumn: '1 / -1', paddingLeft: `${item.depth * 20 + 12}px`, height: activeRowHeight }}>
                    <span style={{ marginRight: 8 }}>{expandedGroups[item.id] ? '▼' : '▶'}</span>
                    <span>{String(item.field)}: <strong>{item.value}</strong> ({item.count})</span>
                  </div>
                );
              }

              const row = item.data;
              const isSel = selection.has(row.id);
              return (
                <div key={row.id} className={`dg-row ${isSel ? 'selected' : ''}`}>
                  {sortedCols.map((col, idx) => {
                    const style = { ...getStickyStyle(idx), height: activeRowHeight };
                    if (col.field === '__checkbox') {
                      return <div key={`${row.id}-cb`} className={`dg-cell ${col.pinned || ''}`} style={style}>
                        <input type="checkbox" checked={isSel} onChange={() => handleSelectRow(row.id)} className="dg-checkbox" />
                      </div>;
                    }
                    if (col.field === '__actions' && rowActions) {
                      const isOpen = activeMenuRowId === row.id;
                      if (isOpen) style.zIndex = 99; // Elevate active action cell
                      return <div key={`${row.id}-act`} className={`dg-cell ${col.pinned || ''}`} style={{ ...style, overflow: 'visible' }}>
                        <ActionCell row={row} actions={rowActions(row)} maxVisible={maxVisibleActions}
                          isOpen={isOpen} onToggle={() => setActiveMenuRowId(isOpen ? null : row.id)} onClose={() => setActiveMenuRowId(null)} />
                      </div>;
                    }
                    // -- RENDER CELL LOGIC --
                    return (
                      <div key={`${row.id}-${String(col.field)}`} className={`dg-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`} style={style}>
                        {col.renderCell
                          ? col.renderCell({ row, value: (row as any)[col.field], field: String(col.field) })
                          : (row as any)[col.field]
                        }
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="dg-footer">
          <div>Showing {Math.min(processedRows.length, (currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, processedRows.length)} of {processedRows.length}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="dg-page-btn">Prev</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="dg-page-btn">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
