'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, ShieldAlert, Send, CheckCircle2, Heart } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-[#F96100] block mb-2">Get in Touch</span>
        <h1 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">Contact Mighty Mental Health</h1>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
          Have questions about the somatic-cognitive approach, PACFA health rebates, or booking an initial consultation? Luke and our practice team are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
        {/* Contact Info & Crisis Notice */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs space-y-6">
            <h3 className="font-extrabold text-xl text-[#130C76]">Practice Information</h3>
            
            <div className="space-y-4 text-xs text-gray-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Practice Clinic Base</span>
                  <span>Logan, Queensland, Australia</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Clinical Email</span>
                  <span>luke@mightymentalhealth.com.au</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Direct Consult Line</span>
                  <span>Phone consultations scheduled via online booking</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
              <p><strong>Clinical Director:</strong> Luke (MCouns, UQ; PACFA Reg)</p>
              <p>Serving clients Australia-wide via secure Telehealth.</p>
            </div>
          </div>

          {/* Urgent Crisis Support Notice */}
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-xs text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-700">
              <ShieldAlert className="w-4 h-4" /> Please Note Regarding Acute Crisis
            </div>
            <p className="leading-relaxed">
              Mighty Mental Health provides scheduled outpatient psychotherapy and is not an emergency psychiatric facility. If you or someone you know is in acute distress:
            </p>
            <ul className="list-disc pl-4 space-y-1 pt-1 font-semibold text-red-800">
              <li>Emergency Services: Call 000</li>
              <li>Lifeline Australia: 13 11 14 (24/7)</li>
              <li>Suicide Call Back Service: 1300 659 467</li>
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5DFD5] shadow-lg">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#130C76]">Message Sent</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Thank you for reaching out. Luke will review your inquiry and get back to you within 1 business day.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs font-bold text-[#F96100] hover:underline"
                >
                  Send another inquiry &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-extrabold text-xl text-[#130C76] mb-2">Send an Inquiry</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0400 000 000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Let us know how we can assist..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#F96100] hover:bg-[#d65300] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
