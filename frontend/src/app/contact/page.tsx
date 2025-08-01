//frontend/src/app/contact/page.tsx
import React from "react";
import { Metadata } from "next";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import ScrollClient from "@/app/components/ScrollClient";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us - Lexiah",
  description:
    "Get in touch with the Lexiah team for support, questions, or feedback.",
};

const userId = "53917586-97ad-49b6-9bd6-51c441316425";

export default function ContactPage() {
  return (
    <>
      <SalesPageHeader />
      <div className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-6 py-20">
          {/* Main Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-8">
              <div className="text-4xl">📧</div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-semibold text-gray-900 mb-4">
              Contact Us
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8">
              This feature is coming soon
            </p>

            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <p className="text-gray-700 leading-relaxed">
                We're building a comprehensive support system to help you get
                the most out of Lexiah. Until then, you can explore our platform
                and discover how it transforms legal workflows.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Link
                href={`/${userId}`}
                className="group relative block w-full px-8 py-4 bg-gray-900 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <span className="relative z-10">Explore Lexiah</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <Link
                href="/about"
                className="block w-full px-8 py-4 text-gray-700 font-semibold rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-300 hover:scale-105"
              >
                Learn About Our Mission
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                We're committed to providing excellent support for legal
                professionals. Our full contact system will include detailed FAQ
                and priority support for premium users.
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
