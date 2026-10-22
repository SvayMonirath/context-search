// src/components/layout/DashboardShell.jsx
// Wraps all /dashboard/* pages: Navbar + Sidebar + main content area.
// Usage: <DashboardShell topBar="AI Search Dashboard"><YourContent /></DashboardShell>

import PageShell from './PageShell';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardShell({ topBar, children, mainStyle = {} }) {
    return (
        <PageShell topBar={topBar}>
        <Navbar showSidebar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', ...mainStyle }}>
            {children}
            </main>
        </div>
        </PageShell>
    );
}
