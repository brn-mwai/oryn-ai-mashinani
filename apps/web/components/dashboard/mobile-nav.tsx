"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "../theme-switcher";
import { useSearch } from "./search-context";
import {
  IconMenu2,
  IconX,
  IconSearch,
  IconBell,
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconCreditCard,
  IconMessage,
  IconFolderOpen,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { name: "Claims", href: "/dashboard/claims", icon: IconFileText },
  { name: "Clients", href: "/dashboard/clients", icon: IconUsers },
  { name: "Payments", href: "/dashboard/payments", icon: IconCreditCard },
  { name: "Messages", href: "/dashboard/messages", icon: IconMessage },
  { name: "Documents", href: "/dashboard/documents", icon: IconFolderOpen },
  { name: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { setOpen: openSearch } = useSearch();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-card border-b border-border">
        <Link href="/dashboard">
          <Image
            src="/logo-dark.svg"
            alt="Oryn"
            width={70}
            height={23}
            className="dark:hidden"
          />
          <Image
            src="/logo-light.svg"
            alt="Oryn"
            width={70}
            height={23}
            className="hidden dark:block"
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openSearch(true)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <IconSearch size={20} stroke={2} />
          </button>
          <Link href="/dashboard/notifications" className="p-2 text-muted-foreground hover:text-foreground relative">
            <IconBell size={20} stroke={2} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? <IconX size={20} stroke={2} /> : <IconMenu2 size={20} stroke={2} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed top-14 right-0 bottom-0 z-30 w-72 bg-card border-l border-border transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 mb-4 bg-muted rounded-lg">
            <div className="w-10 h-10 rounded-full bg-background overflow-hidden">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon size={20} stroke={2} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-border space-y-3">
            <ThemeSwitcher />
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconLogout size={20} stroke={2} />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </div>
  );
}
