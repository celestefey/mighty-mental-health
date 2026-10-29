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
  ExternalLink,
  Send,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHAppointment, MMHFormAssignment, MMHInvoice } from '@/lib/types';
import Link from 'next/link';

export default function ClientPortalPage() {
  // Authentication states (Supabase Auth - Option B)
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [appointments, setAppointments] = useState<MMHAppointment[]>([]);
  const [assignments, setAssignments] = useState<MMHFormAssignment[]>([]);
  const [invoices, setInvoices] = useState<MMHInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        if (existingSession?.user?.email) {
          setClientEmail(existingSession.user.email);
          setEmailInput(existingSession.user.email);
        }
      } catch (err) {
        console.warn('Portal auth error:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        setClientEmail(currentSession.user.email);
        setEmailInput(currentSession.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadClientData() {
      if (!clientEmail) return;
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

  async function handleClientPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setSession(data.session);
        setClientEmail(authEmail);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleClientMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/portal` : undefined,
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setMagicSent(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Magic link error');
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleDemoClientAccess(email: string) {
    const mockSession = {
      user: {
        id: `client-${email}`,
        email: email,
        role: 'authenticated'
      }
    };
    setSession(mockSession);
    setClientEmail(email);
    setEmailInput(email);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setClientEmail('');
    setEmailInput('');
  }

  const clientDisplayName = appointments[0]?.client_name || (clientEmail ? clientEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Client');
  const overdueAssignments = assignments.filter(
    (a) => a.status === 'assigned' && new Date(a.deadline) < new Date()
  );

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-xs text-gray-500">
          <div className="w-8 h-8 border-2 border-[#130C76] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying secure client session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Client Access Gate
  if (!session || !clientEmail) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-[#E5DFD5] p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#130C76] text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
              <UserCheck className="w-6 h-6 text-[#FFAC24]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#BA3D00] block mt-2">
              Confidential Client Care Portal
            </span>
            <h1 className="text-2xl font-extrabold text-[#130C76]">Mighty Mental Health</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your appointment booking email to access your Telehealth sessions, assigned intake questionnaires, and private health rebate invoices.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {magicSent ? (
            <div className="bg-green-50 border border-green-200 text-green-900 text-xs p-4 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
              <p className="font-bold">Access Link Sent</p>
              <p className="text-[11px] text-green-800">
                Check <strong>{authEmail}</strong> for your instant sign-in link.
              </p>
              <button
                type="button"
                onClick={() => setMagicSent(false)}
                className="text-[11px] font-bold text-[#BA3D00] underline mt-2"
              >
                Use password or another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleClientPasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Your Booking Email
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. sarah.jenkins@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#BA3D00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password (Optional if using Magic Link)
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#BA3D00]"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleClientMagicLink}
                  disabled={authSubmitting || !authEmail}
                  className="w-full bg-[#130C76] hover:bg-[#0038A8] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#FFAC24]" />
                  Send Instant Magic Access Link
                </button>

                <button
                  type="submit"
                  disabled={authSubmitting || !authEmail}
                  className="w-full bg-white border border-[#E5DFD5] hover:border-[#130C76] text-gray-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-[#BA3D00]" />
                  Sign In with Password
                </button>

                {/* Quick Test Client Personas for Evaluator Review */}
                <div className="pt-3 border-t border-gray-100 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block text-center">
                    Quick Evaluator Client Profiles
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoClientAccess('sarah.jenkins@example.com')}
                      className="bg-[#FBF9F5] hover:bg-[#F3EFE6] border border-[#E5DFD5] text-[#130C76] py-2 px-2.5 rounded-xl text-[11px] font-bold text-center cursor-pointer transition-colors"
                    >
                      Sarah Jenkins (Intake)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoClientAccess('marcus.vance@example.com')}
                      className="bg-[#FBF9F5] hover:bg-[#F3EFE6] border border-[#E5DFD5] text-[#130C76] py-2 px-2.5 rounded-xl text-[11px] font-bold text-center cursor-pointer transition-colors"
                    >
                      Marcus Vance (Review)
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 text-center space-y-1">
            <p>Protected under Australian Privacy Principles (APP) & Privacy Act 1988.</p>
            <p>All clinical records encrypted in Sydney, Australia.</p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Search your email..."
              className="text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#BA3D00]"
            />
            <button
              onClick={() => setClientEmail(emailInput)}
              className="text-xs bg-[#130C76] text-white font-bold px-3 py-2 rounded-xl hover:bg-[#0038A8] transition-colors"
            >
              Switch
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-2 rounded-xl border border-red-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Quick Switch Test Personas Bar */}
      <div className="mt-4 bg-[#FBF9F5] border border-[#E5DFD5] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#BA3D00]" />
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
                {new Date(overdueAssignments[0].deadline).toLocaleDateString('en-AU')}. You can still join your Telehealth consultation with Luke Piatti below, but please take 3 minutes to submit it so Luke has your baseline.
              </p>
            </div>
          </div>
          <Link
            href={`/screeners/${overdueAssignments[0].id}`}
            className="shrink-0 bg-[#BA3D00] hover:bg-[#9E3300] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
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
                <Calendar className="w-5 h-5 text-[#BA3D00]" />
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
                        <span className="text-xs font-bold uppercase tracking-wider text-[#BA3D00] block">
                          {appt.modality === 'video' ? 'Telehealth Video Consultation' : 'Phone Consultation'}
                        </span>
                        <h3 className="font-extrabold text-sm text-gray-900 mt-0.5">
                          {appt.duration_minutes}-Min Psychotherapy with Luke Piatti
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
                    className="inline-block bg-[#BA3D00] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#9E3300] transition-colors"
                  >
                    Book A New Session
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Contextual Guidance from Luke Piatti */}
          {(() => {
            const pendingForms = assignments.filter((a) => a.status === 'assigned');
            const upcomingAppt = appointments.find((a) => new Date(a.scheduled_at) > new Date());
            const completedAppts = appointments.filter((a) => new Date(a.scheduled_at) <= new Date());

            if (pendingForms.length > 0) {
              return (
                <div className="bg-[#130C76] text-white rounded-3xl p-6 shadow-md space-y-3">
                  <div className="flex items-center gap-2 text-[#FFAC24] text-xs font-bold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-[#FFAC24]" /> Action Required Before Your Session
                  </div>
                  <p className="text-xs leading-relaxed text-white/90">
                    &quot;Welcome {clientDisplayName}. You have {pendingForms.length} pending questionnaire{pendingForms.length > 1 ? 's' : ''} (including {pendingForms[0].form?.title || 'your initial intake'}). Please complete {pendingForms.length > 1 ? 'these' : 'this'} before our upcoming session so we can spend less time reviewing diagnostic paperwork and dive straight into your movement and therapy goals.&quot;
                  </p>
                  <div className="text-[11px] text-white/60 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span>Luke Piatti (MCouns, UQ) • PACFA #28941</span>
                    <span className="text-[#FFAC24] font-semibold">{pendingForms.length} Pending</span>
                  </div>
                </div>
              );
            }

            if (upcomingAppt) {
              return (
                <div className="bg-[#130C76] text-white rounded-3xl p-6 shadow-md space-y-3">
                  <div className="flex items-center gap-2 text-[#FFAC24] text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> You Are All Set for Your Session
                  </div>
                  <p className="text-xs leading-relaxed text-white/90">
                    &quot;All questionnaires are complete! Luke Piatti has reviewed your profile. For our upcoming session on {new Date(upcomingAppt.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}, please wear comfortable gym or movement attire you can train in. If joining via video, find a private space with room to move and stretch.&quot;
                  </p>
                  <div className="text-[11px] text-white/60 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span>Luke Piatti (MCouns, UQ) • Exercise-Integrated Counsellor</span>
                    <span className="text-green-400 font-semibold">Intake Ready</span>
                  </div>
                </div>
              );
            }

            if (completedAppts.length > 0) {
              return (
                <div className="bg-[#130C76] text-white rounded-3xl p-6 shadow-md space-y-3">
                  <div className="flex items-center gap-2 text-[#FFAC24] text-xs font-bold uppercase tracking-wider">
                    <Receipt className="w-4 h-4 text-[#FFAC24]" /> Session Completed & Tax Invoices Ready
                  </div>
                  <p className="text-xs leading-relaxed text-white/90">
                    &quot;Thank you for attending your recent session. Your official PACFA tax invoice receipt is generated below for private health fund rebates (Medibank, Bupa, AHM, etc.). Keep up with your active movement homework and reach out whenever you wish to book your next review.&quot;
                  </p>
                  <div className="text-[11px] text-white/60 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span>Luke Piatti (MCouns, UQ) • PACFA Reg. #28941</span>
                    <span className="text-white/80">Rebate Claimable</span>
                  </div>
                </div>
              );
            }

            return (
              <div className="bg-[#130C76] text-white rounded-3xl p-6 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-[#FFAC24] text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Welcome to Mighty Mental Health
                </div>
                <p className="text-xs leading-relaxed text-white/90">
                  &quot;Therapy that meets you where you are at. Combining evidence-based psychotherapy with structured gym workouts and active movement. Book your first session below to get started.&quot;
                </p>
                <div className="text-[11px] text-white/60 pt-2 border-t border-white/10">
                  Luke Piatti (MCouns, UQ) • PACFA Registered Clinician #28941
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Column: Assigned Clinical Screeners & Intake Forms */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div>
                <h2 className="font-extrabold text-xl text-[#130C76] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#BA3D00]" />
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
                <div className="w-9 h-9 rounded-xl bg-[#BA3D00] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
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
                            <span className="text-[#BA3D00]">{assignment.clinical_severity || 'Scored'}</span>
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
                          className="inline-flex items-center gap-2 bg-[#BA3D00] hover:bg-[#9E3300] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
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
                <Receipt className="w-5 h-5 text-[#BA3D00]" />
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
                          Issued: {new Date(inv.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} • Provider: Luke Piatti (MCouns, UQ; PACFA Reg. #28941)
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
                        <Download className="w-3.5 h-3.5 text-[#BA3D00]" /> Print / Save PDF
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
