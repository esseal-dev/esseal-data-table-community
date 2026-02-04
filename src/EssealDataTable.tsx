/* eslint-disable */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './EssealDataTable.css'

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
  tooltipText?: string;
  onClick: (row: T) => void;
}

type SortDirection = 'asc' | 'desc';
type PinDirection = 'left' | 'right' | false;

export interface SortModel {
  field: string;
  direction: SortDirection;
}

export interface FilterModel {
  [field: string]: string;
}

export interface TableState {
  page: number;
  sortModel: SortModel | null;
  filterModel: FilterModel;
  expandedGroups: Record<string, boolean>;
  columnVisibility: Record<string, boolean>;
  pinnedColumns: Record<string, PinDirection>; // New: Pinned Columns State
}

export interface DataGridProps<T> {
  rows: T[];
  columns: GridColDef<T>[];
  groupBy?: (keyof T)[];
  rowHeight?: number;
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
  disableColumnMenu?: boolean;
  toolbar?: React.ReactNode

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

interface ActionCellProps<T> {
  row: T;
  actions: GridAction<T>[];
  maxVisible: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// --- Helper: Icons ---
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>
);

// --- Helper: Action Cell ---
function ActionCell<T>({ row, actions, maxVisible, isOpen, onToggle, onClose }: ActionCellProps<T>) {
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
      {visible.map((a, i: number) => (
        <button
          key={i}
          title={a.tooltipText || a.label}
          className="dg-action-btn"
          onClick={(e) => { e.stopPropagation(); a.onClick(row); }}
        >
          {a.icon || a.label}
        </button>
      ))}
      {overflow.length > 0 && (
        <div ref={menuRef}>
          <button className="dg-action-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>⋮</button>
          {isOpen && (
            <div className="dg-action-dropdown">
              {overflow.map((a, i: number) => (
                <div
                  key={i}
                  title={a.tooltipText || a.label}
                  className="dg-dropdown-item"
                  onClick={(e) => { e.stopPropagation(); a.onClick(row); onClose(); }}
                >
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
export default function EssealDataTable<T extends { id: string | number }>({
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
  disableColumnMenu = false,
  toolbar = undefined,
  onSelectionChange
}: DataGridProps<T>) {

  const [cols, setCols] = useState(initialColumns);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (initialState?.columnVisibility) return initialState.columnVisibility;
    const defaults: Record<string, boolean> = {};
    initialColumns.forEach(c => {
      defaults[String(c.field)] = !c.hide;
    });
    return defaults;
  });

  // NEW: Pinned Columns State
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, PinDirection>>(() => {
    if (initialState?.pinnedColumns) return initialState.pinnedColumns;
    const defaults: Record<string, PinDirection> = {};
    initialColumns.forEach(c => {
      if (c.pinned) defaults[String(c.field)] = c.pinned;
    });
    return defaults;
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(initialState?.expandedGroups ?? {});
  const [sortModel, setSortModel] = useState<SortModel | null>(initialState?.sortModel ?? null);
  const [filters, setFilters] = useState<FilterModel>(initialState?.filterModel ?? {});
  const [currentPage, setCurrentPage] = useState(initialState?.page ?? 1);

  const [selection, setSelection] = useState<Set<string | number>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);

  // UI State for Menus
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [activePinMenuCol, setActivePinMenuCol] = useState<string | null>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);

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
        columnVisibility,
        pinnedColumns // Persisting Pinned State
      };
      onStateChange(currentState);
    }
  }, [currentPage, sortModel, filters, expandedGroups, columnVisibility, pinnedColumns, onStateChange]);

  // Click Outside Handlers
  useEffect(() => {
    if (!showColumnMenu && !activePinMenuCol) return;
    const handleClick = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
      if (pinMenuRef.current && !pinMenuRef.current.contains(e.target as Node)) {
        setActivePinMenuCol(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColumnMenu, activePinMenuCol]);

  // Column Handlers
  const toggleColumn = (field: string) => {
    setColumnVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePinColumn = (field: string, direction: PinDirection) => {
    setPinnedColumns(prev => ({ ...prev, [field]: direction }));
    setActivePinMenuCol(null);
  };

  // 1. Column Processing (Updated to use Pinned State)
  const { sortedCols, gridTemplateColumns } = useMemo(() => {
    // Filter visible
    const visibleCols = cols.filter(c => columnVisibility[String(c.field)] !== false);

    // Sort by Pinning State
    const pinnedLeft = visibleCols.filter(c => pinnedColumns[String(c.field)] === 'left');
    const pinnedRight = visibleCols.filter(c => pinnedColumns[String(c.field)] === 'right');
    const unpinned = visibleCols.filter(c => !pinnedColumns[String(c.field)] && c.field !== '__checkbox' && c.field !== '__actions');

    // Re-inject System Columns if enabled
    if (checkboxSelection) {
      // Ensure checkbox is always left pinned
      pinnedLeft.unshift({ field: '__checkbox', headerName: '', width: 40, pinned: 'left', sortable: false, filterable: false });
    }

    if (rowActions) {
      // Ensure actions is always right pinned
      pinnedRight.push({
        field: '__actions',
        headerName: 'Actions',
        width: 60 + (maxVisibleActions * 35),
        pinned: 'right',
        sortable: false,
        filterable: false
      });
    }

    // Attach "virtual" pinned status to the column objects so the renderer knows where to stick them
    const attachPin = (c: GridColDef<T>, p: 'left' | 'right' | false): GridColDef<T> => ({ ...c, pinned: p });

    const finalCols = [
      ...pinnedLeft.map(c => attachPin(c, 'left')),
      ...unpinned.map(c => attachPin(c, false)),
      ...pinnedRight.map(c => attachPin(c, 'right'))
    ];

    return { sortedCols: finalCols, gridTemplateColumns: finalCols.map(c => `${c.width}px`).join(' ') };
  }, [cols, columnVisibility, pinnedColumns, rowActions, maxVisibleActions, checkboxSelection]);

  // 2. Data Pipeline
  const processedRows = useMemo(() => {
    let res = filterRows(rows, filters);
    res = sortRows(res, sortModel);
    const tree = groupRows(res, groupBy as (keyof T)[]);
    return flattenTree(tree, expandedGroups);
  }, [rows, filters, sortModel, groupBy, expandedGroups]);

  // 3. Pagination & Virtualization
  const rowsToRender = useMemo(() => {
    if (!pagination) return processedRows;
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, pagination, currentPage, pageSize]);

  const totalPages = pagination ? Math.ceil(processedRows.length / pageSize) : 1;
  const totalContentHeight = rowsToRender.length * rowHeight;

  // Virtualization calculations
  const buffer = 4;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(rowsToRender.length, Math.floor((scrollTop + height) / rowHeight) + buffer);
  const visibleRows = rowsToRender.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

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

      {/* Toolbar */}
      <div className="dg-toolbar">
        {!disableColumnMenu && (
          <div style={{ position: 'relative' }}>
            <button className="dg-toolbar-btn" onClick={() => setShowColumnMenu(!showColumnMenu)}>
              <span>Columns</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {showColumnMenu && (
              <div className="dg-menu dg-column-menu" ref={columnMenuRef}>
                {cols.map(col => (
                  <label key={String(col.field)} className="dg-menu-item">
                    <input
                      type="checkbox"
                      checked={columnVisibility[String(col.field)] !== false}
                      onChange={() => toggleColumn(String(col.field))}
                    />
                    <span>{col.headerName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        <div id="custom-toolbar-buttons">
          {toolbar}
        </div>
      </div>

      <div className="dg-viewport"
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        style={{ overflowY: 'auto', height: pagination ? 'calc(100% - 80px)' : 'calc(100% - 40px)' }}>

        {/* Header */}
        <div className="dg-header-row" style={{ gridTemplateColumns }}>
          {sortedCols.map((col, idx) => {
            const isMenuOpen = activePinMenuCol === col.field;

            // FIX: Boost zIndex if this cell's menu is open, so it sits above sibling sticky headers.
            const style = {
              ...getStickyStyle(idx),
              zIndex: isMenuOpen ? 100 : (col.pinned ? 12 : undefined)
            };

            const isSystemCol = ['__checkbox', '__actions'].includes(String(col.field));
            const isPinned = !!pinnedColumns[String(col.field)];

            return (
              <div key={String(col.field)} className={`dg-header-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`} style={style}>
                <div className="dg-header-main">

                  {/* Left: Title & Sort */}
                  <div className="dg-header-title" onClick={() => col.sortable !== false && !isSystemCol && setSortModel(p => p?.field === col.field && p.direction === 'asc' ? { field: String(col.field), direction: 'desc' } : { field: String(col.field), direction: 'asc' })}>
                    {col.field === '__checkbox' ? (
                      <input type="checkbox" onChange={handleSelectAll} className="dg-checkbox" />
                    ) : (
                      <>
                        <span>{col.headerName}</span>
                        {sortModel?.field === col.field && <span>{sortModel.direction === 'asc' ? ' ↑' : ' ↓'}</span>}
                      </>
                    )}
                  </div>

                  {/* Right: Pin Menu (Not for system cols) */}
                  {!isSystemCol && (
                    <div style={{ position: 'relative' }}>
                      <div
                        className={`dg-pin-icon ${isPinned ? 'pinned' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setActivePinMenuCol(activePinMenuCol === col.field ? null : String(col.field)); }}
                      >
                        <PinIcon />
                      </div>

                      {/* Pin Dropdown */}
                      {activePinMenuCol === col.field && (
                        <div className="dg-menu dg-pin-menu" ref={pinMenuRef}>
                          <div className={`dg-menu-item ${pinnedColumns[String(col.field)] === 'left' ? 'active' : ''}`}
                            onClick={() => handlePinColumn(String(col.field), 'left')}>Pin Left</div>
                          <div className={`dg-menu-item ${pinnedColumns[String(col.field)] === 'right' ? 'active' : ''}`}
                            onClick={() => handlePinColumn(String(col.field), 'right')}>Pin Right</div>
                          <div className={`dg-menu-item ${!pinnedColumns[String(col.field)] ? 'active' : ''}`}
                            onClick={() => handlePinColumn(String(col.field), false)}>No Pin</div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Filter Row */}
                {col.filterable !== false && !isSystemCol && (
                  <input
                    className="dg-column-filter"
                    placeholder="search..."
                    value={filters[col.field as string] || ''}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setFilters(p => ({ ...p, [col.field as string]: e.target.value }))}
                  />
                )}
                {!isSystemCol && (
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
                    style={{ gridColumn: '1 / -1', paddingLeft: `${item.depth * 20 + 12}px`, height: rowHeight }}>
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
                    const style = { ...getStickyStyle(idx), height: rowHeight };
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
