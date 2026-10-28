import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Phone, ShieldAlert, Calendar, UserCheck, Video, Heart, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mighty Mental Health | Integrated Psychotherapy & Somatic Movement',
  description: 'Evidence-based psychotherapy and somatic movement coaching in Logan, Queensland and Australia-wide via Telehealth. Led by Luke (MCouns, UQ; PACFA Registered Clinician).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C2420] antialiased">
        {/* Sticky Crisis Support Bar */}
        <aside aria-label="Crisis Support" className="bg-[#130C76] text-white text-xs py-2 px-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-[#F96100] animate-pulse" />
              <span>Need immediate crisis support?</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <a href="tel:000" className="hover:text-[#FFAC24] transition-colors flex items-center gap-1">
                <span className="bg-red-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Emergency</span> 000
              </a>
              <span className="text-white/40">|</span>
              <a href="tel:131114" className="hover:text-[#FFAC24] transition-colors">
                Lifeline: 13 11 14 (24/7)
              </a>
              <span className="text-white/40">|</span>
              <a href="tel:1300659467" className="hover:text-[#FFAC24] transition-colors">
                Suicide Call Back: 1300 659 467
              </a>
              <span className="text-white/40">|</span>
              <a href="tel:1300224636" className="hover:text-[#FFAC24] transition-colors">
                Beyond Blue: 1300 22 4636
              </a>
            </div>
          </div>
        </aside>

        {/* Primary Navbar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-[#E5DFD5] sticky top-8 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-[#F96100] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#130C76] block leading-none">
                  MIGHTY
                </span>
                <span className="text-xs font-semibold tracking-wider text-[#F96100] uppercase block mt-1">
                  Mental Health
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
              <Link href="/#services" className="hover:text-[#F96100] transition-colors">
                Services
              </Link>
              <Link href="/#about" className="hover:text-[#F96100] transition-colors">
                About Luke
              </Link>
              <Link href="/#booking" className="hover:text-[#F96100] transition-colors">
                Live Calendar
              </Link>
              <Link href="/#contact" className="hover:text-[#F96100] transition-colors">
                Contact
              </Link>
              <Link href="/portal" className="text-[#130C76] hover:text-[#F96100] transition-colors flex items-center gap-1.5 font-semibold">
                <UserCheck className="w-4 h-4" /> Client Portal
              </Link>
              <Link href="/admin" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md transition-colors font-medium border border-gray-300">
                Clinician EHR
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/#booking"
                className="bg-[#F96100] hover:bg-[#d65300] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all hover:shadow hover:scale-[1.02] flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Book Consultation
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Global Footer */}
        <footer className="bg-[#130C76] text-white pt-16 pb-12 border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#F96100] flex items-center justify-center text-white">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">MIGHTY MENTAL HEALTH</span>
              </div>
              <p className="text-white/80 text-sm max-w-md leading-relaxed">
                Meeting you where you&apos;re at — strengthening mind, body, and spirit as one. Evidence-based psychotherapy integrated with somatic movement regulation.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded text-white/90 border border-white/10 font-medium">
                  PACFA Registered Clinician
                </span>
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded text-white/90 border border-white/10 font-medium">
                  UQ Master of Counselling
                </span>
                <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded text-white/90 border border-white/10 font-medium">
                  Certified Movement Coach
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#FFAC24] mb-3">Practice Details</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><strong>Location:</strong> Logan, Queensland, Australia</li>
                <li><strong>Modality:</strong> Telehealth Australia-Wide</li>
                <li><strong>Email:</strong> luke@mightymentalhealth.com.au</li>
                <li><strong>Timezone:</strong> Brisbane, QLD (AEST)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#FFAC24] mb-3">Portals & Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link href="/#booking" className="hover:text-white transition-colors">Book Online Session</Link></li>
                <li><Link href="/portal" className="hover:text-white transition-colors">Client Portal (Intake & Calls)</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Clinician Admin & EHR</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Practice</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 mt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-4">
            <p>&copy; {new Date().getFullYear()} Mighty Mental Health. All rights reserved. ABN: Logan, QLD.</p>
            <p>Protected under Australian Privacy Principles (APP) & Privacy Act 1988.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
