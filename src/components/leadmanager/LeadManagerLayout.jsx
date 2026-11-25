// src/components/leadmanager/LeadManagerLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeadManagerSidebar from './LeadManagerSidebar';
import LeadManagerTopbar from './LeadManagerTopbar';

export default function LeadManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-mist/40">
      <LeadManagerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <LeadManagerTopbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}