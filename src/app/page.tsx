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
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHService } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  return (
    <div className="relative">
      {/* Hero Section */}
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
                  <a href="#services">Explore Clinical Menu</a>
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

      {/* The 5 Values Pillars */}
      <section id="services" className="py-20 bg-white border-b border-[#E5DFD5]">
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
                <div key={i} className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] hover:border-[#F96100] transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DFD5] flex items-center justify-center text-[#F96100] shadow-2xs mb-4 group-hover:scale-110 transition-transform">
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

      {/* Side-by-Side Unified Booking Grid with Cal.com Switcher */}
      <section id="booking" className="py-20 bg-[#FBF9F5] scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F96100] block mb-1">Appointment Scheduler</span>
            <h2 className="text-3xl font-extrabold text-[#130C76] sm:text-4xl">Reserve Your Session</h2>
            <p className="text-sm text-gray-600 mt-2">Select your consultation, choose an open timeslot, and book your session in 60 seconds.</p>
            
            {/* Engine Switcher */}
            <div className="mt-6 inline-flex rounded-xl bg-white p-1 border border-[#E5DFD5] shadow-2xs">
              <button
                onClick={() => setBookingEngine('native')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  bookingEngine === 'native'
                    ? 'bg-[#130C76] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Interactive Dual-Column Grid
              </button>
              <button
                onClick={() => setBookingEngine('calcom')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                calLink="luke-mightymentalhealth/initial-consult"
                metadata={{
                  utm_source: 'website_toggle',
                  workflow: 'agy_marketing_sync',
                }}
              />
            </div>
          ) : (
            /* Unified Dual Column Container */
            <div className="bg-white rounded-3xl border border-[#E5DFD5] shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* STEP 1: Select Session (40% Column) */}
                <div className="lg:col-span-5 p-6 sm:p-8 bg-gray-50/60 border-b lg:border-b-0 lg:border-r border-[#E5DFD5] flex flex-col justify-between">
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
                                ? 'border-[#F96100] bg-white shadow-md' 
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

                {/* STEP 2: Choose Appointment Time (60% Column) */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#130C76] text-white flex items-center justify-center text-xs font-bold">2</span>
                        <h3 className="font-bold text-lg text-[#130C76]">Pick Date & Time</h3>
                      </div>

                      {/* Modality Switcher */}
                      <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                        <button
                          onClick={() => setSelectedModality('video')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedModality === 'video'
                              ? 'bg-white text-[#130C76] shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5 text-[#F96100]" /> Video Call
                        </button>
                        <button
                          onClick={() => setSelectedModality('phone')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedModality === 'phone'
                              ? 'bg-white text-[#130C76] shadow-xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0038A8]" /> Phone Call
                        </button>
                      </div>
                    </div>

                    {/* Timezone Switcher */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-6 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
                      <span className="font-medium text-gray-700">Practice Timezone: Brisbane, QLD (AEST)</span>
                      <select
                        value={selectedTimezone}
                        onChange={(e) => setSelectedTimezone(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 font-semibold focus:outline-hidden"
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
                              className={`w-full py-2.5 rounded-xl text-center border transition-all mb-3 ${
                                isDaySelected
                                  ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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
                                    className={`w-full py-2 px-1 text-center text-xs font-bold rounded-lg border transition-all slot-pill ${
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
                  <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Selected Appointment</span>
                      <p className="text-sm font-extrabold text-[#130C76]">
                        {selectedService?.title} • {selectedModality === 'video' ? 'Video' : 'Phone'}
                      </p>
                      <p className="text-xs text-gray-600 font-semibold">
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
                    className="text-xs text-gray-400 hover:text-gray-600 pt-2"
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
