"use client";

import React, { useRef } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";

import { orynContent } from "../../lib/oryn-content";
import { ButtonLink } from "../../common/button";
import { Heading } from "../../common/heading";
import { Section } from "../../common/section-wrapper";

// Marquee Component
function Marquee() {
  const messages = [
    "AI-POWERED COLLECTION",
    "INSTANT USDC SETTLEMENT",
    "AUTONOMOUS PAYMENT RECOVERY",
    "MULTI-CHANNEL OUTREACH",
    "SMART ESCALATION",
    "CONTRACT PARSING",
    "YOU'RE OWED MONEY. ORYN COLLECTS IT.",
    "5% SUCCESS FEE",
    "NO UPFRONT COSTS",
    "TRUSTED BY 500+ CREATORS",
  ];

  const allMessages = [...messages, ...messages];

  return (
    <div className="relative z-10 w-full">
      {/* Mobile: full width, no vertical lines */}
      <div className="block w-full md:hidden">
        <div className="overflow-hidden py-3 border-b border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#243840]">
          <div className="animate-marquee flex whitespace-nowrap items-center">
            {allMessages.map((message, index) => (
              <span
                key={index}
                className="mx-3 font-['FK_Raster_Grotesk'] text-xs font-normal tracking-wide text-[--text-tertiary] dark:text-[#7a9aa8]"
              >
                {message}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Desktop: grid with vertical lines */}
      <div className="hidden w-full md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
        <div />
        <div className="overflow-hidden py-3 border-x border-b border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#243840]">
          <div className="animate-marquee flex whitespace-nowrap items-center">
            {allMessages.map((message, index) => (
              <span
                key={index}
                className="mx-3 font-['FK_Raster_Grotesk'] text-xs font-normal tracking-wide text-[--text-tertiary] dark:text-[#7a9aa8]"
              >
                {message}
              </span>
            ))}
          </div>
        </div>
        <div />
      </div>
    </div>
  );
}

// Oryn Logo SVG Component
function OrynLogo({ className = "", color = "white" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 111 133" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M55.5 10.5C86.1518 10.5 111 35.5721 111 66.5C111 97.4279 86.1518 122.5 55.5 122.5C24.8482 122.5 0 97.4279 0 66.5C0 35.5721 24.8482 10.5 55.5 10.5ZM91.3887 30.0459C79.3711 18.1466 59.9824 18.2423 48.083 30.2598L19.5459 59.0811C7.64657 71.0987 7.74212 90.4874 19.7598 102.387C31.7774 114.286 51.1661 114.189 63.0654 102.172L91.6025 73.3516C103.502 61.334 103.406 41.9453 91.3887 30.0459Z" fill={color}/>
    </svg>
  );
}

// Dashboard Preview Component - Representing Oryn AI Collection Agent
function DashboardPreview() {
  return (
    <div className="relative overflow-hidden border border-[--border] dark:border-[#3a4f58]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 shrink-0 bg-[#1A2B32] p-5 hidden sm:block">
          {/* Oryn Logo */}
          <div className="mb-8">
            <img src="/logo-light.svg" alt="Oryn" className="h-6 w-auto" />
          </div>
          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {[
              { name: "Dashboard", icon: "grid" },
              { name: "Invoices", icon: "file" },
              { name: "Clients", icon: "users" },
              { name: "Wallet", icon: "wallet" },
              { name: "Agent Activity", icon: "bot" },
            ].map((item, i) => (
              <div
                key={item.name}
                className={clsx(
                  "px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-colors",
                  i === 0
                    ? "bg-[#D2B4FA]/20 text-[#D2B4FA] font-medium"
                    : "text-[#7a9aa8] hover:text-white hover:bg-white/5"
                )}
              >
                <NavIcon type={item.icon} />
                {item.name}
              </div>
            ))}
          </nav>

        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white p-4 sm:p-6 min-h-[320px] sm:min-h-[420px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <p className="text-[#1A2B32]/50 text-xs sm:text-sm mb-1">Total Collected</p>
              <h3 className="text-[#1A2B32] text-2xl sm:text-4xl font-semibold tracking-tight">$124,892<span className="text-lg sm:text-2xl">.00</span></h3>
              <div className="flex items-center gap-2 mt-1 sm:mt-2 flex-wrap">
                <span className="text-[10px] sm:text-xs text-[#22c55e] font-medium bg-[#22c55e]/10 px-2 py-0.5 rounded-full">↑ 12.4% this month</span>
                <span className="text-[10px] sm:text-xs text-[#1A2B32]/40">94.2% recovery rate</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-[#1A2B32]/60 bg-[#f8f9fa] rounded-lg p-1">
              {["1W", "1M", "3M", "6M", "All"].map((period, i) => (
                <button
                  key={period}
                  className={clsx(
                    "px-3 py-1.5 rounded-md transition-colors font-medium",
                    i === 1 ? "bg-[#1A2B32] text-white" : "hover:bg-[#1A2B32]/10"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Collections Chart */}
          <div className="relative h-32 sm:h-48 mb-4 sm:mb-6">
            <svg className="w-full h-full" viewBox="0 0 800 180" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 60}
                  x2="800"
                  y2={i * 60}
                  stroke="#1A2B32"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
              ))}
              {/* Gradient fill */}
              <defs>
                <linearGradient id="collectionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D2B4FA" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#D2B4FA" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d="M0,145 C40,142 80,138 120,132 C160,126 200,118 240,108 C280,98 320,92 360,88 C400,84 440,82 480,76 C520,70 560,62 600,54 C640,46 680,40 720,35 C760,30 800,28 800,28 L800,180 L0,180 Z"
                fill="url(#collectionsGradient)"
              />
              {/* Line */}
              <path
                d="M0,145 C40,142 80,138 120,132 C160,126 200,118 240,108 C280,98 320,92 360,88 C400,84 440,82 480,76 C520,70 560,62 600,54 C640,46 680,40 720,35 C760,30 800,28 800,28"
                fill="none"
                stroke="#D2B4FA"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] sm:text-[10px] text-[#1A2B32]/40 pt-2 border-t border-[#1A2B32]/10">
              {["Dec 21", "Dec 31", "Jan 10", "Jan 19"].map((date) => (
                <span key={date}>{date}</span>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Active Invoices", value: "12", sublabel: "$48,200 pending", color: "#D2B4FA" },
              { label: "Collected Today", value: "$8,420", sublabel: "3 invoices", color: "#22c55e" },
              { label: "Avg Collection Time", value: "4.2 days", sublabel: "↓ 1.3 days", color: "#D2B4FA" },
              { label: "Agent Actions", value: "28", sublabel: "This week", color: "#1A2B32" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#f8f9fa] rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-[#1A2B32]/50 text-[10px] sm:text-[11px] mb-0.5 sm:mb-1 font-medium">{stat.label}</p>
                <p className="text-[#1A2B32] text-base sm:text-xl font-semibold">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1" style={{ color: stat.color }}>{stat.sublabel}</p>
              </div>
            ))}
          </div>

          {/* Recent Agent Activity */}
          <div className="mt-3 sm:mt-4 border-t border-[#1A2B32]/10 pt-3 sm:pt-4 hidden sm:block">
            <p className="text-[#1A2B32]/50 text-[10px] sm:text-xs font-medium mb-2 sm:mb-3">Recent Agent Activity</p>
            <div className="space-y-1.5 sm:space-y-2">
              {[
                { action: "Sent reminder to Sarah Chen", invoice: "INV-0042", time: "2 min ago", type: "reminder" },
                { action: "Payment collected from TechCorp", invoice: "INV-0038", time: "1 hour ago", type: "collected" },
                { action: "Invoice parsed & sent", invoice: "INV-0045", time: "3 hours ago", type: "sent" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className={clsx(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      activity.type === "collected" ? "bg-[#22c55e]" :
                      activity.type === "reminder" ? "bg-[#D2B4FA]" : "bg-[#1A2B32]/30"
                    )} />
                    <span className="text-[#1A2B32] truncate">{activity.action}</span>
                    <span className="text-[#1A2B32]/40 shrink-0">{activity.invoice}</span>
                  </div>
                  <span className="text-[#1A2B32]/40 shrink-0 ml-2">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation Icons
function NavIcon({ type }: { type: string }) {
  const iconClass = "w-4 h-4";
  switch (type) {
    case "grid":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
    case "file":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "users":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      );
    case "bot":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    default:
      return null;
  }
}

// Hero Section
export function OrynHero() {
  const hero = orynContent.hero;

  return (
    <section className="relative min-h-[calc(630px-var(--header-height))] overflow-hidden pb-10">
      <Marquee />
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 md:px-[calc(clamp(28px,10vw,120px)+16px)]">
        <div className="flex flex-col items-center gap-8">
          <h1 className="!max-w-screen-lg text-pretty text-center text-[clamp(32px,7vw,64px)] font-medium leading-none tracking-[-1.44px] text-[--text-primary] dark:text-[--dark-text-primary] md:tracking-[-2.16px]">
            {hero.title.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < hero.title.split('\n').length - 1 && <br />}
              </span>
            ))}
          </h1>
          <h2 className="text-md max-w-2xl text-pretty text-center text-[--text-tertiary] dark:text-[#7a9aa8] md:text-lg">
            {hero.subtitle}
          </h2>
          <div className="flex flex-row items-center justify-center gap-4">
            {hero.actions.map(({ href, label, type, _id }) => (
              <ButtonLink
                key={_id}
                className={clsx(
                  "!h-14 flex-col items-center justify-center !text-base px-8",
                  type === "primary"
                    ? "flex !bg-[#D2B4FA] !text-[#1A2B32] hover:!bg-[#c9a5f7] dark:!bg-[#D2B4FA] dark:!text-[#1A2B32] dark:hover:!bg-[#c9a5f7]"
                    : "flex !border border-[--border] !bg-transparent transition-colors duration-150 hover:!bg-black/5 dark:border-[#3a4f58] dark:hover:!bg-white/5"
                )}
                href={href}
                intent={type}
              >
                {label}
              </ButtonLink>
            ))}
          </div>
        </div>
        {/* Dashboard Preview */}
        <div className="mt-16 w-full max-w-5xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

// Technology Partners Section
export function OrynPartners() {
  const partners = [
    { name: "Arc", logo: "/supporters/Arc.png" },
    { name: "Circle", logo: "/supporters/Circle.png" },
    { name: "Google DeepMind", logo: "/supporters/Google Deepmind.png" },
    { name: "Surge", logo: "/supporters/Surge.png" },
  ];

  return (
    <section className="py-10 sm:py-14 border-t border-[--border] dark:border-[#3a4f58]">
      <div className="px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)]">
        <p className="text-center text-sm text-[--text-tertiary] dark:text-[#7a9aa8] mb-8">
          Building with and Supported by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center h-8 sm:h-9 opacity-70 hover:opacity-100 transition-opacity"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-full w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature Card Visual Components - Diverse Styles

// Visual 1: Document with floating extraction tags
function FeatureVisualContractParsing() {
  return (
    <div className="relative h-full min-h-[340px] flex items-center justify-center p-3">
      <img
        src="/features/contract-parsing.png"
        alt="AI Contract Parsing - extracting payment details from documents"
        className="w-full h-full object-contain border border-[--border] dark:border-[#3a4f58]"
      />
    </div>
  );
}

// Visual 2: Multi-channel messaging visualization
function FeatureVisualMultiChannel() {
  return (
    <div className="relative h-full min-h-[340px] flex items-center justify-center p-3">
      <img
        src="/features/multi-channel.png"
        alt="Multi-Channel Outreach - Email, WhatsApp, and SMS messaging"
        className="w-full h-full object-contain border border-[--border] dark:border-[#3a4f58]"
      />
    </div>
  );
}

// Visual 3: Intelligent follow-up timeline
function FeatureVisualFollowups() {
  return (
    <div className="relative h-full min-h-[340px] flex items-center justify-center p-3">
      <img
        src="/features/follow-ups.png"
        alt="Intelligent Follow-ups - AI adapts tone from friendly to firm"
        className="w-full h-full object-contain border border-[--border] dark:border-[#3a4f58]"
      />
    </div>
  );
}

// Visual 4: USDC settlement flow
function FeatureVisualSettlement() {
  return (
    <div className="relative h-full min-h-[340px] flex items-center justify-center p-3">
      <img
        src="/features/settlement.png"
        alt="Instant USDC Settlement - Cards, Bank, and Crypto to USDC"
        className="w-full h-full object-contain border border-[--border] dark:border-[#3a4f58]"
      />
    </div>
  );
}

// Features Section - Card Style with Visuals
export function OrynFeatures() {
  const features = orynContent.features;

  const featureVisuals: Record<string, React.ReactNode> = {
    "feature-1": <FeatureVisualContractParsing />,
    "feature-2": <FeatureVisualMultiChannel />,
    "feature-3": <FeatureVisualFollowups />,
    "feature-4": <FeatureVisualSettlement />,
  };

  return (
    <section id="features" className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] border-t border-[--border] dark:border-[#3a4f58]">
      {/* Badge - above section */}
      <div className="flex justify-center mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
          {features.heading.badge}
        </span>
      </div>

      {/* Section Header */}
      <div className="text-center mb-10 md:mb-16 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-3 md:mb-4 leading-tight">
          {features.heading.title}
        </h2>
        <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {features.heading.subtitle}
        </p>
      </div>

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto space-y-6">
        {features.features.items.map((feature, index) => (
          <article
            key={feature._id}
            className="border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32] overflow-hidden"
          >
            <div className={`grid grid-cols-1 ${index % 2 === 0 ? "lg:grid-cols-[60%_40%]" : "lg:grid-cols-[40%_60%]"}`}>
              {/* Text Content */}
              <div className={`p-8 md:p-10 flex flex-col justify-center ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                <h3 className="text-xl md:text-2xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-3">
                  {feature._title}
                </h3>
                <p className="text-[--text-secondary] dark:text-[#7a9aa8] text-sm md:text-[15px] mb-6 leading-relaxed">
                  {feature.description}
                </p>
                {/* Bullet Points */}
                <ul className="space-y-3">
                  {feature.bullets?.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon className="w-4 h-4 text-[#D2B4FA] shrink-0 mt-0.5" />
                      <span className="text-sm text-[--text-secondary] dark:text-[#7a9aa8]">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Visual */}
              <div className={`relative border-t lg:border-t-0 border-[--border] dark:border-[#3a4f58] bg-[#fafafa] dark:bg-[#1f3039] ${index % 2 === 0 ? "lg:border-l" : "lg:border-r lg:order-1"}`}>
                {featureVisuals[feature._id]}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// How It Works Section
export function OrynHowItWorks() {
  const howItWorks = orynContent.howItWorks;

  const iconMap: Record<string, React.ReactNode> = {
    upload: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    robot: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    wallet: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    ),
  };

  return (
    <section id="how-it-works" className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] border-t border-[--border] dark:border-[#3a4f58]">
      {/* Badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
          {howItWorks.heading.badge}
        </span>
      </div>

      {/* Section Header */}
      <div className="text-center mb-10 md:mb-16 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-3 md:mb-4 leading-tight">
          {howItWorks.heading.title}
        </h2>
        <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {howItWorks.heading.subtitle}
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {howItWorks.steps.map((step, index) => (
            <div key={step._id} className="relative flex">
              {/* Card */}
              <article className="flex-1 p-6 md:p-8 border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32] md:border-r-0 md:last:border-r text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 border border-[#D2B4FA] text-[#D2B4FA]">
                  <span className="text-lg font-semibold">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="text-[#D2B4FA]">
                    {iconMap[step.icon]}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[--text-tertiary] dark:text-[#7a9aa8] leading-relaxed">
                  {step.description}
                </p>
              </article>

              {/* Arrow Connector (hidden on last item and mobile) */}
              {index < howItWorks.steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center bg-[--surface-primary] dark:bg-[#1A2B32]">
                  <svg className="w-4 h-4 text-[#D2B4FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Who Uses Oryn Section - Marquee with user type cards
export function OrynWhoUsesOryn() {
  const userTypes = [
    {
      _id: "user-1",
      title: "Freelancers",
      description: "Never chase payments again. Focus on your craft while Oryn handles collection.",
      image: "/images/users/Freelancers.png",
    },
    {
      _id: "user-2",
      title: "Agencies",
      description: "Scale collections without scaling headcount. Recover revenue across all clients.",
      image: "/images/users/Agencies.png",
    },
    {
      _id: "user-3",
      title: "SaaS Companies",
      description: "Recover failed payments and reduce churn with intelligent dunning sequences.",
      image: "/images/users/SaaS Companies.png",
    },
    {
      _id: "user-4",
      title: "Creators",
      description: "Spend time creating, not collecting. Get paid for your work automatically.",
      image: "/images/users/Creators.png",
    },
    {
      _id: "user-5",
      title: "Consultants",
      description: "Professional payment recovery that maintains client relationships.",
      image: "/images/users/Consultants.png",
    },
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section id="who-uses" className="border-t border-[--border] dark:border-[#3a4f58]">
      {/* Mobile: full width with padding */}
      <div className="block md:hidden px-4 py-16">
        {/* Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
            Users
          </span>
        </div>
        {/* Section Header */}
        <div className="text-center mb-10 px-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-3 leading-tight">
            Who&apos;s Oryn For
          </h2>
          <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            For Those Who Value Getting Paid, Not Chasing.
          </p>
        </div>
        {/* Scrollable Track - Mobile */}
        <div
          className="flex overflow-x-auto no-scrollbar touch-pan-x scroll-smooth gap-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {userTypes.map((userType) => (
            <div
              key={userType._id}
              className="flex-shrink-0 w-[260px]"
            >
              <article className="border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32] overflow-hidden h-full flex flex-col">
                <div className="p-5">
                  <h3 className="text-base font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                    {userType.title}
                  </h3>
                  <p className="text-sm text-[--text-tertiary] dark:text-[#7a9aa8] leading-relaxed">
                    {userType.description}
                  </p>
                </div>
                <div className="relative w-full aspect-square bg-[#fafafa] dark:bg-[#1f3039] border-t border-[--border] dark:border-[#3a4f58] flex items-center justify-center mt-auto">
                  <img
                    src={userType.image}
                    alt={userType.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full">
                          <svg class="w-16 h-16 text-[#D2B4FA] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: grid with vertical lines */}
      <div className="hidden md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
        <div />
        <div className="border-x border-[--border] dark:border-[#3a4f58] py-24 overflow-hidden">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
              Users
            </span>
          </div>
          {/* Section Header */}
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-4 leading-tight">
              Who&apos;s Oryn For
            </h2>
            <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              For Those Who Value Getting Paid, Not Chasing.
            </p>
          </div>
          {/* Scroll Container with Arrows */}
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-[--surface-primary] dark:bg-[#1A2B32] border border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary] hover:bg-[--surface-secondary] dark:hover:bg-[#243840] transition-colors rounded-full shadow-lg"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Right Arrow */}
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-[--surface-primary] dark:bg-[#1A2B32] border border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary] hover:bg-[--surface-secondary] dark:hover:bg-[#243840] transition-colors rounded-full shadow-lg"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* Scrollable Track */}
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto no-scrollbar touch-pan-x scroll-smooth gap-4 px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {userTypes.map((userType) => (
                <div
                  key={userType._id}
                  className="flex-shrink-0 w-[280px] lg:w-[300px]"
                >
                  <article className="border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32] overflow-hidden h-full flex flex-col">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                        {userType.title}
                      </h3>
                      <p className="text-sm text-[--text-tertiary] dark:text-[#7a9aa8] leading-relaxed">
                        {userType.description}
                      </p>
                    </div>
                    <div className="relative w-full aspect-square bg-[#fafafa] dark:bg-[#1f3039] border-t border-[--border] dark:border-[#3a4f58] flex items-center justify-center mt-auto">
                      <img
                        src={userType.image}
                        alt={userType.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="flex items-center justify-center w-full h-full">
                              <svg class="w-16 h-16 text-[#D2B4FA] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div />
      </div>
    </section>
  );
}

// Benefits Section - Grid of benefit cards
export function OrynBenefits() {
  const benefits = orynContent.benefits;

  const iconMap: Record<string, React.ReactNode> = {
    clock: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    chart: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    shield: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    lightning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    globe: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <section id="benefits" className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] border-t border-[--border] dark:border-[#3a4f58]">
      {/* Badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
          {benefits.heading.badge}
        </span>
      </div>

      {/* Section Header */}
      <div className="text-center mb-10 md:mb-16 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-3 md:mb-4 leading-tight">
          {benefits.heading.title}
        </h2>
        <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {benefits.heading.subtitle}
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.items.map((benefit) => (
          <article
            key={benefit._id}
            className="p-6 border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32]"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-full border border-[--border] dark:border-[#3a4f58] flex items-center justify-center text-[#D2B4FA] mb-4">
              {iconMap[benefit.icon]}
            </div>
            {/* Title */}
            <h3 className="text-base font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
              {benefit.title}
            </h3>
            {/* Description */}
            <p className="text-sm text-[--text-tertiary] dark:text-[#7a9aa8] leading-relaxed">
              {benefit.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Pricing Section
export function OrynPricing() {
  const pricing = orynContent.pricing;

  return (
    <section id="pricing" className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] border-t border-[--border] dark:border-[#3a4f58]">
      {/* Badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
          Pricing
        </span>
      </div>

      {/* Section Header */}
      <div className="text-center mb-10 md:mb-16 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-3 md:mb-4 leading-tight">
          {pricing.heading.title}
        </h2>
        <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {pricing.heading.subtitle}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricing.plans.items.map(({ plan }) => (
          <article
            key={plan._title}
            className={`relative flex flex-col border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32] ${plan.isMostPopular ? "ring-2 ring-[#D2B4FA]" : ""}`}
          >
            {/* Most Popular Badge */}
            {plan.isMostPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#D2B4FA] text-[#1A2B32] text-xs font-semibold px-3 py-1">
                  Most Popular
                </span>
              </div>
            )}

            {/* Header */}
            <header className="flex flex-col gap-2 p-6 pt-8 text-center border-b border-[--border] dark:border-[#3a4f58]">
              <h3 className="text-lg font-semibold text-[--text-primary] dark:text-[--dark-text-primary]">
                {plan._title}
              </h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl md:text-4xl font-bold text-[--text-primary] dark:text-[--dark-text-primary]">
                  {plan.price}
                </span>
              </div>
              <p className="text-sm text-[--text-tertiary] dark:text-[#7a9aa8]">
                {plan.billed}
              </p>
            </header>

            {/* Features List */}
            <div className="flex-1 p-6">
              <ul className="space-y-3">
                {plan.list.items.map((feature) => (
                  <li key={feature._title} className="flex items-start gap-3">
                    <CheckIcon className="w-4 h-4 text-[#D2B4FA] shrink-0 mt-0.5" />
                    <span className="text-sm text-[--text-secondary] dark:text-[#7a9aa8]">
                      {feature._title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <footer className="p-6 pt-0">
              <a
                href="https://app.oryn.cc/sign-up"
                className={`block w-full py-3 text-center text-sm font-semibold transition-colors ${
                  plan.isMostPopular
                    ? "bg-[#D2B4FA] text-[#1A2B32] hover:bg-[#c9a5f7]"
                    : "border border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary] hover:bg-[#f5f5f5] dark:hover:bg-[#2a3f48]"
                }`}
              >
                Get Started
              </a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

// Pricing shadow SVG component
function PricingShadow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 312 175" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g filter="url(#filter0_f_oryn)">
        <path
          d="M-41 398C-41 371.998 -35.9174 346.251 -26.0424 322.229C-16.1673 298.206 -1.69321 276.379 16.5535 257.993C34.8002 239.607 56.4622 225.022 80.3027 215.072C104.143 205.121 129.695 200 155.5 200C181.305 200 206.857 205.121 230.697 215.072C254.538 225.022 276.2 239.607 294.446 257.993C312.693 276.379 327.167 298.206 337.042 322.229C346.917 346.251 352 371.998 352 398L-41 398Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="598"
          id="filter0_f_oryn"
          width="793"
          x="-241"
          y="0"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_oryn" stdDeviation="100" />
        </filter>
      </defs>
    </svg>
  );
}

// FAQ Section
export function OrynFaq() {
  const faq = orynContent.faq;

  return (
    <section id="faq" className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] border-t border-[--border] dark:border-[#3a4f58]">
      {/* Badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58]">
          FAQ
        </span>
      </div>

      {/* Section Header */}
      <div className="text-center mb-10 md:mb-16 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] mb-3 md:mb-4 leading-tight">
          {faq.heading.title}
        </h2>
        <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {faq.heading.subtitle}
        </p>
      </div>

      {/* FAQ Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faq.questions.items.map((question) => (
          <article key={question._title} className="p-6 border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32]">
            <h3 className="text-base font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
              {question._title}
            </h3>
            <p className="text-sm text-[--text-tertiary] dark:text-[#7a9aa8] leading-relaxed">
              {question.answer}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Testimonials Section - matching original template card design
export function OrynTestimonials() {
  const testimonials = orynContent.testimonials;

  return (
    <div className="relative overflow-clip border-t border-[--border] dark:border-[#3a4f58]">
      <Section id="testimonials">
        <div className="flex w-full flex-col gap-14">
          <Heading className="self-stretch" align={testimonials.heading.align}>
            <h4>{testimonials.heading.title}</h4>
          </Heading>
          <div className="relative flex h-full w-full flex-col gap-10 md:flex-row md:gap-10">
            {testimonials.testimonials.items.map((testimonial) => (
              <div key={testimonial._id} className="min-w-0 max-w-full shrink-0 grow-0 basis-[min(740px,100%)] self-stretch md:basis-1/3">
                <article className="flex h-full w-full min-w-0 flex-col rounded-xl border border-[--border] dark:border-[--dark-border]">
                  <div className="flex flex-1 items-start border-b border-[--border] px-5 py-[18px] dark:border-[--dark-border] md:px-8 md:py-7">
                    <blockquote className="text-pretty text-lg font-extralight leading-[135%] text-[--text-primary] dark:text-[--dark-text-primary] sm:text-xl">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[--accent-500] text-lg font-medium text-white">
                      {testimonial.author._title.charAt(0)}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h5 className="text-base font-medium md:text-lg">{testimonial.author._title}</h5>
                      <p className="text-pretty text-sm text-[--text-tertiary] dark:text-[--dark-text-tertiary] md:text-base">
                        {testimonial.author.role}
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

// CTA Section
export function OrynCallout() {
  const callout = orynContent.callout;

  return (
    <section className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] border-t border-[--border] dark:border-[#3a4f58]">
      <div className="max-w-5xl mx-auto">
        <article className="relative flex flex-col items-center justify-center gap-6 p-8 md:p-12 border border-[--border] dark:border-[#3a4f58] bg-[--surface-secondary] dark:bg-[#1A2B32] text-center overflow-hidden">
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[--text-primary] dark:text-[--dark-text-primary] leading-tight">
              {callout.title}
            </h2>
            <p className="text-[--text-tertiary] dark:text-[#7a9aa8] text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
              {callout.subtitle}
            </p>
          </div>

          {/* CTA Button */}
          <a
            href={callout.cta.href}
            className="relative z-10 inline-flex items-center justify-center px-6 py-3 bg-[#D2B4FA] text-[#1A2B32] font-semibold text-sm hover:bg-[#c9a5f7] transition-colors"
          >
            {callout.cta.label}
          </a>
        </article>
      </div>
    </section>
  );
}

// Full Oryn Home Page
export function OrynHomePage() {
  return (
    <>
      <OrynHero />
      <OrynPartners />
      <OrynFeatures />
      <OrynHowItWorks />
      <OrynWhoUsesOryn />
      <OrynBenefits />
      <OrynPricing />
      <OrynFaq />
      <OrynCallout />
    </>
  );
}
