"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Link2,
  HardDrive,
  ScrollText,
  HelpCircle,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const overviewItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/home",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Analytics",
    href: "/home/analytics",
    icon: <BarChart3 size={20} />,
  },
  {
    label: "File Chain",
    href: "/home/file-chain",
    icon: <Link2 size={20} />,
  },
  {
    label: "Storage",
    href: "/home/storage",
    icon: <HardDrive size={20} />,
  },
  {
    label: "Audit Logs",
    href: "/home/audit-logs",
    icon: <ScrollText size={20} />,
  },
];

const bottomItems: NavItem[] = [
  {
    label: "Help",
    href: "/home/help",
    icon: <HelpCircle size={20} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/home") {
      return pathname === "/home";
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    closeMobile();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`flex flex-col h-screen bg-primary text-background transition-all duration-300 overflow-hidden
          fixed md:relative z-50
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${isCollapsed ? "md:w-16" : "md:w-64"}
          w-64
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-background/50">
          <div className="flex items-center justify-center w-8 h-8">
            <div
              className="w-full h-full bg-background"
              style={{
                maskImage: "url(/logo.svg)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskImage: "url(/logo.svg)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold tracking-wide">NOVAULT</span>
          )}
        </div>

        {/* Overview Section */}
        <div className="flex-1 py-4">
          <span
            className={`px-4 text-xs text-background/30 uppercase tracking-wider ${isCollapsed ? "md:hidden" : ""}`}
          >
            Overview
          </span>
          <nav className="mt-2 space-y-2 px-2">
            {overviewItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-background/30 text-background"
                    : "text-background/80 hover:text-background hover:bg-background/10"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`text-sm ${isCollapsed ? "md:hidden" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="py-4 border-t border-background/50">
          <nav className="space-y-2 px-2">
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-background/30 text-background"
                    : "text-background/75 hover:text-background hover:bg-background/10"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`text-sm ${isCollapsed ? "md:hidden" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
