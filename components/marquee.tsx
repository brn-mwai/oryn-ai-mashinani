"use client"

export function Marquee() {
  const messages = [
    "AI-POWERED COLLECTION",
    "PAID WITHOUT THE AWKWARD CHASE",
    "AUTONOMOUS PAYMENT RECOVERY",
    "MULTI-CHANNEL OUTREACH",
    "SMART ESCALATION",
    "CONTRACT PARSING",
    "YOU'RE OWED MONEY. ORYN COLLECTS IT.",
    "5% SUCCESS FEE",
    "NO UPFRONT COSTS",
  ]

  // Duplicate messages for seamless loop
  const allMessages = [...messages, ...messages]

  return (
    <div className="w-full overflow-hidden border-b border-[--border-light] bg-[--surface-secondary] py-2 dark:border-[--dark-border-light] dark:bg-[--dark-surface-secondary]">
      <div className="animate-marquee flex whitespace-nowrap items-center">
        {allMessages.map((message, index) => (
          <div key={index} className="flex items-center">
            <span className="mx-6 text-[--text-tertiary] dark:text-[--dark-text-tertiary]">|</span>
            <span className="font-[var(--font-typewriter)] text-xs font-light tracking-widest text-[--text-tertiary] dark:text-[--dark-text-tertiary]">
              {message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
