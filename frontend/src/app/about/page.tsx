//frontend/src/app/about/page.tsx
//frontend/src/app/about/page.tsx
import React from "react";
import { Metadata } from "next";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import ScrollClient from "@/app/components/ScrollClient";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import UseLexiah from "@/app/components/ui/UseLexiah";

export const metadata: Metadata = {
  title: "About Us - Lexiah",
  description:
    "Learn about Lexiah's mission to transform legal workflows through intelligent AI assistance and thoughtful design.",
};

export default function AboutPage() {
  return (
    <>
      <SalesPageHeader />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-semibold text-gray-900 mb-6">
              About Lexiah
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              We believe legal work deserves technology that thinks as clearly
              as you do.
            </p>
          </div>

          {/* Mission */}
          <div className="mb-16">
            <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Lexiah transforms how legal professionals work by combining
                powerful AI with thoughtful design. We create tools that
                understand the complexity of legal thinking—not to replace
                professional judgment, but to amplify it. Every feature is built
                with privacy, precision, and the realities of legal practice in
                mind. We're not building software for everyone. We're building
                the definitive workspace for legal minds who demand both
                intelligence and integrity from their tools.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="space-y-12 mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 text-center">
              Built on Principles That Matter
            </h2>

            <div className="grid gap-8 lg:gap-12">
              {/* Pillar 1 */}
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Privacy-First by Default
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Your work is confidential. Our architecture ensures your data
                  stays isolated, encrypted, and under your control. We never
                  sell information, never train on your content without
                  permission, and never compromise on security. Privacy isn't a
                  feature—it's the foundation.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="border-l-4 border-purple-600 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Legal Workflow Automation Done Right
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We understand legal work because we've studied it deeply. From
                  document analysis to case organization, every automation is
                  designed around real legal workflows, not generic productivity
                  patterns. Our AI speaks your language and respects the nuance
                  that defines excellent legal work.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="border-l-4 border-green-600 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI as a Thinking Partner
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our AI doesn't make decisions for you—it helps you make better
                  ones. Think of it as a research associate who never sleeps, a
                  document reviewer who never misses details, and a strategic
                  thinking partner who helps you see patterns. The judgment
                  remains yours. The insights multiply.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="border-l-4 border-orange-600 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Built for Legal Professionals
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every line of code serves legal practice. We're not a general
                  productivity tool that happens to work for lawyers—we're a
                  purpose-built platform that understands precedent, procedure,
                  and the weight of every word. Your expertise deserves tools
                  designed specifically for how you think and work.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl py-12 px-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Experience Legal AI Done Right
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              See how Lexiah transforms your legal workflow while respecting the
              craft and precision that defines exceptional legal work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <UseLexiah text="Start Your Journey" widthClass="px-8 py-4" />
              <Link
                href="/#features"
                className="px-8 py-4 text-gray-700 font-semibold rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-300 hover:scale-105"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollClient />
    </>
  );
}
