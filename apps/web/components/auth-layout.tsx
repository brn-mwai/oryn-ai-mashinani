"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "./theme-switcher";

// Dynamically import HalftoneBackground to avoid SSR issues with canvas
const HalftoneBackground = dynamic(() => import("./halftone-background"), {
  ssr: false,
});

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Halftone Background (Desktop only) */}
      <div className="hidden lg:block lg:w-1/2 p-4 h-screen">
        <div className="relative w-full h-full overflow-hidden bg-[#1A2B32] border border-[#3a4f58] dark:border-[#3a4f58]">
          {/* Halftone Background */}
          <HalftoneBackground style={{ position: "absolute", inset: 0, zIndex: 1 }} />

          {/* Logo */}
          <div className="absolute top-8 left-8 z-10">
            <Link href="https://oryn.cc" className="flex items-center">
              <Image
                src="/logo-light.svg"
                alt="Oryn"
                width={120}
                height={39}
                priority
              />
            </Link>
          </div>

          {/* Hero Text */}
          <div className="absolute bottom-10 left-8 right-8 z-10">
            <p className="text-white/60 text-sm mb-3 uppercase tracking-wider font-medium">
              {heroSubtitle}
            </p>
            <h2 className="text-white text-4xl xl:text-5xl font-medium leading-tight tracking-[-1.44px] xl:tracking-[-2px]">
              {heroTitle}
            </h2>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="relative flex-1 flex flex-col min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link href="https://oryn.cc" className="flex items-center">
            <Image
              src="/logo-dark.svg"
              alt="Oryn"
              width={80}
              height={26}
              className="dark:hidden"
            />
            <Image
              src="/logo-light.svg"
              alt="Oryn"
              width={80}
              height={26}
              className="hidden dark:block"
            />
          </Link>
          <ThemeSwitcher />
        </div>

        {/* Desktop Theme Switcher */}
        <div className="hidden lg:block absolute top-6 right-6">
          <ThemeSwitcher />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
          <div className="w-full max-w-[420px]">
            {/* Desktop Logo */}
            <div className="hidden lg:block mb-6">
              <Link href="https://oryn.cc">
                <Image
                  src="/logo-dark.svg"
                  alt="Oryn"
                  width={80}
                  height={26}
                  className="dark:hidden"
                />
                <Image
                  src="/logo-light.svg"
                  alt="Oryn"
                  width={80}
                  height={26}
                  className="hidden dark:block"
                />
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-medium tracking-tighter mb-2 text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground mb-6 sm:mb-8">{subtitle}</p>

            {/* Form Content */}
            {children}
          </div>
        </div>

        {/* Mobile Footer Spacer */}
        <div className="h-4 lg:hidden" />
      </div>
    </div>
  );
}
