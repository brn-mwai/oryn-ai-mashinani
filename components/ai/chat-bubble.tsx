"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatBubbleProps {
  content: string;
  role: "user" | "assistant";
  avatar?: {
    src?: string;
    fallback: string;
  };
  timestamp?: string;
  status?: "sending" | "sent" | "error";
  className?: string;
}

export function ChatBubble({
  content,
  role,
  avatar,
  timestamp,
  status,
  className,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse",
        className
      )}
    >
      {avatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatar.src} />
          <AvatarFallback className={cn(
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>

        {(timestamp || status) && (
          <div
            className={cn(
              "mt-1 flex items-center gap-2 text-xs",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {timestamp && <span>{timestamp}</span>}
            {status === "sending" && <span>Sending...</span>}
            {status === "error" && (
              <span className="text-destructive">Failed to send</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Typing indicator for assistant
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3", className)}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">AI</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3 rounded-bl-md">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
}
