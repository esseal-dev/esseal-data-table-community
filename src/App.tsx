import { useMemo } from 'react'
import './App.css'
import { DataGrid, type GridAction, type GridColDef } from './DataGrid';

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  salary: string; // Formatted string for display
  email: string;
}

const generateData = (count: number): Employee[] => {
  const depts = ['Engineering', 'Sales', 'HR', 'Marketing', 'Support'];
  const roles = ['Manager', 'Associate', 'Lead', 'Intern', 'Director'];
  const statuses = ['Active', 'On Leave', 'Terminated'] as const;

  return Array.from({ length: count }).map((_, i) => ({
    id: `emp-${i}`,
    name: `Employee ${i}`,
    department: depts[Math.floor(Math.random() * depts.length)],
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    salary: `$${(50000 + Math.floor(Math.random() * 100000)).toLocaleString()}`,
    email: `employee${i}@company.com`,
  }));
};

const DEMO_COLS: GridColDef<Employee>[] = [
  { field: 'id', headerName: 'ID', width: 80, pinned: 'left' }, // Pinned Left
  { field: 'name', headerName: 'Full Name', width: 180 }, // Pinned Left
  { field: 'email', headerName: 'Email Address', width: 220 },
  { field: 'department', headerName: 'Department', width: 150, pinned: 'left' },
  { field: 'role', headerName: 'Role', width: 150 },
  { field: 'salary', headerName: 'Salary', width: 120 },
  { field: 'status', headerName: 'Status', width: 110 },
];

const getRowActions = (row: Employee): GridAction<Employee>[] => {
  const actions: GridAction<Employee>[] = [
    {
      label: 'Edit',
      icon: '✏️', // You can use SVGs here
      onClick: (r) => alert(`Editing ${r.name}`),
    },
    {
      label: 'Profile',
      icon: '👤',
      onClick: (r) => console.log('View Profile', r.id),
    },
  ];

  // Conditional Action: Only show "Delete" if terminated, otherwise "Suspend"
  if (row.status === 'Terminated') {
    actions.push({
      label: 'Delete Record',
      icon: '🗑️',
      onClick: (r) => alert(`Deleting ${r.id} permanently`),
    });
  } else {
    actions.push({
      label: 'Suspend User',
      onClick: (r) => alert(`Suspending ${r.name}`),
    });
  }

  // Extra actions to force the menu to appear
  actions.push({ label: 'View Logs', onClick: () => { } });
  actions.push({ label: 'Reset Password', onClick: () => { } });

  return actions;
};


function App() {
  const DEMO_ROWS: Employee[] = useMemo(() => generateData(2000), []);

  return (
    <DataGrid
      rows={DEMO_ROWS}
      columns={DEMO_COLS}
      height={600} // Container height
      rowHeight={45} // Fixed row height
      groupBy={['department', 'status']} // Initial Grouping
      // Action Column Config
      rowActions={getRowActions}
      maxVisibleActions={2} // Show 2 buttons, put the rest in burger menu
    />
  )
}

export default App