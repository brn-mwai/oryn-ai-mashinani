import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - Oryn",
  description: "Cookie Policy for Oryn AI Collection Agent",
};

export default function CookiesPage() {
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
              Cookie Policy
            </h1>
            <p className="text-[--text-tertiary] dark:text-[#7a9aa8]">
              Last updated: January 19, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                1. What Are Cookies
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your overall experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                2. How We Use Cookies
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                Oryn uses cookies and similar technologies for several purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li>To keep you signed in to your account</li>
                <li>To remember your preferences and settings</li>
                <li>To understand how you use our Services</li>
                <li>To improve our website and Services</li>
                <li>To provide personalized content and features</li>
                <li>To analyze traffic and usage patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                3. Types of Cookies We Use
              </h2>

              <div className="border border-[--border] dark:border-[#3a4f58] overflow-hidden mb-6">
                <div className="bg-[--surface-secondary] dark:bg-[#243840] px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">
                  <h3 className="font-semibold text-[--text-primary] dark:text-[--dark-text-primary]">
                    Essential Cookies
                  </h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[--text-secondary] dark:text-[#94a3b8] text-sm">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and session management. You cannot opt out of these cookies.
                  </p>
                </div>
              </div>

              <div className="border border-[--border] dark:border-[#3a4f58] overflow-hidden mb-6">
                <div className="bg-[--surface-secondary] dark:bg-[#243840] px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">
                  <h3 className="font-semibold text-[--text-primary] dark:text-[--dark-text-primary]">
                    Functional Cookies
                  </h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[--text-secondary] dark:text-[#94a3b8] text-sm">
                    These cookies enable enhanced functionality and personalization, such as remembering your theme preference (light/dark mode), language settings, and other customizations.
                  </p>
                </div>
              </div>

              <div className="border border-[--border] dark:border-[#3a4f58] overflow-hidden mb-6">
                <div className="bg-[--surface-secondary] dark:bg-[#243840] px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">
                  <h3 className="font-semibold text-[--text-primary] dark:text-[--dark-text-primary]">
                    Analytics Cookies
                  </h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[--text-secondary] dark:text-[#94a3b8] text-sm">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our Services and user experience.
                  </p>
                </div>
              </div>

              <div className="border border-[--border] dark:border-[#3a4f58] overflow-hidden">
                <div className="bg-[--surface-secondary] dark:bg-[#243840] px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">
                  <h3 className="font-semibold text-[--text-primary] dark:text-[--dark-text-primary]">
                    Marketing Cookies
                  </h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[--text-secondary] dark:text-[#94a3b8] text-sm">
                    These cookies are used to track visitors across websites to display relevant advertisements. They help measure the effectiveness of our marketing campaigns.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                4. Specific Cookies We Use
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-[--border] dark:border-[#3a4f58] text-sm">
                  <thead>
                    <tr className="bg-[--surface-secondary] dark:bg-[#243840]">
                      <th className="text-left px-4 py-3 border-b border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary]">Cookie Name</th>
                      <th className="text-left px-4 py-3 border-b border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary]">Purpose</th>
                      <th className="text-left px-4 py-3 border-b border-[--border] dark:border-[#3a4f58] text-[--text-primary] dark:text-[--dark-text-primary]">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-[--text-secondary] dark:text-[#94a3b8]">
                    <tr>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">oryn_session</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">Authentication and session management</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">oryn_theme</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">Stores theme preference (light/dark)</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">oryn_consent</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">Stores cookie consent preferences</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">_ga</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">Google Analytics - distinguishes users</td>
                      <td className="px-4 py-3 border-b border-[--border] dark:border-[#3a4f58]">2 years</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">_gid</td>
                      <td className="px-4 py-3">Google Analytics - distinguishes users</td>
                      <td className="px-4 py-3">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                5. Third-Party Cookies
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                Some cookies are placed by third-party services that appear on our pages. We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li><strong>Google Analytics</strong> - For website analytics and usage tracking</li>
                <li><strong>Stripe</strong> - For payment processing</li>
                <li><strong>Intercom</strong> - For customer support chat</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                6. Managing Cookies
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                You can control and manage cookies in several ways:
              </p>
              <h3 className="text-lg font-medium text-[--text-primary] dark:text-[--dark-text-primary] mb-2">
                Browser Settings
              </h3>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed mb-4">
                Most browsers allow you to view, manage, delete, and block cookies. Note that blocking all cookies may affect your ability to use certain features of our Services.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[--text-secondary] dark:text-[#94a3b8]">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#D2B4FA] hover:underline">Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-[#D2B4FA] hover:underline">Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#D2B4FA] hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#D2B4FA] hover:underline">Edge</a></li>
              </ul>

              <h3 className="text-lg font-medium text-[--text-primary] dark:text-[--dark-text-primary] mb-2 mt-4">
                Opt-Out Tools
              </h3>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#D2B4FA] hover:underline">Google Analytics Opt-out Browser Add-on</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                7. Do Not Track
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                Some browsers have a "Do Not Track" feature that signals to websites that you do not want to be tracked. Our website currently does not respond to "Do Not Track" signals, but you can manage your cookie preferences as described above.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                8. Updates to This Policy
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will post any changes on this page and update the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[--text-primary] dark:text-[--dark-text-primary] mb-4">
                9. Contact Us
              </h2>
              <p className="text-[--text-secondary] dark:text-[#94a3b8] leading-relaxed">
                If you have questions about our use of cookies, please contact us at:
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
