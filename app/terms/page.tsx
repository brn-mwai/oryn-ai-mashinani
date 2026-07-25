import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Oryn",
  description: "Terms of Service for Oryn AI Collection Agent",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="py-16 md:py-24 px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)]">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <span className="inline-block px-4 py-1.5 text-xs font-medium text-[--text-tertiary] dark:text-[#7a9aa8] border border-[--border] dark:border-[#3a4f58] mb-4">
              Legal
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
              Terms of Service
            </h1>
            <p className="text-[--text-tertiary] dark:text-[#7a9aa8]">
              Last updated: January 19, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                By accessing or using Oryn's AI-powered payment collection services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                2. Description of Services
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Oryn provides an AI-powered platform for automated payment collection. Our Services include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8] mt-4">
                <li>AI-powered contract and invoice parsing</li>
                <li>Automated multi-channel collection outreach (email, SMS, WhatsApp)</li>
                <li>Intelligent follow-up and escalation sequences</li>
                <li>Payment processing and instant USDC settlement</li>
                <li>Dashboard and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                3. Account Registration
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                To use our Services, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                4. Fees and Payment
              </h2>
              <h3 className="text-lg font-medium text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                4.1 Success-Based Pricing
              </h3>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                Oryn operates on a success-based pricing model. You only pay when we successfully collect payment on your behalf. Fees vary by plan:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Starter: 5% of collected amount</li>
                <li>Professional: 3.5% of collected amount</li>
                <li>Enterprise: Custom pricing</li>
              </ul>

              <h3 className="text-lg font-medium text-[--text-primary] dark:text-[--dark-text-primary] mb-2 mt-4">
                4.2 Settlement
              </h3>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Collected payments are settled in USDC to your designated wallet address. Settlement is instant upon successful payment collection, minus applicable fees.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                5. User Responsibilities
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Only upload legitimate contracts and invoices for valid debts</li>
                <li>Provide accurate information about amounts owed</li>
                <li>Not use our Services for fraudulent or illegal purposes</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not attempt to circumvent or disable any security features</li>
                <li>Not interfere with or disrupt our Services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                6. Compliance
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Oryn is designed to comply with applicable collection regulations, including FDCPA (Fair Debt Collection Practices Act), TCPA (Telephone Consumer Protection Act), and international regulations. Our AI ensures all communications are professional, timely, and within legal boundaries. You are responsible for ensuring that the debts you submit for collection are valid and legally enforceable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                7. Intellectual Property
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                All content, features, and functionality of our Services, including but not limited to software, algorithms, text, graphics, logos, and trademarks, are owned by Oryn and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ORYN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF OUR SERVICES.
              </p>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mt-4">
                Our total liability shall not exceed the fees you paid to Oryn in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                9. Disclaimer of Warranties
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT OUR SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ALL DEBTS WILL BE SUCCESSFULLY COLLECTED.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                10. Indemnification
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                You agree to indemnify and hold harmless Oryn and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our Services, your violation of these Terms, or your violation of any rights of a third party.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                11. Termination
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                We may terminate or suspend your account at any time for any reason, including violation of these Terms. Upon termination, your right to use our Services will immediately cease. Provisions that by their nature should survive termination shall remain in effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                12. Governing Law
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                13. Changes to Terms
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of our Services after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                14. Contact Us
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] mt-2">
                Email: <a href="mailto:team@hausorlabs.tech" className="text-[#D2B4FA] hover:underline">team@hausorlabs.tech</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
