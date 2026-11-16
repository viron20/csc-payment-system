import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
