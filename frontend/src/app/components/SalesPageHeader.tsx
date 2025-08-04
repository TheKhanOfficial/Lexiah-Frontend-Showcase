//frontend/src/app/SalesPageHeader.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Menu } from "lucide-react";
import UseLexiah from "@/app/components/ui/UseLexiah";

export default function SalesPageHeader() {
  return (
    <nav className="fixed top-0 w-full bg-white/70 glass-effect z-50 border-b border-gray-100/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "/#features", label: "Features" },
              { href: "/#pricing", label: "Pricing" },
              { href: "/upgrade", label: "Upgrade" },
              { href: "/about", label: "About Us" },
              { href: "/login", label: "Login / Sign-Up" },
            ].map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-gray-800 hover:text-black text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                {label}
              </Link>
            ))}
            <div className="hidden md:inline-block">
              <UseLexiah
                text="Use Lexiah"
                widthClass="w-fit px-6 py-3 text-sm"
              />
            </div>
          </div>

          {/* Mobile Nav: Hamburger + Sheet */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6 text-gray-800" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 pt-10">
                <div className="space-y-6">
                  {[
                    { href: "/#features", label: "Features" },
                    { href: "/#pricing", label: "Pricing" },
                    { href: "/upgrade", label: "Upgrade" },
                    { href: "/about", label: "About Us" },
                    { href: "/login", label: "Login / Sign-Up" },
                  ].map(({ href, label }) => (
                    <SheetClose asChild key={label}>
                      <Link
                        href={href}
                        className="block text-gray-800 text-base font-medium hover:text-black transition-all"
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
