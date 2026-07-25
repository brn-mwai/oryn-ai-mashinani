"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "../theme-switcher";
import { useSearch } from "./search-context";
import { useSidebar } from "./sidebar-context";
import {
  IconSearch,
  IconBell,
  IconGift,
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconCreditCard,
  IconMessage,
  IconFolderOpen,
  IconSettings,
  IconChevronDown,
  IconLogout,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconCommand,
  IconWallet,
  IconLink,
  IconGitBranch,
} from "@tabler/icons-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { name: "Claims", href: "/dashboard/claims", icon: IconFileText },
  { name: "Clients", href: "/dashboard/clients", icon: IconUsers },
  { name: "Payments", href: "/dashboard/payments", icon: IconCreditCard },
  { name: "Wallet", href: "/dashboard/wallet", icon: IconWallet },
  { name: "Messages", href: "/dashboard/messages", icon: IconMessage },
  { name: "Documents", href: "/dashboard/documents", icon: IconFolderOpen },
  { name: "Payment Links", href: "/dashboard/payment-links", icon: IconLink },
  { name: "AI Workflows", href: "/dashboard/workflows", icon: IconGitBranch },
];

const secondaryNavItems: NavItem[] = [
  { name: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { setOpen: openSearch } = useSearch();
  const { isCollapsed, toggle: toggleSidebar } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get Convex user and notification count
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  return (
    <div
      className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 bg-card border-r border-border",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}
    >
      <div className="flex flex-col flex-grow px-3 py-4">
        {/* Logo & Collapse Toggle */}
        <div className="flex items-center justify-between mb-6 px-2">
          {!isCollapsed && (
            <Link href="/dashboard">
              <Image
                src="/logo-dark.svg"
                alt="Oryn"
                width={80}
                height={26}
                className="dark:hidden"
              />
              <Image
                src="/logo-light.svg"
                alt="Oryn"
                width={80}
                height={26}
                className="hidden dark:block"
              />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? (
              <IconLayoutSidebarLeftExpand size={18} stroke={1.5} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={18} stroke={1.5} />
            )}
          </button>
        </div>

        {/* Search */}
        <button
          onClick={() => openSearch(true)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 bg-accent text-accent-foreground mb-4 transition-colors hover:bg-accent/90",
            isCollapsed && "justify-center"
          )}
        >
          <IconSearch size={16} stroke={2} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left text-sm">Search</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-accent-foreground/20 bg-accent-foreground/10 px-1.5 font-mono text-[10px] font-medium">
                <IconCommand size={12} stroke={2} />K
              </kbd>
            </>
          )}
        </button>

        {/* Notifications & Referrals */}
        <div className="space-y-1 mb-4">
          <NavLink
            href="/dashboard/notifications"
            icon={IconBell}
            label="Notifications"
            isActive={pathname === "/dashboard/notifications"}
            isCollapsed={isCollapsed}
            badge={unreadCount}
          />
          <NavLink
            href="/dashboard/referrals"
            icon={IconGift}
            label="Refer & earn"
            isActive={pathname === "/dashboard/referrals"}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border my-2" />

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border my-2" />

        {/* Secondary Navigation */}
        <div className="space-y-1 mb-4">
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Theme Switcher */}
        {!isCollapsed && (
          <div className="px-2 mb-4">
            <ThemeSwitcher />
          </div>
        )}

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              "w-full flex items-center gap-3 p-2 hover:bg-muted transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <IconChevronDown
                  size={16}
                  stroke={2}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    showUserMenu && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-1 p-1 bg-card border border-border shadow-lg">
              <button
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconLogout size={16} stroke={2} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        isCollapsed && "justify-center"
      )}
    >
      <Icon size={16} stroke={2} />
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
