"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { SearchProvider } from "./search-context";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { BreadcrumbProvider, useBreadcrumb } from "./breadcrumb-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconSparkles, IconHelp, IconChevronRight } from "@tabler/icons-react";
import { OrynAI } from "@/components/oryn-ai";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function Breadcrumbs() {
  const { items } = useBreadcrumb();

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <IconChevronRight size={14} className="text-muted-foreground/50" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? "text-foreground" : ""}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleSupportClick = () => {
    window.open("mailto:support@oryn.cc", "_blank");
  };

  // Keyboard shortcut for AI assistant (Cmd/Ctrl + I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setShowAIAssistant((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}
    >
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIAssistant(true)}
              className="gap-2"
            >
              <IconSparkles size={16} />
              Ask AI
              <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-muted border">
                ⌘I
              </kbd>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSupportClick}
              className="gap-2"
            >
              <IconHelp size={16} />
              Support
            </Button>
          </div>
        </div>
      </div>

      <main className="min-h-screen">{children}</main>

      {/* Oryn AI */}
      <OrynAI open={showAIAssistant} onOpenChange={setShowAIAssistant} />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <SearchProvider>
        <BreadcrumbProvider>
          <div className="min-h-screen bg-background">
            {/* Command Palette (CMD+K) */}
            <CommandPalette />

            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Navigation */}
            <MobileNav />

            {/* Main Content */}
            <MainContent>{children}</MainContent>
          </div>
        </BreadcrumbProvider>
      </SearchProvider>
    </SidebarProvider>
  );
}
