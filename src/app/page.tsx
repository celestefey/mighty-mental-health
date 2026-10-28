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

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do I need a GP referral or Mental Health Care Plan to book?',
      a: 'No, a GP referral is not required. You can book an appointment directly through our online calendar at any time. If you plan to claim private health insurance rebates, your invoice will include Luke\'s official PACFA clinician provider credentials.',
      category: 'Booking & Access'
    },
    {
      q: 'What actually happens during a Somatic & Movement Consultation?',
      a: 'Unlike generic gym training or passive talk therapy, somatic movement works directly with your nervous system. We assess where your body stores tension (jaw, neck, shoulders, shallow breathing), combining targeted breath pacing, gentle mobility drills, and progressive nervous system down-regulation to restore autonomic balance. Wear comfortable clothing you can move freely in.',
      category: 'Clinical Approach'
    },
    {
      q: 'What are the consultation fees and are there any upfront surprise costs?',
      a: 'Full transparent pricing: 40-Min Initial Assessment is $160 AUD, 60-Min Psychotherapy & Counselling is $210 AUD (GST-Free), and 30-Min Somatic Movement Consultation is $120 AUD. There are zero upfront booking fees or credit card deposit holds when scheduling your appointment.',
      category: 'Fees & Billing'
    },
    {
      q: 'Can I claim private health fund rebates?',
      a: 'Yes. Luke is a PACFA Registered Clinician. Following each session, an official itemized tax invoice receipt is generated in your Client Portal suitable for immediate claims with Medibank, Bupa, AHM, Police Health, and most major Australian private insurers.',
      category: 'Health Funds'
    },
    {
      q: 'How does online Telehealth video work?',
      a: 'Upon booking, you receive an encrypted in-app video room link accessible directly from your phone, tablet, or laptop browser. There is no software to install or app to download; simply click the link at your session time to connect with Luke in our private WebRTC consultation room.',
      category: 'Telehealth'
    },
    {
      q: 'Where is the physical clinic located if I prefer in-person sessions?',
      a: 'Mighty Mental Health operates from Logan, Queensland, conveniently serving the greater Brisbane and Gold Coast region in person, while offering encrypted Telehealth across Australia. Free, accessible on-site parking is available.',
      category: 'Location'
    },
    {
      q: 'What is your cancellation and rescheduling policy?',
      a: 'We ask for 24 hours\' advance notice for cancellations or rescheduling to allow clients on our waiting list to access care. We understand acute illnesses and family emergencies arise and always handle those situations with clinical compassion.',
      category: 'Policies'
    },
    {
      q: 'How is my clinical confidentiality and health privacy protected?',
      a: 'All clinical notes, assessment responses (such as DASS-21 and GAD-7), and client records are stored in compliance with the Australian Privacy Act 1988 and Australian Privacy Principles (APP). Your raw clinical notes are locked and never shared without your explicit written consent, except where mandated by law for immediate safety.',
      category: 'Privacy'
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
                Strengthening Mind & Body <span className="text-[#F96100]">As One.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-2xl">
                Meeting you where you&apos;re at. Compassionate, evidence-based psychotherapy paired with physical movement regulation to build deep, enduring resilience.
              </p>

              {/* Badges / Credentials */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD5] shadow-xs text-xs font-semibold text-gray-800">
                  <Award className="w-4 h-4 text-[#F96100]" />
                  PACFA Registered Clinician
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD5] shadow-xs text-xs font-semibold text-gray-800">
                  <ShieldCheck className="w-4 h-4 text-[#0038A8]" />
                  Master of Counselling (UQ)
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD5] shadow-xs text-xs font-semibold text-gray-800">
                  <Activity className="w-4 h-4 text-[#2A4836]" />
                  Certified Movement Coach
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button asChild size="lg">
                  <a href="#booking">
                    Book 40-Min Initial Consult <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#about">Meet Luke</a>
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
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#F96100]/10 rounded-bl-full pointer-events-none"></div>
                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-[#130C76] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                    L
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-[#130C76]">Luke</h3>
                    <p className="text-xs text-[#F96100] font-semibold">Founder & Clinical Director</p>
                    <p className="text-xs text-gray-500">Logan, QLD • Telehealth Australia-Wide</p>
                  </div>
                </div>

                <div className="py-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Dual-Track Care</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">No mind/body separation. Therapy for cognition; movement for nervous system equilibrium.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Anti-Clinical Warmth</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">Down-to-earth, genuine dialogue. Zero sterile diagnostic pretension or clinical intimidation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Actionable Self-Determination</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">Take home practical somatic protocols, daily habit design, and tangible emotional agency.</p>
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
              <div className="w-10 h-10 rounded-xl bg-[#F96100]/10 text-[#F96100] flex items-center justify-center shrink-0">
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
                <span className="font-extrabold text-xs text-[#130C76] block">Certified Movement Coach</span>
                <span className="text-[11px] text-gray-500 block">Somatic Regulation</span>
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
                <div className="w-24 h-24 rounded-2xl bg-[#F96100] text-white flex items-center justify-center font-extrabold text-4xl shadow-lg mb-6">
                  L
                </div>
                <h3 className="text-2xl font-extrabold text-white">Luke MCouns</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#FFAC24] mt-1">
                  Master of Counselling (University of Queensland)
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Registered PACFA Clinician • Certified Movement & Strength Coach
                </p>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F96100]" />
                    <span>Practice Base: Logan, Queensland, Australia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#F96100]" />
                    <span>Modality: Encrypted Telehealth Australia-Wide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#F96100]" />
                    <span>luke@mightymentalhealth.com.au</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <Button asChild variant="default" size="default" className="w-full">
                    <a href="#booking">Book With Luke &rarr;</a>
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
                No Cold Waiting Rooms. No Sterile Jargon. <span className="text-[#F96100]">Just Real Healthcare.</span>
              </h2>

              <p className="text-base text-gray-700 leading-relaxed">
                Conventional therapy often asks you to talk about your distress while ignoring the knots in your shoulders, your shallow chest breathing, and your elevated nervous system. Conventional personal training treats your body like a machine to be judged, obsessed with mirrors and cosmetic vanity.
              </p>

              <p className="text-base text-gray-700 leading-relaxed">
                <strong>Mighty Mental Health was founded to fuse both.</strong> With a Master of Counselling from the University of Queensland and years of clinical and physical strength coaching experience, Luke brings an evidence-based, compassionate space where mind and body are strengthened together.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <h4 className="font-extrabold text-sm text-[#130C76] mb-1">Down-To-Earth Dialogue</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Conversations feel natural, grounded, and unpretentious. We speak like real human beings, meeting you wherever you are at.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <h4 className="font-extrabold text-sm text-[#130C76] mb-1">Somatic Equilibrium</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Learn how nervous system regulation, vagal toning, and tailored progressive movement calm anxiety and restore vitality.
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#F96100] block mb-2">Our Grounding Philosophy</span>
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
                <div key={i} className="p-6 rounded-2xl bg-white border border-[#E5DFD5] hover:border-[#F96100] transition-colors group shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-[#E5DFD5] flex items-center justify-center text-[#F96100] shadow-2xs mb-4 group-hover:scale-110 transition-transform">
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#F96100] block mb-1">Appointment Scheduler</span>
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
                            onClick={() => setSelectedService(service)}
                            className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${
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
                                <span className="text-sm font-extrabold text-[#F96100]">
                                  ${(service.price_cents / 100).toFixed(0)} AUD
                                </span>
                                <span className="block text-[11px] text-gray-400 font-medium">{service.duration_minutes} mins</span>
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
                          onClick={() => setSelectedModality('video')}
                          className={`p-4 rounded-2xl cursor-pointer border-2 transition-all relative ${
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
                            <span className="text-gray-400 font-medium">No app download</span>
                          </div>
                        </div>

                        {/* Option 2: Phone Call */}
                        <div
                          onClick={() => setSelectedModality('phone')}
                          className={`p-4 rounded-2xl cursor-pointer border-2 transition-all relative ${
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
                            <span className="text-gray-400 font-medium">Direct phone call</span>
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
                            <Video className="w-3.5 h-3.5 text-[#F96100]" /> Telehealth Video
                          </>
                        ) : (
                          <>
                            <Phone className="w-3.5 h-3.5 text-[#F96100]" /> Phone Call
                          </>
                        )}
                      </span>
                    </div>

                    {/* Timezone Switcher */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-6 bg-white p-3 rounded-xl border border-gray-200">
                      <span className="font-medium text-gray-700">Practice Timezone: Brisbane, QLD (AEST)</span>
                      <select
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
                                        ? 'bg-[#F96100] text-white border-[#F96100] shadow-sm scale-105'
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

      {/* 5. Frequently Asked Questions (FAQs) */}
      <section id="faqs" className="py-24 bg-white border-b border-[#E5DFD5] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="default" className="text-xs font-bold uppercase tracking-wider py-1 px-3 mb-2">
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Client Practice Guide
            </Badge>
            <h2 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Clear, transparent answers about our somatic-cognitive approach, consultation fees, private health fund rebates, and clinical confidentiality.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'bg-[#FBF9F5] border-[#F96100] shadow-sm' 
                      : 'bg-white border-[#E5DFD5] hover:border-gray-400'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-hidden"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F96100] block mb-1">
                        {faq.category}
                      </span>
                      <h3 className="text-base font-bold text-[#130C76] sm:text-lg">
                        {faq.q}
                      </h3>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 transition-colors ${
                      isOpen ? 'bg-[#F96100] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-[#E5DFD5]/60 mt-1 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick FAQ Footer reassurance */}
          <div className="mt-12 text-center text-xs text-gray-500">
            Have a question not covered here?{' '}
            <a href="#contact" className="font-bold text-[#F96100] hover:underline">
              Send Luke an inquiry directly &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* 6. In-Page Contact Us Section */}
      <section id="contact" className="py-24 bg-[#FBF9F5] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="default" className="text-xs font-bold uppercase tracking-wider py-1 px-3 mb-2">
              Get in Touch
            </Badge>
            <h2 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">Have a Question for Luke?</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Have questions about psychotherapy, somatic fitness coaching, private health fund claims, or want to speak before booking? Send a message below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-6 sm:p-8 space-y-6">
                <h3 className="font-extrabold text-xl text-[#130C76]">Practice Information</h3>

                <div className="space-y-4 text-xs text-gray-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block">Clinic Base</span>
                      <span>Logan, Queensland, Australia</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block">Direct Clinical Email</span>
                      <span>luke@mightymentalhealth.com.au</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block">Consultation Modality</span>
                      <span>Secure Telehealth Video or Phone across Australia</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                  <p><strong>Clinical Director:</strong> Luke (MCouns, UQ; PACFA Reg)</p>
                  <p>Inquiries are reviewed directly by Luke within 1 business day.</p>
                </div>
              </Card>

              {/* Acute Crisis Support Safeguard */}
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-xs text-red-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <ShieldAlert className="w-4 h-4" /> Urgent Crisis Support
                </div>
                <p className="leading-relaxed text-[11px] text-red-800">
                  Mighty Mental Health provides scheduled outpatient appointments. If you are experiencing acute distress:
                </p>
                <div className="space-y-1 font-bold text-[11px] text-red-900 pt-1">
                  <p>• Emergency: <strong>000</strong></p>
                  <p>• Lifeline: <strong>13 11 14</strong> (24/7 Crisis Support)</p>
                  <p>• Suicide Call Back: <strong>1300 659 467</strong></p>
                </div>
              </div>
            </div>

            {/* Right Contact Form Column */}
            <div className="lg:col-span-7">
              <Card className="p-6 sm:p-10 shadow-lg">
                {contactSubmitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#130C76]">Message Received</h3>
                    <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                      Thank you, <strong>{contactName}</strong>. Luke has received your note and will reply directly to <strong>{contactEmail}</strong>.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="mt-4 text-xs font-bold text-[#F96100] hover:underline cursor-pointer"
                    >
                      Send another note &rarr;
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="font-extrabold text-xl text-[#130C76] mb-2">Send an Inquiry</h3>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="alex@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="0400 000 000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Your Message *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell Luke a bit about what you are looking for..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                      ></textarea>
                    </div>

                    <Button
                      type="submit"
                      disabled={contactSubmitting}
                      size="lg"
                      className="w-full"
                    >
                      {contactSubmitting ? 'Sending...' : 'Send Message to Luke'}
                    </Button>
                  </form>
                )}
              </Card>
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
                    <span className="font-mono font-bold text-[#F96100]">{bookingSuccess.telehealth_room_id}</span>
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
