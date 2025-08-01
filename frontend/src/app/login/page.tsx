//frontend/src/app/login/page.tsx
import React from "react";
import { Metadata } from "next";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import ScrollClient from "@/app/components/ScrollClient";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login - Lexiah",
  description:
    "Sign in to your Lexiah account to access your legal AI workspace.",
};

export default function LoginPage() {
  return (
    <>
      <SalesPageHeader />
      <div className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-6 py-20">
          {/* Main Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
              <div className="text-4xl">🔐</div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-semibold text-gray-900 mb-4">
              Login & Sign-Up
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8">
              This feature is coming soon
            </p>

            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <p className="text-gray-700 leading-relaxed">
                We're putting the finishing touches on our secure authentication
                system. In the meantime, you can explore Lexiah using our demo
                workspace.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Link
                href="/#features"
                className="block w-full px-8 py-4 text-gray-700 font-semibold rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-300 hover:scale-105"
              >
                Learn More About Lexiah
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Want to be notified when login is ready?{" "}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact us
                </Link>{" "}
                and we'll keep you updated.
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
