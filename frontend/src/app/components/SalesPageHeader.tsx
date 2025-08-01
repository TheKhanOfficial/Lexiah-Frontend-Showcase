//frontend/src/app/SalesPageHeader.tsx
import Link from "next/link";
import Image from "next/image";
import UseLexiah from "@/app/components/ui/UseLexiah";

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
              href="/login"
              className="text-gray-800 hover:text-black text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              Login / Sign-Up
            </Link>
            <div className="hidden md:inline-block">
              <UseLexiah
                text="Use Lexiah"
                widthClass="w-fit px-6 py-3 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
