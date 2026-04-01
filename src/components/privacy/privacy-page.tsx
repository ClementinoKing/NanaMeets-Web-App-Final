"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";

type TocItem = {
  id: string;
  title: string;
};

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function PrivacyPage() {
  const tableOfContents = useMemo<TocItem[]>(
    () => [
      { id: "introduction", title: "Introduction" },
      { id: "information-collect", title: "Information We Collect" },
      { id: "information-use", title: "How We Use Your Information" },
      { id: "information-disclose", title: "Sharing of Information" },
      { id: "security", title: "Data Security" },
      { id: "your-choices", title: "Your Choices and Rights" },
      { id: "data-retention", title: "Data Retention" },
      { id: "csae", title: "Child Sexual Abuse and Exploitation (CSAE)" },
      { id: "third-party-links", title: "Third-Party Links & Services" },
      { id: "data-transfer", title: "Data Transfer" },
      { id: "policy-changes", title: "Changes to This Policy" },
      { id: "event-tickets", title: "Event Ticket Sales & Payment Data" },
      { id: "contact-us", title: "Contact Us" },
    ],
    []
  );

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute bottom-0 left-0 h-[48rem] w-[48rem] rounded-full bg-[#E94057]/20 blur-[200px]"
        />
      </div>
      <div
        className="absolute -right-48 -top-48 h-[48rem] w-[48rem] rounded-full bg-yellow-500/20 blur-[200px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="px-8 py-16 text-center">
          <div className="mx-auto mb-6 h-px w-24 bg-white/15" aria-hidden="true" />
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">Privacy Policy</h1>
          <p className="text-lg text-gray-300">Last Updated December, 2024</p>
          <p className="mx-auto mt-8 max-w-4xl text-xl font-bold leading-relaxed text-white">
            Welcome to Nana Meets! Your privacy is important to us. This Privacy Policy explains how
            we collect, use, disclose, and protect your information when you use our mobile
            application.
          </p>
        </header>

        <main className="px-8 pb-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <section id="introduction" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">1. Introduction</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  Welcome to Nana Meets! Your privacy is important to us. This Privacy Policy explains
                  how we collect, use, disclose, and protect your information when you use our mobile
                  application (&quot;App&quot;). By using Nana Meets, you consent to the practices described
                  in this policy.
                </p>
              </section>

              <section id="information-collect" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">2. Information We Collect</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  We collect the following types of information:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-6">
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Personal Information:</strong> Name, email address, phone number, date of
                    birth, gender, and profile details.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Location Data:</strong> To provide location-based matches and event
                    suggestions, we may collect your approximate or precise location (with your
                    permission).
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Usage Data:</strong> Information about how you interact with the App, such as
                    logins, preferences, and interactions with other users.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Payment Data:</strong> Limited payment details (e.g., transaction ID, payment
                    confirmation, and payment method) may be collected through secure third-party
                    payment processors. Nana Meets does not store full credit card or mobile money
                    account information.
                  </li>
                </ul>
              </section>

              <section id="information-use" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">3. How We Use Your Information</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  We use the collected information to:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-6">
                  <li className="text-base leading-relaxed text-gray-300">
                    Facilitate user interactions and matchmaking.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Personalize your experience on Nana Meets.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Improve App functionality, user safety, and security.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Process payments, subscriptions, and event ticket purchases.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Enforce our Terms of Use and prevent fraudulent activities.
                  </li>
                </ul>
              </section>

              <section id="information-disclose" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">4. Sharing of Information</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  We do not sell or rent your personal data. However, we may share information with:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-6">
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Service Providers:</strong> Payment processors, event organizers, cloud
                    hosting services, and analytics providers.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Event Organizers:</strong> When you purchase event tickets through Nana
                    Meets, we share necessary information (such as your name, contact number, and ticket
                    purchase confirmation) with the event organizer.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Legal Authorities:</strong> When required by law or to protect our rights,
                    users, or the safety of others.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Other Users:</strong> Limited profile details (e.g., name, age, and profile
                    photos) are visible to other users.
                  </li>
                </ul>
              </section>

              <section id="security" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">5. Data Security</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  We implement industry-standard security measures to protect your data. However, no
                  method of transmission over the Internet is 100% secure, and we cannot guarantee
                  absolute security. We use encryption and secure connections (HTTPS) to safeguard
                  personal and payment-related information.
                </p>
              </section>

              <section id="your-choices" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">6. Your Choices and Rights</h2>
                <ul className="mb-4 list-disc space-y-2 pl-6">
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Access &amp; Correction:</strong> You can view or update your profile details
                    within the App.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Location Settings:</strong> You can disable location sharing at any time in
                    your device settings.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Account Deletion:</strong> If you delete your account, your account will be
                    deleted. You can also visit{" "}
                    <Link href="/delete_account" className="text-white underline underline-offset-4">
                      /delete_account
                    </Link>
                    {" "}for the public deletion page.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Marketing Preferences:</strong> You may opt out of promotional emails or
                    event marketing notifications.
                  </li>
                </ul>
              </section>

              <section id="data-retention" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">7. Data Retention</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  We retain your data as long as necessary for operational and legal purposes. If you
                  delete your account, your personal information will be removed, except where retention
                  is required by law.
                </p>
              </section>

              <section id="csae" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">
                  8. Child Sexual Abuse and Exploitation (CSAE)
                </h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  Nana Meets is committed to maintaining a safe and respectful platform. We have a
                  zero-tolerance policy toward Child Sexual Abuse and Exploitation (CSAE). Any content
                  or behavior involving CSAE will result in immediate account termination and reporting
                  to authorities.
                </p>
                <p className="mb-4 text-base leading-relaxed text-gray-300">Prohibited activities include:</p>
                <ul className="mb-4 list-disc space-y-2 pl-6">
                  <li className="text-base leading-relaxed text-gray-300">
                    Possession or sharing of child sexual abuse material (CSAM).
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Attempting to engage minors in inappropriate or sexual activities.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Grooming, solicitation, or coercion of minors.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Sharing or distributing links related to CSAE content.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    Impersonating minors for abusive purposes.
                  </li>
                </ul>
              </section>

              <section id="third-party-links" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">9. Third-Party Links &amp; Services</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  Nana Meets may contain links to third-party websites or services (such as event
                  organizers, ticket platforms, or social links). We are not responsible for their
                  privacy practices and encourage you to review their privacy policies before engaging
                  with them.
                </p>
              </section>

              <section id="data-transfer" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">10. Data Transfer</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  Where necessary, Nana Meets may store or process your data on servers located outside
                  Malawi. We ensure that any data transfers comply with applicable data protection laws
                  and are handled securely.
                </p>
              </section>

              <section id="policy-changes" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">11. Changes to This Policy</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  We may update this Privacy Policy from time to time. If changes are significant, we
                  will notify you through the App or via email before they take effect.
                </p>
              </section>

              <section id="event-tickets" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">12. Event Ticket Sales &amp; Payment Data</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  When you purchase event tickets through Nana Meets, the following additional privacy
                  practices apply:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-6">
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Data Collected:</strong> We collect your name, contact information, and
                    payment confirmation details to complete your ticket purchase.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Sharing with Organizers:</strong> Relevant data is securely shared with the
                    event organizer to issue your ticket and manage attendance.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Third-Party Payments:</strong> Payments are processed through trusted local
                    payment gateways, banks, or mobile money platforms. Nana Meets does not store your
                    complete payment credentials.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Fraud Prevention:</strong> Payment data is securely encrypted and may be
                    retained temporarily to detect and prevent fraudulent activity.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Refunds and Disputes:</strong> Refunds or event-related disputes are managed
                    in accordance with the Terms of Use, and in cooperation with the event organizer.
                  </li>
                  <li className="text-base leading-relaxed text-gray-300">
                    <strong>Data Retention for Compliance:</strong> Ticket transaction data may be
                    retained for financial and regulatory compliance for a limited period.
                  </li>
                </ul>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  By purchasing tickets through Nana Meets, you acknowledge that your information will be
                  used and shared as described above.
                </p>
              </section>

              <section id="contact-us" className="mb-12">
                <h2 className="mb-4 text-xl font-bold text-white">13. Contact Us</h2>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  If you have any questions or concerns about this Privacy Policy, please contact us at:
                </p>
                <a
                  href="mailto:support@nanameets.com"
                  className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 font-semibold transition-all duration-300 hover:scale-105 hover:bg-white/20"
                  style={{ color: "#E94057" }}
                >
                  support@nanameets.com
                </a>
                <p className="mb-4 text-base leading-relaxed text-gray-300">
                  Thank you for trusting Nana Meets!
                </p>
              </section>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-8 rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-6 text-lg font-bold text-white">Table of contents</h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item, index) => (
                    <div key={item.id} className="text-sm">
                      <button
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className="w-full text-left text-gray-300 underline transition-colors hover:text-white"
                      >
                        {index + 1}. {item.title}
                      </button>
                    </div>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={handleScrollToTop}
                  className="mt-6 text-sm text-gray-300 underline transition-colors hover:text-white"
                >
                  Back to top ↑
                </button>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <Link
                    href="/"
                    className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20"
                  >
                    Back home
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
