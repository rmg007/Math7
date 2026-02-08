import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import Navbar from '../Navbar';

interface SidebarProps {
  isMobile?: boolean
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <>
      <div
        className={cn(
          'sidebar',
          { 'sidebar-collapsed': collapsed },
          { 'hidden md:block': !isMobile }
        )}
      >
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 p-2 bg-purple-700 text-white rounded-full hover:bg-purple-600"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
        <Navbar />
      </div>
      {isMobile && (
        <Navbar />
      )}
    </>
  );
}
