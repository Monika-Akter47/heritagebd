import React from "react"
import { Link } from "react-router-dom"
import { Mail, ExternalLink } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#006A4E] flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <span
                className="font-bold text-xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
               Heritage<span className="text-[#D4A017]">BD</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              Bangladesh's premier digital heritage tourism platform. Discover
              ancient wonders, authentic crafts, and connect with expert local
              guides.
            </p>
            <div className="flex items-center gap-3">
              {["f", "tw", "ig", "yt"].map((platform, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#006A4E] flex items-center justify-center transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                ["Heritage Places", "/places"],
                ["Interactive Map", "/map"],
                ["Tour Guides", "/guides"],
                ["Upcoming Events", "/events"],
                ["Heritage Stories", "/stories"],
                ["Trip Planner", "/planner"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">
              Marketplace
            </h4>
            <ul className="space-y-3">
              {[
                ["Shop GI Products", "/shop"],
                ["Handicrafts", "/shop?category=handicraft"],
                ["Traditional Clothing", "/shop?category=clothing"],
                ["Food & Delicacies", "/shop?category=food"],
                ["Become a Seller", "/signup?role=vendor"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                ["About HeritageBD", "/about"],
                ["Become a Guide", "/signup?role=guide"],
                ["Press & Media", "/press"],
                ["Privacy Policy", "/privacy"],
                ["Terms of Service", "/terms"],
                ["Contact Us", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold mb-1">
                Subscribe to Heritage Digest
              </h4>
              <p className="text-white/60 text-sm">
                Monthly stories, travel tips, and festival guides delivered to
                your inbox.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#006A4E]"
                />
              </div>
              <button type="button" disabled title="Newsletter is not connected in this project."
                className="bg-[#006A4E] text-white px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap opacity-50 cursor-not-allowed">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            {"©"} 2026 HeritageBD. All rights reserved.
          </p>
          <p className="text-white/40 text-sm">
            Made with {"❤️"} for Bangladesh
          </p>
        </div>
      </div>
    </footer>
  )
}
