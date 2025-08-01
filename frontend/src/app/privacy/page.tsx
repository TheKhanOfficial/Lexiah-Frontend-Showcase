//frontend/src/app/privacy/page.tsx
import React from "react";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import ScrollClient from "@/app/components/ScrollClient";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export default function PrivacyPage() {
  const lastUpdated = "December 20, 2024";

  return (
    <>
      <SalesPageHeader />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600">
              Your privacy matters. Here's how we protect it.
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
                1. What Information We Collect
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  We collect only what's necessary to provide you with
                  exceptional legal AI assistance.
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Account Information:
                  </span>{" "}
                  Your email address, name, and billing details when you create
                  an account or upgrade your plan.
                </p>
                <p>
                  <span className="font-medium text-gray-900">Usage Data:</span>{" "}
                  The questions you ask and documents you upload to Lexiah for
                  analysis. This helps us provide accurate legal insights.
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Technical Data:
                  </span>{" "}
                  Basic analytics like page views and feature usage to improve
                  your experience. We don't track you across the web.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. How We Use Your Data
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Your data serves one purpose: delivering the legal AI
                  assistance you need.
                </p>
                <p>
                  We process your queries through our AI to provide legal
                  insights and document analysis. Your message history is saved
                  so you can reference past conversations.
                </p>
                <p>
                  We never sell your data. Ever. We don't use your queries to
                  train AI models. Your legal matters stay between you and
                  Lexiah.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Security & Infrastructure
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Lexiah is built on Supabase, a secure platform trusted by
                  thousands of companies worldwide.
                </p>
                <p>
                  Every piece of your data is protected with row-level security.
                  This means your information is isolated and encrypted—only you
                  can access your data.
                </p>
                <p>
                  All data transmission happens over secure HTTPS connections.
                  Your queries and documents are encrypted both in transit and
                  at rest.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. AI Privacy & Zero Retention
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Your conversations with Lexiah are never used to train AI
                  models. Period.
                </p>
                <p>
                  We have a zero data retention agreement with Anthropic, our AI
                  provider. This means your queries are processed and
                  immediately deleted from their systems.
                </p>
                <p>
                  The AI responses you receive are generated in real-time based
                  solely on your current query and conversation context—not on
                  any other user's data.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. HIPAA Compliance
              </h2>
              <div className="space-y-3 text-gray-600">
                <p className="font-medium text-gray-900">
                  Important: Standard Lexiah accounts are not HIPAA-compliant.
                </p>
                <p>
                  If you need to process protected health information (PHI), you
                  must purchase our HIPAA Compliance Upgrade. This adds
                  additional security measures and compliance protocols required
                  by healthcare regulations.
                </p>
                <p>
                  Without the HIPAA upgrade, please do not input any medical
                  records, patient information, or other health-related data
                  into Lexiah.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Third-Party Services
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>We partner with trusted services to deliver Lexiah:</p>
                <p>
                  <span className="font-medium text-gray-900">Supabase:</span>{" "}
                  Handles our database and authentication securely.
                </p>
                <p>
                  <span className="font-medium text-gray-900">Anthropic:</span>{" "}
                  Powers our AI with Claude, under strict zero-retention terms.
                </p>
                <p>
                  <span className="font-medium text-gray-900">Stripe:</span>{" "}
                  Processes payments securely. We never see or store your credit
                  card details.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Your Data Rights
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>You own your data. Here's what you can do with it:</p>
                <p>
                  <span className="font-medium text-gray-900">Access:</span>{" "}
                  Download all your conversations and data anytime from your
                  account settings.
                </p>
                <p>
                  <span className="font-medium text-gray-900">Delete:</span>{" "}
                  Remove individual conversations or delete your entire account.
                  When you delete data, it's gone forever.
                </p>
                <p>
                  <span className="font-medium text-gray-900">Export:</span>{" "}
                  Take your data with you in standard formats if you decide to
                  leave.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Data Storage & Retention
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Your data is stored securely in Supabase's cloud
                  infrastructure with automatic backups for reliability.
                </p>
                <p>
                  We keep your conversations as long as you have an active
                  account. You can delete any conversation at any time.
                </p>
                <p>
                  If you delete your account, all your data is permanently
                  removed within 30 days. No exceptions.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Updates to This Policy
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  We'll update this policy as we improve Lexiah or when
                  regulations change.
                </p>
                <p>
                  If we make significant changes, we'll email you and display a
                  notice in the app. Your continued use means you accept the
                  updates.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section className="border-t pt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Questions About Privacy?
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  We're here to help. If you have any questions about how we
                  handle your data, please reach out.
                </p>
                <div className="flex items-center space-x-2 text-lg">
                  <Link
                    href="/contact"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="mt-16 pt-8 border-t">
              <p className="text-sm text-gray-500 text-center">
                Lexiah is committed to protecting your privacy and earning your
                trust.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollClient />
    </>
  );
}
