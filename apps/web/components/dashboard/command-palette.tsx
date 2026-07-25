"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconCreditCard,
  IconMessage,
  IconFolderOpen,
  IconSettings,
  IconBell,
  IconGift,
  IconUserPlus,
  IconFilePlus,
  IconSend,
  IconWallet,
  IconLink,
} from "@tabler/icons-react";
import { useSearch } from "./search-context";

export function CommandPalette() {
  const { open, setOpen } = useSearch();
  const router = useRouter();

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search for a page, client, or claim..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Searching for">
          <div className="flex gap-2 px-2 py-2">
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80">
              <IconFolderOpen size={14} />
              Pages
              <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-background rounded border">
                ⌘1
              </kbd>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80">
              <IconUsers size={14} />
              Clients
              <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-background rounded border">
                ⌘2
              </kbd>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80">
              <IconFileText size={14} />
              Claims
              <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-background rounded border">
                ⌘3
              </kbd>
            </button>
          </div>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Common Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/claims/new"))}
          >
            <IconFilePlus className="mr-2 h-4 w-4" />
            <span>Create new claim</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/clients/new"))}
          >
            <IconUserPlus className="mr-2 h-4 w-4" />
            <span>Add new client</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/messages/new"))}
          >
            <IconSend className="mr-2 h-4 w-4" />
            <span>Send a reminder</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard"))}
          >
            <IconLayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/claims"))}
          >
            <IconFileText className="mr-2 h-4 w-4" />
            <span>Claims</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/clients"))}
          >
            <IconUsers className="mr-2 h-4 w-4" />
            <span>Clients</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/payments"))}
          >
            <IconCreditCard className="mr-2 h-4 w-4" />
            <span>Payments</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/messages"))}
          >
            <IconMessage className="mr-2 h-4 w-4" />
            <span>Messages</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/documents"))}
          >
            <IconFolderOpen className="mr-2 h-4 w-4" />
            <span>Documents</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/notifications"))}
          >
            <IconBell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/referrals"))}
          >
            <IconGift className="mr-2 h-4 w-4" />
            <span>Refer & Earn</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
          >
            <IconSettings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
