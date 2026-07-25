import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Oryn",
  description: "Privacy Policy for Oryn AI Collection Agent",
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-[--text-tertiary] dark:text-[#7a9aa8]">
              Last updated: January 19, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                1. Introduction
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Oryn ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered payment collection service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-lg font-medium text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Account information (name, email address, password)</li>
                <li>Contract and invoice documents you upload</li>
                <li>Payment information and wallet addresses</li>
                <li>Client contact information for collection purposes</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-[--text-primary] dark:text-[--dark-text-primary] mb-2 mt-4">
                2.2 Information Collected Automatically
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Provide and maintain our AI collection services</li>
                <li>Process payments and settlements in USDC</li>
                <li>Send collection communications on your behalf</li>
                <li>Analyze and improve our AI algorithms</li>
                <li>Communicate with you about your account</li>
                <li>Comply with legal obligations</li>
                <li>Detect and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                4. Information Sharing
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Payment processors and financial institutions</li>
                <li>Communication service providers (email, SMS, WhatsApp)</li>
                <li>Cloud hosting and infrastructure providers</li>
                <li>Analytics and monitoring services</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                5. Data Security
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                We implement industry-standard security measures to protect your data, including encryption at rest and in transit, secure authentication, regular security audits, and access controls. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                6. Data Retention
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide services. We may retain certain information as required by law or for legitimate business purposes, such as resolving disputes and enforcing agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                7. Your Rights
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Export your data</li>
                <li>Opt-out of certain data processing</li>
                <li>Withdraw consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                8. International Transfers
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                9. Contact Us
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] mt-2">
                Email: <a href="mailto:team@hausorlabs.tech" className="text-[#D2B4FA] hover:underline">team@hausorlabs.tech</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
