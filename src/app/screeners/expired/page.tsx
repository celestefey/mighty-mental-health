'use client';

import Link from 'next/link';
import { ShieldAlert, PhoneCall, ArrowLeft, HeartHandshake } from 'lucide-react';

export default function ScreenerExpiredPage() {
  return (
    <main className="min-h-screen bg-[#FBF9F5] text-gray-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E5DFD5] shadow-xl p-8 sm:p-10 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-[#BA3D00] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BA3D00]">
            PACFA Clinical Security Notice
          </span>
          <h1 className="text-2xl font-black text-[#130C76]">
            Assessment Link Expired or Already Used
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            To safeguard your private health information under Australian Privacy Principle 11, our clinical assessment links are single-use and expire within 48 hours of issue.
          </p>
        </div>

        <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E5DFD5] text-left text-xs space-y-2">
          <strong className="text-[#130C76] block font-bold">What to do next:</strong>
          <p className="text-gray-700 leading-relaxed">
            If you need to complete this assessment prior to your next consultation, please notify Luke directly and a fresh, secure assessment token will be issued to your registered email address.
          </p>
          <div className="pt-2 border-t border-[#E5DFD5] text-[11px] text-gray-500 font-medium">
            Luke Piatti • Registered Clinical Counsellor (PACFA #28941) • Logan Central, QLD
          </div>
        </div>

        {/* Duty of Care Crisis Support */}
        <div className="p-4 bg-red-50/70 rounded-2xl border border-red-200 text-left space-y-2">
          <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
            <HeartHandshake className="w-4 h-4 text-red-700 shrink-0" />
            <span>Need Immediate Emotional or Crisis Support?</span>
          </div>
          <p className="text-[11px] text-red-800 leading-relaxed">
            If you are experiencing acute psychological distress or thoughts of self-harm, confidential 24/7 Australian support is available immediately:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <a
              href="tel:131114"
              className="flex items-center justify-center gap-1.5 p-2 bg-white rounded-xl border border-red-200 font-bold text-red-900 hover:bg-red-50 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Lifeline: 13 11 14
            </a>
            <a
              href="tel:1300659467"
              className="flex items-center justify-center gap-1.5 p-2 bg-white rounded-xl border border-red-200 font-bold text-red-900 hover:bg-red-50 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Suicide Call Back: 1300 659 467
            </a>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#130C76] text-white text-xs font-bold hover:bg-[#0c0750] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Practice Homepage
          </Link>
          <a
            href="mailto:luke@mightymentalhealth.com.au"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#130C76] text-[#130C76] text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            Contact Practice
          </a>
        </div>
      </div>
    </main>
  );
}
