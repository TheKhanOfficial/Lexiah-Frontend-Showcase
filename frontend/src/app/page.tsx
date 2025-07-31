//frontend/src/app/page.tsx
import Link from "next/link";
import ScrollClient from "@/app/components/ScrollClient";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import Footer from "@/app/components/Footer";

const userId = "53917586-97ad-49b6-9bd6-51c441316425";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* Navigation */}
        <SalesPageHeader />

        {/* Hero Section */}
        <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 lg:pt-52 lg:pb-40 overflow-hidden">
          <div className="absolute inset-0 animated-gradient opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50" />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 tracking-tighter leading-[0.9]">
              <span className="block hero-line-1">One App.</span>
              <span className="block mt-2 hero-line-2">
                All Your Legal Work.
              </span>
              <span className="block mt-2 hero-line-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Free — Forever.
              </span>
            </h1>

            <p className="hero-subtitle mt-10 text-xl sm:text-2xl lg:text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              The future of legal case management. Infinite folders, AI-powered
              insights, seamless document handling, and intelligent billing —
              all in one beautiful app. No login required. Try it now.
            </p>

            <div className="hero-cta mt-12">
              <Link
                href={`/${userId}`}
                className="group inline-flex items-center px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Start Using Lexiah
                  <svg
                    className="ml-3 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-24 sm:py-32 lg:py-40 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Everything you need.
              </h2>
              <p className="mt-6 text-xl sm:text-2xl text-gray-600 font-light">
                Built for the modern legal professional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              {[
                {
                  color: "blue",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  ),
                  title: "Infinite Case Folders",
                  description:
                    "Organize unlimited cases with AI-powered categorization and instant search across all documents.",
                },
                {
                  color: "purple",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  ),
                  title: "AI Legal Assistant",
                  description:
                    "Get instant insights, summaries, and strategic recommendations powered by advanced AI.",
                },
                {
                  color: "pink",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  ),
                  title: "Smart Documents",
                  description:
                    "Upload, analyze, and extract key information from any legal document instantly.",
                },
                {
                  color: "green",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ),
                  title: "Smart Timeline",
                  description:
                    "Track every event, deadline, and milestone with our intelligent case timeline.",
                },
                {
                  color: "yellow",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ),
                  title: "Smart Billing",
                  description:
                    "Automated time tracking and invoicing. Get paid faster with less effort.",
                },
                {
                  color: "indigo",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  ),
                  title: "Collaborate Seamlessly",
                  description:
                    "Work together with your team in real-time with advanced permissions and sharing.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="fade-up group bg-white rounded-3xl p-8 shadow-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] border border-gray-100"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-14 h-14 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <svg
                      className={`w-7 h-7 text-${feature.color}-600`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 sm:py-32 lg:py-40 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Loved by legal professionals.
              </h2>
              <p className="mt-6 text-xl sm:text-2xl text-gray-600 font-light">
                Join thousands of lawyers transforming their practice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  text: "Lexiah transformed how I manage cases. The AI assistant alone saves me hours every week.",
                  author: "Sarah Chen",
                  role: "Corporate Attorney",
                  avatar: "SC",
                },
                {
                  text: "Finally, a case management tool that's as intuitive as it is powerful. Can't imagine working without it.",
                  author: "Michael Rodriguez",
                  role: "Trial Lawyer",
                  avatar: "MR",
                },
                {
                  text: "The document analysis features are game-changing. It's like having a brilliant paralegal available 24/7.",
                  author: "Emily Watson",
                  role: "Family Law Partner",
                  avatar: "EW",
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="fade-up bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.01] hover:shadow-xl"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg italic font-serif leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-24 sm:py-32 lg:py-40 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Free Forever.
                <span className="block mt-2 text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  No catches. No limits.
                </span>
              </h2>
              <p className="mt-6 text-xl sm:text-2xl text-gray-600 font-light">
                Everything you need to run your practice, at no cost.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="fade-up bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl border border-gray-100">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-10 text-center">
                  <h3 className="text-3xl font-bold mb-2">Free Plan</h3>
                  <div className="text-6xl font-bold mb-2">$0</div>
                  <p className="text-gray-300">per month, forever</p>
                </div>
                <div className="p-10">
                  <ul className="space-y-4">
                    {[
                      "Free Forever-No Gimmicks",
                      "Unlimited cases & documents (250 GB storage per user)",
                      "AI-powered legal assistant",
                      "Smart document analysis",
                      "Automated billing & invoicing",
                      "Real-time collaboration",
                      "Advanced security & encryption",
                      "Mobile apps included",
                      "24/7 support",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-6 h-6 text-purple-500 mt-0.5 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${userId}`}
                    className="mt-10 w-full flex justify-center items-center px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Teaser Section */}
          <div className="mt-24 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Need more power?
            </h3>
            <p className="text-lg text-gray-600 mb-10">
              Lexiah is free forever — but you can mix and match powerful
              upgrades to fit your firm. Just pay for what you need.
            </p>

            <ul className="text-left space-y-4 text-gray-700 text-lg max-w-xl mx-auto">
              {[
                "Upgraded AI capabilities (multiple tiers available)",
                "Premium 24/7 tech support",
                "One-time onboarding help",
                "HIPAA compliance upgrade",
                "Data backup & recovery",
                "White labeling (your logo & colors)",
                "Private server licensing",
                "Certified consultant training",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className="w-6 h-6 text-purple-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Link
                href="/upgrade"
                className="inline-flex items-center px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
              >
                <span className="relative z-10">View All Upgrades</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
      {/* 👇 this runs scroll effects on client only */}
      <ScrollClient />
    </>
  );
}
