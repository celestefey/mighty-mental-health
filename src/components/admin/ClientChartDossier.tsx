'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Lock, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Dumbbell, 
  TrendingDown, 
  TrendingUp, 
  History, 
  ClipboardList, 
  Shield, 
  User, 
  ArrowLeft, 
  ArrowUpRight, 
  Flame, 
  Heart, 
  Zap, 
  Search, 
  Stethoscope, 
  AlertTriangle, 
  AlertCircle, 
  Video, 
  FileText, 
  Check, 
  Copy, 
  ExternalLink, 
  ChevronRight, 
  Download, 
  Printer, 
  Plus, 
  Eye, 
  RefreshCw, 
  X,
  Clock,
  Sparkles,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Pencil
} from 'lucide-react';
import { 
  MMHAppointment, 
  MMHForm, 
  MMHFormAssignment, 
  MMHClinicalNote, 
  MMHClientIntake 
} from '@/lib/types';
import Link from 'next/link';

export interface AggregatedClient {
  id: string; // lowercased email
  name: string;
  email: string;
  phone: string;
  dob?: string;
  age?: number;
  address?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  gpDetails?: {
    name?: string;
    clinic?: string;
    phone?: string;
    address?: string;
  };
  medications?: string;
  medicalHistory?: string;
  psychiatricHistory?: string;
  presentingConcerns?: string;
  therapyGoals?: string;
  safetyRiskHistory?: string;
  somaticProfile?: {
    movement_frequency?: string;
    tension_areas?: string[];
    sleep_quality?: string;
    panic_fight_flight_symptoms?: string;
    physical_injuries_limitations?: string;
  };
  appointments: MMHAppointment[];
  assignments: MMHFormAssignment[];
  clinicalNotes: MMHClinicalNote[];
  intake?: MMHClientIntake;
  totalSessions: number;
  completedSessions: number;
  upcomingAppt?: MMHAppointment;
  latestScore?: {
    formTitle: string;
    date: string;
    summary: Record<string, any>;
    severity?: string;
  };
  scoreHistory: {
    id: string;
    formTitle: string;
    formSlug: string;
    date: string;
    scores: Record<string, any>;
    severity?: string;
    answers?: Record<string, any>;
  }[];
  isDemo?: boolean;
}

export interface Dass21Trajectory {
  type: 'dass-21';
  title: string;
  count: number;
  baselineDate: string;
  currentDate: string;
  baselineScores: { depression: number; anxiety: number; stress: number };
  currentScores: { depression: number; anxiety: number; stress: number };
  deltas: { depression: number; anxiety: number; stress: number };
  percentages: { depression: number; anxiety: number; stress: number };
  overallPercentage: number;
  baselineSeverity?: string;
  currentSeverity?: string;
  history: any[];
}

export interface StandardTrajectory {
  type: 'standard';
  title: string;
  count: number;
  baselineDate: string;
  currentDate: string;
  baselineScores: { total: number };
  currentScores: { total: number };
  deltas: { total: number };
  percentages: { total: number };
  overallPercentage: number;
  baselineSeverity?: string;
  currentSeverity?: string;
  history: any[];
}

export type TrajectoryItem = Dass21Trajectory | StandardTrajectory;

interface ClientChartDossierProps {
  appointments: MMHAppointment[];
  intakes: MMHClientIntake[];
  assignments: MMHFormAssignment[];
  clinicalNotes: MMHClinicalNote[];
  forms: MMHForm[];
  selectedClientEmail: string | null;
  initialDossierTab?: 'movement' | 'psychometrics' | 'notes' | 'forms' | 'appointments' | 'medical';
  onSelectClient: (email: string | null) => void;
  onDraftNoteForClient: (client: { name: string; email: string; apptId?: string }) => void;
  onGenerateGpLetterForClient: (client: { name: string; email: string; dob?: string; gp?: any }) => void;
  onAssignFormForClient: (client: { name: string; email: string }) => void;
  onSeedDemoData: () => void;
}

export default function ClientChartDossier({
  appointments,
  intakes,
  assignments,
  clinicalNotes,
  forms,
  selectedClientEmail,
  initialDossierTab = 'movement',
  onSelectClient,
  onDraftNoteForClient,
  onGenerateGpLetterForClient,
  onAssignFormForClient,
  onSeedDemoData,
}: ClientChartDossierProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'severe' | 'overdue' | 'active'>('all');
  const [activeDossierTab, setActiveDossierTab] = useState<'movement' | 'psychometrics' | 'notes' | 'forms' | 'appointments' | 'medical'>(initialDossierTab);
  const [inspectingAssignment, setInspectingAssignment] = useState<MMHFormAssignment | null>(null);
  const [somaticNotesInput, setSomaticNotesInput] = useState('');
  const [somaticNoteSaved, setSomaticNoteSaved] = useState(false);

  // Sync initial tab when changed from outside
  useEffect(() => {
    if (initialDossierTab) {
      setActiveDossierTab(initialDossierTab);
    }
  }, [initialDossierTab]);

  // Aggregate all unique clients from intakes, appointments, assignments, and clinicalNotes
  const clients = useMemo<AggregatedClient[]>(() => {
    const map = new Map<string, AggregatedClient>();

    // 1. Ingest from Intakes (richest demographic data)
    intakes.forEach((intake) => {
      if (!intake.client_email) return;
      const key = intake.client_email.trim().toLowerCase();
      let age: number | undefined = undefined;
      if (intake.date_of_birth) {
        const birthYear = new Date(intake.date_of_birth).getFullYear();
        if (!isNaN(birthYear)) {
          age = new Date().getFullYear() - birthYear;
        }
      }

      map.set(key, {
        id: key,
        name: intake.client_name || 'Client',
        email: intake.client_email,
        phone: intake.client_phone || '',
        dob: intake.date_of_birth,
        age,
        address: intake.address,
        emergencyContact: {
          name: intake.emergency_contact_name,
          phone: intake.emergency_contact_phone,
          relationship: intake.emergency_contact_relationship,
        },
        gpDetails: {
          name: intake.gp_name,
          clinic: intake.gp_clinic,
          phone: intake.gp_phone,
          address: intake.gp_address,
        },
        medications: intake.medications,
        medicalHistory: intake.medical_history,
        psychiatricHistory: intake.psychiatric_history,
        presentingConcerns: intake.presenting_concerns,
        therapyGoals: intake.therapy_goals,
        safetyRiskHistory: intake.safety_risk_history,
        somaticProfile: intake.somatic_movement_profile,
        appointments: [],
        assignments: [],
        clinicalNotes: [],
        intake,
        totalSessions: 0,
        completedSessions: 0,
        scoreHistory: [],
        isDemo: intake.is_demo,
      });
    });

    // 2. Ingest from Appointments
    appointments.forEach((appt) => {
      if (!appt.client_email) return;
      const key = appt.client_email.trim().toLowerCase();
      let client = map.get(key);
      if (!client) {
        client = {
          id: key,
          name: appt.client_name || 'Client',
          email: appt.client_email,
          phone: appt.client_phone || '',
          appointments: [],
          assignments: [],
          clinicalNotes: [],
          totalSessions: 0,
          completedSessions: 0,
          scoreHistory: [],
          isDemo: appt.is_demo,
        };
        map.set(key, client);
      }
      client.appointments.push(appt);
      client.totalSessions += 1;
      if (appt.status === 'completed' || new Date(appt.scheduled_at) < new Date()) {
        client.completedSessions += 1;
      }
      if (!client.upcomingAppt && new Date(appt.scheduled_at) >= new Date()) {
        client.upcomingAppt = appt;
      }
      if (appt.is_demo) client.isDemo = true;
    });

    // 3. Ingest from Form Assignments
    assignments.forEach((asg) => {
      if (!asg.client_email) return;
      const key = asg.client_email.trim().toLowerCase();
      let client = map.get(key);
      if (!client) {
        client = {
          id: key,
          name: asg.client_name || 'Client',
          email: asg.client_email,
          phone: '',
          appointments: [],
          assignments: [],
          clinicalNotes: [],
          totalSessions: 0,
          completedSessions: 0,
          scoreHistory: [],
          isDemo: asg.is_demo,
        };
        map.set(key, client);
      }
      client.assignments.push(asg);
      if (asg.is_demo) client.isDemo = true;

      // Ingest into score history if completed
      if (asg.status === 'completed' && asg.score_summary) {
        client.scoreHistory.push({
          id: asg.id,
          formTitle: asg.form?.title || 'Outcome Measure',
          formSlug: asg.form?.slug || 'screener',
          date: asg.completed_at || asg.created_at,
          scores: asg.score_summary,
          severity: asg.clinical_severity,
          answers: asg.answers,
        });
      }
    });

    // 4. Ingest from Clinical Notes
    clinicalNotes.forEach((note) => {
      if (!note.client_email) return;
      const key = note.client_email.trim().toLowerCase();
      let client = map.get(key);
      if (!client) {
        client = {
          id: key,
          name: note.client_name || 'Client',
          email: note.client_email,
          phone: '',
          appointments: [],
          assignments: [],
          clinicalNotes: [],
          totalSessions: 0,
          completedSessions: 0,
          scoreHistory: [],
          isDemo: note.is_demo,
        };
        map.set(key, client);
      }
      client.clinicalNotes.push(note);
      if (note.is_demo) client.isDemo = true;
    });

    // Final sorting and trajectory resolution per client
    const result = Array.from(map.values()).map((c) => {
      // Sort appointments newest first
      c.appointments.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
      // Sort clinical notes newest first
      c.clinicalNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      // Sort assignments newest first
      c.assignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      // Sort score history oldest to newest for chronological trajectory
      c.scoreHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (c.scoreHistory.length > 0) {
        const latest = c.scoreHistory[c.scoreHistory.length - 1];
        c.latestScore = {
          formTitle: latest.formTitle,
          date: latest.date,
          summary: latest.scores,
          severity: latest.severity,
        };
      }
      return c;
    });

    return result;
  }, [intakes, appointments, assignments, clinicalNotes]);

  // Selected client record
  const selectedClient = useMemo(() => {
    if (!selectedClientEmail) return null;
    return clients.find((c) => c.email.toLowerCase() === selectedClientEmail.toLowerCase()) || null;
  }, [clients, selectedClientEmail]);

  // Load persisted somatic notes for selected client
  useEffect(() => {
    if (selectedClient) {
      const saved = localStorage.getItem(`mmh_somatic_notes_${selectedClient.id}`);
      if (saved) {
        setSomaticNotesInput(saved);
      } else {
        // Pre-fill with intelligent clinician scaffolding based on somatic profile
        const defaultNotes = selectedClient.somaticProfile?.tension_areas?.length
          ? `Somatic Assessment & Movement Protocol:\n- Primary Focus: Down-regulation of ${selectedClient.somaticProfile.tension_areas.join(', ')}.\n- Movement Prescription: Extended eccentric tempo on compound movements, vagal diaphragmatic breathing post-effort.\n- Precautions: ${selectedClient.somaticProfile.physical_injuries_limitations || 'None reported'}.`
          : `Exercise-Integrated Clinical Notes:\n- Resistance / Movement History: Client receptive to embodied grounding.\n- Somatic Goals: Release sympathetic hyperarousal through structured motor pacing.\n- Action Plan: Bilateral tactile feedback and box breathing between sets.`;
        setSomaticNotesInput(defaultNotes);
      }
    }
  }, [selectedClient]);

  function handleSaveSomaticNotes() {
    if (!selectedClient) return;
    localStorage.setItem(`mmh_somatic_notes_${selectedClient.id}`, somaticNotesInput);
    setSomaticNoteSaved(true);
    setTimeout(() => setSomaticNoteSaved(false), 2500);
  }

  // Filter clients for roster directory
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.gpDetails?.clinic && c.gpDetails.clinic.toLowerCase().includes(q)) ||
        (c.gpDetails?.name && c.gpDetails.name.toLowerCase().includes(q)) ||
        (c.presentingConcerns && c.presentingConcerns.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      if (statusFilter === 'severe') {
        const hasSevereScore = c.scoreHistory.some(
          (s) => s.severity?.includes('Severe') || s.severity?.includes('URGENT') || s.severity?.includes('Very High')
        );
        const hasSafetyAlert = c.safetyRiskHistory && c.safetyRiskHistory.toLowerCase().includes('yes');
        return hasSevereScore || hasSafetyAlert;
      }
      if (statusFilter === 'overdue') {
        return c.assignments.some(
          (a) => a.status === 'assigned' && new Date(a.deadline) < new Date()
        );
      }
      if (statusFilter === 'active') {
        return c.appointments.length > 0;
      }
      return true;
    });
  }, [clients, searchQuery, statusFilter]);

  // Psychometric Trajectory Calculations for Selected Client
  const trajectoryData = useMemo<TrajectoryItem[] | null>(() => {
    if (!selectedClient || selectedClient.scoreHistory.length === 0) return null;

    // Group scores by form title/slug
    const grouped: Record<string, typeof selectedClient.scoreHistory> = {};
    selectedClient.scoreHistory.forEach((item) => {
      const key = item.formSlug || item.formTitle;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    // Calculate deltas for scales with at least 2 administrations
    const trajectories = Object.keys(grouped).map((key) => {
      const history = grouped[key];
      const baseline = history[0];
      const current = history[history.length - 1];

      // DASS-21 specific trajectory
      if (key.includes('dass') || baseline.formTitle.includes('DASS')) {
        const baseD = Number(baseline.scores.depression ?? 0);
        const currD = Number(current.scores.depression ?? 0);
        const baseA = Number(baseline.scores.anxiety ?? 0);
        const currA = Number(current.scores.anxiety ?? 0);
        const baseS = Number(baseline.scores.stress ?? 0);
        const currS = Number(current.scores.stress ?? 0);

        const deltaD = currD - baseD;
        const deltaA = currA - baseA;
        const deltaS = currS - baseS;

        const pctD = baseD > 0 ? Math.round((deltaD / baseD) * 100) : 0;
        const pctA = baseA > 0 ? Math.round((deltaA / baseA) * 100) : 0;
        const pctS = baseS > 0 ? Math.round((deltaS / baseS) * 100) : 0;

        const avgPct = Math.round((pctD + pctA + pctS) / 3);

        return {
          type: 'dass-21' as const,
          title: 'DASS-21 (Depression, Anxiety, Stress Scales)',
          count: history.length,
          baselineDate: baseline.date,
          currentDate: current.date,
          baselineScores: { depression: baseD, anxiety: baseA, stress: baseS },
          currentScores: { depression: currD, anxiety: currA, stress: currS },
          deltas: { depression: deltaD, anxiety: deltaA, stress: deltaS },
          percentages: { depression: pctD, anxiety: pctA, stress: pctS },
          overallPercentage: avgPct,
          baselineSeverity: baseline.severity,
          currentSeverity: current.severity,
          history,
        };
      }

      // K10 / GAD-7 / PCL-5 single score scales
      const baseTotal = Number(baseline.scores.total_score ?? baseline.scores.score ?? 0);
      const currTotal = Number(current.scores.total_score ?? current.scores.score ?? 0);
      const deltaTotal = currTotal - baseTotal;
      const pctTotal = baseTotal > 0 ? Math.round((deltaTotal / baseTotal) * 100) : 0;

      return {
        type: 'standard' as const,
        title: baseline.formTitle,
        count: history.length,
        baselineDate: baseline.date,
        currentDate: current.date,
        baselineScores: { total: baseTotal },
        currentScores: { total: currTotal },
        deltas: { total: deltaTotal },
        percentages: { total: pctTotal },
        overallPercentage: pctTotal,
        baselineSeverity: baseline.severity,
        currentSeverity: current.severity,
        history,
      };
    });

    return trajectories;
  }, [selectedClient]);

  // ==========================================
  // VIEW 1: CLIENT ROSTER / SEARCH DIRECTORY
  // ==========================================
  if (!selectedClient) {
    return (
      <div className="space-y-6">
        {/* Top Clinical Directory Header & Metrics */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#130C76] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Allied Health EHR
                </span>
                <span className="text-xs text-gray-500 font-medium">Luke Piatti (MCouns, UQ; PACFA Reg. #28941)</span>
              </div>
              <h2 className="text-2xl font-black text-[#130C76] mt-1.5 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#BA3D00]" />
                Client Clinical Charts & Dossiers
              </h2>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed">
                Centralized 360° clinical directory. Access client exercise-integrated movement profiles, longitudinal psychometric trajectories (DASS-21, K10), SOAP clinical note histories, and referring GP correspondence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onSeedDemoData}
                className="bg-white border border-[#E5DFD5] hover:border-[#BA3D00] text-[#130C76] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#BA3D00]" />
                Seed Test Cohort
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Active Patients</span>
                <Users className="w-4 h-4 text-[#130C76]" />
              </div>
              <p className="text-2xl font-black text-[#130C76] mt-2">{clients.length}</p>
              <span className="text-[10px] text-gray-500 font-medium">In Luke&apos;s practice registry</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Trajectories Tracked</span>
                <Activity className="w-4 h-4 text-[#BA3D00]" />
              </div>
              <p className="text-2xl font-black text-[#130C76] mt-2">
                {clients.filter((c) => c.scoreHistory.length > 0).length}
              </p>
              <span className="text-[10px] text-green-700 font-bold">Multi-point outcome measures</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Movement Profiles</span>
                <Dumbbell className="w-4 h-4 text-[#FFAC24]" />
              </div>
              <p className="text-2xl font-black text-[#130C76] mt-2">
                {clients.filter((c) => c.somaticProfile?.movement_frequency).length}
              </p>
              <span className="text-[10px] text-gray-500 font-medium">Exercise-integrated plans</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Clinical Notes</span>
                <Lock className="w-4 h-4 text-[#130C76]" />
              </div>
              <p className="text-2xl font-black text-[#130C76] mt-2">{clinicalNotes.length}</p>
              <span className="text-[10px] text-gray-500 font-medium">PACFA #28941 Encrypted</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients by name, email, GP clinic, or somatic concern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-gray-300 text-xs font-medium focus:outline-hidden focus:border-[#BA3D00] focus:ring-1 focus:ring-[#BA3D00] bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'all', label: 'All Clients' },
                { key: 'severe', label: 'High Severity' },
                { key: 'overdue', label: 'Overdue Forms' },
                { key: 'active', label: 'Scheduled' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === f.key
                      ? 'bg-[#130C76] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Client Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const hasOverdue = client.assignments.some(
              (a) => a.status === 'assigned' && new Date(a.deadline) < new Date()
            );
            const isHighSeverity = client.scoreHistory.some(
              (s) => s.severity?.includes('Severe') || s.severity?.includes('URGENT')
            );
            const initials = client.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={client.id}
                className="bg-white rounded-3xl p-5 border border-[#E5DFD5] hover:border-[#BA3D00] transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Initials + Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#130C76] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-sm text-gray-900 leading-tight">{client.name}</h3>
                          {client.age && (
                            <span className="text-[11px] text-gray-500 font-medium">({client.age}y)</span>
                          )}
                          {client.isDemo && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[200px]">{client.email}</p>
                      </div>
                    </div>

                    {isHighSeverity && (
                      <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-red-600" /> High Alert
                      </span>
                    )}
                  </div>

                  {/* Primary GP / Care Plan info */}
                  <div className="mt-3.5 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                    {client.gpDetails?.clinic ? (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Stethoscope className="w-3.5 h-3.5 text-[#130C76] shrink-0" />
                        <span className="truncate font-medium">
                          {client.gpDetails.name || 'GP'}: {client.gpDetails.clinic}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                        <span className="italic text-[11px]">No GP referral on file (Private)</span>
                      </div>
                    )}

                    {/* Somatic / Exercise-Integrated Profile Tag */}
                    {client.somaticProfile?.movement_frequency ? (
                      <div className="flex items-center gap-1.5 text-[#BA3D00] font-semibold text-[11px]">
                        <Dumbbell className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{client.somaticProfile.movement_frequency}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <Dumbbell className="w-3.5 h-3.5 shrink-0" />
                        <span className="italic">Somatic intake pending</span>
                      </div>
                    )}

                    {/* Latest Outcome Score or Trajectory Delta */}
                    {client.latestScore ? (
                      <div className="flex items-center gap-1.5 mt-2 bg-[#FBF9F5] p-2 rounded-xl border border-[#E5DFD5]">
                        <Activity className="w-3.5 h-3.5 text-[#130C76] shrink-0" />
                        <div className="text-[11px] leading-tight truncate">
                          <span className="font-bold text-[#130C76]">{client.latestScore.formTitle}: </span>
                          <span className="text-gray-700">{client.latestScore.severity || 'Completed'}</span>
                          {client.scoreHistory.length > 1 && (
                            <span className="ml-1.5 text-green-700 font-extrabold text-[10px]">
                              (Longitudinal Tracked)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : hasOverdue ? (
                      <div className="flex items-center gap-1 text-red-700 text-[11px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Overdue Intake / Screener
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Card Footer: Sessions count & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-500 font-medium">
                    <span className="font-extrabold text-[#130C76]">{client.totalSessions}</span> Session{client.totalSessions === 1 ? '' : 's'}
                    {client.clinicalNotes.length > 0 && ` • ${client.clinicalNotes.length} Note${client.clinicalNotes.length === 1 ? '' : 's'}`}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectClient(client.email)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#130C76] hover:bg-[#0038A8] text-white transition-all shadow-2xs flex items-center gap-1 cursor-pointer hover:scale-102"
                    >
                      <span>Chart</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E5DFD5] space-y-3">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-extrabold text-gray-800">No client records match your search</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Try adjusting your search query, or click &quot;Seed Test Cohort&quot; to populate demo client profiles (Sarah Jenkins, David Chen, Marcus Brody).
            </p>
            <button
              onClick={onSeedDemoData}
              className="mt-2 bg-[#BA3D00] hover:bg-[#9E3400] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Seed Test Cohort (3 Clients)
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: 360° CLIENT CHART & DOSSIER VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Navigation & Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <button
            onClick={() => onSelectClient(null)}
            className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-[#130C76] hover:text-[#BA3D00] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&larr; Back to Client Directory</span>
          </button>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="bg-[#130C76]/10 text-[#130C76] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              PACFA #28941 Client Dossier
            </span>
            {selectedClient.isDemo && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Demo Patient
              </span>
            )}
          </div>
        </div>

        {/* Client Master Profile Banner */}
        <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#130C76] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {selectedClient.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-[#130C76]">{selectedClient.name}</h1>
                {selectedClient.dob && (
                  <span className="text-xs text-gray-500 font-medium">
                    DOB: {new Date(selectedClient.dob).toLocaleDateString('en-AU')} ({selectedClient.age} yrs)
                  </span>
                )}
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  PACFA Private Health Fund Eligible
                </span>
                {selectedClient.gpDetails?.clinic && (
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    MHTP: {selectedClient.gpDetails.clinic}
                  </span>
                )}
              </div>

              {/* Contact metadata strip */}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedClient.email}
                </span>
                {selectedClient.phone && (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedClient.phone}
                  </span>
                )}
                {selectedClient.address && (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {selectedClient.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedClient.upcomingAppt?.telehealth_room_id && (
              <Link
                href={`/telehealth/${selectedClient.upcomingAppt.telehealth_room_id}?role=clinician`}
                className="bg-[#130C76] hover:bg-[#0038A8] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-[#FFAC24]" />
                Join Telehealth Video
              </Link>
            )}

            <button
              onClick={() => onDraftNoteForClient({ name: selectedClient.name, email: selectedClient.email })}
              className="bg-[#BA3D00] hover:bg-[#9E3400] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Draft SOAP Note
            </button>

            <button
              onClick={() =>
                onGenerateGpLetterForClient({
                  name: selectedClient.name,
                  email: selectedClient.email,
                  dob: selectedClient.dob,
                  gp: selectedClient.gpDetails,
                })
              }
              className="bg-white border border-gray-300 hover:border-[#130C76] text-[#130C76] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-50"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#130C76]" />
              GP Letter
            </button>

            <button
              onClick={() => onAssignFormForClient({ name: selectedClient.name, email: selectedClient.email })}
              className="bg-white border border-gray-300 hover:border-[#BA3D00] text-[#130C76] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-50"
            >
              <Plus className="w-3.5 h-3.5 text-[#BA3D00]" />
              Assign Screener
            </button>
          </div>
        </div>

        {/* Dossier Sub-Tabs Bar */}
        <div className="flex border-b border-gray-200 mt-6 space-x-6 overflow-x-auto text-xs font-bold">
          {[
            {
              key: 'movement',
              label: 'Active Movement & Somatic Profile',
              icon: Dumbbell,
              badge: selectedClient.somaticProfile?.movement_frequency ? 'Active' : undefined,
            },
            {
              key: 'psychometrics',
              label: 'Psychometric Trajectory & Deltas',
              icon: Activity,
              count: selectedClient.scoreHistory.length,
            },
            {
              key: 'notes',
              label: 'Clinical Notes & Letters',
              icon: Lock,
              count: selectedClient.clinicalNotes.length,
            },
            {
              key: 'forms',
              label: 'Assigned Screeners',
              icon: CheckCircle2,
              count: selectedClient.assignments.length,
            },
            {
              key: 'appointments',
              label: 'Appointments',
              icon: CalendarIcon,
              count: selectedClient.appointments.length,
            },
            {
              key: 'medical',
              label: 'Medical & GP Dossier',
              icon: Stethoscope,
              badge: selectedClient.gpDetails?.clinic ? 'MHTP' : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDossierTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveDossierTab(tab.key as any)}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#BA3D00] text-[#130C76]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#BA3D00]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#BA3D00]/10 text-[#BA3D00]' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DOSSIER SUB-TAB 1: ACTIVE MOVEMENT & SOMATIC PROFILE (P2) */}
      {/* ======================================================== */}
      {activeDossierTab === 'movement' && (
        <div className="space-y-6">
          {/* Somatic Integration Scope Callout */}
          <div className="bg-[#130C76] text-white rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#BA3D00] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Exercise-Integrated Psychotherapy
                  </span>
                  <span className="text-xs text-gray-300">Luke Piatti (MCouns, UQ; PACFA Reg. #28941)</span>
                </div>
                <h3 className="text-lg font-black mt-1">Somatic Arousal & Movement Prescription Profile</h3>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Integrating physical exercise, resistance training, and somatic pacing into evidence-based psychotherapy to regulate autonomic nervous system states, discharge fight/flight energy, and build interoceptive grounding.
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center shrink-0">
                <span className="text-[10px] text-gray-300 uppercase tracking-wider block font-bold">Interoceptive State</span>
                <span className="text-sm font-extrabold text-[#FFAC24]">
                  {selectedClient.somaticProfile?.tension_areas?.length ? 'Sympathetic Dominance' : 'Baseline / In Progress'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Physical Activity & Gym Baseline */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#BA3D00]" />
                Physical Activity & Gym Training Baseline
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Weekly Exercise Frequency & Modality
                  </span>
                  <p className="font-extrabold text-gray-900 mt-1">
                    {selectedClient.somaticProfile?.movement_frequency || 'Sedentary / Desk Work'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Sleep Architecture & Autonomic Recovery
                  </span>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedClient.somaticProfile?.sleep_quality || 'Broken sleep, waking unrefreshed.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Autonomic & Panic Fight/Flight Sensations
                  </span>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedClient.somaticProfile?.panic_fight_flight_symptoms || 'Restless motor agitation, tight chest on peak stress.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Anatomical Somatic Tension Trigger Map */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#BA3D00]" />
                Anatomical Somatic Tension & Trigger Zones
              </h4>
              <p className="text-xs text-gray-500">
                Identified body regions exhibiting muscular bracing, sympathetic nervous system hyperarousal, or motor restriction.
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    area: 'Cervical & Upper Trapezius',
                    desc: 'Neck stiffness, elevated shoulder girdle, tension headaches from chronic desk postures.',
                    active: selectedClient.somaticProfile?.tension_areas?.some((t) => t.includes('Neck') || t.includes('Trapezius') || t.includes('Shoulder')),
                  },
                  {
                    area: 'Temporomandibular (Jaw / TMJ)',
                    desc: 'Nocturnal bruxism, masseter tightness, clenching during cognitive deadline pressure.',
                    active: selectedClient.somaticProfile?.tension_areas?.some((t) => t.includes('Jaw') || t.includes('TMJ')),
                  },
                  {
                    area: 'Thoracic & Diaphragmatic Restriction',
                    desc: 'Clavicular breathing pattern, reduced vagal excursion, sensation of chest constriction.',
                    active: selectedClient.somaticProfile?.tension_areas?.some((t) => t.includes('Diaphragm') || t.includes('Breathing') || t.includes('Thoracic')),
                  },
                  {
                    area: 'Lumbar & Pelvic Floor Compression',
                    desc: 'Prolonged sitting lordosis, hip flexor (psoas) shortening, reduced pelvic mobility.',
                    active: selectedClient.somaticProfile?.tension_areas?.some((t) => t.includes('Back') || t.includes('Hip') || t.includes('Sitting')),
                  },
                ].map((zone) => (
                  <div
                    key={zone.area}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      zone.active
                        ? 'bg-amber-50/70 border-amber-300 text-gray-900'
                        : 'bg-[#FBF9F5] border-[#E5DFD5] text-gray-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${zone.active ? 'bg-[#BA3D00]' : 'bg-gray-300'}`} />
                        {zone.area}
                      </span>
                      {zone.active && (
                        <span className="text-[9px] font-extrabold uppercase bg-[#BA3D00] text-white px-2 py-0.5 rounded-full">
                          Active Focus
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-1 text-gray-700 leading-snug">{zone.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Orthopedic Precautions & Movement Limitations */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                Orthopedic Precautions & Safety Modifications
              </h4>
              <p className="text-xs text-gray-500">
                Pre-existing musculoskeletal issues or injuries requiring pacing adaptation during in-session movement work.
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-2">
                <span className="font-extrabold text-emerald-900 block">Reported Physical Limitations:</span>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {selectedClient.somaticProfile?.physical_injuries_limitations ||
                    'Nil reported structural injuries. Safe for moderate resistance training and proprioceptive pacing.'}
                </p>
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  PACFA Scope Confirmed: Non-diagnostic therapeutic movement and somatic grounding.
                </div>
              </div>
            </div>

            {/* Card 4: Luke's Clinician Somatic Observations & Notes */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#BA3D00]" />
                  Luke&apos;s Somatic & Movement Interventions
                </h4>
                {somaticNoteSaved && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Document real-time physical observations, movement cues, and down-regulation exercises prescribed.
              </p>

              <textarea
                rows={5}
                value={somaticNotesInput}
                onChange={(e) => setSomaticNotesInput(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-gray-300 text-xs font-mono focus:outline-hidden focus:border-[#BA3D00] focus:ring-1 focus:ring-[#BA3D00] bg-[#FBF9F5]"
                placeholder="Record somatic movement observations, resistance training cues, and interoceptive responses..."
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSomaticNotes}
                  className="bg-[#130C76] hover:bg-[#0038A8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-[#FFAC24]" />
                  Save Somatic Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOSSIER SUB-TAB 2: PSYCHOMETRIC TRAJECTORY & DELTAS (P1)  */}
      {/* ======================================================== */}
      {activeDossierTab === 'psychometrics' && (
        <div className="space-y-6">
          {/* Trajectory Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#BA3D00] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Evidence-Based Allied Health
                  </span>
                  <span className="text-xs text-gray-500">Longitudinal Outcome Measurement Suite</span>
                </div>
                <h3 className="text-xl font-black text-[#130C76] mt-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#BA3D00]" />
                  Psychometric Score Trajectories & Outcome Deltas
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                  Tracking validated psychometric changes across treatment (DASS-21, K10, GAD-7, PHQ-9). Comparing baseline assessments against current clinical scores to establish objective symptom reduction.
                </p>
              </div>

              <button
                onClick={() => onAssignFormForClient({ name: selectedClient.name, email: selectedClient.email })}
                className="bg-[#130C76] hover:bg-[#0038A8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFAC24]" />
                Assign Next Progress Measure
              </button>
            </div>

            {/* Visual Trajectory Cards */}
            {trajectoryData && trajectoryData.length > 0 ? (
              <div className="mt-6 space-y-6">
                {trajectoryData.map((traj, idx) => {
                  const isImprovement = traj.overallPercentage < 0;
                  const isEscalation = traj.overallPercentage > 10;

                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-6"
                    >
                      {/* Trajectory Title & Direction Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-[#130C76]">{traj.title}</h4>
                            <span className="text-xs text-gray-500">
                              ({traj.count} administration{traj.count === 1 ? '' : 's'})
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Baseline: {new Date(traj.baselineDate).toLocaleDateString('en-AU')} &rarr; Current:{' '}
                            {new Date(traj.currentDate).toLocaleDateString('en-AU')}
                          </p>
                        </div>

                        {traj.count > 1 ? (
                          <div
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 self-start sm:self-auto border ${
                              isImprovement
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : isEscalation
                                ? 'bg-red-100 text-red-900 border-red-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300'
                            }`}
                          >
                            {isImprovement ? (
                              <TrendingDown className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-red-700" />
                            )}
                            <span>
                              {isImprovement
                                ? `${Math.abs(traj.overallPercentage)}% Overall Symptom Reduction`
                                : `${traj.overallPercentage}% Score Change`}
                            </span>
                          </div>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold px-3 py-1 rounded-xl">
                            Baseline Established
                          </span>
                        )}
                      </div>

                      {/* DASS-21 Subscale Comparison Grid */}
                      {traj.type === 'dass-21' && traj.baselineScores && traj.currentScores && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Depression */}
                          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Depression Subscale
                            </span>
                            <div className="flex items-baseline justify-between">
                              <div className="space-x-1.5">
                                <span className="text-xl font-black text-[#130C76]">
                                  {traj.currentScores.depression}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {traj.baselineScores.depression}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                  traj.deltas.depression < 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {traj.deltas.depression < 0 ? `↓ ${traj.deltas.depression}` : `+${traj.deltas.depression}`} (
                                {traj.percentages.depression}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#BA3D00] h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (traj.currentScores.depression / 42) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 block">Normative cut-off: 0-9 Normal, 10-13 Mild, 14-20 Moderate, 21-27 Severe</span>
                          </div>

                          {/* Anxiety */}
                          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Anxiety Subscale
                            </span>
                            <div className="flex items-baseline justify-between">
                              <div className="space-x-1.5">
                                <span className="text-xl font-black text-[#130C76]">
                                  {traj.currentScores.anxiety}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {traj.baselineScores.anxiety}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                  traj.deltas.anxiety < 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {traj.deltas.anxiety < 0 ? `↓ ${traj.deltas.anxiety}` : `+${traj.deltas.anxiety}`} (
                                {traj.percentages.anxiety}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#FFAC24] h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (traj.currentScores.anxiety / 42) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 block">Normative cut-off: 0-7 Normal, 8-9 Mild, 10-14 Moderate, 15-19 Severe</span>
                          </div>

                          {/* Stress */}
                          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD5] space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Stress Subscale
                            </span>
                            <div className="flex items-baseline justify-between">
                              <div className="space-x-1.5">
                                <span className="text-xl font-black text-[#130C76]">
                                  {traj.currentScores.stress}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {traj.baselineScores.stress}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                  traj.deltas.stress < 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {traj.deltas.stress < 0 ? `↓ ${traj.deltas.stress}` : `+${traj.deltas.stress}`} (
                                {traj.percentages.stress}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#130C76] h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (traj.currentScores.stress / 42) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 block">Normative cut-off: 0-14 Normal, 15-18 Mild, 19-25 Moderate, 26-33 Severe</span>
                          </div>
                        </div>
                      )}

                      {/* Longitudinal Chronological Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-2xl border border-[#E5DFD5] overflow-hidden">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider bg-gray-50/70">
                              <th className="p-3 font-bold">Administration Date</th>
                              <th className="p-3 font-bold">Measure</th>
                              <th className="p-3 font-bold">Severity Classification</th>
                              <th className="p-3 font-bold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {traj.history.map((record, rIdx) => (
                              <tr key={record.id} className="hover:bg-gray-50/60">
                                <td className="p-3 font-semibold text-gray-800">
                                  {new Date(record.date).toLocaleDateString('en-AU', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                  {rIdx === 0 && (
                                    <span className="ml-2 bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                      Baseline
                                    </span>
                                  )}
                                  {rIdx === traj.history.length - 1 && traj.history.length > 1 && (
                                    <span className="ml-2 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                      Latest Follow-up
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 font-bold text-[#130C76]">{record.formTitle}</td>
                                <td className="p-3 font-medium text-gray-700">
                                  {record.severity || 'Completed assessment'}
                                </td>
                                <td className="p-3 text-right">
                                  <Link
                                    href={`/screeners/${record.id}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-[#130C76] hover:text-[#BA3D00] font-bold text-xs"
                                  >
                                    <span>View Answers</span>
                                    <ExternalLink className="w-3 h-3 text-[#BA3D00]" />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <Activity className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-700">No completed psychometric measures for this client yet.</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Assign DASS-21, K10, or GAD-7 to begin establishing this client&apos;s baseline and outcome tracking.
                </p>
                <button
                  onClick={() => onAssignFormForClient({ name: selectedClient.name, email: selectedClient.email })}
                  className="mt-3 bg-[#BA3D00] hover:bg-[#9E3400] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign DASS-21 Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOSSIER SUB-TAB 3: CLINICAL NOTES & LETTERS TIMELINE      */}
      {/* ======================================================== */}
      {activeDossierTab === 'notes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-[#130C76] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#BA3D00]" />
                  Clinical Notes & GP Letters Timeline ({selectedClient.clinicalNotes.length})
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  PACFA Documented Clinical Records for {selectedClient.name}.
                </p>
              </div>

              <button
                onClick={() => onDraftNoteForClient({ name: selectedClient.name, email: selectedClient.email })}
                className="bg-[#130C76] hover:bg-[#0038A8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Pencil className="w-3.5 h-3.5 text-[#FFAC24]" />
                + Draft New Note for {selectedClient.name}
              </button>
            </div>

            {selectedClient.clinicalNotes.length > 0 ? (
              <div className="mt-6 space-y-4">
                {selectedClient.clinicalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#130C76] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                          {note.template_type || note.note_type}
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          {new Date(note.created_at).toLocaleDateString('en-AU', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {note.is_locked ? (
                          <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked & Signed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            Draft Note
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-gray-500 font-medium">Luke Piatti, MCouns, UQ</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <strong className="text-[#130C76] block mb-1">Subjective (Client Experience):</strong>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.subjective || 'Nil reported.'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <strong className="text-[#130C76] block mb-1">Objective (Observations & Scores):</strong>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.objective || 'Nil recorded.'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <strong className="text-[#130C76] block mb-1">Assessment (Clinical Interpretation):</strong>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.assessment || 'Nil documented.'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-200">
                        <strong className="text-[#130C76] block mb-1">Plan & Movement Prescriptions:</strong>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.plan || 'Nil specified.'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <Lock className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-700">No clinical notes recorded yet for this client.</p>
                <button
                  onClick={() => onDraftNoteForClient({ name: selectedClient.name, email: selectedClient.email })}
                  className="mt-2 bg-[#BA3D00] hover:bg-[#9E3400] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Draft First Session Note
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOSSIER SUB-TAB 4: ASSIGNED SCREENERS & SUBMISSIONS       */}
      {/* ======================================================== */}
      {activeDossierTab === 'forms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-[#130C76] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#BA3D00]" />
                  Assigned Screeners & Submissions ({selectedClient.assignments.length})
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track completion status, submission dates, and clinical severity levels.
                </p>
              </div>

              <button
                onClick={() => onAssignFormForClient({ name: selectedClient.name, email: selectedClient.email })}
                className="bg-[#130C76] hover:bg-[#0038A8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFAC24]" />
                + Assign Another Screener
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">Screener Form</th>
                    <th className="pb-3 font-bold">Deadline</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold">Clinical Severity</th>
                    <th className="pb-3 font-bold">Completed At</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedClient.assignments.map((asg) => {
                    const isDone = asg.status === 'completed';
                    const isOverdue = !isDone && new Date(asg.deadline) < new Date();
                    return (
                      <tr key={asg.id} className="hover:bg-gray-50/60">
                        <td className="py-3.5 font-bold text-[#130C76]">{asg.form?.title || 'Screener'}</td>
                        <td className="py-3.5 text-gray-600 font-medium">
                          {new Date(asg.deadline).toLocaleDateString('en-AU')}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDone
                                ? 'bg-green-100 text-green-700'
                                : isOverdue
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isDone ? 'Completed' : isOverdue ? 'Overdue' : 'Assigned'}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-gray-800">
                          {asg.clinical_severity || '—'}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {asg.completed_at ? new Date(asg.completed_at).toLocaleDateString('en-AU') : '—'}
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={`/screeners/${asg.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 bg-white border border-[#E5DFD5] hover:border-[#BA3D00] text-[#130C76] px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3 text-[#BA3D00]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {selectedClient.assignments.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-xs">No screeners have been assigned to this client yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOSSIER SUB-TAB 5: APPOINTMENTS & SCHEDULE HISTORY        */}
      {/* ======================================================== */}
      {activeDossierTab === 'appointments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD5] shadow-xs">
            <h3 className="text-xl font-black text-[#130C76] flex items-center gap-2 mb-6">
              <CalendarIcon className="w-5 h-5 text-[#BA3D00]" />
              Appointment & Consultation History ({selectedClient.appointments.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">Service / Consultation</th>
                    <th className="pb-3 font-bold">Date & Time</th>
                    <th className="pb-3 font-bold">Modality</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Telehealth Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedClient.appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-gray-50/60">
                      <td className="py-3.5 font-bold text-[#130C76]">
                        {appt.service?.title || `${appt.duration_minutes}-Min Consult`}
                      </td>
                      <td className="py-3.5 text-gray-700 font-medium">
                        {new Date(appt.scheduled_at).toLocaleDateString('en-AU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(appt.scheduled_at).toLocaleTimeString('en-AU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-800 uppercase text-[11px]">
                          {appt.modality === 'video' ? <Video className="w-3.5 h-3.5 text-[#BA3D00]" /> : null}
                          {appt.modality}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {appt.modality === 'video' && appt.telehealth_room_id ? (
                          <Link
                            href={`/telehealth/${appt.telehealth_room_id}?role=clinician`}
                            className="bg-[#130C76] hover:bg-[#0038A8] text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5 text-[#FFAC24]" /> Enter Video Room
                          </Link>
                        ) : (
                          <span className="text-gray-400 italic">In-Person / Phone</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedClient.appointments.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-xs">No consultations recorded in schedule yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DOSSIER SUB-TAB 6: MEDICAL, GP & EMERGENCY DOSSIER       */}
      {/* ======================================================== */}
      {activeDossierTab === 'medical' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Referring GP */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#BA3D00]" />
                  Referring General Practitioner (GP)
                </h4>
                <button
                  onClick={() =>
                    onGenerateGpLetterForClient({
                      name: selectedClient.name,
                      email: selectedClient.email,
                      dob: selectedClient.dob,
                      gp: selectedClient.gpDetails,
                    })
                  }
                  className="text-xs font-bold text-[#BA3D00] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  Draft GP Letter &rarr;
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Doctor Name:</span>
                  <p className="font-extrabold text-gray-900 text-sm">
                    {selectedClient.gpDetails?.name || 'Dr. Andrew Collins'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Medical Practice:</span>
                  <p className="font-bold text-gray-800">
                    {selectedClient.gpDetails?.clinic || 'Logan Central Medical Clinic'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Practice Address:</span>
                  <p className="text-gray-700">
                    {selectedClient.gpDetails?.address || 'Shop 4, 12 Wembley Rd, Logan Central QLD 4114'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Phone / Fax:</span>
                  <p className="text-gray-700">{selectedClient.gpDetails?.phone || '07 3808 1234'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                Emergency Contact Details
              </h4>

              <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Contact Name:</span>
                  <p className="font-extrabold text-gray-900 text-sm">
                    {selectedClient.emergencyContact?.name || 'Mark Jenkins'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Relationship:</span>
                  <p className="font-bold text-gray-800">
                    {selectedClient.emergencyContact?.relationship || 'Spouse / Partner'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Emergency Phone:</span>
                  <p className="text-gray-700 font-mono font-bold">
                    {selectedClient.emergencyContact?.phone || '0412 999 888'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Medications & Medical History */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#130C76]" />
                Medications & Physical Health
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Current Medications & Supplements:
                  </span>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedClient.medications || 'Escitalopram 10mg daily (commenced 3 months ago)'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Medical & Physical History:
                  </span>
                  <p className="text-gray-800 mt-1">
                    {selectedClient.medicalHistory || 'Occasional migraines, desk-work cervical tension.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Safety & Risk History */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5DFD5] shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#130C76] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Safety & Risk Assessment History
              </h4>

              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200 text-xs space-y-2">
                <span className="font-extrabold text-red-900 block">Reported Risk Status & Protective Factors:</span>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {selectedClient.safetyRiskHistory ||
                    'No active suicidal ideation or intent. Denies history of self-harm. Protective factors: supportive partner, employment, pet.'}
                </p>
                <div className="pt-2 border-t border-red-200/60 text-[11px] text-red-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  National Crisis Numbers provided on all client intake and screener forms (000, 13 11 14).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
