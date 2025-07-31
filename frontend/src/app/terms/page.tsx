//frontend/src/app/terms/page.tsx
//frontend/src/app/terms/page.tsx
import React from "react";
import { Metadata } from "next";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import ScrollClient from "@/app/components/ScrollClient";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Lexiah",
  description:
    "Terms of Service for Lexiah legal AI platform. Clear, modern terms for professional legal workflows.",
};

export default function TermsPage() {
  const lastUpdated = "December 20, 2024";

  return (
    <>
      <SalesPageHeader />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">
              Clear terms for using Lexiah's legal AI platform.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  By using Lexiah, you agree to these terms. If you don't agree,
                  please don't use our platform.
                </p>
                <p>
                  We may update these terms occasionally. We'll notify you of
                  significant changes via email or through the platform.
                  Continued use after changes means you accept the updated
                  terms.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Use of AI and Legal Disclaimer
              </h2>
              <div className="space-y-3 text-gray-600">
                <p className="font-medium text-gray-900">
                  Lexiah's AI outputs are NOT legal advice and are NOT a
                  substitute for a licensed attorney.
                </p>
                <p>
                  Our AI is powerful and designed for legal workflows, but it's
                  a tool to assist your work, not replace professional legal
                  judgment. Always consult with a qualified attorney for legal
                  advice specific to your situation.
                </p>
                <p>You're responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Reviewing and verifying all AI-generated content</li>
                  <li>
                    Ensuring compliance with applicable laws and regulations
                  </li>
                  <li>
                    Making your own professional judgments about legal matters
                  </li>
                  <li>
                    Maintaining attorney-client relationships where required
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Account Responsibilities
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  You're responsible for your account activity and keeping your
                  login credentials secure. Don't share your account with
                  others.
                </p>
                <p>
                  You must provide accurate information when creating your
                  account and keep it updated. You're liable for all activity
                  under your account.
                </p>
                <p>
                  Use Lexiah professionally and ethically. Don't use it for
                  illegal activities, harassment, or to violate anyone's rights.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Plans & Payments
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Lexiah offers both free and paid features. Free users have
                  access to core functionality with certain limits (like message
                  caps).
                </p>
                <p>
                  Paid upgrades unlock additional features including increased
                  message limits, priority support, and specialized compliance
                  features. All pricing is clearly displayed before purchase.
                </p>
                <p>
                  Payments are processed securely through our payment providers.
                  Subscriptions auto-renew unless cancelled. You can cancel
                  anytime from your account settings.
                </p>
                <p>
                  Refunds are handled case-by-case. Contact us at{" "}
                  <Link
                    href="/contact"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    support
                  </Link>{" "}
                  if you have billing concerns.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. HIPAA Compliance
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  HIPAA compliance features are available only with paid upgrade
                  plans. Free accounts are not HIPAA compliant.
                </p>
                <p>
                  If you handle protected health information (PHI), you must
                  upgrade to a HIPAA-compliant plan before using Lexiah for such
                  work.
                </p>
                <p>
                  HIPAA-compliant plans include enhanced security controls,
                  audit logging, and signed Business Associate Agreements
                  (BAAs). These features ensure your healthcare-related legal
                  work meets federal compliance requirements.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Data & Privacy Summary
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Your data is stored securely using Supabase with Row Level
                  Security (RLS) enabled. This ensures your data is isolated and
                  protected.
                </p>
                <p>
                  We collect only what's necessary to provide our service: your
                  account information, the content you share with our AI, and
                  basic usage analytics to improve the platform.
                </p>
                <p>
                  We don't sell your data or use it for advertising. Your legal
                  work stays confidential.
                </p>
                <p>
                  For complete details about how we handle your information, see
                  our full{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Termination and Fair Use
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  You can close your account anytime. We may suspend or
                  terminate accounts that violate these terms or engage in
                  abusive behavior.
                </p>
                <p>
                  Fair use means using Lexiah as intended for legitimate legal
                  work. Don't attempt to overload our systems, reverse engineer
                  our AI, or use automated tools to extract data.
                </p>
                <p>
                  Upon termination, you'll retain access to your data for a
                  reasonable period to allow export. After that, we may delete
                  your account data in accordance with our retention policies.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Liability Limits
              </h2>
              <div className="space-y-3 text-gray-600">
                <p className="font-medium text-gray-900">
                  Lexiah is provided "as is" without warranties of any kind.
                </p>
                <p>
                  We disclaim all liability related to how you use our AI
                  outputs. While we work hard to provide accurate and helpful
                  responses, AI can make mistakes, and you're responsible for
                  verifying and using the information appropriately.
                </p>
                <p>
                  Our maximum liability to you is limited to the amount you've
                  paid for our services in the 12 months before the issue
                  occurred.
                </p>
                <p>
                  We're not liable for indirect damages, lost profits, or
                  consequential damages arising from your use of Lexiah.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Governing Law
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  These terms are governed by the laws of Florida, United
                  States. Any disputes will be resolved in Florida courts.
                </p>
                <p>
                  We'll try to resolve any issues informally first. If that
                  doesn't work, any legal proceedings must be conducted
                  individually, not as part of a class action.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Contact Info
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>Questions about these terms? We're here to help.</p>
                <p>
                  Reach us at{" "}
                  <Link
                    href="/contact"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    our contact page
                  </Link>{" "}
                  or email us directly. We respond to all inquiries promptly.
                </p>
                <p>
                  For technical support, billing questions, or feature requests,
                  our team is ready to assist with your legal workflow needs.
                </p>
              </div>
            </section>
          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              These terms are written in plain English to be as clear as
              possible. If you need clarification on anything, please don't
              hesitate to contact us.
            </p>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollClient />
    </>
  );
}
