"use client";

import { PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";

interface HomeNavBarProps {
  userEmail: string;
  userRole: string;
  userName?: string;
  hasMasterKey?: boolean;
}

export const HomeNavBar = ({
  userEmail,
  userRole,
  userName,
  hasMasterKey,
}: HomeNavBarProps) => {
  const { isCollapsed, toggleSidebar, setMobileOpen } = useSidebar();

  return (
    <div className="flex items-center gap-4 px-4 py-3 w-full border-b border-gray-200">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="p-2 rounded-lg text-gray-500 hover:text-foreground hover:bg-gray-100 transition-colors md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Toggle Button - Desktop only */}
      <button
        onClick={toggleSidebar}
        className="hidden md:block p-2 rounded-lg text-gray-500 hover:text-foreground hover:bg-gray-100 transition-colors"
        aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen size={20} />
        ) : (
          <PanelLeftClose size={20} />
        )}
      </button>

      <div className="flex-1">
        {hasMasterKey ? (
          <span className="text-sm text-green-600">
            ✓ Master key configured
          </span>
        ) : (
          <span className="text-sm text-orange-500">⚠ Master key not set</span>
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-foreground">{userName}</span>
        <span className="text-xs text-gray-500 capitalize">
          Role: {userRole}
        </span>
      </div>
    </div>
  );
};
