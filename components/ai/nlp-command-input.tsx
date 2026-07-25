"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  Loader2,
  Sparkles,
  MessageSquare,
  CreditCard,
  Bell,
  Users,
  TrendingUp,
} from "lucide-react";

interface NLPSuggestion {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: string;
}

const defaultSuggestions: NLPSuggestion[] = [
  {
    id: "1",
    text: "Send a reminder to...",
    icon: <Bell className="h-4 w-4" />,
    category: "Reminders",
  },
  {
    id: "2",
    text: "Create a new claim for...",
    icon: <CreditCard className="h-4 w-4" />,
    category: "Claims",
  },
  {
    id: "3",
    text: "Check status of...",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "Status",
  },
  {
    id: "4",
    text: "Add a new client...",
    icon: <Users className="h-4 w-4" />,
    category: "Clients",
  },
  {
    id: "5",
    text: "Escalate claim for...",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "Escalation",
  },
];

interface NLPCommandInputProps {
  onSubmit: (command: string) => void;
  suggestions?: NLPSuggestion[];
  placeholder?: string;
  isProcessing?: boolean;
  className?: string;
}

export function NLPCommandInput({
  onSubmit,
  suggestions = defaultSuggestions,
  placeholder = "Ask Oryn anything... (e.g., 'Send a reminder to John about his $500 invoice')",
  isProcessing = false,
  className,
}: NLPCommandInputProps) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (value.trim() && !isProcessing) {
      onSubmit(value.trim());
      setValue("");
      setOpen(false);
    }
  };

  const handleSelect = (suggestion: NLPSuggestion) => {
    setValue(suggestion.text);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.text.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className={cn("relative", className)}>
      <Popover open={open && value.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 rounded-xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Sparkles className="ml-2 h-5 w-5 text-primary" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              disabled={isProcessing}
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              onClick={handleSubmit}
              disabled={!value.trim() || isProcessing}
              size="sm"
              className="rounded-lg"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandList>
              <CommandEmpty>Type to search or enter a command</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        {suggestion.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{suggestion.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.category}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick actions */}
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => handleSelect(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {suggestion.icon}
            {suggestion.text.split("...")[0]}...
          </button>
        ))}
      </div>
    </div>
  );
}
