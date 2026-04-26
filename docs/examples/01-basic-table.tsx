/**
 * Example 01 — Basic table with sorting, filtering, pagination, and row actions.
 *
 * Run this inside any React 18 app that has esseal-data-table installed:
 *   npm install esseal-data-table
 */

import React, { useState } from 'react';
import { EssealDataTable } from 'esseal-data-table';
import type { GridColDef, GridAction } from 'esseal-data-table';
import 'esseal-data-table/style.css';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive';
  salary: number;
}

const ROWS: Employee[] = [
  { id: 1, name: 'Alice Johnson',  role: 'Engineer',  department: 'Engineering', status: 'Active',   salary: 95000 },
  { id: 2, name: 'Bob Smith',      role: 'Designer',  department: 'Design',      status: 'Active',   salary: 82000 },
  { id: 3, name: 'Carol White',    role: 'Manager',   department: 'Engineering', status: 'Inactive', salary: 115000 },
  { id: 4, name: 'David Lee',      role: 'Engineer',  department: 'Engineering', status: 'Active',   salary: 88000 },
  { id: 5, name: 'Eva Martinez',   role: 'Analyst',   department: 'Finance',     status: 'Active',   salary: 79000 },
  { id: 6, name: 'Frank Brown',    role: 'Designer',  department: 'Design',      status: 'Inactive', salary: 77000 },
  { id: 7, name: 'Grace Kim',      role: 'Engineer',  department: 'Engineering', status: 'Active',   salary: 91000 },
  { id: 8, name: 'Henry Wilson',   role: 'Manager',   department: 'Finance',     status: 'Active',   salary: 122000 },
  { id: 9, name: 'Iris Chen',      role: 'Engineer',  department: 'Engineering', status: 'Active',   salary: 97000 },
  { id: 10, name: 'Jake Turner',   role: 'Analyst',   department: 'Finance',     status: 'Inactive', salary: 73000 },
  { id: 11, name: 'Karen Patel',   role: 'Specialist',department: 'HR',          status: 'Active',   salary: 68000 },
  { id: 12, name: 'Leo Nguyen',    role: 'Engineer',  department: 'Engineering', status: 'Active',   salary: 93000 },
];

const COLUMNS: GridColDef<Employee>[] = [
  { field: 'id',         headerName: 'ID',         width: 60,  filterable: false },
  { field: 'name',       headerName: 'Name',        width: 180, pinned: 'left' },
  { field: 'role',       headerName: 'Role',        width: 130 },
  { field: 'department', headerName: 'Department',  width: 140 },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
    renderCell: ({ value }) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        background: value === 'Active' ? '#dcfce7' : '#fee2e2',
        color:      value === 'Active' ? '#16a34a' : '#dc2626',
      }}>
        {String(value)}
      </span>
    ),
  },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 110,
    filterable: false,
    renderCell: ({ value }) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        ${(value as number).toLocaleString()}
      </span>
    ),
  },
];

export default function BasicTable() {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const rowActions = (row: Employee): GridAction<Employee>[] => [
    {
      label: 'Edit',
      onClick: (r) => alert(`Edit: ${r.name}`),
    },
    {
      label: 'Deactivate',
      disabled: row.status === 'Inactive',
      tooltipText: row.status === 'Inactive' ? 'Already inactive' : 'Deactivate this employee',
      onClick: (r) => alert(`Deactivate: ${r.name}`),
    },
    {
      label: 'Delete',
      onClick: (r) => alert(`Delete: ${r.name} (id=${r.id})`),
    },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, height: '100vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Employee Directory</h2>

      {selectedIds.length > 0 && (
        <div style={{ fontSize: 13, color: '#0284c7' }}>
          {selectedIds.length} row(s) selected — IDs: {selectedIds.join(', ')}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <EssealDataTable<Employee>
          rows={ROWS}
          columns={COLUMNS}
          pagination
          pageSize={5}
          checkboxSelection
          maxVisibleActions={1}
          rowActions={rowActions}
          onSelectionChange={setSelectedIds}
          getRowClassName={(row) => row.status === 'Inactive' ? 'row-inactive' : ''}
        />
      </div>

      <style>{`
        .row-inactive .dg-cell { background: #fff5f5; }
      `}</style>
    </div>
  );
}
