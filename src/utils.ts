import type { FilterModel, SortModel, GroupNode, RowNode } from './types';

export function filterRows<T>(rows: T[], filters: FilterModel): T[] {
  const activeFilters = Object.entries(filters).filter(([, val]) => val.trim() !== '');
  if (activeFilters.length === 0) return rows;
  return rows.filter(row =>
    activeFilters.every(([field, val]) =>
      String((row as any)[field] || '').toLowerCase().includes(val.toLowerCase())
    )
  );
}

export function sortRows<T>(rows: T[], sortModel: SortModel | null): T[] {
  if (!sortModel) return rows;
  return [...rows].sort((a, b) => {
    const valA = (a as any)[sortModel.field];
    const valB = (b as any)[sortModel.field];
    if (valA < valB) return sortModel.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortModel.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupRows<T extends { id: string | number }>(
  rows: T[],
  groupByKeys: (keyof T)[],
  depth = 0,
  parentId = 'root'
): (GroupNode<T> | RowNode<T>)[] {
  if (!groupByKeys || groupByKeys.length === 0) {
    return rows.map(r => ({ type: 'row', id: r.id, data: r }));
  }

  const currentKey = groupByKeys[0];
  const groups: Record<string, T[]> = {};
  rows.forEach(row => {
    const value = String((row as any)[currentKey]);
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
    children: groupRows(groups[groupValue], groupByKeys.slice(1), depth + 1, `${parentId}__${String(currentKey)}-${groupValue}`),
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
