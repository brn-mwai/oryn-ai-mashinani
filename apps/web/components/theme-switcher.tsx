"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <div className="size-8" />
        <div className="size-8" />
        <div className="size-8" />
      </div>
    );
  }

  return (
    <div className="inline-flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      <SwitchButton currentTheme={theme} targetTheme="light" setTheme={setTheme}>
        <IconSun size={16} stroke={1.5} />
      </SwitchButton>
      <SwitchButton currentTheme={theme} targetTheme="system" setTheme={setTheme}>
        <IconDeviceDesktop size={16} stroke={1.5} />
      </SwitchButton>
      <SwitchButton currentTheme={theme} targetTheme="dark" setTheme={setTheme}>
        <IconMoon size={16} stroke={1.5} />
      </SwitchButton>
    </div>
  );
}

function SwitchButton({
  currentTheme,
  targetTheme,
  setTheme,
  children,
}: {
  currentTheme?: string;
  targetTheme: string;
  setTheme: (theme: string) => void;
  children: React.ReactNode;
}) {
  const isSelected = currentTheme === targetTheme;

  return (
    <button
      type="button"
      aria-label={`${targetTheme} theme`}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
      )}
      onClick={() => setTheme(targetTheme)}
    >
      {children}
    </button>
  );
}
