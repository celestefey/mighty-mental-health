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
  ShieldAlert,
  UserCheck,
  Printer,
  Copy,
  Check,
  FileDown,
  Stethoscope,
  ChevronRight,
  MessageSquare,
  HeartHandshake,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHAppointment, MMHForm, MMHFormAssignment, MMHClinicalNote, MMHClientIntake, ClinicalTemplateType } from '@/lib/types';
import { CLINICAL_TEMPLATES, generateGpLetter } from '@/lib/clinicalTemplates';
import ClientChartDossier from '@/components/admin/ClientChartDossier';
import Link from 'next/link';
import { useMemo } from 'react';

const CATEGORY_TABS = [
  'All',
  'Mood & Depression',
  'Anxiety & Trauma',
  'ADHD & Neurodiversity',
  'Sleep & Somatics',
  'Substance & Well-being',
];

export default function ClinicianAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'clients' | 'forms' | 'assignments' | 'intakes' | 'notes'>('schedule');
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
  const [clientDossierInitialTab, setClientDossierInitialTab] = useState<'movement' | 'psychometrics' | 'notes' | 'forms' | 'appointments' | 'medical'>('movement');
  
  // Data states
  const [appointments, setAppointments] = useState<MMHAppointment[]>([]);
  const [forms, setForms] = useState<MMHForm[]>([]);
  const [assignments, setAssignments] = useState<MMHFormAssignment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<MMHClinicalNote[]>([]);
  const [intakes, setIntakes] = useState<MMHClientIntake[]>([]);
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

  // Client Intake Modal state
  const [selectedIntake, setSelectedIntake] = useState<MMHClientIntake | null>(null);

  // Addenda State (PACFA append-only legal amendments)
  const [selectedNoteForAddendum, setSelectedNoteForAddendum] = useState<MMHClinicalNote | null>(null);
  const [addendumText, setAddendumText] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('Clarification of clinical details');
  const [isSavingAddendum, setIsSavingAddendum] = useState(false);
  const [addendumError, setAddendumError] = useState<string | null>(null);

  // Clinical Notes & GP Letters state
  const [selectedApptForNote, setSelectedApptForNote] = useState<MMHAppointment | null>(null);
  const [selectedNoteTemplate, setSelectedNoteTemplate] = useState<ClinicalTemplateType>('SOAP');
  const [noteSubjective, setNoteSubjective] = useState('');
  const [noteObjective, setNoteObjective] = useState('');
  const [noteAssessment, setNoteAssessment] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [injectFeedback, setInjectFeedback] = useState<string | null>(null);

  // Dedicated GP Letter Builder state
  const [gpClientName, setGpClientName] = useState('');
  const [gpClientDob, setGpClientDob] = useState('');
  const [gpName, setGpName] = useState('');
  const [gpClinic, setGpClinic] = useState('');
  const [gpAddress, setGpAddress] = useState('');
  const [gpSessionsCompleted, setGpSessionsCompleted] = useState(1);
  const [gpTotalSessionsAllowed, setGpTotalSessionsAllowed] = useState(6);
  const [gpTherapyFocus, setGpTherapyFocus] = useState('Cognitive-emotional processing, autonomic nervous system down-regulation, vagal breathing, and progressive movement protocols.');
  const [gpClinicalSummary, setGpClinicalSummary] = useState('');
  const [gpRecommendation, setGpRecommendation] = useState('');
  const [gpLetterOutput, setGpLetterOutput] = useState('');
  const [gpCopySuccess, setGpCopySuccess] = useState(false);
  const [noteCopySuccess, setNoteCopySuccess] = useState(false);

  // Sandbox & Demo States
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [isPurgingDemo, setIsPurgingDemo] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Authentication states (Supabase Auth - Option B)
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('luke@mightymentalhealth.com.au');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMagicSent, setAuthMagicSent] = useState(false);

  const isClinicianEmail = (email?: string | null) => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower === 'luke@mightymentalhealth.com.au' || lower === 'lukepiatti@gmail.com';
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          const email = existingSession.user?.email;
          const role = existingSession.user?.user_metadata?.role;
          if (isClinicianEmail(email) || role === 'clinician') {
            setSession(existingSession);
            loadAllAdminData();
          } else {
            await supabase.auth.signOut();
            setSession(null);
            setAuthError('Access Denied: Restricted to Luke Piatti (PACFA Reg. #28941). You are signed in with an unauthorized account.');
          }
        } else {
          setSession(null);
        }
      } catch (err) {
        console.warn('Auth check notice:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (currentSession) {
        const email = currentSession.user?.email;
        const role = currentSession.user?.user_metadata?.role;
        if (isClinicianEmail(email) || role === 'clinician') {
          setSession(currentSession);
          loadAllAdminData();
        } else {
          await supabase.auth.signOut();
          setSession(null);
          setAuthError('Access Denied: Restricted to Luke Piatti (PACFA Reg. #28941).');
        }
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handlePasswordLogin(e: React.FormEvent) {
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
        const email = data.session?.user?.email;
        const role = data.session?.user?.user_metadata?.role;
        if (isClinicianEmail(email) || role === 'clinician') {
          setSession(data.session);
          loadAllAdminData();
        } else {
          await supabase.auth.signOut();
          setSession(null);
          setAuthError('Access Denied: Account is not authorized as practice clinician.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
        },
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthMagicSent(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Magic link request error');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function loadAllAdminData() {
    setLoading(true);
    const [apptsRes, formsRes, assignRes, notesRes, intakesRes] = await Promise.all([
      supabase.from('mmh_appointments').select('*, service:mmh_services(*)').order('scheduled_at', { ascending: false }),
      supabase.from('mmh_forms').select('*').order('created_at', { ascending: true }),
      supabase.from('mmh_form_assignments').select('*, form:mmh_forms(*)').order('created_at', { ascending: false }),
      supabase.from('mmh_clinical_notes').select('*, addenda:mmh_clinical_note_addenda(*)').order('created_at', { ascending: false }),
      supabase.from('mmh_client_intakes').select('*').order('created_at', { ascending: false }),
    ]);

    if (apptsRes.data) setAppointments(apptsRes.data as MMHAppointment[]);
    if (formsRes.data) {
      setForms(formsRes.data as MMHForm[]);
      if (formsRes.data.length > 0) setAssignFormId(formsRes.data[0].id);
    }
    if (assignRes.data) setAssignments(assignRes.data as MMHFormAssignment[]);
    if (notesRes.data) setClinicalNotes(notesRes.data as MMHClinicalNote[]);
    if (intakesRes.data) setIntakes(intakesRes.data as MMHClientIntake[]);
    setLoading(false);
  }

  // Handle Legal Addendum Submission (PACFA Compliant append-only)
  async function handleSaveAddendum(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNoteForAddendum || !addendumText.trim()) return;
    setIsSavingAddendum(true);
    setAddendumError(null);
    try {
      const { error } = await supabase.from('mmh_clinical_note_addenda').insert({
        note_id: selectedNoteForAddendum.id,
        addendum_text: addendumText.trim(),
        reason_for_amendment: amendmentReason,
      });
      if (error) {
        setAddendumError(error.message);
      } else {
        setSelectedNoteForAddendum(null);
        setAddendumText('');
        setAmendmentReason('Clarification of clinical details');
        await loadAllAdminData();
      }
    } catch (err: any) {
      setAddendumError(err.message || 'Failed to attach legal addendum.');
    } finally {
      setIsSavingAddendum(false);
    }
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

  // Handle Save Clinical Note / GP Letter
  async function handleSaveNote(lock: boolean = false) {
    const clientName = selectedApptForNote?.client_name || gpClientName;
    const clientEmail = selectedApptForNote?.client_email || 'client@example.com';
    if (!clientName) {
      alert('Please select an appointment or enter a client name.');
      return;
    }
    setIsNoteSaving(true);

    const isGp = selectedNoteTemplate === 'gp-first-session' || selectedNoteTemplate === 'gp-progress-update';

    await supabase.from('mmh_clinical_notes').insert({
      appointment_id: selectedApptForNote?.id || null,
      client_name: clientName,
      client_email: clientEmail,
      note_type: isGp ? 'template' : 'SOAP',
      template_type: selectedNoteTemplate,
      subjective: noteSubjective,
      objective: noteObjective,
      assessment: noteAssessment,
      plan: notePlan,
      gp_letter_text: isGp ? gpLetterOutput : null,
      is_locked: lock,
      locked_at: lock ? new Date().toISOString() : null,
    });

    setIsNoteSaving(false);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 3000);
    loadAllAdminData();
  }

  // Handle switching clinical note / GP letter template
  function handleSelectTemplate(tmplType: ClinicalTemplateType) {
    setSelectedNoteTemplate(tmplType);
    const def = CLINICAL_TEMPLATES[tmplType];
    if (!def) return;

    if (tmplType === 'gp-first-session' || tmplType === 'gp-progress-update') {
      const clientName = selectedApptForNote?.client_name || gpClientName || 'Sarah Jenkins';
      setGpClientName(clientName);
      
      // Auto-fill from intake if matching
      const matchingIntake = intakes.find(i => i.client_name.toLowerCase() === clientName.toLowerCase());
      if (matchingIntake) {
        if (matchingIntake.gp_name) setGpName(matchingIntake.gp_name);
        if (matchingIntake.gp_clinic) setGpClinic(matchingIntake.gp_clinic);
        if (matchingIntake.gp_address) setGpAddress(matchingIntake.gp_address);
        if (matchingIntake.date_of_birth) setGpClientDob(matchingIntake.date_of_birth);
      } else {
        if (!gpName) setGpName('Dr. Andrew Collins');
        if (!gpClinic) setGpClinic('Logan Central Medical Clinic');
        if (!gpAddress) setGpAddress('Shop 4, 12 Wembley Rd, Logan Central QLD 4114');
        if (!gpClientDob) setGpClientDob('1992-06-14');
      }

      const letter = generateGpLetter({
        templateType: tmplType,
        clientName: clientName,
        clientDob: gpClientDob || '1992-06-14',
        gpName: gpName || 'Dr. Andrew Collins',
        gpClinic: gpClinic || 'Logan Central Medical Clinic',
        gpAddress: gpAddress || 'Shop 4, 12 Wembley Rd, Logan Central QLD 4114',
        sessionsCompleted: gpSessionsCompleted,
        totalSessionsAllowed: gpTotalSessionsAllowed,
        therapyFocus: gpTherapyFocus,
        clinicalSummary: gpClinicalSummary,
        recommendation: gpRecommendation,
      });
      setGpLetterOutput(letter);
    } else {
      if (noteSubjective || noteObjective || noteAssessment || notePlan) {
        if (window.confirm(`Load default clinical scaffold for "${def.title}"? This will populate the fields with the standard template layout.`)) {
          setNoteSubjective(def.defaultSubjective);
          setNoteObjective(def.defaultObjective);
          setNoteAssessment(def.defaultAssessment);
          setNotePlan(def.defaultPlan);
        }
      } else {
        setNoteSubjective(def.defaultSubjective);
        setNoteObjective(def.defaultObjective);
        setNoteAssessment(def.defaultAssessment);
        setNotePlan(def.defaultPlan);
      }
    }
  }

  // 1-Click Inject Recent Client Assessment Scores into Note Objective field
  function handleInjectScoresIntoNote() {
    const clientEmail = selectedApptForNote?.client_email;
    const clientName = selectedApptForNote?.client_name || gpClientName;
    
    // Find completed assignments for this client
    const clientAssignments = assignments.filter(
      a => a.status === 'completed' && (
        (clientEmail && a.client_email.toLowerCase() === clientEmail.toLowerCase()) ||
        (clientName && a.client_name.toLowerCase() === clientName.toLowerCase())
      )
    );

    if (clientAssignments.length === 0) {
      setInjectFeedback('No completed assessments found for this client yet.');
      setTimeout(() => setInjectFeedback(null), 3000);
      return;
    }

    const latest = clientAssignments[0];
    const scores = latest.score_summary || {};
    let scoreLines = `\n\n--- PSYCHOMETRIC OUTCOME MEASURE (${latest.form?.title || 'NovoPsych Scale'}) ---\n`;
    scoreLines += `Completed: ${new Date(latest.completed_at || latest.created_at).toLocaleDateString('en-AU')}\n`;
    if (scores.total_score !== undefined) scoreLines += `Total Score: ${scores.total_score}\n`;
    if (scores.depression !== undefined) scoreLines += `DASS-21 Depression: ${scores.depression}\n`;
    if (scores.anxiety !== undefined) scoreLines += `DASS-21 Anxiety: ${scores.anxiety}\n`;
    if (scores.stress !== undefined) scoreLines += `DASS-21 Stress: ${scores.stress}\n`;
    if (latest.clinical_severity) scoreLines += `Clinical Classification: ${latest.clinical_severity}\n`;
    scoreLines += `------------------------------------------------------------\n`;

    setNoteObjective(prev => prev + scoreLines);
    setInjectFeedback(`Injected ${latest.form?.title} scores into Objective!`);
    setTimeout(() => setInjectFeedback(null), 3000);
  }

  // Generate / Refresh GP Letter
  function handleGenerateGpLetter() {
    const isFirst = selectedNoteTemplate === 'gp-first-session';
    const letter = generateGpLetter({
      templateType: isFirst ? 'gp-first-session' : 'gp-progress-update',
      clientName: gpClientName || selectedApptForNote?.client_name || 'Client',
      clientDob: gpClientDob,
      gpName: gpName,
      gpClinic: gpClinic,
      gpAddress: gpAddress,
      sessionsCompleted: gpSessionsCompleted,
      totalSessionsAllowed: gpTotalSessionsAllowed,
      therapyFocus: gpTherapyFocus,
      clinicalSummary: gpClinicalSummary,
      recommendation: gpRecommendation,
    });
    setGpLetterOutput(letter);
  }

  // Copy GP Letter to Clipboard
  function handleCopyGpLetter() {
    if (!gpLetterOutput) return;
    navigator.clipboard.writeText(gpLetterOutput);
    setGpCopySuccess(true);
    setTimeout(() => setGpCopySuccess(false), 2500);
  }

  function escapeHtml(str: string | number | undefined | null): string {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Print GP Letter with full RACGP & PACFA Australian Medical Letterhead
  function handlePrintGpLetter() {
    if (!gpLetterOutput) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const patientName = escapeHtml(gpClientName || selectedApptForNote?.client_name || 'Patient');
    const patientDob = escapeHtml(gpClientDob || 'On file');
    const doctorName = escapeHtml(gpName || 'Referring General Practitioner');
    const clinicName = escapeHtml(gpClinic || 'General Practice Clinic');
    const clinicAddress = escapeHtml(gpAddress || 'Logan, Queensland');
    const currentDate = escapeHtml(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }));
    const safeLetterOutput = escapeHtml(gpLetterOutput);
    const safeCompleted = escapeHtml(gpSessionsCompleted);
    const safeTotal = escapeHtml(gpTotalSessionsAllowed);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>GP Medical Correspondence - Mighty Mental Health</title>
          <style>
            @page {
              size: A4;
              margin: 15mm 20mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111827;
              background: #fff;
              line-height: 1.5;
              font-size: 10pt;
              margin: 0;
              padding: 24px;
            }
            .header-banner {
              border-bottom: 3px solid #130C76;
              padding-bottom: 12px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .clinic-brand h1 {
              font-size: 17pt;
              font-weight: 800;
              color: #130C76;
              margin: 0 0 3px 0;
              letter-spacing: -0.5px;
            }
            .clinic-brand .tagline {
              font-size: 8.5pt;
              font-weight: 700;
              color: #BA3D00;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .clinic-brand .credentials {
              font-size: 8.5pt;
              color: #4B5563;
              font-weight: 600;
              margin-top: 3px;
            }
            .clinic-meta {
              text-align: right;
              font-size: 8pt;
              color: #4B5563;
              line-height: 1.45;
            }
            .clinic-meta strong {
              color: #111827;
            }
            .doc-title-bar {
              background: #F3F4F6;
              border-left: 4px solid #130C76;
              padding: 6px 12px;
              font-size: 8.5pt;
              font-weight: 800;
              color: #130C76;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              padding: 12px 14px;
              margin-bottom: 20px;
              font-size: 8.5pt;
            }
            .meta-block h4 {
              margin: 0 0 6px 0;
              font-size: 8pt;
              font-weight: 800;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-row {
              margin-bottom: 3px;
              display: flex;
            }
            .meta-label {
              width: 115px;
              font-weight: 600;
              color: #4B5563;
            }
            .meta-value {
              font-weight: 700;
              color: #111827;
            }
            .letter-content {
              line-height: 1.6;
              font-size: 9.5pt;
              color: #1F2937;
              white-space: pre-wrap;
              font-family: inherit;
              padding: 4px 0;
            }
            .signature-block {
              margin-top: 24px;
              padding-top: 14px;
              border-top: 1px solid #E5E7EB;
              page-break-inside: avoid;
            }
            .sig-name {
              font-size: 10.5pt;
              font-weight: 800;
              color: #130C76;
            }
            .sig-title {
              font-size: 8.5pt;
              color: #4B5563;
              line-height: 1.4;
            }
            .sig-credential {
              font-size: 8.5pt;
              font-weight: 700;
              color: #BA3D00;
              margin-top: 2px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="clinic-brand">
              <h1>MIGHTY MENTAL HEALTH</h1>
              <div class="tagline">Exercise-Integrated Psychotherapy & Clinical Counselling</div>
              <div class="credentials">Luke Piatti | MCouns (UQ) | PACFA Reg. Clinical Counsellor #28941</div>
            </div>
            <div class="clinic-meta">
              <div><strong>Clinic Base:</strong> Logan Central, QLD 4114</div>
              <div><strong>Modality:</strong> Encrypted Telehealth Australia-Wide</div>
              <div><strong>Clinical Email:</strong> luke@mightymentalhealth.com.au</div>
              <div><strong>Web:</strong> https://mighty-mental-health.vercel.app</div>
            </div>
          </div>

          <div class="doc-title-bar">
            <span>Confidential Medical Correspondence — RACGP / PACFA Standards</span>
            <span>Date: ${currentDate}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-block">
              <h4>Patient Demographics</h4>
              <div class="meta-row"><span class="meta-label">Patient Name:</span><span class="meta-value">${patientName}</span></div>
              <div class="meta-row"><span class="meta-label">Date of Birth:</span><span class="meta-value">${patientDob}</span></div>
              <div class="meta-row"><span class="meta-label">Referral Type:</span><span class="meta-value">General Practitioner / Allied Health Clinical Referral</span></div>
              <div class="meta-row"><span class="meta-label">Sessions Completed:</span><span class="meta-value">${safeCompleted} of ${safeTotal} Authorised</span></div>
            </div>
            <div class="meta-block">
              <h4>Referring General Practitioner</h4>
              <div class="meta-row"><span class="meta-label">Doctor Name:</span><span class="meta-value">${doctorName}</span></div>
              <div class="meta-row"><span class="meta-label">Medical Practice:</span><span class="meta-value">${clinicName}</span></div>
              <div class="meta-row"><span class="meta-label">Clinic Address:</span><span class="meta-value">${clinicAddress}</span></div>
              <div class="meta-row"><span class="meta-label">Provider Status:</span><span class="meta-value">Allied Health Progress Correspondence</span></div>
            </div>
          </div>

          <div class="letter-content">${safeLetterOutput}</div>

          <div class="signature-block">
            <div class="sig-name">Luke Piatti (MCouns, UQ)</div>
            <div class="sig-title">Master of Counselling (University of Queensland)</div>
            <div class="sig-title">Exercise-Integrated Counsellor & Clinical Director</div>
            <div class="sig-credential">PACFA Registered Clinical Counsellor #28941</div>
            <div style="font-size: 7.5pt; color: #9CA3AF; margin-top: 4px;">Mighty Mental Health — Logan, QLD // Verified Digital Record under Australian Privacy Principles</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  // Unique Clients Count for Tab Counter
  const uniqueClientsCount = useMemo(() => {
    const emails = new Set<string>();
    intakes.forEach(i => i.client_email && emails.add(i.client_email.toLowerCase().trim()));
    appointments.forEach(a => a.client_email && emails.add(a.client_email.toLowerCase().trim()));
    assignments.forEach(as => as.client_email && emails.add(as.client_email.toLowerCase().trim()));
    clinicalNotes.forEach(n => n.client_email && emails.add(n.client_email.toLowerCase().trim()));
    return emails.size;
  }, [intakes, appointments, assignments, clinicalNotes]);

  // Open 360° Client Chart & Dossier
  function handleOpenClientChart(clientEmail: string, tab: 'movement' | 'psychometrics' | 'notes' | 'forms' | 'appointments' | 'medical' = 'movement') {
    setSelectedClientEmail(clientEmail.toLowerCase());
    setClientDossierInitialTab(tab);
    setActiveTab('clients');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Draft Note for Client from Dossier
  function handleDraftNoteForClient(client: { name: string; email: string; apptId?: string }) {
    const matchingAppt = appointments.find(a => a.client_email?.toLowerCase() === client.email.toLowerCase());
    if (matchingAppt) {
      setSelectedApptForNote(matchingAppt);
    }
    setGpClientName(client.name);
    const matchingIntake = intakes.find(i => i.client_email?.toLowerCase() === client.email.toLowerCase());
    if (matchingIntake) {
      if (matchingIntake.gp_name) setGpName(matchingIntake.gp_name);
      if (matchingIntake.gp_clinic) setGpClinic(matchingIntake.gp_clinic);
      if (matchingIntake.gp_address) setGpAddress(matchingIntake.gp_address);
      if (matchingIntake.date_of_birth) setGpClientDob(matchingIntake.date_of_birth);
    }
    setSelectedNoteTemplate('SOAP');
    setActiveTab('notes');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Generate GP Letter for Client from Dossier
  function handleGenerateGpLetterForClient(client: { name: string; email: string; dob?: string; gp?: any }) {
    setGpClientName(client.name);
    if (client.dob) setGpClientDob(client.dob);
    if (client.gp?.name) setGpName(client.gp.name);
    if (client.gp?.clinic) setGpClinic(client.gp.clinic);
    if (client.gp?.address) setGpAddress(client.gp.address);
    setSelectedNoteTemplate('gp-progress-update');
    setActiveTab('notes');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Assign Screener for Client from Dossier
  function handleAssignFormForClient(client: { name: string; email: string }) {
    setAssignClientName(client.name);
    setAssignClientEmail(client.email);
    if (forms.length > 0 && !assignFormId) {
      setAssignFormId(forms[0].id);
    }
    setIsAssignModalOpen(true);
  }

  // Transfer Intake details into First Session Clinical Note
  function handleTransferIntakeToNote(intake: MMHClientIntake) {
    setActiveTab('notes');
    setSelectedNoteTemplate('first-session');
    
    // Match appointment if exists
    const matchingAppt = appointments.find(a => a.client_email?.toLowerCase() === intake.client_email.toLowerCase());
    if (matchingAppt) setSelectedApptForNote(matchingAppt);

    const tensionList = intake.somatic_movement_profile?.tension_areas?.join(', ') || 'None specified';
    const subj = `1. Referral & Presenting Concerns:
${intake.presenting_concerns || 'Client attended initial consultation.'}

2. Biopsychosocial History & Medical:
- Medications: ${intake.medications || 'Nil'}
- Medical History: ${intake.medical_history || 'Nil'}
- Psychiatric History: ${intake.psychiatric_history || 'Nil'}
- Referring GP: ${intake.gp_name || 'Self-referred'} (${intake.gp_clinic || 'N/A'})

3. Client Stated Therapy Goals:
${intake.therapy_goals || 'Down-regulation of nervous system, somatic integration.'}`;

    const obj = `1. Mental Status Examination (MSE):
- General: Client attended prompt and engaged.
- Somatic Baseline:
  * Primary tension areas: ${tensionList}
  * Movement frequency: ${intake.somatic_movement_profile?.movement_frequency || 'Sedentary'}
  * Sleep pattern: ${intake.somatic_movement_profile?.sleep_quality || 'Fragmented'}
  * Acute autonomic arousal: ${intake.somatic_movement_profile?.panic_fight_flight_symptoms || 'None'}

2. Psychometric Screener Baseline:
[Click "⚡ Inject Latest Client Scores" to insert DASS-21, K10 or PHQ-9]`;

    const assess = `1. Clinical Formulation:
Initial presentation consistent with autonomic nervous system dysregulation secondary to chronic stressors.

2. Safety Risk Assessment (From Intake Screener):
${intake.safety_risk_history || 'No acute suicidal ideation, plan, or intent reported.'}
Protective factors identified; safe for outpatient psychotherapy & somatic movement.`;

    const plan = `1. Modality: Integrated PACFA Counselling + Somatic Movement Therapy (6-session initial plan).
2. Somatic Homework: Daily diaphragmatic vagal breath pacing (5 mins 2x/day).
3. GP Liaison: Provide formal first session summary to ${intake.gp_name || 'referring practitioner'}.`;

    setNoteSubjective(subj);
    setNoteObjective(obj);
    setNoteAssessment(assess);
    setNotePlan(plan);
    setSelectedIntake(null);
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
        supabase.from('mmh_client_intakes').delete().eq('is_demo', true),
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

      // 2. Insert Client Intakes (Sarah Jenkins & David Chen)
      await supabase.from('mmh_client_intakes').insert([
        {
          client_name: 'Sarah Jenkins',
          client_email: 'sarah.jenkins@example.com',
          client_phone: '0412 345 678',
          date_of_birth: '1992-06-14',
          address: '14 Jacaranda Ave, Logan Central QLD 4114',
          emergency_contact_name: 'Mark Jenkins',
          emergency_contact_phone: '0412 999 888',
          emergency_contact_relationship: 'Spouse',
          gp_name: 'Dr. Andrew Collins',
          gp_clinic: 'Logan Central Medical Clinic',
          gp_phone: '07 3808 1234',
          gp_address: 'Shop 4, 12 Wembley Rd, Logan Central QLD 4114',
          medications: 'Escitalopram 10mg daily (commenced 3 months ago)',
          medical_history: 'Occasional migraines, desk-work posture tension.',
          psychiatric_history: 'Previous mild generalized anxiety in 2021; nil prior hospitalisations.',
          somatic_movement_profile: {
            movement_frequency: 'Sedentary (desk work 8-10 hrs/day)',
            tension_areas: ['Neck & Upper Trapezius', 'Jaw / Clenching (TMJ)', 'Diaphragm / Shallow Breathing'],
            sleep_quality: '4-5 hrs broken sleep, wakes feeling unrefreshed with racing mind',
            panic_fight_flight_symptoms: 'Sudden chest tightness and trembling when deadlines peak',
            physical_injuries_limitations: 'Mild lower back stiffness from prolonged sitting'
          },
          presenting_concerns: 'Severe occupational burnout, continuous sympathetic nervous system arousal, inability to mentally disconnect from work responsibilities.',
          therapy_goals: 'Down-regulate physical stress responses, improve sleep architecture without increasing medication, build sustainable somatic regulation practices.',
          safety_risk_history: 'No active suicidal ideation or intent. Denies history of self-harm. Protective factors: supportive marital relationship, dog, employment security.',
          is_demo: true,
        },
        {
          client_name: 'David Chen',
          client_email: 'david.chen@example.com',
          client_phone: '0423 456 789',
          date_of_birth: '1988-11-20',
          address: 'Springwood, QLD 4127',
          emergency_contact_name: 'Eileen Chen',
          emergency_contact_phone: '0423 111 222',
          emergency_contact_relationship: 'Sister',
          gp_name: 'Dr. Michelle Tran',
          gp_clinic: 'Springwood Family Health',
          gp_phone: '07 3208 5555',
          gp_address: 'Cnr Cinderella Dr & Vanessa Blvd, Springwood QLD 4127',
          medications: 'None currently reported',
          medical_history: 'Nil significant physical medical conditions.',
          psychiatric_history: 'Nil prior psychological treatment. First time seeking therapy.',
          somatic_movement_profile: {
            movement_frequency: 'Recreational gym 2x/week, but erratic',
            tension_areas: ['Shoulders', 'Lower Back'],
            sleep_quality: 'Trouble falling asleep due to cognitive rumination',
            panic_fight_flight_symptoms: 'Occasional social anxiety trembling',
            physical_injuries_limitations: 'None'
          },
          presenting_concerns: 'Generalised anxiety and autonomic agitation impacting social and family commitments.',
          therapy_goals: 'Acquire concrete autonomic down-regulation techniques and somatic tools for nervous system balance.',
          safety_risk_history: 'No suicidal ideation, intent or self-harm history.',
          is_demo: true,
        },
        {
          client_name: 'Marcus Brody',
          client_email: 'marcus.brody@example.com',
          client_phone: '0434 567 890',
          date_of_birth: '1995-04-18',
          address: '28 Bluebell St, Underwood QLD 4119',
          emergency_contact_name: 'Chloe Brody',
          emergency_contact_phone: '0434 112 334',
          emergency_contact_relationship: 'Partner',
          gp_name: 'Dr. Katherine Bell',
          gp_clinic: 'Underwood Medical Centre',
          gp_phone: '07 3341 8888',
          gp_address: '2974 Logan Rd, Underwood QLD 4119',
          medications: 'Creatine monohydrate 5g, Whey protein; nil prescription psychoactive medication.',
          medical_history: 'Right AC joint impingement (bench press flare-up 2024), tight posterior chain.',
          psychiatric_history: 'Performance anxiety and hyperarousal around athletic competition and work performance.',
          somatic_movement_profile: {
            movement_frequency: 'Barbell strength training 4x/week (squat, bench, deadlift)',
            tension_areas: ['Upper Thoracic / Between Shoulder Blades', 'Right Anterior Shoulder (AC Joint)', 'Psoas / Hip Flexors'],
            sleep_quality: '5.5 hrs interrupted sleep, high pre-bed CNS stimulation and cortisol',
            panic_fight_flight_symptoms: 'Restless motor agitation, elevated resting heart rate post-work',
            physical_injuries_limitations: 'Right shoulder overhead press caution; needs warm-up for heavy squats'
          },
          presenting_concerns: 'High sympathetic drive interfering with nervous system recovery, athletic fatigue, sleep deficits, and perfectionism.',
          therapy_goals: 'Learn down-regulation somatic protocols post-workout, integrate cognitive processing with physical pacing, improve parasympathetic sleep rebound.',
          safety_risk_history: 'Nil suicidal ideation or intent. High athletic drive and resilience.',
          is_demo: true,
        }
      ]);

      // 3. Insert Assignments (Longitudinal Multi-Point Trajectories)
      const sarahDeadline = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
      const davidDeadline = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      const marcusDeadline = new Date(now.getTime() - 24 * 3600 * 1000).toISOString(); // Overdue!

      if (dassForm) {
        // Sarah Jenkins - Baseline DASS-21 (4 Weeks Ago)
        await supabase.from('mmh_form_assignments').insert({
          form_id: dassForm.id,
          client_name: 'Sarah Jenkins',
          client_email: 'sarah.jenkins@example.com',
          deadline: new Date(now.getTime() - 28 * 24 * 3600 * 1000).toISOString(),
          status: 'completed',
          clinical_severity: 'D: Severe (22) | A: Extremely Severe (24) | S: Extremely Severe (30)',
          score_summary: {
            depression: 22,
            anxiety: 24,
            stress: 30,
            total_score: 76,
            requiresUrgentAttention: true
          },
          completed_at: new Date(now.getTime() - 27 * 24 * 3600 * 1000).toISOString(),
          is_demo: true,
        });

        // Sarah Jenkins - Session 4 Review DASS-21 (Yesterday: Demonstrates -27% depression, -25% anxiety, -13% stress)
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
            total_score: 60,
            requiresUrgentAttention: false
          },
          completed_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
          is_demo: true,
        });
      }

      if (k10Form) {
        // David Chen - Baseline K10 (2 Weeks Ago)
        await supabase.from('mmh_form_assignments').insert({
          form_id: k10Form.id,
          client_name: 'David Chen',
          client_email: 'david.chen@example.com',
          deadline: new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString(),
          status: 'completed',
          clinical_severity: 'K10: High Distress (Score 28)',
          score_summary: {
            total_score: 28,
            distressLevel: 'High'
          },
          completed_at: new Date(now.getTime() - 13 * 24 * 3600 * 1000).toISOString(),
          is_demo: true,
        });

        // David Chen - Follow-up K10 (Yesterday: -21% Delta Improvement)
        await supabase.from('mmh_form_assignments').insert({
          form_id: k10Form.id,
          client_name: 'David Chen',
          client_email: 'david.chen@example.com',
          deadline: davidDeadline,
          status: 'completed',
          clinical_severity: 'K10: Moderate Distress (Score 22)',
          score_summary: {
            total_score: 22,
            distressLevel: 'Moderate'
          },
          completed_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
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

      if (pclForm) {
        // Marcus Brody - PCL-5 Assessment
        await supabase.from('mmh_form_assignments').insert({
          form_id: pclForm.id,
          client_name: 'Marcus Brody',
          client_email: 'marcus.brody@example.com',
          deadline: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
          status: 'completed',
          clinical_severity: 'PCL-5: Probable Clinical Hyperarousal (Score 42)',
          score_summary: {
            total_score: 42,
            probablePTSD: true
          },
          completed_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
          is_demo: true,
        });
      }

      if (aisForm) {
        // Marcus Brody - Athens Insomnia Scale
        await supabase.from('mmh_form_assignments').insert({
          form_id: aisForm.id,
          client_name: 'Marcus Brody',
          client_email: 'marcus.brody@example.com',
          deadline: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
          status: 'completed',
          clinical_severity: 'AIS: Marked Insomnia & CNS Overreach (Score 11)',
          score_summary: {
            total_score: 11,
            insomniaSeverity: 'Marked'
          },
          completed_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
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

      // 4. Insert Clinical notes & Invoices
      if (insertedAppts && insertedAppts.length > 0) {
        await supabase.from('mmh_clinical_notes').insert([
          {
            appointment_id: insertedAppts[0].id,
            client_name: 'Sarah Jenkins',
            client_email: 'sarah.jenkins@example.com',
            note_type: 'SOAP',
            template_type: 'first-session',
            subjective: 'Client presents with autonomic arousal, chronic deadline pressure, upper trapezius tightness, and fragmented sleep.',
            objective: 'Observed clavicular shallow breathing. Baseline DASS-21 Anxiety score is 24 (Extremely Severe) and Stress is 30 (Extremely Severe).',
            assessment: 'Somatic distress consistent with sympathetic nervous system overdrive.',
            plan: 'Prescribed box breathing down-regulation; vagal nerve pacing; 1-week follow up.',
            is_locked: true,
            created_at: new Date(now.getTime() - 21 * 24 * 3600 * 1000).toISOString(),
            is_demo: true,
          },
          {
            appointment_id: insertedAppts[0].id,
            client_name: 'Sarah Jenkins',
            client_email: 'sarah.jenkins@example.com',
            note_type: 'SOAP',
            template_type: 'SOAP',
            subjective: 'Session 4 Review. Reports marked reduction in chest tightness and improved work boundary enforcement.',
            objective: 'DASS-21 follow-up shows significant improvement: Depression down to 16 (-27%), Anxiety down to 18 (-25%), Stress down to 26 (-13%). Vagal breathing practiced 5x/wk.',
            assessment: 'Positive therapeutic trajectory. Sympathetic down-regulation progressing well.',
            plan: 'Continue exercise-integrated somatic grounding; maintain pacing protocol; review in 2 weeks.',
            is_locked: false,
            created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
            is_demo: true,
          },
          {
            appointment_id: insertedAppts.length > 2 ? insertedAppts[2].id : insertedAppts[0].id,
            client_name: 'Marcus Brody',
            client_email: 'marcus.brody@example.com',
            note_type: 'SOAP',
            template_type: 'first-session',
            subjective: 'Athlete presenting with pre-competition performance anxiety and elevated sympathetic activation.',
            objective: 'PCL-5 score 42. Athens Insomnia Scale 11. Right AC joint rotator cuff precaution noted.',
            assessment: 'Performance hyperarousal with central nervous system overreach.',
            plan: 'Prescribe post-workout parasympathetic breath reset; bilateral tempo pacing; avoid heavy overhead shoulder pressing until acute impingement settles.',
            is_locked: false,
            created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
            is_demo: true,
          }
        ]);

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

      setFeedbackMessage('Demo client cohort seeded successfully! Sarah Jenkins (Distress & Intake submitted), David Chen (Pending GAD-7 & Intake), and Marcus Brody are active.');
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
        supabase.from('mmh_client_intakes').delete().eq('is_demo', true),
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

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-xs text-gray-500">
          <div className="w-8 h-8 border-2 border-[#130C76] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying encrypted clinician session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-[#E5DFD5] p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#130C76] text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
              <Lock className="w-6 h-6 text-[#FFAC24]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#BA3D00] block mt-2">
              Encrypted Clinician EHR Gate
            </span>
            <h1 className="text-2xl font-extrabold text-[#130C76]">Mighty Mental Health</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Access to patient clinical notes, psychological assessments, and GP correspondence is restricted to <strong>Luke Piatti (MCouns, UQ; PACFA Reg. #28941)</strong>.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authMagicSent ? (
            <div className="bg-green-50 border border-green-200 text-green-900 text-xs p-4 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
              <p className="font-bold">Magic Link Dispatched</p>
              <p className="text-[11px] text-green-800">
                Check <strong>{authEmail}</strong> for your secure one-click clinician login link.
              </p>
              <button
                type="button"
                onClick={() => setAuthMagicSent(false)}
                className="text-[11px] font-bold text-[#BA3D00] underline mt-2"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Clinician Email
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="luke@mightymentalhealth.com.au"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#BA3D00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password
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
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-[#130C76] hover:bg-[#0038A8] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#FFAC24]" />
                  {authSubmitting ? 'Authenticating...' : 'Sign In as Luke Piatti'}
                </button>

                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={authSubmitting}
                  className="w-full bg-white border border-[#E5DFD5] hover:border-[#130C76] text-gray-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#BA3D00]" />
                  Email Secure Magic Link
                </button>

              </div>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 text-center space-y-1">
            <p>Protected under Australian Privacy Principles (APP) & Privacy Act 1988.</p>
            <p>Encrypted clinical records stored in Sydney (ap-southeast-2).</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Clinician Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#BA3D00] text-white text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Clinician Administration
            </span>
            <span className="text-xs text-gray-500">PACFA Registered Practice Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#130C76] mt-1">EHR & Practice Manager</h1>
          <p className="text-xs text-gray-500">
            Practice Director: Luke Piatti (MCouns, UQ; PACFA Reg. #28941) • Logan, QLD
          </p>
        </div>

        {/* Quick Action Buttons & Session Control */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FBF9F5] border border-[#E5DFD5] px-3 py-1.5 rounded-xl text-xs text-gray-700">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="font-semibold">{session?.user?.email || 'luke@mightymentalhealth.com.au'}</span>
            <button
              onClick={handleSignOut}
              className="ml-2 text-[11px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
            >
              Sign Out
            </button>
          </div>

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
            <Plus className="w-3.5 h-3.5 text-[#BA3D00]" /> New Form / Screener
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-[#BA3D00] hover:bg-[#9E3300] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
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
      <div className="flex border-b border-gray-200 mt-6 space-x-6 overflow-x-auto text-sm font-bold">
        {[
          { key: 'schedule', label: 'Appointments & Schedule', icon: CalendarIcon, count: appointments.length },
          { key: 'assignments', label: 'Form Submissions', icon: CheckCircle2, count: assignments.length },
          { key: 'intakes', label: 'Client Intakes', icon: UserCheck, count: intakes.length },
          { key: 'forms', label: 'Form Library', icon: FileText, count: forms.length },
          { key: 'notes', label: 'Clinical Notes & GP Letters', icon: Lock, count: clinicalNotes.length },
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

      {/* TAB CONTENT: CLIENT INTAKES */}
      {activeTab === 'intakes' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#130C76] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Pre-Session Onboarding
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Digital 4-Step Intake Records</span>
                </div>
                <h2 className="text-xl font-extrabold text-[#130C76] mt-1 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#F96100]" />
                  Client Clinical Intakes ({intakes.length})
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted via the Mighty Mental Health Client Intake Portal. Includes biopsychosocial history, referring GP, somatic tension mapping, and safety risk screener.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/intake"
                  target="_blank"
                  className="bg-white border border-[#E5DFD5] hover:border-[#130C76] text-[#130C76] px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#F96100]" />
                  Open Public Intake Form
                </Link>
              </div>
            </div>

            {/* Intakes List */}
            <div className="mt-6 space-y-4">
              {intakes.map((intake) => {
                const tensionAreas = intake.somatic_movement_profile?.tension_areas || [];
                const isHighRisk = intake.safety_risk_history && (
                  intake.safety_risk_history.toLowerCase().includes('yes') ||
                  intake.safety_risk_history.toLowerCase().includes('active') ||
                  intake.safety_risk_history.toLowerCase().includes('suicide')
                );

                return (
                  <div
                    key={intake.id || intake.client_email}
                    className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] hover:border-[#130C76]/30 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-[#130C76]">{intake.client_name}</h3>
                          {intake.date_of_birth && (
                            <span className="text-xs text-gray-500 font-medium">
                              (DOB: {new Date(intake.date_of_birth).toLocaleDateString('en-AU')})
                            </span>
                          )}
                          {intake.is_demo && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {intake.client_email} • {intake.client_phone || 'No phone'}
                          {intake.address && ` • ${intake.address}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isHighRisk ? (
                          <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                            Safety Flag Review
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                            No Acute Risk Flagged
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">
                          {intake.created_at ? new Date(intake.created_at).toLocaleDateString('en-AU') : 'Recent'}
                        </span>
                      </div>
                    </div>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                          Referring GP
                        </span>
                        <p className="font-extrabold text-gray-800">
                          {intake.gp_name || 'Self-Referred / No GP'}
                        </p>
                        <p className="text-gray-500 text-[11px] truncate">
                          {intake.gp_clinic || 'No clinic listed'}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                          Presenting Concerns & Goals
                        </span>
                        <p className="text-gray-700 font-medium line-clamp-2">
                          {intake.presenting_concerns || 'None specified'}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                          Somatic Tension Baseline
                        </span>
                        {tensionAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tensionAreas.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="bg-[#130C76]/5 text-[#130C76] px-2 py-0.5 rounded-lg text-[10px] font-bold"
                              >
                                {area}
                              </span>
                            ))}
                            {tensionAreas.length > 3 && (
                              <span className="text-[10px] text-gray-400 font-bold self-center">
                                +{tensionAreas.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No specific tension areas identified</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#E5DFD5] flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-semibold">
                        Emergency Contact: {intake.emergency_contact_name || 'N/A'} ({intake.emergency_contact_relationship || 'Contact'}) • {intake.emergency_contact_phone || 'N/A'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedIntake(intake)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-gray-100 text-[#130C76] border border-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Full Intake
                        </button>
                        <button
                          onClick={() => handleTransferIntakeToNote(intake)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F96100] hover:bg-[#d65300] text-white transition-all shadow-2xs flex items-center gap-1 cursor-pointer hover:scale-105"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          Transfer to Clinical Note &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {intakes.length === 0 && (
                <div className="py-16 text-center text-gray-500">
                  <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No client intake forms received yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Clients can complete the 4-step onboarding intake prior to their first session.</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={handleSeedDemoData}
                      className="text-xs font-bold text-[#F96100] hover:underline cursor-pointer"
                    >
                      + Seed Demo Client Intakes (Sarah Jenkins & David Chen)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CLINICAL NOTES & GP LETTERS */}
      {activeTab === 'notes' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#130C76] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    NovoNote Clinical Scribe
                  </span>
                  <span className="text-xs text-gray-500 font-medium">PACFA #28941 Encrypted Records</span>
                </div>
                <h2 className="text-xl font-extrabold text-[#130C76] mt-1 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#F96100]" />
                  Clinical Notes & GP Letters Suite
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Compliant with PACFA Documentation Standards, Medicare Better Access requirements, and Australian Privacy Principles.
                </p>
              </div>

              {noteSavedFeedback && (
                <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Clinical Record Saved Successfully!
                </div>
              )}
            </div>

            {/* Template Selector Row */}
            <div className="my-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Clinical Note or GP Correspondence Template:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(Object.keys(CLINICAL_TEMPLATES) as ClinicalTemplateType[]).map((tmplKey) => {
                  const tmpl = CLINICAL_TEMPLATES[tmplKey];
                  const isSelected = selectedNoteTemplate === tmplKey;
                  return (
                    <button
                      key={tmplKey}
                      type="button"
                      onClick={() => handleSelectTemplate(tmplKey)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#130C76] text-white border-[#130C76] shadow-sm scale-102'
                          : 'bg-[#FBF9F5] text-gray-800 border-[#E5DFD5] hover:border-gray-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-block ${
                            isSelected
                              ? 'bg-white/20 text-[#FFAC24]'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tmpl.category}
                        </span>
                        <h4 className="font-extrabold text-xs leading-tight">{tmpl.title}</h4>
                      </div>
                      <span className={`text-[10px] mt-2 block ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {tmpl.isGpLetter ? 'Formal Letterhead' : 'EHR Note'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client Session Selector */}
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E5DFD5] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Associate with Client Consultation:
                </label>
                <select
                  value={selectedApptForNote?.id || ''}
                  onChange={(e) => {
                    const found = appointments.find((a) => a.id === e.target.value);
                    setSelectedApptForNote(found || null);
                    if (found) {
                      setGpClientName(found.client_name);
                      // Check for matching intake
                      const matchingIntake = intakes.find(
                        (i) => i.client_email?.toLowerCase() === found.client_email.toLowerCase()
                      );
                      if (matchingIntake) {
                        if (matchingIntake.gp_name) setGpName(matchingIntake.gp_name);
                        if (matchingIntake.gp_clinic) setGpClinic(matchingIntake.gp_clinic);
                        if (matchingIntake.gp_address) setGpAddress(matchingIntake.gp_address);
                        if (matchingIntake.date_of_birth) setGpClientDob(matchingIntake.date_of_birth);
                      }
                    }
                  }}
                  className="w-full sm:w-96 px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100] bg-white"
                >
                  <option value="">-- Choose Appointment --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.client_name} ({new Date(a.scheduled_at).toLocaleDateString('en-AU')}) - {a.service?.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons: Score Injector & Scaffold */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleInjectScoresIntoNote}
                  className="bg-white hover:bg-gray-100 text-[#130C76] border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Extract latest completed psychometric assessment scores for this client and append to note"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F96100]" />
                  ⚡ Inject Latest Scores into (O)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const def = CLINICAL_TEMPLATES[selectedNoteTemplate];
                    if (def && !def.isGpLetter) {
                      setNoteSubjective(def.defaultSubjective);
                      setNoteObjective(def.defaultObjective);
                      setNoteAssessment(def.defaultAssessment);
                      setNotePlan(def.defaultPlan);
                    }
                  }}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Reset to Template Scaffold
                </button>
              </div>
            </div>

            {injectFeedback && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                {injectFeedback}
              </div>
            )}

            {/* CONDITIONAL VIEW A: CLINICAL NOTE (SOAP / FIRST-SESSION / RISK / AOD) */}
            {selectedNoteTemplate !== 'gp-first-session' && selectedNoteTemplate !== 'gp-progress-update' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#130C76] uppercase tracking-wider">
                      S — Subjective
                    </label>
                    <span className="text-[11px] text-gray-500">Client narrative, presenting complaints, history</span>
                  </div>
                  <textarea
                    rows={4}
                    value={noteSubjective}
                    onChange={(e) => setNoteSubjective(e.target.value)}
                    placeholder="Client reports feeling overwhelmed with work load; difficulty falling asleep..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-hidden focus:border-[#F96100]"
                  ></textarea>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#130C76] uppercase tracking-wider">
                      O — Objective
                    </label>
                    <span className="text-[11px] text-gray-500">Clinician observations, somatic tension signs, psychometrics</span>
                  </div>
                  <textarea
                    rows={4}
                    value={noteObjective}
                    onChange={(e) => setNoteObjective(e.target.value)}
                    placeholder="Observed affect, shallow clavicular breathing, DASS-21 Anxiety score..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-hidden focus:border-[#F96100]"
                  ></textarea>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#130C76] uppercase tracking-wider">
                      A — Assessment
                    </label>
                    <span className="text-[11px] text-gray-500">Clinical formulation, autonomic nervous system tone, progress</span>
                  </div>
                  <textarea
                    rows={4}
                    value={noteAssessment}
                    onChange={(e) => setNoteAssessment(e.target.value)}
                    placeholder="Sympathetic hyperarousal driven by work stress; somatic box-breathing produced immediate heart rate deceleration..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-hidden focus:border-[#F96100]"
                  ></textarea>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#130C76] uppercase tracking-wider">
                      P — Plan
                    </label>
                    <span className="text-[11px] text-gray-500">Therapeutic interventions, somatic homework, follow-up</span>
                  </div>
                  <textarea
                    rows={3}
                    value={notePlan}
                    onChange={(e) => setNotePlan(e.target.value)}
                    placeholder="Prescribed 10-minute daily morning brisk walk + vagal breathwork. Assigned DASS-21 reassessment for next session."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-hidden focus:border-[#F96100]"
                  ></textarea>
                </div>

                <div className="pt-6 border-t border-gray-200 mt-6 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-600" /> Sydney ap-southeast-2 encrypted storage
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveNote(false)}
                      disabled={isNoteSaving}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save Draft Note
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNote(true)}
                      disabled={isNoteSaving}
                      className="bg-[#130C76] hover:bg-[#0038A8] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#FFAC24]" /> Finalise & Lock Note
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL VIEW B: FORMAL GP CORRESPONDENCE BUILDER */}
            {(selectedNoteTemplate === 'gp-first-session' || selectedNoteTemplate === 'gp-progress-update') && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-[#F96100] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block mb-0.5">
                      Australian GP Medical Correspondence & MHTP Review
                    </strong>
                    Under Medicare Better Access and PACFA Clinical practice guidelines, Luke provides formal written reports to referring General Practitioners following Session 1 and Session 6 (or at plan review intervals).
                  </div>
                </div>

                {/* GP Letter Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      value={gpClientName}
                      onChange={(e) => setGpClientName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Patient DOB
                    </label>
                    <input
                      type="text"
                      value={gpClientDob}
                      onChange={(e) => setGpClientDob(e.target.value)}
                      placeholder="e.g. 14/06/1992"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Referring GP Name
                    </label>
                    <input
                      type="text"
                      value={gpName}
                      onChange={(e) => setGpName(e.target.value)}
                      placeholder="e.g. Dr. Andrew Collins"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      GP Practice / Clinic
                    </label>
                    <input
                      type="text"
                      value={gpClinic}
                      onChange={(e) => setGpClinic(e.target.value)}
                      placeholder="e.g. Logan Central Medical Clinic"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      GP Clinic Address
                    </label>
                    <input
                      type="text"
                      value={gpAddress}
                      onChange={(e) => setGpAddress(e.target.value)}
                      placeholder="e.g. 12 Wembley Rd, Logan Central"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Sessions Attended
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={gpSessionsCompleted}
                        onChange={(e) => setGpSessionsCompleted(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Total Allowed
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={gpTotalSessionsAllowed}
                        onChange={(e) => setGpTotalSessionsAllowed(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Clinical Focus & Modalities
                    </label>
                    <textarea
                      rows={2}
                      value={gpTherapyFocus}
                      onChange={(e) => setGpTherapyFocus(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Clinical Summary / Recommendation (Optional Override)
                    </label>
                    <textarea
                      rows={2}
                      value={gpRecommendation}
                      onChange={(e) => setGpRecommendation(e.target.value)}
                      placeholder="Leave blank to use default PACFA recommendation..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateGpLetter}
                    className="bg-[#130C76] hover:bg-[#0038A8] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#FFAC24]" />
                    Generate Formal GP Letter
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyGpLetter}
                    className="bg-white border border-[#E5DFD5] hover:border-[#130C76] text-[#130C76] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {gpCopySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#F96100]" />
                        Copy Letter Text
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintGpLetter}
                    className="bg-white border border-[#E5DFD5] hover:border-[#130C76] text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-500" />
                    Print / Export PDF Letter
                  </button>
                </div>

                {/* Live Formatted GP Letter Preview */}
                <div className="bg-[#FAF8F5] border-2 border-[#E5DFD5] rounded-3xl p-6 sm:p-8 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                    <span className="text-[11px] font-extrabold text-[#130C76] uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-[#BA3D00]" />
                      Australian Clinical Letterhead (RACGP & PACFA #28941)
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Verified Formal Medical Correspondence</span>
                  </div>

                  {gpLetterOutput ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
                      {/* Clinical Letterhead Banner */}
                      <div className="border-b-2 border-[#130C76] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h4 className="text-xl font-extrabold text-[#130C76] tracking-tight">MIGHTY MENTAL HEALTH</h4>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#BA3D00] mt-0.5">Exercise-Integrated Psychotherapy & Clinical Counselling</p>
                          <p className="text-xs text-gray-600 mt-1">Luke Piatti (MCouns, UQ) • PACFA Reg. Clinical Counsellor #28941</p>
                        </div>
                        <div className="text-xs text-gray-500 sm:text-right space-y-0.5">
                          <p><strong>Clinic:</strong> Logan Central, QLD 4114</p>
                          <p><strong>Email:</strong> luke@mightymentalhealth.com.au</p>
                          <p><strong>Web:</strong> https://mighty-mental-health.vercel.app</p>
                        </div>
                      </div>

                      {/* Patient & GP Meta Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F9FAFB] border border-gray-200 rounded-xl p-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Patient Details</span>
                          <p><strong>Name:</strong> {gpClientName || selectedApptForNote?.client_name || 'Client'}</p>
                          <p><strong>DOB:</strong> {gpClientDob || 'On file'}</p>
                          <p><strong>Framework:</strong> Better Access / Mental Health Care Plan</p>
                          <p><strong>Sessions:</strong> {gpSessionsCompleted} of {gpTotalSessionsAllowed} Completed</p>
                        </div>
                        <div className="space-y-1 sm:border-l sm:border-gray-200 sm:pl-4">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Referring Practitioner</span>
                          <p><strong>Doctor:</strong> {gpName || 'Referring GP'}</p>
                          <p><strong>Clinic:</strong> {gpClinic || 'Medical Centre'}</p>
                          <p><strong>Address:</strong> {gpAddress || 'Logan, QLD'}</p>
                          <p><strong>Status:</strong> MHTP Progress Update</p>
                        </div>
                      </div>

                      {/* Letter Body */}
                      <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-sans border-t border-b border-gray-100 py-4">
                        {gpLetterOutput}
                      </div>

                      {/* Signature Block */}
                      <div className="pt-2 text-xs space-y-1">
                        <p className="font-extrabold text-sm text-[#130C76]">Luke Piatti (MCouns, UQ)</p>
                        <p className="text-gray-600">Master of Counselling (University of Queensland)</p>
                        <p className="text-[#BA3D00] font-bold">Exercise-Integrated Counsellor & Clinical Director</p>
                        <p className="text-gray-500 text-[11px]">PACFA Registered Clinical Counsellor #28941</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                      Click &quot;Generate Formal GP Letter&quot; above to compile the medical report into the letterhead.
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      Archived in MMH Clinical Notes database as permanent encrypted client record.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveNote(true)}
                      disabled={isNoteSaving}
                      className="bg-[#130C76] hover:bg-[#0038A8] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#FFAC24]" />
                      Finalise & Save into Clinical Archive
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIOUS NOTES & LETTERS ARCHIVE */}
            <div className="mt-12 pt-8 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#F96100]" />
                    Encrypted Clinical Notes & Correspondence Archive ({clinicalNotes.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Chronological audit log of Luke's progress notes, risk assessments, and GP update letters.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {clinicalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <strong className="font-extrabold text-gray-900 text-sm">
                          {note.client_name}
                        </strong>
                        <span className="bg-[#130C76]/10 text-[#130C76] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {note.template_type || note.note_type}
                        </span>
                        {note.is_locked ? (
                          <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                        {note.is_demo && (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {note.is_locked && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNoteForAddendum(note);
                              setAddendumText('');
                              setAddendumError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-[#BA3D00] bg-[#BA3D00]/10 hover:bg-[#BA3D00]/20 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" /> Attach Addendum
                          </button>
                        )}
                        <span className="text-gray-400 font-mono text-[11px]">
                          {new Date(note.created_at).toLocaleString('en-AU')}
                        </span>
                      </div>
                    </div>

                    {note.gp_letter_text ? (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200 font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto text-gray-700">
                        {note.gp_letter_text}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 text-[11px]">
                        <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                          <strong className="text-[#130C76] block mb-1">Subjective:</strong>
                          <p className="text-gray-600 line-clamp-3">{note.subjective || 'Nil recorded'}</p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                          <strong className="text-[#130C76] block mb-1">Objective:</strong>
                          <p className="text-gray-600 line-clamp-3">{note.objective || 'Nil recorded'}</p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                          <strong className="text-[#130C76] block mb-1">Assessment:</strong>
                          <p className="text-gray-600 line-clamp-3">{note.assessment || 'Nil recorded'}</p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                          <strong className="text-[#130C76] block mb-1">Plan:</strong>
                          <p className="text-gray-600 line-clamp-3">{note.plan || 'Nil recorded'}</p>
                        </div>
                      </div>
                    )}

                    {/* Append-only Legal Addenda */}
                    {note.addenda && note.addenda.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#E5DFD5] space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#130C76]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1E3A2F]" />
                          <span>Legal Addenda (Append-Only Audit Log: PACFA Compliant)</span>
                        </div>
                        <div className="space-y-2 pl-2 border-l-2 border-[#1E3A2F]/40">
                          {note.addenda.map((ad) => (
                            <div key={ad.id} className="p-2.5 bg-white rounded-xl border border-gray-200 text-[11px] space-y-1">
                              <div className="flex items-center justify-between gap-2 text-[10px]">
                                <span className="font-extrabold text-[#1E3A2F] bg-[#1E3A2F]/10 px-2 py-0.5 rounded-full">
                                  {ad.reason_for_amendment}
                                </span>
                                <span className="text-gray-400 font-mono">
                                  {new Date(ad.created_at).toLocaleString('en-AU')}
                                </span>
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap">{ad.addendum_text}</p>
                              <span className="text-[10px] text-gray-400 block pt-0.5">
                                Sealed by Luke Piatti (PACFA Reg. #28941)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {clinicalNotes.length === 0 && (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    No clinical progress notes or GP letters archived yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL CLIENT INTAKE DETAILS */}
      {selectedIntake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div>
                <span className="text-[10px] font-extrabold text-[#F96100] uppercase tracking-wider block">
                  Confidential Clinical Intake Record
                </span>
                <h3 className="font-extrabold text-xl text-[#130C76]">
                  {selectedIntake.client_name}
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  DOB: {selectedIntake.date_of_birth || 'Not recorded'} • Email: {selectedIntake.client_email} • Phone: {selectedIntake.client_phone || 'N/A'}
                </span>
              </div>
              <button
                onClick={() => setSelectedIntake(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto py-6 space-y-6 flex-1 pr-2 text-xs">
              {/* Step 1: Personal & Emergency & GP */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-[#130C76] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#F96100]" />
                  1. Demographics, Emergency Contact & GP Liaison
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FBF9F5] rounded-2xl border border-[#E5DFD5]">
                  <div>
                    <span className="font-bold text-gray-500 text-[10px] uppercase block">Emergency Contact</span>
                    <p className="font-bold text-gray-800">
                      {selectedIntake.emergency_contact_name || 'N/A'} ({selectedIntake.emergency_contact_relationship || 'Contact'})
                    </p>
                    <p className="text-gray-600">{selectedIntake.emergency_contact_phone || 'No phone'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 text-[10px] uppercase block">Referring GP</span>
                    <p className="font-bold text-gray-800">{selectedIntake.gp_name || 'Self-Referred'}</p>
                    <p className="text-gray-600">{selectedIntake.gp_clinic || 'No clinic listed'} • {selectedIntake.gp_phone || ''}</p>
                    {selectedIntake.gp_address && <p className="text-gray-500 text-[11px]">{selectedIntake.gp_address}</p>}
                  </div>
                </div>
              </div>

              {/* Step 2: Medical & Psychiatric History */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-[#130C76] flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-[#F96100]" />
                  2. Medical, Psychiatric & Medication Baseline
                </h4>
                <div className="space-y-2 p-4 bg-[#FBF9F5] rounded-2xl border border-[#E5DFD5]">
                  <div>
                    <strong className="text-gray-700 block mb-0.5">Current Medications:</strong>
                    <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                      {selectedIntake.medications || 'Nil medications reported'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-gray-700 block mb-0.5">Medical & Physical Health History:</strong>
                    <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                      {selectedIntake.medical_history || 'Nil significant medical history reported'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-gray-700 block mb-0.5">Previous Psychiatric / Psychological Care:</strong>
                    <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                      {selectedIntake.psychiatric_history || 'First time seeking psychotherapy / counselling'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Somatic Profile */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-[#130C76] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#F96100]" />
                  3. Somatic Baseline & Nervous System Profile
                </h4>
                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E5DFD5] space-y-3">
                  <div>
                    <span className="font-bold text-gray-500 text-[10px] uppercase block mb-1">
                      Identified Physical Tension Areas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIntake.somatic_movement_profile?.tension_areas?.map((area, idx) => (
                        <span
                          key={idx}
                          className="bg-[#130C76] text-white px-3 py-1 rounded-xl text-xs font-bold"
                        >
                          {area}
                        </span>
                      )) || <span className="text-gray-400 italic">No areas specified</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <strong className="text-gray-700 block">Movement Frequency:</strong>
                      <span className="text-gray-800">{selectedIntake.somatic_movement_profile?.movement_frequency || 'Not stated'}</span>
                    </div>
                    <div>
                      <strong className="text-gray-700 block">Sleep Quality:</strong>
                      <span className="text-gray-800">{selectedIntake.somatic_movement_profile?.sleep_quality || 'Not stated'}</span>
                    </div>
                    <div>
                      <strong className="text-gray-700 block">Acute Fight / Flight Symptoms:</strong>
                      <span className="text-gray-800">{selectedIntake.somatic_movement_profile?.panic_fight_flight_symptoms || 'None reported'}</span>
                    </div>
                    <div>
                      <strong className="text-gray-700 block">Physical Injuries / Limitations:</strong>
                      <span className="text-gray-800">{selectedIntake.somatic_movement_profile?.physical_injuries_limitations || 'None reported'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Presenting Concerns, Goals & Safety */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-[#130C76] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#F96100]" />
                  4. Presenting Concerns, Goals & Safety Risk Screener
                </h4>
                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E5DFD5] space-y-3">
                  <div>
                    <strong className="text-gray-700 block mb-0.5">Presenting Concerns & Narrative:</strong>
                    <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                      {selectedIntake.presenting_concerns || 'Not stated'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-gray-700 block mb-0.5">Therapy Goals:</strong>
                    <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                      {selectedIntake.therapy_goals || 'Not stated'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-gray-700 block mb-0.5">Safety & Suicide Risk Screener Response:</strong>
                    <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200 font-semibold">
                      {selectedIntake.safety_risk_history || 'No safety risk history reported'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500">Mighty Mental Health Digital Intake</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIntake(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferIntakeToNote(selectedIntake)}
                  className="bg-[#F96100] hover:bg-[#d65300] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Transfer into Initial Clinical Note &rarr;
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

      {/* MODAL 5: ATTACH LEGAL ADDENDUM TO LOCKED CLINICAL NOTE */}
      {selectedNoteForAddendum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div>
                <span className="text-[10px] font-extrabold text-[#BA3D00] uppercase tracking-wider block">
                  PACFA Compliant Clinical Audit Log
                </span>
                <h3 className="font-extrabold text-lg text-[#130C76]">
                  Attach Legal Addendum
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  Client: <strong className="text-gray-800">{selectedNoteForAddendum.client_name}</strong> • Original Note: {new Date(selectedNoteForAddendum.created_at).toLocaleDateString('en-AU')}
                </span>
              </div>
              <button
                onClick={() => setSelectedNoteForAddendum(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAddendum} className="overflow-y-auto py-5 space-y-4 flex-1 pr-1 text-xs">
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-900 leading-relaxed text-[11px]">
                <strong className="block mb-0.5 font-bold">Australian Medical Defense & PACFA Standard:</strong>
                Locked clinical notes cannot be modified or overwritten. This entry will be appended permanently with an immutable timestamp to preserve clinical legal integrity.
              </div>

              {addendumError && (
                <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{addendumError}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Reason for Amendment
                </label>
                <select
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#130C76]"
                >
                  <option value="Clarification of clinical details">Clarification of clinical details</option>
                  <option value="Correction of objective fact or date">Correction of objective fact or date</option>
                  <option value="Additional information received from client or external provider">Additional information received from client or external provider</option>
                  <option value="Retrospective clinical assessment note">Retrospective clinical assessment note</option>
                  <option value="Safety risk plan update or post-session contact">Safety risk plan update or post-session contact</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Addendum Text (Permanent Clinical Entry)
                </label>
                <textarea
                  value={addendumText}
                  onChange={(e) => setAddendumText(e.target.value)}
                  rows={6}
                  placeholder="Record additional clinical observations, clarifications, or newly reported information..."
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#130C76] text-xs leading-relaxed"
                  required
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Author: Luke Piatti (MCouns, UQ; PACFA Reg. #28941)
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedNoteForAddendum(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddendum || !addendumText.trim()}
                  className="bg-[#BA3D00] hover:bg-[#9d3300] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSavingAddendum ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sealing Addendum...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Seal Permanent Addendum
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
