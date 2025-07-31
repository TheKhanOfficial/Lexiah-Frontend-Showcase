//frontend/src/app/upgrade/page.tsx
import { Metadata } from "next";
import ScrollClient from "@/app/components/ScrollClient";
import SalesPageHeader from "@/app/components/SalesPageHeader";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "Upgrade Your Practice | Lexiah",
  description: "Choose what you need. All pricing is upfront.",
};

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  period?: string;
  badge?: string;
}

const aiMicrotransactions: Product[] = [
  {
    id: "ai-1",
    title: "1 AI Message",
    description: "One-time advanced legal AI task. Great for quick insights.",
    price: "$0.89",
    period: "per message",
  },
  {
    id: "ai-5",
    title: "5 AI Messages",
    description: "Bundle of 5 AI tasks. Save more per message.",
    price: "$3.99",
    period: "total",
  },
  {
    id: "ai-10",
    title: "10 AI Messages",
    description: "Bigger bundle for regular AI usage. Even better value.",
    price: "$6.99",
    period: "total",
    badge: "Best Value",
  },
];

const aiSubscriptions: Product[] = [
  {
    id: "sub-plus",
    title: "Lexiah Plus",
    description: "Up to 1,000 AI messages per month.",
    price: "$19",
    period: "per user/month",
  },
  {
    id: "sub-silver",
    title: "Lexiah Silver",
    description: "Unlimited AI messages, fastest legal workflow acceleration.",
    price: "$99",
    period: "per user/month",
    badge: "Most Popular",
  },
  {
    id: "sub-gold",
    title: "Lexiah Gold",
    description: "Unlimited AI using advanced model (Claude Opus 4).",
    price: "$399",
    period: "per user/month",
  },
];

const complianceStorage: Product[] = [
  {
    id: "hipaa",
    title: "HIPAA Compliance Upgrade",
    description: "Ensure full legal compliance for healthcare-related work.",
    price: "$49",
    period: "per user/month",
  },
  {
    id: "storage",
    title: "Extra Storage",
    description:
      "Beyond the included 250 GB per user — ideal for data-heavy firms.",
    price: "$5",
    period: "per additional GB/month",
  },
];

const serviceUpgrades: Product[] = [
  {
    id: "onboarding",
    title: "Paid Onboarding",
    description: "White-glove setup, configuration, and live user training.",
    price: "$999",
    period: "one-time",
    badge: "Firm-wide",
  },
  {
    id: "support",
    title: "Priority Tech Support",
    description:
      "Skip the line with 24/7 hotline, live chat, and expert support.",
    price: "$199",
    period: "per month/firm",
  },
  {
    id: "hosting",
    title: "Cloud Hosting (Fully Managed)",
    description:
      "Let us securely host your Lexiah instance — no IT team needed.",
    price: "$399",
    period: "per month",
  },
  {
    id: "backup",
    title: "Data Backup & Recovery",
    description: "Daily encrypted backups, instant recovery in emergencies.",
    price: "$99",
    period: "per month/firm",
  },
  {
    id: "whitelabel",
    title: "White Labeling",
    description:
      "Replace Lexiah branding with your firm's name, logo, and colors.",
    price: "$2,500",
    period: "one-time",
  },
  {
    id: "private",
    title: "Private Server Licensing",
    description: "For clients demanding full control. On-prem or VPC install.",
    price: "$9,999",
    period: "one-time",
    badge: "Enterprise",
  },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {product.badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            {product.badge}
          </span>
        </div>
      )}

      <div className="flex-1 p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              {product.price}
            </span>
            {product.period && (
              <span className="ml-2 text-sm text-gray-500">
                /{product.period}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button className="w-full px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function ProductSection({
  title,
  icon,
  products,
  columns = 3,
}: {
  title: string;
  icon: string;
  products: Product[];
  columns?: number;
}) {
  const gridCols = columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function UpgradePage() {
  return (
    <>
      {/* Main Header */}
      <SalesPageHeader />

      {/* Fixed Cart Bar */}
      <div className="fixed top-24 right-6 z-40">
        <button className="relative p-3 rounded-full bg-white/70 backdrop-blur-md shadow-md hover:bg-white transition">
          <svg
            className="w-6 h-6 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
            0
          </span>
        </button>
      </div>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Upgrade Your Practice
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose what you need. All pricing is upfront.
            </p>
          </div>

          {/* Product Sections */}
          <div className="space-y-16">
            <ProductSection
              title="AI Message Microtransactions"
              icon="🧠"
              products={aiMicrotransactions}
            />

            <div className="border-t border-gray-200"></div>

            <ProductSection
              title="AI Subscription Plans"
              icon="🧠"
              products={aiSubscriptions}
            />

            <div className="border-t border-gray-200"></div>

            <ProductSection
              title="Compliance & Data Upgrades"
              icon="🔒"
              products={complianceStorage}
              columns={2}
            />

            <div className="border-t border-gray-200"></div>

            <ProductSection
              title="Service Enhancements & Add-ons"
              icon="🛠️"
              products={serviceUpgrades}
            />
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our enterprise team can create a tailored package for your firm's
              unique needs.
            </p>
            <button className="px-8 py-4 bg-black text-white font-medium rounded-xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Client-side scroll effects */}
      <ScrollClient />
    </>
  );
}
