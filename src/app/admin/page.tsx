'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  FileText, 
  Plus, 
  Edit3, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Video, 
  Send, 
  Search,
  ShieldCheck,
  Activity,
  AlertCircle,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHAppointment, MMHForm, MMHFormAssignment, MMHClinicalNote } from '@/lib/types';
import Link from 'next/link';

const CATEGORY_TABS = [
  'All',
  'Mood & Depression',
  'Anxiety & Trauma',
  'ADHD & Neurodiversity',
  'Sleep & Somatics',
  'Substance & Well-being',
];

export default function ClinicianAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'forms' | 'assignments' | 'notes'>('schedule');
  
  // Data states
  const [appointments, setAppointments] = useState<MMHAppointment[]>([]);
  const [forms, setForms] = useState<MMHForm[]>([]);
  const [assignments, setAssignments] = useState<MMHFormAssignment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<MMHClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Filter & Preview states
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
  const [formSearchQuery, setFormSearchQuery] = useState<string>('');
  const [previewingForm, setPreviewingForm] = useState<MMHForm | null>(null);

  // Form Builder state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Mood & Depression');
  const [formDescription, setFormDescription] = useState('');
  const [formQuestions, setFormQuestions] = useState<any[]>([
    { id: 'q1', text: 'How has your physical stress been this week?', type: 'scale_0_3' }
  ]);

  // Assign Form state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignFormId, setAssignFormId] = useState('');
  const [assignClientName, setAssignClientName] = useState('');
  const [assignClientEmail, setAssignClientEmail] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('2026-11-05');

  // Clinical SOAP Notes state
  const [selectedApptForNote, setSelectedApptForNote] = useState<MMHAppointment | null>(null);
  const [noteSubjective, setNoteSubjective] = useState('');
  const [noteObjective, setNoteObjective] = useState('');
  const [noteAssessment, setNoteAssessment] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Sandbox & Demo States
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [isPurgingDemo, setIsPurgingDemo] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  async function loadAllAdminData() {
    setLoading(true);
    const [apptsRes, formsRes, assignRes, notesRes] = await Promise.all([
      supabase.from('mmh_appointments').select('*, service:mmh_services(*)').order('scheduled_at', { ascending: false }),
      supabase.from('mmh_forms').select('*').order('created_at', { ascending: true }),
      supabase.from('mmh_form_assignments').select('*, form:mmh_forms(*)').order('created_at', { ascending: false }),
      supabase.from('mmh_clinical_notes').select('*').order('created_at', { ascending: false }),
    ]);

    if (apptsRes.data) setAppointments(apptsRes.data as MMHAppointment[]);
    if (formsRes.data) {
      setForms(formsRes.data as MMHForm[]);
      if (formsRes.data.length > 0) setAssignFormId(formsRes.data[0].id);
    }
    if (assignRes.data) setAssignments(assignRes.data as MMHFormAssignment[]);
    if (notesRes.data) setClinicalNotes(notesRes.data as MMHClinicalNote[]);
    setLoading(false);
  }

  // Handle Form Builder Save
  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    const slug = formSlug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingFormId) {
      await supabase.from('mmh_forms').update({
        title: formTitle,
        category: formCategory,
        description: formDescription,
        questions: formQuestions,
        updated_at: new Date().toISOString(),
      }).eq('id', editingFormId);
    } else {
      await supabase.from('mmh_forms').insert({
        title: formTitle,
        slug: slug,
        category: formCategory,
        description: formDescription,
        questions: formQuestions,
        is_template: false,
      });
    }

    setIsFormModalOpen(false);
    setEditingFormId(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    loadAllAdminData();
  }

  // Handle Assign Form
  async function handleAssignForm(e: React.FormEvent) {
    e.preventDefault();
    if (!assignFormId || !assignClientEmail) return;

    await supabase.from('mmh_form_assignments').insert({
      form_id: assignFormId,
      client_name: assignClientName,
      client_email: assignClientEmail,
      deadline: new Date(assignDeadline).toISOString(),
      status: 'assigned',
    });

    setIsAssignModalOpen(false);
    setAssignClientName('');
    setAssignClientEmail('');
    loadAllAdminData();
    setActiveTab('assignments');
  }

  // Handle Save SOAP Clinical Note
  async function handleSaveNote(lock: boolean = false) {
    if (!selectedApptForNote) return;
    setIsNoteSaving(true);

    await supabase.from('mmh_clinical_notes').insert({
      appointment_id: selectedApptForNote.id,
      client_name: selectedApptForNote.client_name,
      client_email: selectedApptForNote.client_email,
      note_type: 'SOAP',
      subjective: noteSubjective,
      objective: noteObjective,
      assessment: noteAssessment,
      plan: notePlan,
      is_locked: lock,
      locked_at: lock ? new Date().toISOString() : null,
    });

    setIsNoteSaving(false);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 3000);
    loadAllAdminData();
  }

  // Seed realistic Demo Cohort (Sarah Jenkins, David Chen, Marcus Brody)
  async function handleSeedDemoData() {
    setIsSeedingDemo(true);
    try {
      const { data: services } = await supabase.from('mmh_services').select('id, slug');
      const s60 = services?.find(s => s.slug === 'psychotherapy-counselling')?.id;
      const s40 = services?.find(s => s.slug === 'initial-consult')?.id;
      const s30 = services?.find(s => s.slug === 'somatic-movement')?.id;

      const dassForm = forms.find(f => f.slug === 'dass-21');
      const gadForm = forms.find(f => f.slug === 'gad-7');
      const somaticForm = forms.find(f => f.slug === 'somatic-intake');
      const aisForm = forms.find(f => f.slug === 'ais');
      const k10Form = forms.find(f => f.slug === 'k10');
      const pclForm = forms.find(f => f.slug === 'pcl-5');
      const phqForm = forms.find(f => f.slug === 'phq-9');

      const now = new Date();
      const appt1Time = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
      const appt2Time = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      const appt3Time = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

      // Clean existing demo data first to prevent duplicates
      await Promise.all([
        supabase.from('mmh_appointments').delete().eq('is_demo', true),
        supabase.from('mmh_form_assignments').delete().eq('is_demo', true),
        supabase.from('mmh_clinical_notes').delete().eq('is_demo', true),
        supabase.from('mmh_invoices').delete().eq('is_demo', true),
      ]);

      // 1. Insert Appointments
      const { data: insertedAppts } = await supabase.from('mmh_appointments').insert([
        {
          client_name: 'Sarah Jenkins',
          client_email: 'sarah.jenkins@example.com',
          client_phone: '0412 345 678',
          service_id: s60 || null,
          scheduled_at: appt1Time,
          duration_minutes: 60,
          modality: 'video',
          status: 'confirmed',
          telehealth_room_id: 'mmh-sarah-j-telehealth',
          notes: 'Reports workplace burnout, clavicular breathing, high autonomic stress.',
          is_demo: true,
        },
        {
          client_name: 'David Chen',
          client_email: 'david.chen@example.com',
          client_phone: '0423 456 789',
          service_id: s40 || null,
          scheduled_at: appt2Time,
          duration_minutes: 40,
          modality: 'video',
          status: 'confirmed',
          telehealth_room_id: 'mmh-david-c-telehealth',
          notes: 'Initial consult regarding nervous system downregulation & sleep.',
          is_demo: true,
        },
        {
          client_name: 'Marcus Brody',
          client_email: 'marcus.brody@example.com',
          client_phone: '0434 567 890',
          service_id: s30 || null,
          scheduled_at: appt3Time,
          duration_minutes: 30,
          modality: 'video',
          status: 'confirmed',
          telehealth_room_id: 'mmh-marcus-b-telehealth',
          notes: 'Somatic movement integration for athletic performance hyperarousal.',
          is_demo: true,
        }
      ]).select();

      // 2. Insert Assignments
      const sarahDeadline = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
      const davidDeadline = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      const marcusDeadline = new Date(now.getTime() - 24 * 3600 * 1000).toISOString(); // Overdue!

      if (dassForm) {
        await supabase.from('mmh_form_assignments').insert({
          form_id: dassForm.id,
          client_name: 'Sarah Jenkins',
          client_email: 'sarah.jenkins@example.com',
          deadline: sarahDeadline,
          status: 'completed',
          clinical_severity: 'D: Moderate (16) | A: Severe (18) | S: Severe (26)',
          score_summary: {
            depression: 16,
            anxiety: 18,
            stress: 26,
            requiresUrgentAttention: true
          },
          completed_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
          is_demo: true,
        });
      }

      if (k10Form) {
        await supabase.from('mmh_form_assignments').insert({
          form_id: k10Form.id,
          client_name: 'David Chen',
          client_email: 'david.chen@example.com',
          deadline: davidDeadline,
          status: 'assigned',
          is_demo: true,
        });
      } else if (gadForm) {
        await supabase.from('mmh_form_assignments').insert({
          form_id: gadForm.id,
          client_name: 'David Chen',
          client_email: 'david.chen@example.com',
          deadline: davidDeadline,
          status: 'assigned',
          is_demo: true,
        });
      }

      if (somaticForm) {
        await supabase.from('mmh_form_assignments').insert({
          form_id: somaticForm.id,
          client_name: 'Marcus Brody',
          client_email: 'marcus.brody@example.com',
          deadline: marcusDeadline,
          status: 'assigned',
          is_demo: true,
        });
      }

      if (aisForm) {
        await supabase.from('mmh_form_assignments').insert({
          form_id: aisForm.id,
          client_name: 'Marcus Brody',
          client_email: 'marcus.brody@example.com',
          deadline: davidDeadline,
          status: 'assigned',
          is_demo: true,
        });
      }

      // 3. Insert SOAP note & Invoice for Sarah Jenkins
      if (insertedAppts && insertedAppts.length > 0) {
        await supabase.from('mmh_clinical_notes').insert({
          appointment_id: insertedAppts[0].id,
          client_name: 'Sarah Jenkins',
          client_email: 'sarah.jenkins@example.com',
          note_type: 'SOAP',
          subjective: 'Client presents with autonomic arousal, chronic deadline pressure, upper trapezius tightness, and fragmented sleep.',
          objective: 'Observed clavicular shallow breathing. DASS-21 Anxiety score is 18 (Severe) and Stress is 26 (Severe).',
          assessment: 'Somatic distress consistent with sympathetic nervous system overdrive.',
          plan: 'Prescribed box breathing down-regulation; vagal nerve pacing; 1-week follow up.',
          is_locked: false,
          is_demo: true,
        });

        await supabase.from('mmh_invoices').insert({
          appointment_id: insertedAppts[0].id,
          client_name: 'Sarah Jenkins',
          client_email: 'sarah.jenkins@example.com',
          amount_cents: 21000,
          gst_cents: 0,
          status: 'paid',
          invoice_number: `MMH-PACFA-${Date.now().toString().slice(-4)}`,
          is_demo: true,
        });
      }

      setFeedbackMessage('Demo client cohort seeded successfully! Sarah Jenkins (Severe Distress), David Chen (Pending GAD-7), and Marcus Brody (Overdue Screener) are active.');
      setTimeout(() => setFeedbackMessage(null), 6000);
      await loadAllAdminData();
    } catch (err) {
      console.error('Error seeding demo data:', err);
    } finally {
      setIsSeedingDemo(false);
    }
  }

  // Purge Demo Data
  async function handlePurgeDemoData() {
    if (!window.confirm('Are you sure you want to purge all demo test records? Real production patient data will remain untouched.')) {
      return;
    }
    setIsPurgingDemo(true);
    try {
      await Promise.all([
        supabase.from('mmh_appointments').delete().eq('is_demo', true),
        supabase.from('mmh_form_assignments').delete().eq('is_demo', true),
        supabase.from('mmh_clinical_notes').delete().eq('is_demo', true),
        supabase.from('mmh_invoices').delete().eq('is_demo', true),
      ]);
      setFeedbackMessage('All demo test records purged. Database sandbox is clean.');
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadAllAdminData();
    } catch (err) {
      console.error('Error purging demo data:', err);
    } finally {
      setIsPurgingDemo(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Clinician Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#F96100] text-white text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Clinician Administration
            </span>
            <span className="text-xs text-gray-500">PACFA Registered Practice Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#130C76] mt-1">EHR & Practice Manager</h1>
          <p className="text-xs text-gray-500">Practice Director: Luke (MCouns, UQ) • Logan, QLD</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingFormId(null);
              setFormTitle('');
              setFormSlug('');
              setFormDescription('');
              setFormQuestions([{ id: 'q1', text: '', type: 'scale_0_3' }]);
              setIsFormModalOpen(true);
            }}
            className="bg-white border border-[#E5DFD5] hover:border-[#130C76] text-[#130C76] px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#F96100]" /> New Form / Screener
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-[#F96100] hover:bg-[#d65300] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Assign Screener to Client
          </button>
        </div>
      </div>

      {/* Sandbox Test & Verification Toolbar */}
      <div className="mt-4 bg-[#FBF9F5] border border-[#E5DFD5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#130C76]/10 text-[#130C76] flex items-center justify-center font-bold text-xs shrink-0">
            <Sparkles className="w-4 h-4 text-[#F96100]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs text-[#130C76]">Clinical Testing Sandbox</span>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                {appointments.filter(a => a.is_demo).length} Demo Client(s) Loaded
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Simulate complete patient journeys: Sarah Jenkins (Severe DASS-21), David Chen (Pending GAD-7), and Marcus Brody (Overdue Screener).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={handleSeedDemoData}
            disabled={isSeedingDemo}
            className="flex-1 sm:flex-none bg-[#130C76] hover:bg-[#0038A8] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeedingDemo ? 'animate-spin' : ''}`} />
            {isSeedingDemo ? 'Seeding...' : 'Seed Test Cohort'}
          </button>

          {appointments.some(a => a.is_demo) && (
            <button
              onClick={handlePurgeDemoData}
              disabled={isPurgingDemo}
              className="flex-1 sm:flex-none bg-white border border-red-200 hover:bg-red-50 text-red-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              {isPurgingDemo ? 'Purging...' : 'Purge Demo Data'}
            </button>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div className="mt-3 bg-green-50 border border-green-200 text-green-900 rounded-xl p-3 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Real-time Clinician Urgent Alert Banner if high severity, suicide risk, or PTSD cutoff submissions exist */}
      {assignments.some(a => a.clinical_severity && (
        a.clinical_severity.includes('Severe') || 
        a.clinical_severity.includes('Extremely Severe') ||
        a.clinical_severity.includes('URGENT') ||
        a.clinical_severity.includes('Suicide') ||
        a.clinical_severity.includes('Probable PTSD') ||
        a.clinical_severity.includes('Very High Distress') ||
        a.clinical_severity.includes('High Substance Risk')
      )) && (
        <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm animate-pulse shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-red-900 block flex items-center gap-2">
                High-Distress / Clinical Risk Alert Flagged
                <span className="bg-red-200 text-red-900 text-[10px] px-2 py-0.2 rounded-full uppercase tracking-wider font-extrabold">Action Required</span>
              </span>
              <span className="text-xs text-red-700">One or more clients have submitted assessments flagged with high distress, suicidality, or probable PTSD. Please review the Submissions roster below.</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('assignments')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Review Submissions &rarr;
          </button>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-gray-200 mt-6 space-x-8 text-sm font-bold">
        {[
          { key: 'schedule', label: 'Appointments & Schedule', icon: CalendarIcon, count: appointments.length },
          { key: 'assignments', label: 'Client Form Submissions', icon: CheckCircle2, count: assignments.length },
          { key: 'forms', label: 'Form Builder & Library', icon: FileText, count: forms.length },
          { key: 'notes', label: 'SOAP Clinical Notes', icon: Lock, count: clinicalNotes.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                isActive
                  ? 'border-[#F96100] text-[#130C76]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#F96100]' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                isActive ? 'bg-[#F96100]/10 text-[#F96100]' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <h2 className="text-xl font-extrabold text-[#130C76] mb-4">Patient Appointment Roster</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">Client</th>
                    <th className="pb-3 font-bold">Service</th>
                    <th className="pb-3 font-bold">Scheduled At</th>
                    <th className="pb-3 font-bold">Modality</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((appt) => {
                    const hasOverdueScreener = assignments.some(
                      (a) => a.client_email === appt.client_email && a.status === 'assigned' && new Date(a.deadline) < new Date()
                    );
                    return (
                      <tr key={appt.id} className="hover:bg-gray-50/60">
                        <td className="py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-gray-900">{appt.client_name}</span>
                            {appt.is_demo && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                Demo
                              </span>
                            )}
                            {hasOverdueScreener && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-amber-600" /> Overdue Screener
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 block mt-0.5">{appt.client_email} • {appt.client_phone}</span>
                        </td>
                      <td className="py-4 font-bold text-[#130C76]">
                        {appt.service?.title || `${appt.duration_minutes}-Min Session`}
                      </td>
                      <td className="py-4 text-gray-700">
                        {new Date(appt.scheduled_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at{' '}
                        {new Date(appt.scheduled_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-800 uppercase">
                          {appt.modality === 'video' ? <Video className="w-3.5 h-3.5 text-[#F96100]" /> : null}
                          {appt.modality}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {appt.modality === 'video' && (
                          <Link
                            href={`/telehealth/${appt.telehealth_room_id}?role=clinician`}
                            className="bg-[#130C76] hover:bg-[#0038A8] text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5 text-[#FFAC24]" /> Start Room (Clinician)
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setSelectedApptForNote(appt);
                            setActiveTab('notes');
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                          SOAP Note
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ASSIGNMENTS & SCREENER RESPONSES */}
      {activeTab === 'assignments' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#130C76]">Client Assessment Submissions</h2>
                <p className="text-xs text-gray-500 mt-1">Monitor psychometric outcomes (DASS-21, GAD-7, Intakes) assigned to your clients with deadlines.</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-[#F96100] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#d65300] transition-colors"
              >
                + Assign New Screener
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">Client</th>
                    <th className="pb-3 font-bold">Screener Form</th>
                    <th className="pb-3 font-bold">Deadline</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold">Clinical Severity / Scores</th>
                    <th className="pb-3 font-bold">Completed At</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((asg) => {
                    const isDone = asg.status === 'completed';
                    const isOverdue = !isDone && new Date(asg.deadline) < new Date();
                    return (
                      <tr key={asg.id} className="hover:bg-gray-50/60">
                        <td className="py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-gray-900">{asg.client_name}</span>
                            {asg.is_demo && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                Demo
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 block mt-0.5">{asg.client_email}</span>
                        </td>
                        <td className="py-4 font-bold text-[#130C76]">
                          {asg.form?.title || 'Assessment'}
                        </td>
                        <td className="py-4 text-gray-600 font-semibold">
                          {new Date(asg.deadline).toLocaleDateString('en-AU')}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone 
                              ? 'bg-green-100 text-green-700' 
                              : isOverdue 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isDone ? 'Completed' : isOverdue ? 'Overdue' : 'Assigned'}
                          </span>
                        </td>
                        <td className="py-4">
                          {asg.clinical_severity ? (
                            <span className={`font-bold px-2.5 py-1 rounded-lg border text-[11px] inline-flex items-center gap-1 ${
                              asg.clinical_severity.includes('URGENT') || asg.clinical_severity.includes('Suicide')
                                ? 'bg-red-100 text-red-900 border-red-300 animate-pulse'
                                : asg.clinical_severity.includes('Severe') || asg.clinical_severity.includes('Probable PTSD') || asg.clinical_severity.includes('Very High') || asg.clinical_severity.includes('High Substance')
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : asg.clinical_severity.includes('Moderate') || asg.clinical_severity.includes('Significant') || asg.clinical_severity.includes('ADHD Indicated')
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-green-50 text-green-800 border-green-200'
                            }`}>
                              {(asg.clinical_severity.includes('URGENT') || asg.clinical_severity.includes('Suicide')) && (
                                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              )}
                              <span>{asg.clinical_severity}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pending client submission</span>
                          )}
                        </td>
                        <td className="py-4 text-gray-500">
                          {asg.completed_at ? new Date(asg.completed_at).toLocaleDateString('en-AU') : '—'}
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/screeners/${asg.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 bg-white border border-[#E5DFD5] hover:border-[#F96100] text-[#130C76] px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3 text-[#F96100]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FORMS & SCREENER BUILDER */}
      {activeTab === 'forms' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-[#130C76]">Clinical Assessment Library</h2>
                  <span className="bg-[#130C76]/10 text-[#130C76] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {forms.length} Standardized Scales & Intakes
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Validated psychometric instruments grounded in scientific literature (NovoPsych Assessment Library) + Luke&apos;s somatic movement protocols.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setEditingFormId(null);
                    setFormTitle('');
                    setFormSlug('');
                    setFormDescription('');
                    setFormQuestions([{ id: 'q1', text: '', type: 'scale_0_3' }]);
                    setIsFormModalOpen(true);
                  }}
                  className="bg-[#130C76] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0038A8] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FFAC24]" /> Custom Form
                </button>
              </div>
            </div>

            {/* Category Filter Tabs & Search Bar */}
            <div className="pt-6 pb-2 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {CATEGORY_TABS.map((cat) => {
                    const count = cat === 'All' 
                      ? forms.length 
                      : forms.filter(f => f.category === cat).length;
                    const isActive = selectedCategoryTab === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryTab(cat)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#130C76] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Search */}
                <div className="relative w-full sm:w-72 shrink-0">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formSearchQuery}
                    onChange={(e) => setFormSearchQuery(e.target.value)}
                    placeholder="Search PHQ, K10, PCL, ADHD..."
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#F96100] bg-gray-50/50"
                  />
                  {formSearchQuery && (
                    <button
                      onClick={() => setFormSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            {(() => {
              const filteredForms = forms.filter((form) => {
                const matchesCategory = selectedCategoryTab === 'All' || form.category === selectedCategoryTab;
                const matchesSearch = 
                  form.title.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
                  form.description.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
                  form.slug.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
                  (form.questions && form.questions.some(q => q.text.toLowerCase().includes(formSearchQuery.toLowerCase())));
                return matchesCategory && matchesSearch;
              });

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {filteredForms.map((form) => (
                      <div key={form.id} className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] flex flex-col justify-between hover:border-[#130C76]/30 transition-all shadow-2xs">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-white border border-[#E5DFD5] text-[#130C76] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                              {form.category}
                            </span>
                            {form.is_template ? (
                              <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.2 rounded-full font-bold">
                                Validated Norms
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-bold">Custom Form</span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-base text-[#130C76] mb-1.5">{form.title}</h3>
                          <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">{form.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold">
                            <span>{form.questions?.length || 0} Questions configured</span>
                            <span>•</span>
                            <span className="font-mono text-gray-400">/{form.slug}</span>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewingForm(form)}
                              className="text-xs font-bold text-gray-600 hover:text-[#130C76] p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Preview Questions"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingFormId(form.id);
                                setFormTitle(form.title);
                                setFormSlug(form.slug);
                                setFormCategory(form.category);
                                setFormDescription(form.description);
                                setFormQuestions(form.questions || []);
                                setIsFormModalOpen(true);
                              }}
                              className="text-xs font-bold text-[#130C76] hover:text-[#F96100] p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit Form"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setAssignFormId(form.id);
                              setIsAssignModalOpen(true);
                            }}
                            className="text-xs bg-[#F96100] hover:bg-[#d65300] text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer hover:scale-105"
                          >
                            Assign to Client
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredForms.length === 0 && (
                    <div className="py-16 text-center text-gray-500">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">No assessments match your category or search.</p>
                      <button
                        onClick={() => { setSelectedCategoryTab('All'); setFormSearchQuery(''); }}
                        className="mt-2 text-xs font-bold text-[#F96100] hover:underline cursor-pointer"
                      >
                        Clear filters & show all assessments
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SOAP CLINICAL NOTES */}
      {activeTab === 'notes' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-extrabold text-[#130C76] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#F96100]" />
                  SOAP Progress Notes (Encrypted Clinical Record)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Protected under PACFA Code of Ethics and Australian Privacy Principles. Raw clinical notes are never exposed to clients.
                </p>
              </div>

              {noteSavedFeedback && (
                <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Note Saved Successfully!
                </div>
              )}
            </div>

            {/* Select Appointment for Note */}
            <div className="my-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Client Session:
              </label>
              <select
                value={selectedApptForNote?.id || ''}
                onChange={(e) => {
                  const found = appointments.find((a) => a.id === e.target.value);
                  setSelectedApptForNote(found || null);
                }}
                className="w-full sm:w-96 px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
              >
                <option value="">-- Choose Appointment --</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.client_name} ({new Date(a.scheduled_at).toLocaleDateString('en-AU')}) - {a.service?.title}
                  </option>
                ))}
              </select>
            </div>

            {/* SOAP Grid */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#130C76] uppercase tracking-wider mb-1">
                  S — Subjective (Client narrative, chief complaints, reported mood & tension)
                </label>
                <textarea
                  rows={3}
                  value={noteSubjective}
                  onChange={(e) => setNoteSubjective(e.target.value)}
                  placeholder="Client reports feeling overwhelmed with work load; difficulty falling asleep..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#130C76] uppercase tracking-wider mb-1">
                  O — Objective (Clinician observations, somatic tension signs, affect, DASS-21 score)
                </label>
                <textarea
                  rows={3}
                  value={noteObjective}
                  onChange={(e) => setNoteObjective(e.target.value)}
                  placeholder="Flat affect, shallow clavicular breathing, DASS-21 Anxiety score 18 (Severe)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#130C76] uppercase tracking-wider mb-1">
                  A — Assessment (Clinical conceptualization, progress toward somatic-cognitive goals)
                </label>
                <textarea
                  rows={3}
                  value={noteAssessment}
                  onChange={(e) => setNoteAssessment(e.target.value)}
                  placeholder="Sympathetic hyperarousal driven by work stress; somatic box-breathing produced immediate heart rate deceleration..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#130C76] uppercase tracking-wider mb-1">
                  P — Plan (Interventions, somatic homework, next consultation time)
                </label>
                <textarea
                  rows={3}
                  value={notePlan}
                  onChange={(e) => setNotePlan(e.target.value)}
                  placeholder="Prescribed 10-minute daily morning brisk walk + vagal breathwork. Assigned DASS-21 reassessment for next session."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                ></textarea>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 mt-6 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" /> Sydney ap-southeast-2 data residency
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveNote(false)}
                  disabled={isNoteSaving}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
                >
                  Save Draft Note
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveNote(true)}
                  disabled={isNoteSaving}
                  className="bg-[#130C76] hover:bg-[#0038A8] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#FFAC24]" /> Finalise & Lock Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORM BUILDER / EDITOR */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-xl text-[#130C76]">
                {editingFormId ? 'Edit Clinical Assessment' : 'Create New Assessment / Screener'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Form Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 2-Week Somatic Tension Log"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                  >
                    <option value="screener">Psychometric Screener</option>
                    <option value="intake">Client Intake Questionnaire</option>
                    <option value="somatic">Somatic & Movement Protocol</option>
                    <option value="custom">Custom Clinical Form</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">URL Identifier (Slug)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. somatic-tension-log"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Instructions for Client</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Instructions for how the client should fill this out..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                ></textarea>
              </div>

              {/* Questions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Configured Questions</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormQuestions([
                        ...formQuestions,
                        { id: `q${formQuestions.length + 1}`, text: '', type: 'scale_0_3' }
                      ]);
                    }}
                    className="text-xs font-bold text-[#F96100] hover:text-[#d65300]"
                  >
                    + Add Question
                  </button>
                </div>

                {formQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formQuestions.filter((_, i) => i !== idx);
                          setFormQuestions(updated);
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={q.text}
                      onChange={(e) => {
                        const updated = [...formQuestions];
                        updated[idx].text = e.target.value;
                        setFormQuestions(updated);
                      }}
                      placeholder="Question prompt..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    />
                    <div className="flex items-center gap-4 text-xs">
                      <label className="text-gray-500">Type:</label>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const updated = [...formQuestions];
                          updated[idx].type = e.target.value;
                          setFormQuestions(updated);
                        }}
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="scale_0_3">4-Point Scale (0 to 3)</option>
                        <option value="text">Long Text Response</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#F96100] hover:bg-[#d65300] text-white px-6 py-2 rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Form to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN FORM TO CLIENT */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-[#130C76]">Assign Screener to Client</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignForm} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Select Form / Screener *</label>
                <select
                  value={assignFormId}
                  onChange={(e) => setAssignFormId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-[#130C76] focus:outline-hidden"
                >
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={assignClientName}
                  onChange={(e) => setAssignClientName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Client Email Address *</label>
                <input
                  type="email"
                  required
                  value={assignClientEmail}
                  onChange={(e) => setAssignClientEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Submission Deadline *</label>
                <input
                  type="date"
                  required
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Client will see a due-date countdown in their portal.</p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#F96100] hover:bg-[#d65300] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Send Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW ASSESSMENT */}
      {previewingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div>
                <span className="text-[10px] font-extrabold text-[#F96100] uppercase tracking-wider block">Assessment Preview</span>
                <h3 className="font-extrabold text-xl text-[#130C76]">{previewingForm.title}</h3>
                <span className="text-xs text-gray-500 font-semibold">{previewingForm.questions?.length || 0} Questions configured • Category: {previewingForm.category}</span>
              </div>
              <button onClick={() => setPreviewingForm(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <div className="overflow-y-auto py-6 space-y-4 flex-1 pr-2">
              <p className="text-xs text-gray-600 italic bg-gray-50 p-3 rounded-xl border border-gray-200">{previewingForm.description}</p>
              {previewingForm.questions?.map((q, idx) => (
                <div key={q.id || idx} className="p-3.5 bg-[#FBF9F5] rounded-xl border border-[#E5DFD5] space-y-1 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E5DFD5] text-[#130C76] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{q.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>Scale Type: <strong className="text-gray-600">{q.type}</strong></span>
                        {q.scale && <span>• Axis: <strong className="text-gray-600">{q.scale}</strong></span>}
                        {q.critical_alert && <span className="bg-red-100 text-red-800 px-1.5 py-0.2 rounded-full font-bold">Safety Alert Item</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-400">NovoPsych Validated Standardized Scale</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewingForm(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignFormId(previewingForm.id);
                    setPreviewingForm(null);
                    setIsAssignModalOpen(true);
                  }}
                  className="bg-[#F96100] hover:bg-[#d65300] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Assign This Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
