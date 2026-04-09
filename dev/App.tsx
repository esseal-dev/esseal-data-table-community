import React from 'react';
import EssealDataTable from '../src/EssealDataTable';
import '../src/EssealDataTable.css';

interface User {
  id: number;
  name: string;
  role: string;
  department: string;
  status: string;
  age: number;
}

const rows: User[] = [
  { id: 1, name: 'Alice Johnson', role: 'Engineer', department: 'Engineering', status: 'Active', age: 29 },
  { id: 2, name: 'Bob Smith', role: 'Designer', department: 'Design', status: 'Active', age: 34 },
  { id: 3, name: 'Carol White', role: 'Manager', department: 'Engineering', status: 'Inactive', age: 41 },
  { id: 4, name: 'David Lee', role: 'Engineer', department: 'Engineering', status: 'Active', age: 26 },
  { id: 5, name: 'Eva Martinez', role: 'Analyst', department: 'Finance', status: 'Active', age: 31 },
  { id: 6, name: 'Frank Brown', role: 'Designer', department: 'Design', status: 'Inactive', age: 38 },
  { id: 7, name: 'Grace Kim', role: 'Engineer', department: 'Engineering', status: 'Active', age: 27 },
  { id: 8, name: 'Henry Wilson', role: 'Manager', department: 'Finance', status: 'Active', age: 45 },
];

const columns = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'name', headerName: 'Name', width: 180, sortable: true, pinned: 'left' as const },
  { field: 'role', headerName: 'Role', width: 130, sortable: true },
  { field: 'department', headerName: 'Department', width: 150, sortable: true },
  { field: 'age', headerName: 'Age', width: 80, sortable: true },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
    renderCell: ({ value }: { value: string }) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        background: value === 'Active' ? '#dcfce7' : '#fee2e2',
        color: value === 'Active' ? '#16a34a' : '#dc2626',
      }}>
        {value}
      </span>
    ),
  },
];

export default function App() {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ marginBottom: 16 }}>EssealDataTable Playground</h2>
      <EssealDataTable
        rows={rows}
        columns={columns}
        checkboxSelection
        pagination
        pageSize={5}
        rowActions={(row) => [
          { label: 'Edit', onClick: (r) => alert(`Edit: ${r.name}`) },
          { label: 'Delete', onClick: (r) => alert(`Delete: ${r.name}`) },
        ]}
      />
    </div>
  );
}
