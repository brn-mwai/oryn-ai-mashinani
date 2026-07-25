"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Half2Icon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { Button } from "../common/button";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = React.useState<string>();

  React.useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  return (
    <div className="flex gap-0.5 rounded-full border border-[--border] bg-[--surface-secondary] p-0.5 text-center dark:border-[#3a4f58] dark:bg-[#243840]">
      <SwitchButton selectedTheme={selectedTheme} setTheme={setTheme} theme="light">
        <SunIcon color="currentColor" height={16} width={16} />
      </SwitchButton>
      <SwitchButton selectedTheme={selectedTheme} setTheme={setTheme} theme="system">
        <Half2Icon color="currentColor" height={16} width={16} />
      </SwitchButton>
      <SwitchButton selectedTheme={selectedTheme} setTheme={setTheme} theme="dark">
        <MoonIcon color="currentColor" height={16} width={16} />
      </SwitchButton>
    </div>
  );
}

function SwitchButton({
  selectedTheme,
  theme,
  setTheme,
  children,
}: {
  selectedTheme?: string;
  theme: string;
  setTheme: (theme: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <Button
      unstyled
      aria-label={`${theme} theme`}
      className={clsx(
        "!flex !size-6 items-center justify-center !rounded-full !p-[3px] text-[--text-tertiary] dark:text-[#7a9aa8]",
        "data-[selected='true']:bg-[--surface-tertiary] data-[selected='true']:text-[--text-primary] dark:data-[selected='true']:bg-[#3a4f58] dark:data-[selected='true']:text-white",
        "hover:bg-[--surface-tertiary] hover:text-[--text-primary] dark:hover:bg-[#2e454e] dark:hover:text-white",
      )}
      data-selected={selectedTheme === theme}
      onClick={() => setTheme(theme)}
    >
      {children}
    </Button>
  );
}
