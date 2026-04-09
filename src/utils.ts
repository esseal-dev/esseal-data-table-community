import type { FilterModel, SortModel, GroupNode, RowNode } from './types';

type ValueGetters<T> = Record<string, (row: T) => any>;

function getCellValue<T>(row: T, field: string, valueGetters: ValueGetters<T>): any {
  return valueGetters[field] ? valueGetters[field](row) : (row as any)[field];
}

export function filterRows<T>(rows: T[], filters: FilterModel, valueGetters: ValueGetters<T> = {}): T[] {
  const activeFilters = Object.entries(filters).filter(([, val]) => val.trim() !== '');
  if (activeFilters.length === 0) return rows;
  return rows.filter(row =>
    activeFilters.every(([field, val]) =>
      String(getCellValue(row, field, valueGetters) ?? '').toLowerCase().includes(val.toLowerCase())
    )
  );
}

export function sortRows<T>(rows: T[], sortModel: SortModel | null, valueGetters: ValueGetters<T> = {}): T[] {
  if (!sortModel) return rows;
  return [...rows].sort((a, b) => {
    const valA = getCellValue(a, sortModel.field, valueGetters);
    const valB = getCellValue(b, sortModel.field, valueGetters);
    if (valA < valB) return sortModel.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortModel.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupRows<T>(
  rows: T[],
  groupByKeys: (keyof T)[],
  valueGetters: ValueGetters<T>,
  resolveId: (row: T) => string | number,
  depth = 0,
  parentId = 'root'
): (GroupNode<T> | RowNode<T>)[] {
  if (!groupByKeys || groupByKeys.length === 0) {
    return rows.map(r => ({ type: 'row', id: resolveId(r), data: r }));
  }

  const currentKey = groupByKeys[0];
  const groups: Record<string, T[]> = {};
  rows.forEach(row => {
    const value = String(getCellValue(row, String(currentKey), valueGetters));
    if (!groups[value]) groups[value] = [];
    groups[value].push(row);
  });

  return Object.keys(groups).map(groupValue => ({
    type: 'group',
    id: `${parentId}__${String(currentKey)}-${groupValue}`,
    field: currentKey,
    value: groupValue,
    depth,
    count: groups[groupValue].length,
    children: groupRows(
      groups[groupValue],
      groupByKeys.slice(1),
      valueGetters,
      resolveId,
      depth + 1,
      `${parentId}__${String(currentKey)}-${groupValue}`
    ),
  }));
}

export function flattenTree<T>(
  nodes: (GroupNode<T> | RowNode<T>)[],
  expandedIds: Record<string, boolean>
): (GroupNode<T> | RowNode<T>)[] {
  let flatList: (GroupNode<T> | RowNode<T>)[] = [];
  nodes.forEach(node => {
    flatList.push(node);
    if (node.type === 'group' && expandedIds[node.id]) {
      flatList = flatList.concat(flattenTree(node.children, expandedIds));
    }
  });
  return flatList;
}
