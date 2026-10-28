'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  ShieldAlert, 
  ShieldCheck, 
  Share2, 
  MessageSquare, 
  Users, 
  Sparkles,
  Heart,
  Lock,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Activity,
  ChevronRight,
  X,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  MMHAppointment, 
  MMHForm, 
  MMHFormAssignment, 
  MMHClinicalNote,
  ScreenerQuestion 
} from '@/lib/types';
import {
  scoreDass21,
  scoreGad7,
  scorePhq9,
  scoreK10,
  scorePcl5,
  scoreAsrs,
  scoreAis,
  scoreBrs,
  scoreCrafft,
  scoreWsas,
  scoreAq10,
} from '@/lib/scoring';
import Link from 'next/link';

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // AudioContext blocked by browser autoplay policy
  }
}

export default function EmbeddedTelehealthRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const initialRole = searchParams.get('role') === 'client' ? 'client' : 'clinician';

  // Role perspective: 'clinician' (Luke's console) vs 'client' (Patient view)
  const [activeRole, setActiveRole] = useState<'clinician' | 'client'>(initialRole);

  // Call & Media States
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chat State
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Encrypted consultation room initialized (256-bit AES). Australian Privacy Principles compliant.', time: 'Just now' },
    { sender: 'Luke (Clinician)', text: 'Hi! Whenever you are settled, take a deep breath. We will begin shortly.', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Clinical & Room Data States
  const [appointment, setAppointment] = useState<MMHAppointment | null>(null);
  const [patientAssignments, setPatientAssignments] = useState<MMHFormAssignment[]>([]);
  const [availableForms, setAvailableForms] = useState<MMHForm[]>([]);
  const [previousNotes, setPreviousNotes] = useState<MMHClinicalNote[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Luke's Workbench States
  const [workbenchTab, setWorkbenchTab] = useState<'soap' | 'profile' | 'dispatch'>('soap');
  const [noteSubjective, setNoteSubjective] = useState('');
  const [noteObjective, setNoteObjective] = useState('');
  const [noteAssessment, setNoteAssessment] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);
  const [selectedDispatchFormId, setSelectedDispatchFormId] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Patient Slide-Over Drawer States
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);
  const [activeInSessionAssignment, setActiveInSessionAssignment] = useState<MMHFormAssignment | null>(null);
  const [drawerAnswers, setDrawerAnswers] = useState<Record<string, any>>({});
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false);
  const [drawerSubmittedResult, setDrawerSubmittedResult] = useState<any | null>(null);
  const [newAssignmentAlertPill, setNewAssignmentAlertPill] = useState(false);

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startWebcam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        }
      } catch (err) {
        setCameraActive(false);
      }
    }

    if (isVideoOn) {
      startWebcam();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn]);

  // Load appointment and patient profile
  useEffect(() => {
    async function loadRoomContext() {
      setLoadingData(true);

      // 1. Find appointment by telehealth_room_id or id
      const { data: apptData } = await supabase
        .from('mmh_appointments')
        .select('*, service:mmh_services(*)')
        .or(`telehealth_room_id.eq.${roomId},id.eq.${roomId}`)
        .maybeSingle();

      let currentAppt = apptData as MMHAppointment | null;

      // Fallback if testing ad-hoc room
      if (!currentAppt) {
        const { data: defaultAppt } = await supabase
          .from('mmh_appointments')
          .select('*, service:mmh_services(*)')
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        currentAppt = defaultAppt as MMHAppointment | null;
      }

      setAppointment(currentAppt);

      // 2. Load available forms for Luke to dispatch
      const { data: formsData } = await supabase
        .from('mmh_forms')
        .select('*')
        .order('title', { ascending: true });
      if (formsData) {
        setAvailableForms(formsData as MMHForm[]);
        if (formsData.length > 0 && !selectedDispatchFormId) {
          setSelectedDispatchFormId(formsData[0].id);
        }
      }

      if (currentAppt) {
        await refreshPatientData(currentAppt.client_email);
      }

      setLoadingData(false);
    }

    loadRoomContext();
  }, [roomId]);

  // Helper to fetch client's assignments and past SOAP notes
  async function refreshPatientData(clientEmail: string) {
    const [assignRes, notesRes] = await Promise.all([
      supabase
        .from('mmh_form_assignments')
        .select('*, form:mmh_forms(*)')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false }),
      supabase
        .from('mmh_clinical_notes')
        .select('*')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false })
    ]);

    if (assignRes.data) {
      setPatientAssignments(assignRes.data as MMHFormAssignment[]);
      // Check if there is a pending assignment to pop-up for the patient
      const pending = assignRes.data.find(a => a.status === 'assigned');
      if (pending) {
        setActiveInSessionAssignment(pending as MMHFormAssignment);
      }
    }
    if (notesRes.data) {
      setPreviousNotes(notesRes.data as MMHClinicalNote[]);
    }
  }

  // Real-time synchronization polling (every 3 seconds in-call)
  useEffect(() => {
    if (!appointment) return;
    const interval = setInterval(async () => {
      const { data: freshAssignments } = await supabase
        .from('mmh_form_assignments')
        .select('*, form:mmh_forms(*)')
        .eq('client_email', appointment.client_email)
        .order('created_at', { ascending: false });

      if (freshAssignments) {
        // Detect if a new assignment was dispatched while patient is in call
        const currentIds = new Set(patientAssignments.map(a => a.id));
        const newlyAdded = freshAssignments.find(a => !currentIds.has(a.id) && a.status === 'assigned');

        if (newlyAdded && activeRole === 'client') {
          setActiveInSessionAssignment(newlyAdded as MMHFormAssignment);
          setIsPatientDrawerOpen(true);
          setNewAssignmentAlertPill(true);
          playNotificationChime();
        }

        setPatientAssignments(freshAssignments as MMHFormAssignment[]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [appointment, patientAssignments, activeRole]);

  // Luke dispatches a live screener to the patient
  async function handleDispatchAssessment() {
    if (!appointment || !selectedDispatchFormId) return;
    setIsDispatching(true);

    const chosenForm = availableForms.find(f => f.id === selectedDispatchFormId);

    const { data, error } = await supabase.from('mmh_form_assignments').insert({
      form_id: selectedDispatchFormId,
      client_name: appointment.client_name,
      client_email: appointment.client_email,
      deadline: new Date().toISOString(),
      status: 'assigned',
      is_demo: appointment.is_demo ?? false,
    }).select('*, form:mmh_forms(*)').single();

    if (data) {
      setDispatchFeedback(`Dispatched "${chosenForm?.title}" to ${appointment.client_name}!`);
      setTimeout(() => setDispatchFeedback(null), 4000);
      await refreshPatientData(appointment.client_email);

      // Add in-room chat announcement
      setMessages(prev => [
        ...prev,
        {
          sender: 'Luke (Clinician)',
          text: `I've sent through the "${chosenForm?.title}" assessment for you to complete in your side drawer. Take your time!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    setIsDispatching(false);
  }

  // 1-Click: Inject Latest Screener Scores into SOAP Objective (O)
  function handleInjectScoresIntoObjective() {
    const latestCompleted = patientAssignments.find(a => a.status === 'completed' && a.score_summary);
    if (!latestCompleted || !latestCompleted.form) {
      setNoteFeedback('No completed screener found to inject yet.');
      setTimeout(() => setNoteFeedback(null), 3000);
      return;
    }

    const formTitle = latestCompleted.form.title;
    const severity = latestCompleted.clinical_severity || 'Completed';
    const timestamp = latestCompleted.completed_at 
      ? new Date(latestCompleted.completed_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
      : 'In-Session';

    let scoresText = '';
    const scores = latestCompleted.score_summary || {};

    if (scores.depression !== undefined && scores.anxiety !== undefined) {
      scoresText = `Depression: ${scores.depression} (${scores.severity?.depression || 'Normal'}), Anxiety: ${scores.anxiety} (${scores.severity?.anxiety || 'Normal'}), Stress: ${scores.stress} (${scores.severity?.stress || 'Normal'})`;
    } else if (scores.total !== undefined) {
      scoresText = `Total Score: ${scores.total} | Clinical Classification: ${severity}`;
    } else {
      scoresText = `Classification: ${severity}`;
    }

    const injection = `\n[Standardized Psychometric Screener: ${formTitle} (${timestamp})]\n- Clinical Result: ${severity}\n- Metrics: ${scoresText}\n- Autonomic baseline noted during telehealth session.\n`;

    setNoteObjective(prev => (prev ? prev.trim() + '\n' + injection : injection.trim()));
    setNoteFeedback(`Injected ${formTitle} scores into Objective (O)!`);
    setTimeout(() => setNoteFeedback(null), 3500);
  }

  // Save Luke's SOAP Note
  async function handleSaveSoapNote(lock: boolean = false) {
    if (!appointment) return;
    setIsSavingNote(true);

    const { error } = await supabase.from('mmh_clinical_notes').insert({
      appointment_id: appointment.id,
      client_name: appointment.client_name,
      client_email: appointment.client_email,
      note_type: 'SOAP',
      subjective: noteSubjective,
      objective: noteObjective,
      assessment: noteAssessment,
      plan: notePlan,
      is_locked: lock,
      locked_at: lock ? new Date().toISOString() : null,
      is_demo: appointment.is_demo ?? false,
    });

    if (!error) {
      setNoteFeedback(lock ? 'SOAP Note locked & cryptographically sealed.' : 'Draft SOAP note saved to clinical record.');
      setTimeout(() => setNoteFeedback(null), 3000);
      await refreshPatientData(appointment.client_email);
    } else {
      setNoteFeedback('Failed to save note. Please check connection.');
    }
    setIsSavingNote(false);
  }

  // Patient Submits Screener from In-Session Drawer
  async function handleSubmitPatientDrawer(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInSessionAssignment || !activeInSessionAssignment.form) return;
    setIsSubmittingDrawer(true);

    const slug = activeInSessionAssignment.form.slug;
    let scoreSummary: any = {};
    let severityFlag = 'Completed';

    if (slug === 'dass-21') {
      const res = scoreDass21(drawerAnswers);
      scoreSummary = res;
      severityFlag = `D:${res.severity.depression} | A:${res.severity.anxiety} | S:${res.severity.stress}`;
    } else if (slug === 'gad-7') {
      const res = scoreGad7(drawerAnswers);
      scoreSummary = res;
      severityFlag = res.severity;
    } else if (slug === 'phq-9') {
      const res = scorePhq9(drawerAnswers);
      scoreSummary = res;
      severityFlag = res.hasSelfHarmRisk
        ? `URGENT: Suicide/Self-Harm Flag (Item 9) | ${res.severity}`
        : `${res.severity} Depression (Score: ${res.total}/27)`;
    } else if (slug === 'k10') {
      const res = scoreK10(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/50)`;
    } else if (slug === 'pcl-5') {
      const res = scorePcl5(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.probablePTSD ? 'Probable PTSD' : res.severity} (Score: ${res.total}/80)`;
    } else if (slug === 'asrs-v1') {
      const res = scoreAsrs(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Part A: ${res.shadedCount}/6 Criteria)`;
    } else if (slug === 'ais') {
      const res = scoreAis(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/24)`;
    } else if (slug === 'brs') {
      const res = scoreBrs(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Mean: ${res.meanScore}/5.00)`;
    } else if (slug === 'crafft') {
      const res = scoreCrafft(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (${res.score}/6 Indicators)`;
    } else if (slug === 'wsas') {
      const res = scoreWsas(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/40)`;
    } else if (slug === 'aq-10') {
      const res = scoreAq10(drawerAnswers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/10)`;
    } else {
      scoreSummary = { totalAnswered: Object.keys(drawerAnswers).length };
      severityFlag = 'Intake Submitted';
    }

    await supabase
      .from('mmh_form_assignments')
      .update({
        status: 'completed',
        answers: drawerAnswers,
        score_summary: scoreSummary,
        clinical_severity: severityFlag,
        completed_at: new Date().toISOString(),
      })
      .eq('id', activeInSessionAssignment.id);

    // Alert Luke via internal chat
    setMessages(prev => [
      ...prev,
      {
        sender: 'System Alert',
        text: `Patient has completed "${activeInSessionAssignment.form?.title}". Score: ${severityFlag}. Ready to inject into SOAP note.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsSubmittingDrawer(false);
    setDrawerSubmittedResult(scoreSummary);
    setNewAssignmentAlertPill(false);
    if (appointment) {
      await refreshPatientData(appointment.client_email);
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [
      ...prev,
      { 
        sender: activeRole === 'clinician' ? 'Luke (Clinician)' : (appointment?.client_name || 'Patient'), 
        text: chatInput, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ]);
    setChatInput('');
  };

  const clientName = appointment?.client_name || 'Patient';
  const serviceTitle = appointment?.service?.title || 'Telehealth Consultation';

  return (
    <div className="min-h-screen bg-[#0F1412] text-white flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* TOP TELEHEALTH NAVIGATION BAR */}
      <header className="bg-[#130C76] border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 z-30 shrink-0">
        
        {/* Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F96100] flex items-center justify-center text-white shadow-sm shrink-0">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                Mighty Mental Health Telehealth
              </span>
              <span className="bg-white/10 text-[#FFAC24] text-[10px] font-bold px-2 py-0.2 rounded-full hidden sm:inline-block">
                PACFA Telehealth Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>Patient: <strong className="text-white">{clientName}</strong></span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline text-white/50">{serviceTitle}</span>
              <span>•</span>
              <span className="font-mono text-green-300 font-bold">{formatTimer(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* Perspective Switcher & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Dual Perspective Role Switcher */}
          <div className="bg-black/40 border border-white/10 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setActiveRole('clinician')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'clinician'
                  ? 'bg-[#F96100] text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Switch to Luke's Clinical Workbench view"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Luke&apos;s Console</span>
            </button>
            <button
              onClick={() => setActiveRole('client')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'client'
                  ? 'bg-[#F96100] text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Switch to Patient view with slide-over drawer"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Patient View</span>
            </button>
          </div>

          {/* Crisis Button */}
          <a
            href="tel:131114"
            className="hidden lg:flex items-center gap-1.5 text-xs bg-red-600/30 text-red-200 border border-red-500/40 px-3 py-1.5 rounded-xl font-bold hover:bg-red-600/50 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Lifeline 13 11 14
          </a>

          {/* Chat Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              chatOpen ? 'bg-[#F96100] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Toggle Consultation Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN BODY AREA */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col lg:flex-row gap-4 w-full h-[calc(100vh-130px)] overflow-hidden max-w-[1920px] mx-auto">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: WEBRTC VIDEO FEED ARENA */}
        {/* ========================================================================= */}
        <section 
          className={`h-full bg-[#161D1A] rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 shadow-2xl transition-all duration-300 ${
            activeRole === 'clinician' ? 'lg:w-7/12 xl:w-3/5' : 'w-full'
          }`}
        >
          {/* Top Video Overlay Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <span>
                {activeRole === 'clinician' ? `Patient Feed: ${clientName}` : 'Luke MCouns (UQ) — PACFA Clinician'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* In-Call Screener Notification Pill (Patient View) */}
              {activeRole === 'client' && activeInSessionAssignment && activeInSessionAssignment.status === 'assigned' && (
                <button
                  onClick={() => setIsPatientDrawerOpen(true)}
                  className="bg-[#F96100] hover:bg-[#d65300] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Complete Assessment ({activeInSessionAssignment.form?.title})</span>
                </button>
              )}
              <span className="text-[11px] text-white/60 bg-black/40 px-2.5 py-1 rounded-md border border-white/5 font-mono">
                HD 1080p • 18ms WebRTC
              </span>
            </div>
          </div>

          {/* Central Feed Presentation (Active Remote Participant) */}
          <div className="my-auto text-center space-y-3 z-10">
            {activeRole === 'clinician' ? (
              // Clinician looking at patient
              <div className="space-y-3">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#130C76] to-[#0038A8] text-white flex items-center justify-center font-extrabold text-4xl shadow-xl mx-auto border-4 border-white/20">
                  {clientName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white">{clientName}</h3>
                  <p className="text-xs text-green-300 font-medium mt-0.5">Microphone & Video Connected • Active Participant</p>
                </div>
                {/* Audio activity visualizer bar */}
                <div className="flex items-center justify-center gap-1 pt-1">
                  {[40, 75, 55, 90, 60, 80, 45, 95, 50, 70].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-[#F96100] rounded-full animate-pulse" 
                      style={{ height: `${h * 0.25}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Patient looking at Luke
              <div className="space-y-3">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#130C76] to-[#F96100] text-white flex items-center justify-center font-extrabold text-4xl shadow-xl mx-auto border-4 border-white/20">
                  L
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white">Luke MCouns (UQ)</h3>
                  <p className="text-xs text-[#FFAC24] font-medium mt-0.5">PACFA Registered Clinician #28941 • Somatic Movement Coach</p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full text-[11px] text-white/80 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-[#F96100]" /> Somatic Nervous System Regulation in session
                </div>
              </div>
            )}
          </div>

          {/* Bottom Feed Bar */}
          <div className="z-10 bg-black/50 backdrop-blur-md p-3 rounded-2xl text-xs text-white/70 flex items-center justify-between border border-white/10">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>Australian Privacy Act & PACFA Code of Ethics Compliant</span>
            </span>
            <span className="text-[11px] text-white/50">Sydney Server (ap-southeast-2)</span>
          </div>

          {/* Local PiP Mirror Video Feed */}
          <div className="absolute bottom-5 right-5 w-40 sm:w-52 h-28 sm:h-36 rounded-2xl bg-[#130C76] border-2 border-white/30 shadow-2xl overflow-hidden z-20">
            {isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-white/50">
                <VideoOff className="w-6 h-6 mb-1 text-white/40" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-white">
              {activeRole === 'clinician' ? 'Luke (You)' : 'You'}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LUKE'S CLINICAL WORKBENCH (SOAP NOTES, PROFILES, DISPATCH) */}
        {/* ========================================================================= */}
        {activeRole === 'clinician' && (
          <aside className="lg:w-5/12 xl:w-2/5 h-full bg-[#1A2421] rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
            
            {/* Workbench Tab Navigation */}
            <div className="p-3 bg-[#130C76]/70 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl text-xs w-full">
                {[
                  { key: 'soap', label: 'SOAP Notes', icon: Lock },
                  { key: 'profile', label: 'Patient Profile & Tests', icon: FileText, count: patientAssignments.length },
                  { key: 'dispatch', label: 'Dispatch Assessment', icon: Zap }
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = workbenchTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setWorkbenchTab(t.key as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                        isActive
                          ? 'bg-[#F96100] text-white shadow-xs'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{t.label}</span>
                      {t.count !== undefined && (
                        <span className="bg-white/20 text-white text-[10px] px-1.5 rounded-full">
                          {t.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Workbench Feedback Banner */}
            {noteFeedback && (
              <div className="bg-green-500/20 border-b border-green-500/30 text-green-200 px-4 py-2 text-xs font-semibold flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span>{noteFeedback}</span>
              </div>
            )}
            {dispatchFeedback && (
              <div className="bg-[#F96100]/20 border-b border-[#F96100]/30 text-orange-200 px-4 py-2 text-xs font-semibold flex items-center gap-2 shrink-0">
                <Zap className="w-4 h-4 text-[#F96100] shrink-0" />
                <span>{dispatchFeedback}</span>
              </div>
            )}

            {/* TAB 1: LIVE SOAP NOTES */}
            {workbenchTab === 'soap' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                
                {/* 1-Click Quick Injector Bar */}
                <div className="bg-[#130C76]/50 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-white text-xs block">Quick Psychometric Injector</span>
                    <span className="text-[11px] text-white/60">Auto-insert latest test scores into Objective (O)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleInjectScoresIntoObjective}
                    className="bg-[#FFAC24] hover:bg-amber-400 text-[#130C76] px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 shrink-0"
                    title="Insert latest completed test scores into Objective section"
                  >
                    <Zap className="w-3.5 h-3.5 fill-[#130C76]" />
                    <span>Inject Scores</span>
                  </button>
                </div>

                {/* S - Subjective */}
                <div className="space-y-1">
                  <label className="font-bold text-[#FFAC24] uppercase tracking-wider block">
                    S — Subjective (Client narrative, chief complaints, tension report)
                  </label>
                  <textarea
                    rows={3}
                    value={noteSubjective}
                    onChange={(e) => setNoteSubjective(e.target.value)}
                    placeholder="Client reports high work stress, clavicular shallow breathing, difficulty relaxing in evenings..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 focus:outline-hidden focus:border-[#F96100] text-xs leading-relaxed"
                  />
                </div>

                {/* O - Objective */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#FFAC24] uppercase tracking-wider block">
                      O — Objective (Observed posture, breathing, psychometric scores)
                    </label>
                    <button
                      type="button"
                      onClick={handleInjectScoresIntoObjective}
                      className="text-[10px] text-[#F96100] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" /> Auto-Insert
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={noteObjective}
                    onChange={(e) => setNoteObjective(e.target.value)}
                    placeholder="Observed upper cervical tension, elevated respiratory rate. [Click 'Inject Scores' above to insert screener metrics]..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 focus:outline-hidden focus:border-[#F96100] text-xs leading-relaxed font-mono"
                  />
                </div>

                {/* A - Assessment */}
                <div className="space-y-1">
                  <label className="font-bold text-[#FFAC24] uppercase tracking-wider block">
                    A — Assessment (Autonomic state formulation, cognitive patterns)
                  </label>
                  <textarea
                    rows={3}
                    value={noteAssessment}
                    onChange={(e) => setNoteAssessment(e.target.value)}
                    placeholder="Autonomic dysregulation consistent with sustained sympathetic drive; high somatic tension..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 focus:outline-hidden focus:border-[#F96100] text-xs leading-relaxed"
                  />
                </div>

                {/* P - Plan */}
                <div className="space-y-1">
                  <label className="font-bold text-[#FFAC24] uppercase tracking-wider block">
                    P — Plan (Movement homework, somatic pacing, next session)
                  </label>
                  <textarea
                    rows={3}
                    value={notePlan}
                    onChange={(e) => setNotePlan(e.target.value)}
                    placeholder="Prescribed 10-min morning walking cadence + 4-7-8 vagal breathing reset. Re-test DASS-21 in 2 weeks."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 focus:outline-hidden focus:border-[#F96100] text-xs leading-relaxed"
                  />
                </div>

                {/* Save Controls */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/50 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> PACFA Audit Trail
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSoapNote(false)}
                      disabled={isSavingNote}
                      className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSoapNote(true)}
                      disabled={isSavingNote}
                      className="bg-[#130C76] hover:bg-[#0038A8] border border-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#FFAC24]" /> Finalise & Lock
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PATIENT PROFILE & TEST RESULTS */}
            {workbenchTab === 'profile' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {/* Client Profile Card */}
                <div className="bg-black/30 border border-white/10 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{clientName}</h4>
                      <p className="text-[11px] text-white/60">{appointment?.client_email}</p>
                    </div>
                    <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                      Active Client
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                    <div>
                      <span className="text-white/40 block">Phone</span>
                      <span className="font-semibold text-white/80">{appointment?.client_phone || '0412 345 678'}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Session Format</span>
                      <span className="font-semibold text-[#FFAC24]">Telehealth Video Consultation</span>
                    </div>
                  </div>
                </div>

                {/* Test Results Header */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#F96100]" /> Psychometric Assessment History
                  </h4>
                  <span className="text-[10px] text-white/50">{patientAssignments.length} total</span>
                </div>

                {/* Submissions List */}
                <div className="space-y-2.5">
                  {patientAssignments.map((asg) => {
                    const isDone = asg.status === 'completed';
                    const hasScores = asg.score_summary && Object.keys(asg.score_summary).length > 0;
                    return (
                      <div key={asg.id} className="p-3.5 bg-black/20 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block text-xs">{asg.form?.title || 'Assessment'}</span>
                            <span className="text-[10px] text-white/50 block">
                              Category: {asg.form?.category || 'General'} • {isDone ? `Completed: ${new Date(asg.completed_at || '').toLocaleDateString('en-AU')}` : 'Pending Submission'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isDone ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isDone ? 'Completed' : 'Assigned'}
                          </span>
                        </div>

                        {/* Scores Badge */}
                        {asg.clinical_severity && (
                          <div className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-between ${
                            asg.clinical_severity.includes('Severe') || asg.clinical_severity.includes('URGENT')
                              ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                              : 'bg-white/5 text-white/80 border border-white/10'
                          }`}>
                            <span>Severity: {asg.clinical_severity}</span>
                            {isDone && (
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkbenchTab('soap');
                                  handleInjectScoresIntoObjective();
                                }}
                                className="text-[10px] bg-[#F96100] text-white px-2 py-0.5 rounded-md hover:bg-[#d65300] transition-colors"
                              >
                                Inject to Note
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {patientAssignments.length === 0 && (
                    <div className="text-center py-8 text-white/40 text-xs">
                      No assessment records found for this client.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DISPATCH ASSESSMENT */}
            {workbenchTab === 'dispatch' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
                <div className="bg-[#130C76]/50 border border-white/10 p-4 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#FFAC24]" /> In-Session Live Dispatcher
                  </h4>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Select any standardized scale from the NovoPsych library below. When you click dispatch, it immediately pops into {clientName}&apos;s video screen in a slide-over drawer for live completion.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="font-bold text-white block uppercase tracking-wider">
                    Select Standardized Assessment:
                  </label>
                  <select
                    value={selectedDispatchFormId}
                    onChange={(e) => setSelectedDispatchFormId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/20 text-white font-bold text-xs focus:outline-hidden focus:border-[#F96100]"
                  >
                    {availableForms.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#1A2421] text-white">
                        {f.title} ({f.category})
                      </option>
                    ))}
                  </select>

                  {/* Form Details Preview */}
                  {(() => {
                    const form = availableForms.find(f => f.id === selectedDispatchFormId);
                    if (!form) return null;
                    return (
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                        <span className="font-bold text-[#FFAC24] block">{form.title}</span>
                        <p className="text-white/70 leading-relaxed text-[11px]">{form.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                          <span>{form.questions?.length || 0} Questions configured</span>
                          <span>•</span>
                          <span>Category: {form.category}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={handleDispatchAssessment}
                    disabled={isDispatching}
                    className="w-full bg-[#F96100] hover:bg-[#d65300] text-white py-3 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isDispatching ? 'Pushing to Patient...' : 'Push Live to Patient Screen Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* IN-CALL CHAT DRAWER */}
        {chatOpen && (
          <aside className="w-80 h-full bg-[#1A2421] rounded-3xl border border-white/10 flex flex-col justify-between p-4 shadow-2xl shrink-0">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Consultation Chat</h4>
              <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white text-base cursor-pointer">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`p-2.5 rounded-xl ${m.sender.includes('You') || m.sender.includes('Luke') ? 'bg-[#F96100]/20 ml-3' : 'bg-white/5 mr-3'}`}>
                  <div className="flex justify-between text-[10px] text-white/50 mb-0.5">
                    <span className="font-bold text-white/90">{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type note or question..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-hidden"
              />
              <button type="submit" className="bg-[#F96100] px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer">
                Send
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* ========================================================================= */}
      {/* PATIENT SLIDE-OVER RIGHT DRAWER (POPS IN WHEN FORM ASSIGNED) */}
      {/* ========================================================================= */}
      {activeRole === 'client' && (
        <div
          className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white text-gray-900 shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-in-out flex flex-col ${
            isPatientDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 bg-[#130C76] text-white flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-[#FFAC24] text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" /> In-Session Clinical Screener
              </div>
              <h3 className="font-extrabold text-base text-white">
                {activeInSessionAssignment?.form?.title || 'Assigned Assessment'}
              </h3>
            </div>
            <button
              onClick={() => setIsPatientDrawerOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Minimize drawer (keep call open)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {drawerSubmittedResult ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-extrabold text-[#130C76]">Assessment Received!</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Thank you! Your responses have been delivered into Luke&apos;s active session console. You can now close this drawer to return to full video.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPatientDrawerOpen(false);
                    setDrawerSubmittedResult(null);
                  }}
                  className="bg-[#130C76] hover:bg-[#0038A8] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Close & Return to Video
                </button>
              </div>
            ) : activeInSessionAssignment && activeInSessionAssignment.form ? (
              <form onSubmit={handleSubmitPatientDrawer} className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                  <p className="font-bold mb-1">Luke requested this assessment:</p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {activeInSessionAssignment.form.description}
                  </p>
                </div>

                {/* Questions */}
                <div className="space-y-5">
                  {(activeInSessionAssignment.form.questions || []).map((q: ScreenerQuestion, idx: number) => (
                    <div key={q.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-300 text-[#130C76] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-gray-900 leading-snug">{q.text}</p>
                      </div>

                      {/* Scale 0 to 3 */}
                      {q.type === 'scale_0_3' && (
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {[0, 1, 2, 3].map((val) => {
                            const isChosen = drawerAnswers[q.id] === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setDrawerAnswers(prev => ({ ...prev, [q.id]: val }))}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-[#F96100] text-white border-[#F96100] scale-105 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Scale 1 to 5 */}
                      {q.type === 'scale_1_5' && (
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isChosen = drawerAnswers[q.id] === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setDrawerAnswers(prev => ({ ...prev, [q.id]: val }))}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-[#130C76] text-white border-[#130C76] scale-105 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Scale 0 to 4 */}
                      {q.type === 'scale_0_4' && (
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                          {[0, 1, 2, 3, 4].map((val) => {
                            const isChosen = drawerAnswers[q.id] === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setDrawerAnswers(prev => ({ ...prev, [q.id]: val }))}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-[#F96100] text-white border-[#F96100] scale-105 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Yes / No */}
                      {q.type === 'yes_no' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {[
                            { label: 'Yes', val: true },
                            { label: 'No', val: false }
                          ].map((opt) => {
                            const isChosen = drawerAnswers[q.id] === opt.val;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setDrawerAnswers(prev => ({ ...prev, [q.id]: opt.val }))}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  isChosen
                                    ? opt.val
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                      : 'bg-green-600 text-white border-green-600 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Select radio */}
                      {q.type === 'select' && q.options && (
                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt: string) => (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                                drawerAnswers[q.id] === opt
                                  ? 'border-[#F96100] bg-white font-bold text-[#130C76]'
                                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={drawerAnswers[q.id] === opt}
                                onChange={() => setDrawerAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                className="text-[#F96100] focus:ring-[#F96100]"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Text */}
                      {q.type === 'text' && (
                        <textarea
                          rows={2}
                          value={drawerAnswers[q.id] || ''}
                          onChange={(e) => setDrawerAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Your answer..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-hidden focus:border-[#F96100]"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDrawer}
                  className="w-full bg-[#F96100] hover:bg-[#d65300] text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDrawer ? 'Submitting...' : 'Submit to Luke & Continue Session'}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                No active in-session form currently requested by Luke.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM TELEHEALTH CONTROL DECK */}
      <footer className="bg-[#130C76] border-t border-white/10 py-3.5 px-4 sm:px-6 flex items-center justify-between gap-4 z-30 shrink-0">
        
        {/* Left Side: Call State */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-white/70">
          <span className="font-bold text-white">{clientName}</span>
          <span>•</span>
          <span className="text-[#FFAC24] font-medium">{serviceTitle}</span>
        </div>

        {/* Center: Main Media Buttons */}
        <div className="flex items-center justify-center gap-3 mx-auto">
          {/* Mic */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white shadow-md'
            }`}
            title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white shadow-md'
            }`}
            title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing ? 'bg-[#F96100] text-white shadow-md' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Share Screen"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Patient Drawer Floating Trigger Button */}
          {activeRole === 'client' && (
            <button
              onClick={() => setIsPatientDrawerOpen(!isPatientDrawerOpen)}
              className={`h-11 px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isPatientDrawerOpen || newAssignmentAlertPill
                  ? 'bg-[#F96100] text-white shadow-lg animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Open in-session assessment drawer"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">In-Call Assessment</span>
              {activeInSessionAssignment && activeInSessionAssignment.status === 'assigned' && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              )}
            </button>
          )}

          {/* End Call */}
          <Link
            href={activeRole === 'clinician' ? '/admin' : '/portal'}
            className="bg-red-600 hover:bg-red-700 text-white px-5 h-11 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">End Consultation</span>
          </Link>
        </div>

        {/* Right Side: Security Badge */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-white/50">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span>256-Bit Encrypted WebRTC</span>
        </div>
      </footer>
    </div>
  );
}
