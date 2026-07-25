"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import {
  IconSparkles,
  IconArrowUp,
  IconX,
  IconUpload,
  IconFile,
  IconPhoto,
  IconBrain,
  IconWand,
  IconWorld,
  IconDatabase,
  IconFileText,
  IconUsers,
  IconMail,
  IconCalendar,
  IconChartBar,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Model configurations
const AI_MODELS = {
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Fast & powerful" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Ultra fast" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "Great reasoning" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", description: "Efficient" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Latest & fastest" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Most capable" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Fast & efficient" },
  ],
  claude: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", description: "Best quality" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Quick responses" },
  ],
};

// Agent mode quick actions
const AGENT_ACTIONS = [
  {
    id: "send-reminders",
    icon: IconMail,
    label: "Send Bulk Reminders",
    prompt: "Send payment reminders to all clients with overdue invoices. Use email first, and escalate tone based on how overdue each invoice is.",
    category: "collections",
  },
  {
    id: "agentic-marathon",
    icon: IconWand,
    label: "Start Collection Marathon",
    prompt: "Start an agentic marathon to monitor all my overdue claims. Send reminders every 3 days, escalate after 7 days of no response, and use email first then SMS then WhatsApp. Report back daily.",
    category: "marathon",
  },
  {
    id: "draft-email",
    icon: IconMail,
    label: "Draft Email for Client",
    prompt: "Help me draft a professional payment reminder email. I'll tell you which client and claim it's for.",
    category: "messages",
  },
  {
    id: "create-payment-link",
    icon: IconFileText,
    label: "Create Payment Link",
    prompt: "Create a payment link for my most overdue claim and show me how to share it.",
    category: "payments",
  },
  {
    id: "analyze-performance",
    icon: IconChartBar,
    label: "Analyze My Performance",
    prompt: "Analyze my collection performance. Show me my success rate, average collection time, best performing channels, and areas for improvement.",
    category: "analytics",
  },
  {
    id: "find-at-risk",
    icon: IconCalendar,
    label: "Find At-Risk Claims",
    prompt: "Identify claims that are at risk of becoming uncollectible. Look at age, escalation level, and client response patterns.",
    category: "claims",
  },
  {
    id: "escalate-overdue",
    icon: IconWand,
    label: "Escalate Overdue Claims",
    prompt: "Review all my overdue claims and escalate any that have been at the same level for more than 7 days without a response.",
    category: "collections",
  },
  {
    id: "client-analysis",
    icon: IconUsers,
    label: "Client Payment Analysis",
    prompt: "Analyze my client portfolio. Show me which clients pay on time, which are problematic, and recommend strategies for difficult clients.",
    category: "clients",
  },
];

// Loading words animation
const LOADING_WORDS = [
  "Thinking",
  "Processing",
  "Analyzing",
  "Searching",
  "Computing",
  "Generating",
  "Reasoning",
  "Loading",
];

function ThinkingAnimation() {
  const [wordIndex, setWordIndex] = useState(0);
  const [dots, setDots] = useState("");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % LOADING_WORDS.length);
        setFade(false);
      }, 300);
    }, 1800);

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 350);

    return () => {
      clearInterval(wordInterval);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "text-sm text-muted-foreground font-mono tracking-wider transition-opacity duration-300",
          fade ? "opacity-30" : "opacity-100"
        )}
      >
        {LOADING_WORDS[wordIndex]}<span className="inline-block w-8">{dots}</span>
      </span>
      <span className="inline-block w-[3px] h-4 bg-accent animate-blink" />
    </div>
  );
}

// Simple Markdown Renderer
function MarkdownRenderer({ content }: { content: string }) {
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    let tableBuffer: string[] = [];
    let codeBlock: { lang: string; lines: string[] } | null = null;
    let listItems: { type: "ul" | "ol"; items: string[] } | null = null;

    const processInline = (line: string): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let keyIndex = 0;

      // Process inline elements
      while (remaining.length > 0) {
        // Bold **text** or __text__
        const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/);
        if (boldMatch) {
          if (boldMatch[1]) parts.push(processInline(boldMatch[1]));
          parts.push(<strong key={keyIndex++} className="font-semibold">{processInline(boldMatch[3])}</strong>);
          remaining = boldMatch[4];
          continue;
        }

        // Italic *text* or _text_
        const italicMatch = remaining.match(/^(.*?)(\*|_)([^*_]+)\2(.*)$/);
        if (italicMatch && !italicMatch[1].endsWith("*") && !italicMatch[1].endsWith("_")) {
          if (italicMatch[1]) parts.push(italicMatch[1]);
          parts.push(<em key={keyIndex++} className="italic">{italicMatch[3]}</em>);
          remaining = italicMatch[4];
          continue;
        }

        // Inline code `code`
        const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/);
        if (codeMatch) {
          if (codeMatch[1]) parts.push(codeMatch[1]);
          parts.push(
            <code key={keyIndex++} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-accent">
              {codeMatch[2]}
            </code>
          );
          remaining = codeMatch[3];
          continue;
        }

        // Links [text](url)
        const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/);
        if (linkMatch) {
          if (linkMatch[1]) parts.push(linkMatch[1]);
          parts.push(
            <a key={keyIndex++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {linkMatch[2]}
            </a>
          );
          remaining = linkMatch[4];
          continue;
        }

        // No more matches, add remaining text
        parts.push(remaining);
        break;
      }

      return parts.length === 1 ? parts[0] : parts;
    };

    const flushList = () => {
      if (listItems) {
        const ListTag = listItems.type === "ul" ? "ul" : "ol";
        const listClass = listItems.type === "ul" ? "list-disc" : "list-decimal";
        elements.push(
          <ListTag key={i++} className={`${listClass} list-inside mb-2 space-y-1 ml-2`}>
            {listItems.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{processInline(item)}</li>
            ))}
          </ListTag>
        );
        listItems = null;
      }
    };

    const flushTable = () => {
      if (tableBuffer.length >= 2) {
        const headerRow = tableBuffer[0].split("|").filter(Boolean).map(s => s.trim());
        const rows = tableBuffer.slice(2).map(row => row.split("|").filter(Boolean).map(s => s.trim()));

        elements.push(
          <div key={i++} className="overflow-x-auto my-3">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="border border-border px-3 py-2 text-left font-semibold">{processInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-border px-3 py-2">{processInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
    };

    for (const line of lines) {
      // Code blocks
      if (line.startsWith("```")) {
        if (codeBlock) {
          elements.push(
            <pre key={i++} className="bg-muted/50 border border-border rounded-md p-3 my-2 overflow-x-auto text-xs font-mono">
              <code>{codeBlock.lines.join("\n")}</code>
            </pre>
          );
          codeBlock = null;
        } else {
          flushList();
          flushTable();
          codeBlock = { lang: line.slice(3), lines: [] };
        }
        continue;
      }

      if (codeBlock) {
        codeBlock.lines.push(line);
        continue;
      }

      // Table rows
      if (line.includes("|") && line.trim().startsWith("|")) {
        flushList();
        tableBuffer.push(line);
        continue;
      } else if (tableBuffer.length > 0) {
        flushTable();
      }

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushList();
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const className = level === 1 ? "text-xl font-bold mt-4 mb-2" :
                         level === 2 ? "text-lg font-semibold mt-3 mb-2" :
                         "text-base font-semibold mt-3 mb-1";
        elements.push(
          <div key={i++} className={className}>{processInline(text)}</div>
        );
        continue;
      }

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(line.trim())) {
        flushList();
        elements.push(<hr key={i++} className="my-3 border-border" />);
        continue;
      }

      // Blockquotes
      if (line.startsWith(">")) {
        flushList();
        const text = line.slice(1).trim();
        elements.push(
          <blockquote key={i++} className="border-l-2 border-accent pl-3 my-2 italic text-muted-foreground">
            {processInline(text)}
          </blockquote>
        );
        continue;
      }

      // Unordered lists
      const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!listItems || listItems.type !== "ul") {
          flushList();
          listItems = { type: "ul", items: [] };
        }
        listItems.items.push(ulMatch[1]);
        continue;
      }

      // Ordered lists
      const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!listItems || listItems.type !== "ol") {
          flushList();
          listItems = { type: "ol", items: [] };
        }
        listItems.items.push(olMatch[1]);
        continue;
      }

      // Flush any pending list before adding a paragraph
      flushList();

      // Empty lines
      if (line.trim() === "") {
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={i++} className="mb-2 last:mb-0 leading-relaxed">{processInline(line)}</p>
      );
    }

    // Flush remaining
    flushList();
    flushTable();
    if (codeBlock) {
      elements.push(
        <pre key={i++} className="bg-muted/50 border border-border rounded-md p-3 my-2 overflow-x-auto text-xs font-mono">
          <code>{codeBlock.lines.join("\n")}</code>
        </pre>
      );
    }

    return elements;
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
}

interface Attachment {
  name: string;
  type: string;
  url?: string;
  previewUrl?: string; // For image previews
  size?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  isStreaming?: boolean;
  sources?: Array<{
    title: string;
    url?: string;
    type: "database" | "web" | "document";
  }>;
}

interface OrynAIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrynAI({ open, onOpenChange }: OrynAIProps) {
  const { user } = useUser();
  const [mode, setMode] = useState<"ask" | "agent">("ask");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant");
  const [selectedProvider, setSelectedProvider] = useState<"groq" | "gemini" | "claude">("groq");
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Array<{ file: File; previewUrl?: string }>>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [deepThinking, setDeepThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    // Determine provider from model ID
    if (modelId.startsWith("llama") || modelId.startsWith("mixtral") || modelId.startsWith("gemma")) {
      setSelectedProvider("groq");
    } else if (modelId.startsWith("gemini")) {
      setSelectedProvider("gemini");
    } else if (modelId.startsWith("claude")) {
      setSelectedProvider("claude");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  // Clean up preview URLs when component unmounts or attachments change
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    e?.preventDefault();
    const messageContent = promptOverride || input.trim();
    if (!messageContent && attachments.length === 0) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      attachments: attachments.map((att) => ({
        name: att.file.name,
        type: att.file.type,
        previewUrl: att.previewUrl,
        size: att.file.size,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    // Add streaming placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      // Prepare form data for file uploads
      const formData = new FormData();
      formData.append("message", messageContent);
      formData.append("model", selectedModel);
      formData.append("provider", selectedProvider);
      formData.append("mode", mode);
      formData.append("deepThinking", deepThinking.toString());
      formData.append("conversationHistory", JSON.stringify(messages.slice(-10)));

      attachments.forEach((att, i) => {
        formData.append(`file_${i}`, att.file);
      });

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources: Message["sources"] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                }
                if (data.sources) {
                  sources = data.sources;
                }
                if (data.done) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, isStreaming: false, sources }
                        : m
                    )
                  );
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, I encountered an error. Please try again.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: (typeof AGENT_ACTIONS)[0]) => {
    setInput(action.prompt);
    handleSubmit(undefined, action.prompt);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setAttachments([]);
  };

  // Execute agent actions
  const executeAction = async (action: string, params: Record<string, any>) => {
    try {
      const response = await fetch("/api/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params }),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Handle action buttons in agent mode
  const handleAgentAction = async (
    actionType: string,
    params: Record<string, any>,
    description: string
  ) => {
    if (isLoading) return;

    // Add user message indicating action
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Execute action: ${description}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add streaming placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      const result = await executeAction(actionType, params);

      const responseContent = result.success
        ? `**Action Completed Successfully**\n\n${result.message}${result.data ? `\n\n**Details:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`` : ""}`
        : `**Action Failed**\n\n${result.message || "An error occurred while executing the action."}`;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: responseContent, isStreaming: false }
            : m
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, I encountered an error executing that action.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const allModels = [
    ...AI_MODELS.groq.map((m) => ({ ...m, provider: "groq" as const })),
    ...AI_MODELS.gemini.map((m) => ({ ...m, provider: "gemini" as const })),
    ...AI_MODELS.claude.map((m) => ({ ...m, provider: "claude" as const })),
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-background border shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
              <IconSparkles size={18} className="text-accent-foreground" />
            </div>
            <span className="font-semibold">Oryn AI</span>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-muted p-1">
            <button
              onClick={() => setMode("ask")}
              className={cn(
                "px-3 py-1 text-sm font-medium transition-colors",
                mode === "ask"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ask AI
            </button>
            <button
              onClick={() => setMode("agent")}
              className={cn(
                "px-3 py-1 text-sm font-medium transition-colors",
                mode === "agent"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Agent
            </button>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-muted transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              {mode === "ask" ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 flex items-center justify-center">
                    <IconBrain size={32} className="text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Ask Oryn AI anything</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    I have access to your claims, clients, payments, and documents.
                    I can also search the web for you. Upload files for analysis.
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconDatabase size={14} />
                      Database Access
                    </span>
                    <span className="flex items-center gap-1">
                      <IconWorld size={14} />
                      Web Search
                    </span>
                    <span className="flex items-center gap-1">
                      <IconUpload size={14} />
                      File Analysis
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 flex items-center justify-center">
                    <IconWand size={32} className="text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Agent Mode</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    Execute tasks automatically. Select an action or describe what you want to do.
                  </p>
                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                    {AGENT_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-2 p-3 text-left border hover:border-accent hover:bg-accent/5 transition-colors"
                      >
                        <action.icon size={16} className="text-accent shrink-0" />
                        <span className="text-sm">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3",
                      message.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted"
                    )}
                  >
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.attachments.map((att, i) => (
                          <div key={i} className="relative">
                            {att.type.startsWith("image/") && att.previewUrl ? (
                              <div className="relative group">
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  className="max-w-[200px] max-h-[150px] object-cover rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(att.previewUrl, "_blank")}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
                                  {att.name}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs bg-background/50 px-2 py-1 rounded">
                                <IconFile size={12} />
                                <span className="max-w-[150px] truncate">{att.name}</span>
                                {att.size && (
                                  <span className="text-muted-foreground">
                                    ({(att.size / 1024).toFixed(1)}KB)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-sm">
                      {message.isStreaming && !message.content ? (
                        <ThinkingAnimation />
                      ) : (
                        <>
                          <MarkdownRenderer content={message.content} />
                          {message.isStreaming && message.content && (
                            <span className="inline-block w-[3px] h-4 ml-1 bg-accent animate-blink" />
                          )}
                        </>
                      )}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-xs bg-background/50 px-2 py-1"
                            >
                              {source.type === "database" && <IconDatabase size={12} />}
                              {source.type === "web" && <IconWorld size={12} />}
                              {source.type === "document" && <IconFileText size={12} />}
                              {source.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions for assistant messages */}
                    {message.role === "assistant" && !message.isStreaming && message.content && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-border/50">
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {copied === message.id ? (
                            <IconCheck size={12} />
                          ) : (
                            <IconCopy size={12} />
                          )}
                          {copied === message.id ? "Copied" : "Copy"}
                        </button>

                        {/* Agent mode quick actions */}
                        {mode === "agent" && (
                          <>
                            <span className="text-border">|</span>
                            <button
                              onClick={() => handleAgentAction("send_bulk_reminders", { channel: "email", limit: 5 }, "Send reminders to overdue claims")}
                              disabled={isLoading}
                              className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 disabled:opacity-50"
                            >
                              <IconMail size={12} />
                              Send Reminders
                            </button>
                            <button
                              onClick={() => handleSubmit(undefined, "Show me all my overdue claims and let me choose which ones to escalate")}
                              disabled={isLoading}
                              className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 disabled:opacity-50"
                            >
                              <IconWand size={12} />
                              Escalate Claims
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="relative group"
              >
                {att.previewUrl ? (
                  <div className="relative">
                    <img
                      src={att.previewUrl}
                      alt={att.file.name}
                      className="w-16 h-16 object-cover rounded border border-border"
                    />
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconX size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[10px] text-white truncate">
                      {att.file.name}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-muted px-2 py-1 text-sm rounded">
                    <IconFile size={14} />
                    <span className="truncate max-w-[120px]">{att.file.name}</span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Input */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  mode === "ask"
                    ? "Ask me a question about your data..."
                    : "Describe what you want me to do..."
                }
                className="w-full min-h-[60px] max-h-[150px] resize-none px-4 py-3 pr-12 border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="absolute right-3 bottom-3 p-2 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <IconLoader2 size={18} className="animate-spin" />
                ) : (
                  <IconArrowUp size={18} />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 text-xs border hover:bg-muted transition-colors"
                >
                  <IconUpload size={14} />
                  Upload
                </button>

                {/* Deep Thinking Toggle */}
                <button
                  type="button"
                  onClick={() => setDeepThinking(!deepThinking)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs border transition-colors",
                    deepThinking
                      ? "bg-accent text-accent-foreground border-accent"
                      : "hover:bg-muted"
                  )}
                >
                  <IconBrain size={14} />
                  Deep thinking
                </button>

                {/* Clear */}
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1 px-2 py-1 text-xs border hover:bg-muted transition-colors"
                  >
                    <IconRefresh size={14} />
                    Clear
                  </button>
                )}
              </div>

              {/* Model Selector */}
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    Groq
                  </div>
                  {AI_MODELS.groq.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">
                    Gemini
                  </div>
                  {AI_MODELS.gemini.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">
                    Claude
                  </div>
                  {AI_MODELS.claude.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Powered by Oryn AI</span>
          <span className="flex items-center gap-1">
            <IconDatabase size={12} />
            Connected to your data
          </span>
        </div>
      </div>
    </div>
  );
}
