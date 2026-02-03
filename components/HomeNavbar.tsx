"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { signOut } from "@/app/home/actions";

interface HomeNavBarProps {
  userRole: string;
  userName?: string;
}

// Map routes to page titles
const pageTitles: Record<string, string> = {
  "/home": "Dashboard",
  "/home/analytics": "Analytics",
  "/home/file-chain": "File Chain",
  "/home/storage": "Storage",
  "/home/audit-logs": "Audit Logs",
  "/home/settings": "Settings",
  "/home/help": "Help",
};

export const HomeNavBar = ({ userRole, userName }: HomeNavBarProps) => {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, setMobileOpen } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <h1 className=" text-primary">{pageTitles[pathname]}</h1>
      </div>

      {/* User Profile */}
      <div
        className="relative rounded-lg border px-2 border-foreground/20"
        ref={dropdownRef}
      >
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-4 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">
              {userName}
            </span>
            <span className="text-xs text-gray-500 capitalize">{userRole}</span>
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-500 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-background rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <Link
              href="/home/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-gray-100 transition-colors"
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
            <div className="border-t border-gray-200 my-1" />
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-400 hover:text-background rounded transition-colors w-full"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
