'use client';

import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Video, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Download,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHAppointment, MMHFormAssignment, MMHInvoice } from '@/lib/types';
import Link from 'next/link';

export default function ClientPortalPage() {
  const [emailInput, setEmailInput] = useState('sarah.jenkins@example.com');
  const [clientEmail, setClientEmail] = useState('sarah.jenkins@example.com');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const [appointments, setAppointments] = useState<MMHAppointment[]>([]);
  const [assignments, setAssignments] = useState<MMHFormAssignment[]>([]);
  const [invoices, setInvoices] = useState<MMHInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      setLoading(true);
      // Fetch appointments for this client
      const { data: appts } = await supabase
        .from('mmh_appointments')
        .select('*')
        .eq('client_email', clientEmail)
        .order('scheduled_at', { ascending: true });

      // Fetch assigned forms for this client
      const { data: forms } = await supabase
        .from('mmh_form_assignments')
        .select('*, form:mmh_forms(*)')
        .eq('client_email', clientEmail)
        .order('deadline', { ascending: true });

      // Fetch invoices for this client
      const { data: invs } = await supabase
        .from('mmh_invoices')
        .select('*')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (appts) setAppointments(appts as MMHAppointment[]);
      if (forms) setAssignments(forms as MMHFormAssignment[]);
      if (invs) setInvoices(invs as MMHInvoice[]);
      setLoading(false);
    }

    if (clientEmail) {
      loadClientData();
    }
  }, [clientEmail]);

  const clientDisplayName = appointments[0]?.client_name || (clientEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()));
  const overdueAssignments = assignments.filter(
    (a) => a.status === 'assigned' && new Date(a.deadline) < new Date()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Client Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-[#E5DFD5]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#130C76]/10 text-[#130C76] text-xs font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" /> Client Telehealth & Care Portal
          </div>
          <h1 className="text-3xl font-extrabold text-[#130C76]">Welcome back, {clientDisplayName}</h1>
          <p className="text-xs text-gray-500 mt-1">Logged in as {clientEmail} • Logan, QLD Clinic</p>
        </div>

        {/* Change Account or Switch */}
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Search your email..."
            className="text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#F96100]"
          />
          <button
            onClick={() => setClientEmail(emailInput)}
            className="text-xs bg-[#130C76] text-white font-bold px-3 py-2 rounded-xl hover:bg-[#0038A8] transition-colors"
          >
            Switch
          </button>
        </div>
      </div>

      {/* Quick Switch Test Personas Bar */}
      <div className="mt-4 bg-[#FBF9F5] border border-[#E5DFD5] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F96100]" />
          <span className="font-extrabold text-[#130C76]">Quick Test Personas:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setClientEmail('sarah.jenkins@example.com');
              setEmailInput('sarah.jenkins@example.com');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              clientEmail === 'sarah.jenkins@example.com'
                ? 'bg-[#130C76] text-white shadow-2xs'
                : 'bg-white border border-[#E5DFD5] text-gray-700 hover:border-[#130C76]'
            }`}
          >
            Sarah Jenkins (Severe DASS-21 + Invoice)
          </button>
          <button
            onClick={() => {
              setClientEmail('david.chen@example.com');
              setEmailInput('david.chen@example.com');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              clientEmail === 'david.chen@example.com'
                ? 'bg-[#130C76] text-white shadow-2xs'
                : 'bg-white border border-[#E5DFD5] text-gray-700 hover:border-[#130C76]'
            }`}
          >
            David Chen (Pending GAD-7)
          </button>
          <button
            onClick={() => {
              setClientEmail('marcus.brody@example.com');
              setEmailInput('marcus.brody@example.com');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              clientEmail === 'marcus.brody@example.com'
                ? 'bg-[#130C76] text-white shadow-2xs'
                : 'bg-white border border-[#E5DFD5] text-gray-700 hover:border-[#130C76]'
            }`}
          >
            Marcus Brody (Overdue Screener ⚠️)
          </button>
        </div>
      </div>

      {/* Overdue Screener Soft Reminder Banner */}
      {overdueAssignments.length > 0 && (
        <div className="mt-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              !
            </div>
            <div>
              <span className="font-extrabold text-sm text-amber-950 block">Pre-Session Assessment Overdue</span>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                Your assigned form <strong>{overdueAssignments[0].form?.title || 'Clinical Assessment'}</strong> was due on{' '}
                {new Date(overdueAssignments[0].deadline).toLocaleDateString('en-AU')}. You can still join your Telehealth consultation with Luke below, but please take 3 minutes to submit it so Luke has your baseline.
              </p>
            </div>
          </div>
          <Link
            href={`/screeners/${overdueAssignments[0].id}`}
            className="shrink-0 bg-[#F96100] hover:bg-[#d65300] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Complete Overdue Screener &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Left Column: Upcoming Sessions & Telehealth Launcher */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="font-extrabold text-lg text-[#130C76] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F96100]" />
                Upcoming Sessions
              </h2>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                Active Client
              </span>
            </div>

            <div className="divide-y divide-gray-100 mt-4">
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <div key={appt.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#F96100] block">
                          {appt.modality === 'video' ? 'Telehealth Video Consultation' : 'Phone Consultation'}
                        </span>
                        <h3 className="font-extrabold text-sm text-gray-900 mt-0.5">
                          {appt.duration_minutes}-Min Psychotherapy with Luke
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(appt.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at{' '}
                          {new Date(appt.scheduled_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} AEST
                        </p>
                      </div>
                    </div>

                    {/* Telehealth One-Click Launcher */}
                    {appt.modality === 'video' && (
                      <Link
                        href={`/telehealth/${appt.telehealth_room_id}?role=client`}
                        className="w-full bg-[#130C76] hover:bg-[#0038A8] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4 text-[#FFAC24]" />
                        Join Encrypted Telehealth Room
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-500 space-y-3">
                  <p>No upcoming sessions found for this email.</p>
                  <Link
                    href="/#booking"
                    className="inline-block bg-[#F96100] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#d65300] transition-colors"
                  >
                    Book A New Session
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Clinician Notes & Guidance */}
          <div className="bg-[#130C76] text-white rounded-3xl p-6 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-[#FFAC24] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Message from Luke
            </div>
            <p className="text-xs leading-relaxed text-white/90">
              &quot;Remember to complete your assigned DASS-21 and somatic intake screener prior to our session. It helps us spend less time on diagnostic questionnaires and more time moving toward what matters to you.&quot;
            </p>
            <div className="text-[11px] text-white/60 pt-2 border-t border-white/10">
              Luke MCouns (UQ) • PACFA Registered Clinician
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Clinical Screeners & Intake Forms */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div>
                <h2 className="font-extrabold text-xl text-[#130C76] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#F96100]" />
                  Assigned Screeners & Intake Forms
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Complete these psychometric assessments before your appointment deadline.
                </p>
              </div>
              <span className="text-xs font-bold bg-[#FBF9F5] border border-[#E5DFD5] text-[#130C76] px-3 py-1 rounded-full">
                {assignments.filter(a => a.status === 'assigned').length} Pending
              </span>
            </div>

            {/* Comprehensive Clinical Intake Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F96100] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  <FileText className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-[#130C76] block">New Client Clinical Intake</span>
                  <p className="text-[11px] text-gray-600">Complete your medical, somatic baseline, and GP details (Psychological Assessments Australia standard).</p>
                </div>
              </div>
              <Link
                href="/intake"
                className="bg-[#130C76] hover:bg-[#0038A8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                Start Digital Intake &rarr;
              </Link>
            </div>

            <div className="divide-y divide-gray-100 mt-4 space-y-4">
              {assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const isCompleted = assignment.status === 'completed';
                  const deadlineDate = new Date(assignment.deadline);
                  const isOverdue = !isCompleted && deadlineDate < new Date();

                  return (
                    <div key={assignment.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-gray-900">
                              {assignment.form?.title || 'Clinical Assessment'}
                            </h3>
                            {isCompleted ? (
                              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Submitted
                              </span>
                            ) : isOverdue ? (
                              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Overdue
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {assignment.form?.description}
                          </p>
                        </div>

                        {/* Action / Deadline */}
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs text-gray-400 block font-medium">Deadline</span>
                          <span className="text-xs font-bold text-gray-800 block">
                            {deadlineDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Completed summary vs Complete button */}
                      {isCompleted ? (
                        <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-[#E5DFD5] text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-gray-800">
                            <span>Clinical Scoring Result:</span>
                            <span className="text-[#F96100]">{assignment.clinical_severity || 'Scored'}</span>
                          </div>
                          {assignment.score_summary && (
                            <div className="flex gap-4 text-[11px] text-gray-600 pt-1">
                              {assignment.score_summary.depression !== undefined && (
                                <span>Depression: <strong>{assignment.score_summary.depression}</strong></span>
                              )}
                              {assignment.score_summary.anxiety !== undefined && (
                                <span>Anxiety: <strong>{assignment.score_summary.anxiety}</strong></span>
                              )}
                              {assignment.score_summary.stress !== undefined && (
                                <span>Stress: <strong>{assignment.score_summary.stress}</strong></span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={`/screeners/${assignment.id}`}
                          className="inline-flex items-center gap-2 bg-[#F96100] hover:bg-[#d65300] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
                        >
                          Complete Screener Now <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-gray-500 space-y-3">
                  <p>No screeners currently assigned. When Luke assigns an intake form or DASS-21, it will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Invoices and Private Health Receipts */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h2 className="font-extrabold text-lg text-[#130C76] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#F96100]" />
                Invoices & Health Fund Receipts
              </h2>
              <span className="text-xs font-bold text-gray-500">
                {invoices.length} Available
              </span>
            </div>

            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">Tax Invoice #{inv.invoice_number}</span>
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {inv.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          Issued: {new Date(inv.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} • Provider: Luke (MCouns, UQ)
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-base font-extrabold text-[#130C76]">
                          ${(inv.amount_cents / 100).toFixed(2)} AUD
                        </span>
                        <span className="text-[10px] text-gray-500 block font-semibold">
                          GST Free (Psychotherapy)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-gray-600 text-[11px]">
                        PACFA Registered Clinician #28941 • Suitable for Medibank, Bupa, AHM, and private health rebate claims.
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="bg-white border border-[#E5DFD5] hover:border-[#130C76] text-[#130C76] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#F96100]" /> Print / Save PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="font-bold text-gray-700">No invoices yet for this client</p>
                <p className="text-[11px] text-gray-500 mt-1">Official PACFA provider tax receipts are generated upon appointment completion and available here for immediate Medibank, Bupa, and private insurer claims.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
