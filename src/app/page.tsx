'use client';

import { useState, useEffect } from 'react';
import { 
  Heart, 
  Brain, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Video, 
  Phone, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  ArrowRight, 
  Award,
  Users,
  Compass,
  Zap,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  SlidersHorizontal,
  Mail,
  MapPin,
  Send,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHService } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ValidatedBookingForm } from '@/components/booking/ValidatedBookingForm';
import { CalBookingEmbed } from '@/components/booking/CalBookingEmbed';

export default function HomePage() {
  const [services, setServices] = useState<MMHService[]>([]);
  const [selectedService, setSelectedService] = useState<MMHService | null>(null);
  const [selectedModality, setSelectedModality] = useState<'video' | 'phone'>('video');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Australia/Brisbane');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-29');
  const [selectedTime, setSelectedTime] = useState<string>('09:30 AM');
  
  // Booking Mode: Interactive MMH Grid vs Cal.com Embed
  const [bookingEngine, setBookingEngine] = useState<'native' | 'calcom'>('native');

  // Booking Form Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // In-Page Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // FAQ Accordion State & Category Filter
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');

  const faqs = [
    {
      q: 'Do I need a GP referral or Mental Health Care Plan to book?',
      a: 'No, a GP referral is not required. You can book an appointment directly through our online calendar at any time. If you plan to claim private health insurance rebates, your invoice will include Luke Piatti\'s official PACFA clinician provider credentials.',
      category: 'Booking & Access',
      categoryGroup: 'Fees & Rebates'
    },
    {
      q: 'What actually happens during an Exercise-Integrated Session?',
      a: 'Unlike passive talk therapy or generic gym workouts, Luke Piatti integrates evidence-based counselling with structured physical exercise and active movement. We assess your goals and physical baseline, using gym workouts, resistance training, and active conditioning as practical tools to break mental rumination, regulate your nervous system, and build enduring grit. Wear comfortable clothing you can move and train in.',
      category: 'Clinical Approach',
      categoryGroup: 'Exercise & Therapy'
    },
    {
      q: 'What are the consultation fees and are there any upfront surprise costs?',
      a: 'Full transparent pricing: 40-Min Initial Assessment is $160 AUD, 60-Min Psychotherapy & Exercise-Integrated Counselling is $210 AUD (GST-Free), and 30-Min Active Movement Consultation is $120 AUD. There are zero upfront booking fees or credit card deposit holds when scheduling your appointment.',
      category: 'Fees & Billing',
      categoryGroup: 'Fees & Rebates'
    },
    {
      q: 'Can I claim private health fund rebates?',
      a: 'Yes. Luke Piatti is a PACFA Registered Clinician (#28941). Following each session, an official itemized tax invoice receipt is generated in your Client Portal suitable for immediate claims with Medibank, Bupa, AHM, Police Health, and most major Australian private insurers.',
      category: 'Health Funds',
      categoryGroup: 'Fees & Rebates'
    },
    {
      q: 'How does online Telehealth video work?',
      a: 'Upon booking, you receive an encrypted in-app video room link accessible directly from your phone, tablet, or laptop browser. There is no software to install or app to download; simply click the link at your session time to connect with Luke in our private WebRTC consultation room.',
      category: 'Telehealth',
      categoryGroup: 'Telehealth & Privacy'
    },
    {
      q: 'Where is the physical clinic located if I prefer in-person sessions?',
      a: 'Mighty Mental Health operates from Logan, Queensland, conveniently serving the greater Brisbane and Gold Coast region for in-person and gym-based sessions, while offering encrypted Telehealth across Australia. Free, accessible on-site parking is available.',
      category: 'Location',
      categoryGroup: 'Exercise & Therapy'
    },
    {
      q: 'What is your cancellation and rescheduling policy?',
      a: 'We ask for 24 hours\' advance notice for cancellations or rescheduling to allow clients on our waiting list to access care. We understand acute illnesses and family emergencies arise and always handle those situations with clinical compassion.',
      category: 'Policies',
      categoryGroup: 'Fees & Rebates'
    },
    {
      q: 'How is my clinical confidentiality and health privacy protected?',
      a: 'All clinical notes, assessment responses (such as DASS-21 and GAD-7), and client records are stored in compliance with the Australian Privacy Act 1988 and Australian Privacy Principles (APP). Your raw clinical notes are locked and never shared without your explicit written consent, except where mandated by law for immediate safety.',
      category: 'Privacy',
      categoryGroup: 'Telehealth & Privacy'
    }
  ];

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase.from('mmh_services').select('*').order('duration_minutes', { ascending: true });
      if (data && data.length > 0) {
        setServices(data as MMHService[]);
        setSelectedService(data[0] as MMHService);
      }
    }
    loadServices();
  }, []);

  // Calendar dates for the week
  const weekDays = [
    { day: 'MON', date: '26 Oct', fullDate: '2026-10-26', slots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'] },
    { day: 'TUE', date: '27 Oct', fullDate: '2026-10-27', slots: ['10:00 AM', '02:00 PM', '04:30 PM'] },
    { day: 'WED', date: '28 Oct', fullDate: '2026-10-28', slots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'] },
    { day: 'THU', date: '29 Oct', fullDate: '2026-10-29', slots: ['01:00 PM', '03:30 PM', '05:00 PM'] },
    { day: 'FRI', date: '30 Oct', fullDate: '2026-10-30', slots: ['10:00 AM', '11:30 AM', '01:00 PM'] },
  ];

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSubmitting(true);

    try {
      await fetch('/api/webhooks/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: contactName,
          client_email: contactEmail,
          form_id: 'inpage-contact-inquiry',
          form_title: 'Website General Inquiry',
          answers: { phone: contactPhone, message: contactMessage },
          clinical_severity: 'General Inquiry',
          metadata: { origin: 'landing_page_contact_section' },
        }),
      });
    } catch (err) {
      console.warn('Contact logging notice:', err);
    }

    setContactSubmitting(false);
    setContactSubmitted(true);
  }

  return (
    <div className="relative">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE6] border-b border-[#E5DFD5]">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#130C76_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="default" className="text-xs font-bold uppercase tracking-wider py-1 px-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                The Somatic-Cognitive Synthesis
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#130C76] leading-[1.12]">
                Strengthening Mind & Body <span className="text-[#BA3D00]">As One.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-2xl">
                Meeting you where you&apos;re at. Compassionate, evidence-based psychotherapy paired with structured physical exercise and gym workouts to build deep, enduring resilience.
              </p>

              {/* Badges / Credentials */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD5] shadow-xs text-xs font-semibold text-gray-800">
                  <Award className="w-4 h-4 text-[#BA3D00]" />
                  PACFA Registered Clinician #28941
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD5] shadow-xs text-xs font-semibold text-gray-800">
                  <ShieldCheck className="w-4 h-4 text-[#0038A8]" />
                  Master of Counselling (UQ)
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD5] shadow-xs text-xs font-semibold text-gray-800">
                  <Activity className="w-4 h-4 text-[#2A4836]" />
                  Exercise-Integrated Counsellor
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button asChild size="lg" className="bg-[#BA3D00] hover:bg-[#9E3300] text-white">
                  <a href="#booking">
                    Book 40-Min Initial Consult <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#about">Meet Luke Piatti</a>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href="#contact">Contact Practice</a>
                </Button>
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-2 pt-1 font-medium">
                <Lock className="w-3.5 h-3.5 text-green-600" />
                Zero upfront booking fee • Secure Australian Telehealth
              </p>
            </div>

            {/* Right Card / Visual representation */}
            <div className="lg:col-span-5">
              <Card className="relative p-8 shadow-xl overflow-hidden border-[#E5DFD5]">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#BA3D00]/10 rounded-bl-full pointer-events-none"></div>
                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-[#130C76] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                    L
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xl text-[#130C76]">Luke Piatti</h2>
                    <p className="text-xs text-[#BA3D00] font-bold">Exercise-Integrated Counsellor & Clinical Director</p>
                    <p className="text-xs text-gray-500">Logan, QLD • Telehealth Australia-Wide</p>
                  </div>
                </div>

                <div className="py-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#BA3D00] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Dual-Track Care</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">No mind/body separation. Therapy for cognition; physical training for nervous system equilibrium.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#BA3D00] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Anti-Clinical Warmth</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">Down-to-earth, genuine dialogue. Zero sterile diagnostic pretension or clinical intimidation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#BA3D00] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Actionable Self-Determination</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">Take home structured physical workouts, daily habit design, and tangible emotional agency.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 bg-gray-50 -mx-8 -mb-8 p-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Initial Consult</span>
                  <span className="text-sm font-extrabold text-[#130C76]">40 Mins • $160 AUD</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Clinical Accreditation & Trust Ribbon */}
      <section className="bg-white border-b border-[#E5DFD5] py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-between text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BA3D00]/10 text-[#BA3D00] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-[#130C76] block">PACFA Registered</span>
                <span className="text-[11px] text-gray-500 block">Clinician #28941</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-[#130C76] block">UQ Master of Counselling</span>
                <span className="text-[11px] text-gray-500 block">University of Queensland</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A4836]/10 text-[#2A4836] flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-[#130C76] block">Exercise-Integrated</span>
                <span className="text-[11px] text-gray-500 block">Active Therapy & Movement</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#130C76]/10 text-[#130C76] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-[#130C76] block">Privacy Act & APP Compliant</span>
                <span className="text-[11px] text-gray-500 block">Encrypted Australian Telehealth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dedicated "About Luke" Section */}
      <section id="about" className="py-24 bg-white border-b border-[#E5DFD5] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Visual Profile & Credentials Badge Deck */}
            <div className="lg:col-span-5 space-y-6">
              <div className="relative rounded-3xl overflow-hidden bg-[#130C76] text-white p-8 sm:p-10 shadow-xl border border-[#130C76]">
                <div className="w-24 h-24 rounded-2xl bg-[#BA3D00] text-white flex items-center justify-center font-extrabold text-4xl shadow-lg mb-6">
                  L
                </div>
                <h3 className="text-2xl font-extrabold text-white">Luke Piatti (MCouns, UQ)</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#FFAC24] mt-1">
                  Master of Counselling (University of Queensland)
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Registered PACFA Clinician #28941 • Exercise-Integrated Counsellor
                </p>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FFAC24]" />
                    <span>Practice Base: Logan, Queensland, Australia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#FFAC24]" />
                    <span>Modality: Encrypted Telehealth Australia-Wide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FFAC24]" />
                    <span>luke@mightymentalhealth.com.au</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <Button asChild variant="default" size="default" className="w-full bg-[#BA3D00] hover:bg-[#9E3300]">
                    <a href="#booking">Book With Luke Piatti &rarr;</a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative, Dual-Track Philosophy & Anti-Clinical Stance */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="navy" className="text-xs font-bold uppercase tracking-wider py-1 px-3">
                Meet Your Clinician
              </Badge>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#130C76] tracking-tight">
                No Cold Waiting Rooms. No Sterile Jargon. <span className="text-[#BA3D00]">Just Real Healthcare.</span>
              </h2>

              <p className="text-base text-gray-700 leading-relaxed">
                Conventional therapy often asks you to talk about your distress while ignoring the knots in your shoulders, your shallow breathing, and your dysregulated nervous system. Conventional fitness treats your body like a machine to be judged, obsessed with mirrors and cosmetic vanity.
              </p>

              <p className="text-base text-gray-700 leading-relaxed">
                <strong>Mighty Mental Health was founded to fuse both.</strong> With a Master of Counselling from the University of Queensland and years of clinical practice integrating physical exercise and resistance training into psychotherapy, Luke brings an evidence-based, compassionate space where mind and body are strengthened together.
              </p>

              <p className="text-base text-gray-700 leading-relaxed">
                Luke works with clients through active movement, weight training, conditioning, and behavioral activation to regulate the nervous system, break mental paralysis, and build enduring grit.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <h3 className="font-extrabold text-sm text-[#130C76] mb-1">Down-To-Earth Dialogue</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Conversations feel natural, grounded, and unpretentious. We speak like real human beings, meeting you wherever you are at.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <h3 className="font-extrabold text-sm text-[#130C76] mb-1">Exercise & Somatic Equilibrium</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Learn how nervous system regulation, structured gym training, and tailored progressive movement calm anxiety and restore vitality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 5 Values Pillars */}
      <section id="services" className="py-20 bg-[#FBF9F5] border-b border-[#E5DFD5] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#BA3D00] block mb-2">Our Grounding Philosophy</span>
            <h2 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">The 5 Core Pillars</h2>
            <p className="text-gray-600 mt-4 text-base">The unwavering ethical foundation guiding every session, intake questionnaire, and clinical interaction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { title: 'Human Dignity', desc: 'Inviolable worth and profound compassion for every person who reaches out.', icon: Heart },
              { title: 'Acceptance', desc: 'Leaving judgments at the door. Radical acceptance of setbacks and coping mechanisms.', icon: ShieldCheck },
              { title: 'Person-Centred', desc: 'Meeting you where you are at. Collaborative, eye-level partnership.', icon: Users },
              { title: 'Self-Determination', desc: 'Empowering you with concrete somatic tools and internal autonomy.', icon: Compass },
              { title: 'Holistic Perspective', desc: 'Treating brain, physical biology, autonomic nervous system, and context as one.', icon: Zap },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-white border border-[#E5DFD5] hover:border-[#BA3D00] transition-colors group shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-[#E5DFD5] flex items-center justify-center text-[#BA3D00] shadow-2xs mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[#130C76] text-base mb-2">{pillar.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Side-by-Side Unified Booking Grid with Cal.com Switcher */}
      <section id="booking" className="py-20 bg-white border-b border-[#E5DFD5] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#BA3D00] block mb-1">Appointment Scheduler</span>
            <h2 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">Reserve Your Session</h2>
            <p className="text-sm text-gray-600 mt-2">Select your consultation, choose an open timeslot, and book your session in 60 seconds.</p>
            
            {/* Engine Switcher */}
            <div className="mt-6 inline-flex rounded-xl bg-gray-50 p-1 border border-[#E5DFD5] shadow-2xs">
              <button
                onClick={() => setBookingEngine('native')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bookingEngine === 'native'
                    ? 'bg-[#130C76] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Interactive Dual-Column Grid
              </button>
              <button
                onClick={() => setBookingEngine('calcom')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bookingEngine === 'calcom'
                    ? 'bg-[#130C76] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cal.com Scheduler
              </button>
            </div>
          </div>

          {bookingEngine === 'calcom' ? (
            <div className="max-w-4xl mx-auto">
              <CalBookingEmbed
                calLink={process.env.NEXT_PUBLIC_CAL_LINK || ''}
                onSwitchToNative={() => setBookingEngine('native')}
                metadata={{
                  utm_source: 'website_toggle',
                  workflow: 'agy_marketing_sync',
                }}
              />
            </div>
          ) : (
            /* Unified Dual Column Container */
            <div className="bg-[#FBF9F5] rounded-3xl border border-[#E5DFD5] shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* STEP 1: Select Session (40% Column) */}
                <div className="lg:col-span-5 p-6 sm:p-8 bg-white border-b lg:border-b-0 lg:border-r border-[#E5DFD5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="w-7 h-7 rounded-full bg-[#130C76] text-white flex items-center justify-center text-xs font-bold">1</span>
                      <h3 className="font-bold text-lg text-[#130C76]">Choose Your Service</h3>
                    </div>

                    <div className="space-y-4">
                      {services.map((service) => {
                        const isSelected = selectedService?.id === service.id;
                        return (
                          <div
                            key={service.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            onClick={() => setSelectedService(service)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedService(service);
                              }
                            }}
                            className={`p-5 rounded-2xl cursor-pointer border-2 transition-all focus-visible:ring-2 focus-visible:ring-[#F96100] focus-visible:outline-hidden ${
                              isSelected 
                                ? 'border-[#F96100] bg-[#FFFDF9] shadow-md' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                    isSelected ? 'bg-[#F96100] text-white' : 'border border-gray-300'
                                  }`}>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-[#130C76]">{service.title}</h4>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 pl-7 leading-relaxed">{service.description}</p>
                              </div>
                              <div className="text-right shrink-0 pl-3">
                                <span className="text-sm font-extrabold text-[#BA3D00]">
                                  ${(service.price_cents / 100).toFixed(0)} AUD
                                </span>
                                <span className="block text-[11px] text-gray-600 font-semibold">{service.duration_minutes} mins</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-1.5">
                    <p className="flex items-center gap-1.5 font-medium text-gray-700">
                      <ShieldCheck className="w-4 h-4 text-green-600" /> Private Health Fund Claimable
                    </p>
                    <p>Invoices issued automatically with PACFA provider number for private health rebates.</p>
                  </div>
                </div>

                {/* STEP 2 & 3: Choose Format & Time (60% Column) */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Consultation Format Selector (Prominent Telehealth vs Phone) */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-7 h-7 rounded-full bg-[#130C76] text-white flex items-center justify-center text-xs font-bold">2</span>
                        <h3 className="font-bold text-lg text-[#130C76]">Choose Consultation Format</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Telehealth Video */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedModality === 'video'}
                          onClick={() => setSelectedModality('video')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedModality('video');
                            }
                          }}
                          className={`p-4 rounded-2xl cursor-pointer border-2 transition-all relative focus-visible:ring-2 focus-visible:ring-[#130C76] focus-visible:outline-hidden ${
                            selectedModality === 'video'
                              ? 'border-[#130C76] bg-white shadow-md ring-2 ring-[#130C76]/15'
                              : 'border-gray-200 bg-white/70 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                                selectedModality === 'video' ? 'bg-[#130C76] text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Video className="w-5 h-5 text-[#FFAC24]" />
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-[#130C76] block">
                                  Telehealth Video
                                </span>
                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                  Encrypted in-browser room
                                </span>
                              </div>
                            </div>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                              selectedModality === 'video' ? 'bg-[#130C76] text-white' : 'border border-gray-300'
                            }`}>
                              {selectedModality === 'video' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
                            <span className="bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-full">
                              ★ Recommended for Somatics
                            </span>
                            <span className="text-gray-600 font-semibold">No app download</span>
                          </div>
                        </div>

                        {/* Option 2: Phone Call */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedModality === 'phone'}
                          onClick={() => setSelectedModality('phone')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedModality('phone');
                            }
                          }}
                          className={`p-4 rounded-2xl cursor-pointer border-2 transition-all relative focus-visible:ring-2 focus-visible:ring-[#130C76] focus-visible:outline-hidden ${
                            selectedModality === 'phone'
                              ? 'border-[#130C76] bg-white shadow-md ring-2 ring-[#130C76]/15'
                              : 'border-gray-200 bg-white/70 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                                selectedModality === 'phone' ? 'bg-[#130C76] text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Phone className="w-5 h-5 text-[#FFAC24]" />
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-[#130C76] block">
                                  Phone Call
                                </span>
                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                  Luke calls your mobile
                                </span>
                              </div>
                            </div>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                              selectedModality === 'phone' ? 'bg-[#130C76] text-white' : 'border border-gray-300'
                            }`}>
                              {selectedModality === 'phone' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
                            <span className="bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                              Audio Only
                            </span>
                            <span className="text-gray-600 font-semibold">Direct phone call</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: Choose Appointment Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#130C76] text-white flex items-center justify-center text-xs font-bold">3</span>
                        <h3 className="font-bold text-lg text-[#130C76]">Pick Date & Time</h3>
                      </div>
                      <span className="text-xs text-[#130C76] font-bold bg-[#130C76]/5 px-2.5 py-1 rounded-lg border border-[#130C76]/10 flex items-center gap-1.5">
                        {selectedModality === 'video' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-[#BA3D00]" /> Telehealth Video
                          </>
                        ) : (
                          <>
                            <Phone className="w-3.5 h-3.5 text-[#BA3D00]" /> Phone Call
                          </>
                        )}
                      </span>
                    </div>

                    {/* Timezone Switcher */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-6 bg-white p-3 rounded-xl border border-gray-200">
                      <label htmlFor="timezone-select" className="font-semibold text-gray-700">Practice Timezone: Brisbane, QLD (AEST)</label>
                      <select
                        id="timezone-select"
                        aria-label="Select Consultation Timezone"
                        value={selectedTimezone}
                        onChange={(e) => setSelectedTimezone(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 font-semibold focus:outline-hidden"
                      >
                        <option value="Australia/Brisbane">AEST (Brisbane / Logan)</option>
                        <option value="Australia/Sydney">AEDT (Sydney, Melbourne, ACT)</option>
                        <option value="Australia/Perth">AWST (Perth, WA)</option>
                      </select>
                    </div>

                    {/* Weekly Calendar Grid */}
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {weekDays.map((col) => {
                        const isDaySelected = selectedDate === col.fullDate;
                        return (
                          <div key={col.day} className="flex flex-col items-center">
                            <button
                              onClick={() => setSelectedDate(col.fullDate)}
                              className={`w-full py-2.5 rounded-xl text-center border transition-all mb-3 cursor-pointer ${
                                isDaySelected
                                  ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{col.day}</span>
                              <span className="block text-xs font-extrabold mt-0.5">{col.date.split(' ')[0]}</span>
                            </button>

                            {/* Time Slots */}
                            <div className="w-full space-y-2">
                              {col.slots.map((slot) => {
                                const isSlotSelected = isDaySelected && selectedTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    onClick={() => {
                                      setSelectedDate(col.fullDate);
                                      setSelectedTime(slot);
                                    }}
                                    className={`w-full py-2 px-1 text-center text-xs font-bold rounded-lg border transition-all slot-pill cursor-pointer ${
                                      isSlotSelected
                                        ? 'bg-[#BA3D00] text-white border-[#BA3D00] shadow-sm scale-105'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                  >
                                    {slot.replace(' ', '')}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Confirmation Bar */}
                  <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 rounded-b-3xl">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Selected Consultation</span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-sm font-extrabold text-[#130C76]">
                          {selectedService?.title}
                        </p>
                        <span className="bg-[#130C76] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-2xs">
                          {selectedModality === 'video' ? (
                            <>
                              <Video className="w-3 h-3 text-[#FFAC24]" /> Telehealth Video
                            </>
                          ) : (
                            <>
                              <Phone className="w-3 h-3 text-[#FFAC24]" /> Phone Call
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold mt-0.5">
                        {selectedDate} @ {selectedTime} ({selectedTimezone.split('/')[1]})
                      </p>
                    </div>

                    <Button
                      onClick={() => setIsBookingModalOpen(true)}
                      size="lg"
                    >
                      Confirm & Enter Details <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Unified FAQs & Direct Contact (Side-by-Side 2-Column Split) */}
      <section id="faqs" className="py-20 bg-white border-b border-[#E5DFD5] scroll-mt-16">
        <div id="contact" className="scroll-mt-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="default" className="text-xs font-bold uppercase tracking-wider py-1 px-3 mb-2">
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Practice Guide & Direct Contact
            </Badge>
            <h2 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">Questions Answered & Direct Inquiries</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Explore practice details, consultation fees, and our exercise-integrated therapy model, or send Luke Piatti a confidential note below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Categorized Compact FAQ */}
            <div className="lg:col-span-7 space-y-5">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {['All', 'Exercise & Therapy', 'Fees & Rebates', 'Telehealth & Privacy'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedFaqCategory(cat);
                      setOpenFaqIndex(0);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedFaqCategory === cat
                        ? 'bg-[#130C76] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Accordion Items */}
              <div className="space-y-3">
                {faqs
                  .filter((faq) => selectedFaqCategory === 'All' || faq.categoryGroup === selectedFaqCategory)
                  .map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isOpen 
                            ? 'bg-[#FBF9F5] border-[#BA3D00] shadow-xs' 
                            : 'bg-white border-[#E5DFD5] hover:border-gray-400'
                        }`}
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-hidden"
                          aria-expanded={isOpen}
                        >
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#BA3D00] block mb-1">
                              {faq.category}
                            </span>
                            <h3 className="text-sm font-bold text-[#130C76] sm:text-base">
                              {faq.q}
                            </h3>
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isOpen ? 'bg-[#BA3D00] text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-[#E5DFD5]/60 mt-1 animate-fadeIn">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="text-xs text-gray-500 pt-2 flex items-center gap-1.5">
                <span>Looking for something specific?</span>
                <span className="font-semibold text-gray-800">Use the inquiry form on the right &rarr;</span>
              </div>
            </div>

            {/* Right Column: Direct Contact Form & Practice Information */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-6 sm:p-8 shadow-lg border-[#E5DFD5]">
                {contactSubmitted ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-[#130C76]">Message Sent</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Thank you, <strong>{contactName}</strong>. Luke Piatti will review your inquiry and reply to <strong>{contactEmail}</strong> within 1 business day.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="mt-3 text-xs font-bold text-[#BA3D00] hover:underline cursor-pointer"
                    >
                      Send another note &rarr;
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <h3 className="font-extrabold text-xl text-[#130C76]">Send an Inquiry</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Reviewed directly and confidentially by Luke Piatti.</p>
                    </div>

                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <Input
                        id="contact-name"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Email Address *
                        </label>
                        <Input
                          id="contact-email"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="alex@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <Input
                          id="contact-phone"
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="0400 000 000"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Your Message *
                      </label>
                      <textarea
                        id="contact-message"
                        rows={3}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell Luke about what you are experiencing and what you hope to achieve..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#BA3D00]"
                      ></textarea>
                    </div>

                    <Button
                      type="submit"
                      disabled={contactSubmitting}
                      size="lg"
                      className="w-full bg-[#BA3D00] hover:bg-[#9E3300] text-white"
                    >
                      {contactSubmitting ? 'Sending...' : 'Send Message to Luke Piatti'}
                    </Button>
                  </form>
                )}

                {/* Practice Meta Snapshot */}
                <div className="pt-5 mt-5 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#BA3D00] shrink-0" />
                    <span>Logan Central, QLD • Australia-Wide Telehealth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#BA3D00] shrink-0" />
                    <span>luke@mightymentalhealth.com.au</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Luke Piatti (MCouns, UQ; PACFA Reg. #28941)</span>
                  </div>
                </div>
              </Card>

              {/* Acute Crisis Support Safeguard */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-xs text-red-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <ShieldAlert className="w-4 h-4" /> Immediate Crisis Support
                </div>
                <p className="leading-relaxed text-[11px] text-red-800">
                  If you or someone you know is in immediate physical danger or distress:
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-bold text-[11px] text-red-900">
                  <span>Emergency: <a href="tel:000" className="underline">000</a></span>
                  <span>Lifeline: <a href="tel:131114" className="underline">13 11 14</a></span>
                  <span>Suicide Call Back: <a href="tel:1300659467" className="underline">1300 659 467</a></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form Modal with React Hook Form + Zod */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#130C76]">Booking Confirmed!</h3>
                <p className="text-sm text-gray-600">
                  Thank you, <strong>{bookingSuccess.client_name}</strong>. Your {selectedService?.title} has been scheduled.
                </p>

                <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs space-y-2 border border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scheduled Time:</span>
                    <span className="font-bold text-gray-800">{selectedDate} @ {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Consultation Modality:</span>
                    <span className="font-bold text-gray-800 uppercase">{selectedModality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Telehealth Room ID:</span>
                    <span className="font-mono font-bold text-[#BA3D00]">{bookingSuccess.telehealth_room_id}</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Button asChild variant="navy">
                    <a href={`/telehealth/${bookingSuccess.telehealth_room_id}`}>
                      <Video className="w-4 h-4 mr-1 text-[#FFAC24]" /> Preview Telehealth Room
                    </a>
                  </Button>
                  <Button asChild variant="secondary">
                    <a href="/portal">Go To Client Portal (Intake Forms)</a>
                  </Button>
                  <button
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setBookingSuccess(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 pt-2 cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : selectedService && (
              <ValidatedBookingForm
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedModality={selectedModality}
                selectedTimezone={selectedTimezone}
                onSuccess={(data) => setBookingSuccess(data)}
                onCancel={() => setIsBookingModalOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
