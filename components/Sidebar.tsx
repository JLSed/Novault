"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Link2,
  HardDrive,
  ScrollText,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

/** Represents a sub-item within a navigation item */
export interface NavSubItem {
  label: string;
  href: string;
}

/** Represents a navigation item with optional children */
export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavSubItem[];
}

/** Represents a group of navigation items with a label */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Configuration for sidebar navigation groups */
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/home",
        icon: <LayoutDashboard size={20} />,
      },
      {
        label: "Filling Forms",
        href: "/home/forms",
        icon: <FileText size={20} />,
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
        label: "Audit Logs",
        href: "/home/audit-logs",
        icon: <ScrollText size={20} />,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Storage",
        href: "/home/storage",
        icon: <HardDrive size={20} />,
      },
      {
        label: "User Management",
        href: "/home/user",
        icon: <Users size={20} />,
        children: [{ label: "something", href: "/home/user/trademark" }],
      },
    ],
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}

/** Renders a single navigation item with optional expandable children */
function NavItemComponent({
  item,
  isCollapsed,
  isActive,
  onNavigate,
}: NavItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const itemActive = isActive(item.href);
  const childActive = item.children?.some((child) => isActive(child.href));

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && !isCollapsed) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else {
      onNavigate();
    }
  };

  return (
    <div>
      <Link
        href={item.href}
        onClick={handleClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          itemActive || childActive
            ? "bg-background/30 text-background"
            : "text-background/80 hover:text-background hover:bg-background/10"
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="shrink-0">{item.icon}</span>
        <span className={`text-sm flex-1 ${isCollapsed ? "md:hidden" : ""}`}>
          {item.label}
        </span>
        {hasChildren && !isCollapsed && (
          <span className="shrink-0 md:block hidden">
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
        )}
      </Link>

      {/* Sub-items */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="ml-6 mt-1 space-y-1 hidden md:block">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(child.href)
                  ? "bg-background/20 text-background"
                  : "text-background/70 hover:text-background hover:bg-background/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {child.label}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile sub-items (always visible when parent is active) */}
      {hasChildren && (
        <div className="ml-6 mt-1 space-y-1 md:hidden">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(child.href)
                  ? "bg-background/20 text-background"
                  : "text-background/70 hover:text-background hover:bg-background/10"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface NavGroupComponentProps {
  group: NavGroup;
  isCollapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}

/** Renders a group of navigation items with a label */
function NavGroupComponent({
  group,
  isCollapsed,
  isActive,
  onNavigate,
}: NavGroupComponentProps) {
  return (
    <div className="py-4">
      <span
        className={`px-4 text-xs text-background/30 uppercase tracking-wider ${
          isCollapsed ? "md:hidden" : ""
        }`}
      >
        {group.label}
      </span>
      <nav className="mt-2 space-y-1 px-2">
        {group.items.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            isCollapsed={isCollapsed}
            isActive={isActive}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

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

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto">
          {navGroups.map((group) => (
            <NavGroupComponent
              key={group.label}
              group={group}
              isCollapsed={isCollapsed}
              isActive={isActive}
              onNavigate={handleNavClick}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
