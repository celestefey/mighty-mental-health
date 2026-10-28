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
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHAppointment, MMHForm, MMHFormAssignment, MMHClinicalNote } from '@/lib/types';
import Link from 'next/link';

export default function ClinicianAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'forms' | 'assignments' | 'notes'>('schedule');
  
  // Data states
  const [appointments, setAppointments] = useState<MMHAppointment[]>([]);
  const [forms, setForms] = useState<MMHForm[]>([]);
  const [assignments, setAssignments] = useState<MMHFormAssignment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<MMHClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Builder state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<'screener' | 'intake' | 'somatic' | 'custom'>('custom');
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

      {/* Real-time Clinician Urgent Alert Banner if high severity submissions exist */}
      {assignments.some(a => a.clinical_severity && (a.clinical_severity.includes('Severe') || a.clinical_severity.includes('Extremely Severe'))) && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs animate-pulse">
              !
            </div>
            <div>
              <span className="font-extrabold text-sm text-red-900 block">High-Severity Clinical Screener Alert</span>
              <span className="text-xs text-red-700">One or more clients have submitted assessments flagged with Severe distress. Please review the Submissions tab.</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('assignments')}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-gray-50/60">
                      <td className="py-4">
                        <span className="font-extrabold text-sm text-gray-900 block">{appt.client_name}</span>
                        <span className="text-[11px] text-gray-500">{appt.client_email} • {appt.client_phone}</span>
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
                            href={`/telehealth/${appt.telehealth_room_id}`}
                            className="bg-[#130C76] hover:bg-[#0038A8] text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5 text-[#FFAC24]" /> Start Room
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
                  ))}
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
                    <th className="pb-3 font-bold text-right">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((asg) => {
                    const isDone = asg.status === 'completed';
                    return (
                      <tr key={asg.id} className="hover:bg-gray-50/60">
                        <td className="py-4">
                          <span className="font-extrabold text-sm text-gray-900 block">{asg.client_name}</span>
                          <span className="text-[11px] text-gray-500">{asg.client_email}</span>
                        </td>
                        <td className="py-4 font-bold text-[#130C76]">
                          {asg.form?.title || 'Assessment'}
                        </td>
                        <td className="py-4 text-gray-600 font-semibold">
                          {new Date(asg.deadline).toLocaleDateString('en-AU')}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {asg.status}
                          </span>
                        </td>
                        <td className="py-4">
                          {asg.clinical_severity ? (
                            <span className="font-bold text-[#F96100] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                              {asg.clinical_severity}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pending client submission</span>
                          )}
                        </td>
                        <td className="py-4 text-right text-gray-500">
                          {asg.completed_at ? new Date(asg.completed_at).toLocaleDateString('en-AU') : '—'}
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#130C76]">Clinical Assessment Library</h2>
                <p className="text-xs text-gray-500 mt-1">Pre-loaded standardized psychological instruments and custom clinician-built screeners.</p>
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
                className="bg-[#130C76] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#0038A8] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFAC24]" /> Create New Form
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <div key={form.id} className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-white border border-[#E5DFD5] text-[#130C76] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {form.category}
                      </span>
                      {form.is_template && (
                        <span className="text-[10px] text-gray-500 font-bold">Standard Template</span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-[#130C76] mb-1">{form.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">{form.description}</p>
                    <span className="text-[11px] text-gray-400 font-semibold block">
                      {form.questions?.length || 0} Questions configured
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
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
                      className="text-xs font-bold text-[#130C76] hover:text-[#F96100] transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Form
                    </button>
                    <button
                      onClick={() => {
                        setAssignFormId(form.id);
                        setIsAssignModalOpen(true);
                      }}
                      className="text-xs bg-[#F96100] hover:bg-[#d65300] text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Assign to Client
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                  className="bg-[#F96100] hover:bg-[#d65300] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs"
                >
                  Send Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
