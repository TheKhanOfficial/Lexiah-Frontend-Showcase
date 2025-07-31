//frontend/src/app/SalesPageHeader.tsx
import Link from "next/link";
import Image from "next/image";

const userId = "53917586-97ad-49b6-9bd6-51c441316425";

export default function SalesPageHeader() {
  return (
    <nav className="fixed top-0 w-full bg-white/70 glass-effect z-50 border-b border-gray-100/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <Link
            href="/#top"
            className="transform transition-transform duration-300 hover:scale-105"
          >
            <Image
              src="/lexiah.svg"
              alt="Lexiah logo"
              width={240}
              height={64}
              className="w-48 lg:w-60"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-gray-800 hover:text-black text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-gray-800 hover:text-black text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              Pricing
            </Link>
            <Link
              href="/upgrade"
              className="text-gray-800 hover:text-black text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              Upgrade
            </Link>
            <Link
              href="/about"
              className="text-gray-800 hover:text-black text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              About Us
            </Link>
            <Link
              href={`/${userId}`}
              className="hidden md:inline-block group relative px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <span className="relative z-10">Use Lexiah</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
