/**
 * Example 03 — Server-side unpaged grouping (Mode 4).
 *
 * Groups are provided by the server with pre-computed counts.
 * Rows are loaded lazily per group when the user expands it.
 * No outer pagination is used — all groups are visible at once.
 *
 * This is the recommended approach for the "Excel power user" pattern:
 * the user sees all groups with correct totals without loading all rows
 * upfront.
 */

import React from 'react';
import { EssealDataTable } from 'esseal-data-table';
import type { GridColDef, LoadGroupDataParams, LoadGroupDataResult, ServerGroupDef } from 'esseal-data-table';
import 'esseal-data-table/style.css';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  location: string;
  salary: number;
  status: 'Active' | 'Inactive';
}

// ── Simulated server ──────────────────────────────────────────────────────────

const ALL_EMPLOYEES: Employee[] = [
  { id: 1,  name: 'Alice Johnson',  role: 'Engineer',  department: 'Engineering', location: 'New York', salary: 95000,  status: 'Active' },
  { id: 2,  name: 'David Lee',      role: 'Engineer',  department: 'Engineering', location: 'Remote',   salary: 88000,  status: 'Active' },
  { id: 3,  name: 'Grace Kim',      role: 'Engineer',  department: 'Engineering', location: 'Remote',   salary: 91000,  status: 'Active' },
  { id: 4,  name: 'Carol White',    role: 'Manager',   department: 'Engineering', location: 'New York', salary: 115000, status: 'Inactive' },
  { id: 5,  name: 'Iris Chen',      role: 'Engineer',  department: 'Engineering', location: 'New York', salary: 97000,  status: 'Active' },
  { id: 6,  name: 'Leo Nguyen',     role: 'Engineer',  department: 'Engineering', location: 'London',   salary: 93000,  status: 'Active' },
  { id: 7,  name: 'Bob Smith',      role: 'Designer',  department: 'Design',      location: 'London',   salary: 82000,  status: 'Active' },
  { id: 8,  name: 'Frank Brown',    role: 'Designer',  department: 'Design',      location: 'London',   salary: 77000,  status: 'Inactive' },
  { id: 9,  name: 'Mia Scott',      role: 'Designer',  department: 'Design',      location: 'New York', salary: 80000,  status: 'Active' },
  { id: 10, name: 'Eva Martinez',   role: 'Analyst',   department: 'Finance',     location: 'Chicago',  salary: 79000,  status: 'Active' },
  { id: 11, name: 'Henry Wilson',   role: 'Manager',   department: 'Finance',     location: 'Chicago',  salary: 122000, status: 'Active' },
  { id: 12, name: 'Jake Turner',    role: 'Analyst',   department: 'Finance',     location: 'Remote',   salary: 73000,  status: 'Inactive' },
  { id: 13, name: 'Olivia Clark',   role: 'Analyst',   department: 'Finance',     location: 'London',   salary: 76000,  status: 'Active' },
  { id: 14, name: 'Karen Patel',    role: 'Specialist',department: 'HR',          location: 'Chicago',  salary: 68000,  status: 'Active' },
  { id: 15, name: 'Nathan Brooks',  role: 'Manager',   department: 'HR',          location: 'Remote',   salary: 108000, status: 'Active' },
];

// Group summary — what the server would return in an aggregation query
const SERVER_GROUPS: ServerGroupDef<Employee>[] = [
  {
    field: 'department',
    groups: [
      { value: 'Engineering', count: 6 },
      { value: 'Design',      count: 3 },
      { value: 'Finance',     count: 4 },
      { value: 'HR',          count: 2 },
    ],
  },
];

async function fetchGroupRows(
  params: LoadGroupDataParams
): Promise<LoadGroupDataResult<Employee>> {
  // Parse the groupId to find which group was expanded.
  // The component generates IDs like: __department-Engineering
  const groupValue = params.groupId.split('-').slice(1).join('-');

  await new Promise(res => setTimeout(res, 500)); // simulate latency

  const rows = ALL_EMPLOYEES.filter(e => e.department === groupValue);

  // No nextCursor — load all rows at once (Mode 4 / unpaged)
  return { rows };
}

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS: GridColDef<Employee>[] = [
  { field: 'id',         headerName: 'ID',         width: 60,  filterable: false, sortable: false },
  { field: 'name',       headerName: 'Name',        width: 180 },
  { field: 'role',       headerName: 'Role',        width: 130 },
  { field: 'location',   headerName: 'Location',    width: 130 },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 110,
    filterable: false,
    renderCell: ({ value }) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>${(value as number).toLocaleString()}</span>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 100,
    renderCell: ({ value }) => (
      <span style={{
        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
        background: value === 'Active' ? '#dcfce7' : '#fee2e2',
        color:      value === 'Active' ? '#166534' : '#991b1b',
      }}>
        {String(value)}
      </span>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ServerGroupingExample() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, height: '100vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0 }}>Employees by Department</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Expand a department to load its employees. Group counts come from the server.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <EssealDataTable<Employee>
          rows={[]}
          columns={COLUMNS}
          serverGroups={SERVER_GROUPS}
          onLoadGroupData={fetchGroupRows}
        />
      </div>
    </div>
  );
}
