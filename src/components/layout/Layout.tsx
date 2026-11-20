import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="lg:ml-64 pt-16 min-h-[calc(100vh-4rem)]" id="main-content">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <Footer />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-35 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};