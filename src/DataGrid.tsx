/* eslint-disable */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import "./DataGrid.css"

// --- Types ---

export interface GridColDef<T = any> {
  field: keyof T | string;
  headerName: string;
  width: number;
  pinned?: 'left' | 'right' | false;
  sortable?: boolean;
}

export interface GridAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
}

type SortDirection = 'asc' | 'desc';

interface SortModel {
  field: string;
  direction: SortDirection;
}

interface DataGridProps<T> {
  rows: T[];
  columns: GridColDef<T>[];
  groupBy?: (keyof T)[];
  rowHeight?: number;
  height?: number;
  rowActions?: (row: T) => GridAction<T>[];
  maxVisibleActions?: number;
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
  data: T;
};

// --- Helper: Action Cell Component ---
// Updated to be Controlled (state managed by parent)
function ActionCell<T>({
  row,
  actions,
  maxVisible,
  isOpen,
  onToggle,
  onClose,
}: {
  row: T;
  actions: GridAction<T>[];
  maxVisible: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // If clicking inside the menu, do nothing
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      // If clicking the toggle button itself (handled by onToggle), do nothing 
      // We rely on bubbling or specific checks usually, but simplest here is:
      // We attach this listener to document. 
      onClose();
    };

    // Use setTimeout to avoid catching the immediate click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const visibleActions = actions.slice(0, maxVisible);
  const overflowActions = actions.slice(maxVisible);

  return (
    <div className="dg-action-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
      {visibleActions.map((action, idx) => (
        <button
          key={idx}
          className="dg-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(row);
          }}
          title={action.label}
        >
          {action.icon || action.label}
        </button>
      ))}

      {overflowActions.length > 0 && (
        <div className="dg-action-menu-container" ref={menuRef}>
          <button
            className={`dg-action-btn dg-burger-btn ${isOpen ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            ⋮
          </button>

          {isOpen && (
            <div className="dg-action-dropdown">
              {overflowActions.map((action, idx) => (
                <div
                  key={idx}
                  className="dg-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(row);
                    onClose();
                  }}
                >
                  {action.icon && <span style={{ marginRight: 8, display: 'flex' }}>{action.icon}</span>}
                  <span style={{ whiteSpace: 'nowrap' }}>{action.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Helper: Grouping Logic ---
function groupRows<T>(
  rows: T[],
  groupByKeys: (keyof T)[],
  depth = 0,
  parentId = 'root'
): (GroupNode<T> | RowNode<T>)[] {
  if (!groupByKeys || groupByKeys.length === 0) {
    return rows.map((r) => ({ type: 'row', data: r }));
  }

  const currentKey = groupByKeys[0];
  const groups: Record<string, T[]> = {};

  rows.forEach((row) => {
    const value = String((row as any)[currentKey]);
    if (!groups[value]) groups[value] = [];
    groups[value].push(row);
  });

  return Object.keys(groups).map((groupValue) => {
    const groupRowsList = groups[groupValue];
    const uniqueId = `${parentId}__${String(currentKey)}-${groupValue}`;

    return {
      type: 'group',
      id: uniqueId,
      field: currentKey,
      value: groupValue,
      depth: depth,
      count: groupRowsList.length,
      children: groupRows(groupRowsList, groupByKeys.slice(1), depth + 1, uniqueId),
    };
  });
}

// --- Helper: Flatten Tree ---
function flattenTree<T>(
  nodes: (GroupNode<T> | RowNode<T>)[],
  expandedIds: Record<string, boolean>
): (GroupNode<T> | RowNode<T>)[] {
  let flatList: (GroupNode<T> | RowNode<T>)[] = [];

  nodes.forEach((node) => {
    if (node.type === 'row') {
      flatList.push(node);
    } else {
      flatList.push(node);
      if (expandedIds[node.id]) {
        flatList = flatList.concat(flattenTree(node.children, expandedIds));
      }
    }
  });

  return flatList;
}

// --- Helper: Sorting ---
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
export function DataGrid<T extends { id: string | number }>({
  rows,
  columns: initialColumns,
  groupBy = [],
  rowHeight = 40,
  height = 600,
  rowActions,
  maxVisibleActions = 1,
}: DataGridProps<T>) {

  // State
  const [cols, setCols] = useState(initialColumns);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [sortModel, setSortModel] = useState<SortModel | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // NEW: Track which row has the menu open
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);

  // 1. Logic: Prepare Columns
  const { sortedCols, gridTemplateColumns } = useMemo(() => {
    const pinnedLeft = cols.filter((c) => c.pinned === 'left');
    const pinnedRight = cols.filter((c) => c.pinned === 'right');
    const unpinned = cols.filter((c) => !c.pinned);

    if (rowActions) {
      pinnedRight.push({
        field: '__actions',
        headerName: 'Actions',
        width: 60 + (maxVisibleActions * 35),
        pinned: 'right',
        sortable: false,
      });
    }

    const sorted = [...pinnedLeft, ...unpinned, ...pinnedRight];
    const template = sorted.map((c) => `${c.width}px`).join(' ');

    return { sortedCols: sorted, gridTemplateColumns: template };
  }, [cols, rowActions, maxVisibleActions]);

  // Helper: Sticky Offset Calculation
  const getStickyStyle = (index: number) => {
    const col = sortedCols[index];
    const style: React.CSSProperties = {};

    if (col.pinned === 'left') {
      let left = 0;
      for (let i = 0; i < index; i++) left += sortedCols[i].width;
      style.left = left;
      style.position = 'sticky';
      style.zIndex = 2;
    } else if (col.pinned === 'right') {
      let right = 0;
      for (let i = index + 1; i < sortedCols.length; i++) {
        right += sortedCols[i].width;
      }
      style.right = right;
      style.position = 'sticky';
      style.zIndex = 2;
    }

    return style;
  };

  // 2. Logic: Sorting -> Grouping -> Flattening
  const processedRows = useMemo(() => {
    const sorted = sortRows(rows, sortModel);
    const groupedTree = groupRows(sorted, groupBy);
    return flattenTree(groupedTree, expandedGroups);
  }, [rows, groupBy, expandedGroups, sortModel]);

  // 3. Logic: Virtualization
  const totalContentHeight = processedRows.length * rowHeight;
  const buffer = 5;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(
    processedRows.length,
    Math.floor((scrollTop + height) / rowHeight) + buffer
  );

  const visibleRows = processedRows.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  // 4. Handlers
  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    // Optional: Close menu on scroll if desired
    // setActiveMenuRowId(null); 
  };

  const handleHeaderClick = (field: string, sortable?: boolean) => {
    if (sortable === false) return;
    setSortModel((prev) => {
      if (prev?.field === field) {
        return prev.direction === 'asc' ? { field, direction: 'desc' } : null;
      }
      return { field, direction: 'asc' };
    });
  };

  // --- Resizing Logic ---
  const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      index,
      startX: e.clientX,
      startWidth: sortedCols[index].width,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { index, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;

    setCols((prev) => {
      const newCols = [...prev];
      const fieldToUpdate = sortedCols[index].field;
      const targetIndex = newCols.findIndex((c) => c.field === fieldToUpdate);
      if (targetIndex !== -1) {
        newCols[targetIndex] = {
          ...newCols[targetIndex],
          width: Math.max(50, startWidth + diff),
        };
      }
      return newCols;
    });
  }, [sortedCols]);

  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // --- Render ---
  return (
    <div className="dg-container" style={{ height }}>
      <div
        className="dg-viewport"
        ref={viewportRef}
        onScroll={handleScroll}
        style={{ overflowY: 'auto', height: '100%', position: 'relative' }}
      >
        {/* HEADER */}
        <div
          className="dg-header-row"
          style={{
            gridTemplateColumns,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'grid'
          }}
        >
          {sortedCols.map((col, index) => {
            const stickyStyle = getStickyStyle(index);
            if (stickyStyle.position === 'sticky') stickyStyle.zIndex = 12;
            const isSorted = sortModel?.field === col.field;

            return (
              <div
                key={String(col.field)}
                className={`dg-header-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`}
                style={stickyStyle}
                onClick={() => handleHeaderClick(String(col.field), col.sortable)}
              >
                <div className="dg-header-content">
                  <span className="dg-header-text">{col.headerName}</span>
                  {isSorted && (
                    <span className="dg-sort-icon">
                      {sortModel!.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </div>
                {col.field !== '__actions' && (
                  <div
                    className="dg-resizer"
                    onMouseDown={(e) => handleMouseDown(e, index)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* BODY */}
        <div style={{ height: totalContentHeight, position: 'relative' }}>
          <div
            className="dg-body"
            style={{
              gridTemplateColumns,
              display: 'grid',
              transform: `translateY(${offsetY}px)`
            }}
          >
            {visibleRows.map((item) => {
              if (item.type === 'group') {
                return (
                  <div
                    key={item.id}
                    className="dg-group-row"
                    onClick={() => toggleGroup(item.id)}
                    style={{
                      gridColumn: `1 / -1`,
                      paddingLeft: `${item.depth * 20 + 12}px`,
                      height: rowHeight,
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ marginRight: 8, fontSize: '12px' }}>
                      {expandedGroups[item.id] ? '▼' : '▶'}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {String(item.field)}: <strong>{item.value}</strong>
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 8 }}>({item.count})</span>
                    </span>
                  </div>
                );
              }

              const row = item.data;
              const isRowMenuOpen = activeMenuRowId === row.id;

              return (
                <div
                  key={row.id}
                  className="dg-row"
                  style={{ display: 'contents' }}
                >
                  {sortedCols.map((col, index) => {
                    const stickyStyle = getStickyStyle(index);
                    const cellStyle: React.CSSProperties = {
                      ...stickyStyle,
                      height: rowHeight,
                      display: 'flex',
                      alignItems: 'center',
                    };

                    // Action Column Render
                    if (col.field === '__actions' && rowActions) {
                      // Z-INDEX FIX: If this row's menu is open, give this cell a massive z-index
                      // so it renders ON TOP of the subsequent rows.
                      if (isRowMenuOpen) {
                        cellStyle.zIndex = 1000;
                        cellStyle.overflow = 'visible';
                      } else {
                        // Standard sticky z-index is 2, ensure it's set
                        cellStyle.zIndex = 2;
                        cellStyle.overflow = 'visible'; // Action cell always visible for dropdown
                      }

                      return (
                        <div
                          key={`${row.id}-actions`}
                          className={`dg-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`}
                          style={cellStyle}
                        >
                          <ActionCell
                            row={row}
                            actions={rowActions(row)}
                            maxVisible={maxVisibleActions}
                            isOpen={isRowMenuOpen}
                            onToggle={() => setActiveMenuRowId(isRowMenuOpen ? null : row.id)}
                            onClose={() => setActiveMenuRowId(null)}
                          />
                        </div>
                      );
                    }

                    // Standard Cell Render
                    return (
                      <div
                        key={`${row.id}-${String(col.field)}`}
                        className={`dg-cell ${col.pinned ? `pinned-${col.pinned}` : ''}`}
                        style={cellStyle}
                      >
                        {(row as any)[col.field]}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}