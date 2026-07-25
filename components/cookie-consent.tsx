"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("oryn_cookie_consent");
    if (!consent) {
      // Small delay before showing the popup
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("oryn_cookie_consent", "accepted");
    setShowConsent(false);
  };

  const handleReject = () => {
    localStorage.setItem("oryn_cookie_consent", "rejected");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="bg-[--surface-primary] dark:bg-[#243840] border border-[--border] dark:border-[#3a4f58] p-4 md:p-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                We value your privacy
              </h3>
              <p className="text-sm text-[--text-secondary] dark:text-[#94a3b8]">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                By clicking "Accept", you consent to our use of cookies. Read our{" "}
                <Link href="/cookies" className="text-[#D2B4FA] hover:underline">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#D2B4FA] hover:underline">
                  Privacy Policy
                </Link>{" "}
                to learn more.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#1A2B32] text-white hover:bg-[#2a3f48] dark:bg-[#D2B4FA] dark:text-[#1A2B32] dark:hover:bg-[#c9a5f7] transition-colors"
              >
                Accept All Cookies
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary] hover:bg-[--surface-secondary] dark:hover:bg-[#2e454e] transition-colors"
              >
                Reject Non-Essential
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 pt-2 border-t border-[--border] dark:border-[#3a4f58]">
              <Link
                href="/privacy"
                className="text-xs text-[--text-tertiary] dark:text-[#7a9aa8] hover:text-[--text-primary] dark:hover:text-[--dark-text-primary] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-[--text-tertiary] dark:text-[#7a9aa8] hover:text-[--text-primary] dark:hover:text-[--dark-text-primary] transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-xs text-[--text-tertiary] dark:text-[#7a9aa8] hover:text-[--text-primary] dark:hover:text-[--dark-text-primary] transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
