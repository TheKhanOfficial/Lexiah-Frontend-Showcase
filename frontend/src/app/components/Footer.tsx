// frontend/src/app/components/Footer.tsx
import Link from "next/link";

function getLinkHref(label: string): string {
  switch (label.toLowerCase()) {
    case "features":
      return "/#features";
    case "pricing":
      return "/#pricing";
    case "about":
      return "/about";
    case "privacy":
      return "/privacy";
    case "terms":
      return "/terms";
    case "contact":
      return "/contact";
    default:
      return "#";
  }
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="font-bold text-3xl mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Lexiah
            </div>
            <p className="text-gray-400 leading-relaxed">
              The future of legal case management.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Features", "Pricing"],
            },
            {
              title: "Company",
              links: ["About", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy", "Terms"],
            },
          ].map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-6 text-lg">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={getLinkHref(link)}
                      className="text-gray-400 transition-all duration-300 hover:text-white hover:translate-x-1 inline-block"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">
            &copy; 2024 Lexiah. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
