'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MMHFormAssignment, ScreenerQuestion } from '@/lib/types';
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
import { 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  ShieldAlert,
  Info,
  PhoneCall,
  HeartHandshake
} from 'lucide-react';
import Link from 'next/link';

export default function ScreenerSubmissionPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<MMHFormAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);

  // Quick escape (1800RESPECT standard)
  const handleQuickEscape = () => {
    window.location.replace('https://www.bom.gov.au');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showCrisisModal) {
        handleQuickEscape();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCrisisModal]);

  useEffect(() => {
    async function fetchAssignment() {
      setLoading(true);
      const { data } = await supabase
        .from('mmh_form_assignments')
        .select('*, form:mmh_forms(*)')
        .eq('id', assignmentId)
        .single();

      if (data) {
        setAssignment(data as MMHFormAssignment);
        if (data.status === 'completed') {
          setIsSubmitted(true);
          setSubmissionResult(data.score_summary);
        }
      }
      setLoading(false);
    }

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    // Real-time Duty of Care Interceptor for suicidal ideation / acute risk
    const isPhq9SuicideItem = assignment?.form?.slug === 'phq-9' && (questionId === 'q9' || questionId === 'phq9_9');
    if (isPhq9SuicideItem && Number(value) > 0 && !crisisAcknowledged) {
      setShowCrisisModal(true);
    }
  };

  const handleMultiSelectToggle = (questionId: string, option: string) => {
    const current: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    if (current.includes(option)) {
      setAnswers((prev) => ({ ...prev, [questionId]: current.filter((item) => item !== option) }));
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: [...current, option] }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment || !assignment.form) return;
    setValidationError(null);

    const questions: ScreenerQuestion[] = assignment.form.questions || [];
    const unanswered = questions.filter(
      (q) => answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === ''
    );
    if (unanswered.length > 0) {
      setValidationError(`Please complete all ${questions.length} questions before submitting (currently missing ${unanswered.length} ${unanswered.length === 1 ? 'question' : 'questions'}).`);
      return;
    }

    setIsSubmitting(true);

    let scoreSummary: any = {};
    let severityFlag = 'Completed';
    const slug = assignment.form.slug;

    if (slug === 'dass-21') {
      const res = scoreDass21(answers);
      scoreSummary = res;
      severityFlag = `D:${res.severity.depression} | A:${res.severity.anxiety} | S:${res.severity.stress}`;
    } else if (slug === 'gad-7') {
      const res = scoreGad7(answers);
      scoreSummary = res;
      severityFlag = res.severity;
    } else if (slug === 'phq-9') {
      const res = scorePhq9(answers);
      scoreSummary = res;
      severityFlag = res.hasSelfHarmRisk
        ? `URGENT: Suicide/Self-Harm Flag (Item 9) | ${res.severity}`
        : `${res.severity} Depression (Score: ${res.total}/27)`;
    } else if (slug === 'k10') {
      const res = scoreK10(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/50)`;
    } else if (slug === 'pcl-5') {
      const res = scorePcl5(answers);
      scoreSummary = res;
      severityFlag = `${res.probablePTSD ? 'Probable PTSD' : res.severity} (Score: ${res.total}/80)`;
    } else if (slug === 'asrs-v1') {
      const res = scoreAsrs(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Part A: ${res.shadedCount}/6 Criteria)`;
    } else if (slug === 'ais') {
      const res = scoreAis(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/24)`;
    } else if (slug === 'brs') {
      const res = scoreBrs(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Mean: ${res.meanScore}/5.00)`;
    } else if (slug === 'crafft') {
      const res = scoreCrafft(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (${res.score}/6 Indicators)`;
    } else if (slug === 'wsas') {
      const res = scoreWsas(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/40)`;
    } else if (slug === 'aq-10') {
      const res = scoreAq10(answers);
      scoreSummary = res;
      severityFlag = `${res.severity} (Score: ${res.total}/10)`;
    } else {
      scoreSummary = { totalAnswered: Object.keys(answers).length };
      severityFlag = 'Intake Submitted';
    }

    const isCrisis = slug === 'phq-9' && answers['q9'] && Number(answers['q9']) > 0;

    // Call stored procedure RPC (SECURITY DEFINER)
    const { data: rpcRes, error: rpcError } = await (supabase.rpc as any)('submit_screener_result', {
      p_assignment_id: assignment.id,
      p_answers: answers,
      p_score_summary: scoreSummary,
      p_clinical_severity: severityFlag,
      p_is_crisis_flagged: Boolean(isCrisis),
    });

    if (rpcError) {
      // Fallback in case RPC is not cached/accessible
      const { error: updateError } = await supabase
        .from('mmh_form_assignments')
        .update({
          status: 'completed',
          answers: answers,
          score_summary: scoreSummary,
          clinical_severity: severityFlag,
          completed_at: new Date().toISOString(),
        })
        .eq('id', assignment.id);

      if (updateError) {
        setValidationError(`Failed to submit screener: ${updateError.message || 'Database error'}. Please try again.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Dispatch real-time clinical notification alert to Luke
    try {
      await fetch('/api/alerts/clinician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: assignment.client_name,
          client_email: assignment.client_email,
          form_title: assignment.form.title,
          severity: severityFlag,
          scores: scoreSummary,
          submitted_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('Clinician alert logging:', err);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    setSubmissionResult(scoreSummary);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-[#F96100] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-gray-500 font-medium">Loading your confidential screener...</p>
      </div>
    );
  }

  if (!assignment || !assignment.form) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Assignment Not Found</h2>
        <p className="text-xs text-gray-500 mt-2">This assessment link may have expired or is invalid.</p>
        <Link href="/portal" className="inline-block mt-4 text-xs font-bold text-[#F96100]">
          Return to Client Portal &rarr;
        </Link>
      </div>
    );
  }

  const form = assignment.form;
  const questions: ScreenerQuestion[] = form.questions || [];
  const slug = form.slug;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link href="/portal" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#130C76] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Client Portal
        </Link>

        {/* 1800RESPECT Safe Exit / Quick Escape */}
        <button
          type="button"
          onClick={handleQuickEscape}
          title="Instantly leave this page and redirect to Australian Weather (BOM) to protect your privacy"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>Quick Safety Exit (Esc)</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5DFD5] shadow-lg">
        {/* Form Title & Instructions */}
        <div className="border-b border-gray-100 pb-6 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F96100] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Confidential Clinical Screener
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#130C76]">{form.title}</h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{form.description}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
            <span>Client: <strong>{assignment.client_name}</strong></span>
            <span>•</span>
            <span>Category: <strong className="text-[#130C76]">{form.category}</strong></span>
            <span>•</span>
            <span>Deadline: <strong>{new Date(assignment.deadline).toLocaleDateString('en-AU')}</strong></span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#130C76]">Screener Received</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Thank you for completing this assessment. Your responses have been encrypted and delivered directly to Luke to review prior to your next consultation.
            </p>

            {/* Visual Clinical Score Summary depending on Instrument */}
            {submissionResult && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 max-w-lg mx-auto text-left text-xs space-y-3 mt-4">
                <span className="font-bold text-gray-700 block uppercase tracking-wider">Clinical Scoring Summary:</span>

                {/* DASS-21 */}
                {slug === 'dass-21' && submissionResult.severity && (
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Depression</span>
                      <span className="font-extrabold text-sm text-[#130C76] block mt-1">{submissionResult.severity.depression}</span>
                      <span className="text-[10px] text-gray-500">Score: {submissionResult.depression}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Anxiety</span>
                      <span className="font-extrabold text-sm text-[#F96100] block mt-1">{submissionResult.severity.anxiety}</span>
                      <span className="text-[10px] text-gray-500">Score: {submissionResult.anxiety}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Stress</span>
                      <span className="font-extrabold text-sm text-[#0038A8] block mt-1">{submissionResult.severity.stress}</span>
                      <span className="text-[10px] text-gray-500">Score: {submissionResult.stress}</span>
                    </div>
                  </div>
                )}

                {/* PHQ-9 */}
                {slug === 'phq-9' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Depression Severity Band:</span>
                      <span className="font-extrabold text-[#130C76]">{submissionResult.severity} (Score: {submissionResult.total}/27)</span>
                    </div>
                    <p className="text-[11px] text-gray-500 italic">{submissionResult.recommendation}</p>
                    {submissionResult.hasSelfHarmRisk && (
                      <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Self-Harm / Suicide risk screener item flagged. Luke has been notified for clinical safety review.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* K10 */}
                {slug === 'k10' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Distress Level:</span>
                      <span className="font-extrabold text-[#130C76]">{submissionResult.severity} ({submissionResult.total}/50)</span>
                    </div>
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                      <strong>Normative Benchmark:</strong> {submissionResult.normativePercentile}
                    </div>
                    <p className="text-[11px] text-gray-500">{submissionResult.clinicalSummary}</p>
                  </div>
                )}

                {/* PCL-5 */}
                {slug === 'pcl-5' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">PTSD Classification:</span>
                      <span className={`font-extrabold ${submissionResult.probablePTSD ? 'text-red-600' : 'text-[#130C76]'}`}>
                        {submissionResult.severity} (Score: {submissionResult.total}/80)
                      </span>
                    </div>
                    {submissionResult.clusters && (
                      <div className="grid grid-cols-4 gap-1.5 text-center pt-1 text-[10px]">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <span className="block text-gray-400 font-bold">B: Intrusion</span>
                          <span className="font-extrabold text-gray-900 mt-0.5">{submissionResult.clusters.B_Intrusions}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <span className="block text-gray-400 font-bold">C: Avoidance</span>
                          <span className="font-extrabold text-gray-900 mt-0.5">{submissionResult.clusters.C_Avoidance}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <span className="block text-gray-400 font-bold">D: Mood/Cog</span>
                          <span className="font-extrabold text-gray-900 mt-0.5">{submissionResult.clusters.D_CognitionAndMood}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <span className="block text-gray-400 font-bold">E: Arousal</span>
                          <span className="font-extrabold text-gray-900 mt-0.5">{submissionResult.clusters.E_ArousalAndReactivity}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ASRS v1.1 */}
                {slug === 'asrs-v1' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Part A Criteria Met:</span>
                      <span className="font-extrabold text-[#F96100]">{submissionResult.shadedCount} / 6 Criteria</span>
                    </div>
                    <p className="text-[11px] text-gray-600">{submissionResult.interpretation}</p>
                  </div>
                )}

                {/* AIS */}
                {slug === 'ais' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Insomnia Severity:</span>
                      <span className="font-extrabold text-[#130C76]">{submissionResult.severity} ({submissionResult.total}/24)</span>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                      <strong>Somatic Note:</strong> {submissionResult.somaticGuidance}
                    </div>
                  </div>
                )}

                {/* BRS */}
                {slug === 'brs' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Resilience Index:</span>
                      <span className="font-extrabold text-[#130C76]">{submissionResult.severity} ({submissionResult.meanScore}/5.00)</span>
                    </div>
                    <p className="text-[11px] text-gray-600">{submissionResult.interpretation}</p>
                  </div>
                )}

                {/* CRAFFT */}
                {slug === 'crafft' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Substance Risk Index:</span>
                      <span className={`font-extrabold ${submissionResult.highRisk ? 'text-red-600' : 'text-green-700'}`}>
                        {submissionResult.severity} ({submissionResult.score}/6)
                      </span>
                    </div>
                    {submissionResult.riskFactors && submissionResult.riskFactors.length > 0 && (
                      <div className="text-[11px] text-gray-600">
                        <strong>Flagged Indicators:</strong> {submissionResult.riskFactors.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* WSAS */}
                {slug === 'wsas' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Functional Impairment:</span>
                      <span className="font-extrabold text-[#130C76]">{submissionResult.severity} ({submissionResult.total}/40)</span>
                    </div>
                    <p className="text-[11px] text-gray-600">{submissionResult.functionalImpact}</p>
                  </div>
                )}

                {/* AQ-10 */}
                {slug === 'aq-10' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700">Autism Screening Result:</span>
                      <span className="font-extrabold text-[#130C76]">{submissionResult.severity} ({submissionResult.total}/10)</span>
                    </div>
                    <p className="text-[11px] text-gray-600">{submissionResult.details}</p>
                  </div>
                )}
              </div>
            )}

            {/* Permanent 24/7 Australian Crisis Support Helplines */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs text-red-900 space-y-2 mt-6">
              <div className="flex items-center gap-1.5 font-bold text-red-700">
                <ShieldAlert className="w-4 h-4 text-red-600" /> Immediate 24/7 Crisis Support Numbers:
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed">
                Assessments are reviewed by Luke ahead of scheduled appointments. If you are experiencing acute distress, thoughts of harm, or need immediate assistance, free 24/7 support is always available:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-bold text-[11px]">
                <a href="tel:000" className="bg-white border border-red-200 p-2 rounded-xl text-center hover:bg-red-100/50 block transition-colors">
                  <span className="text-red-600 block text-[9px] uppercase font-bold">Emergency Services</span>
                  000
                </a>
                <a href="tel:131114" className="bg-white border border-red-200 p-2 rounded-xl text-center hover:bg-red-100/50 block transition-colors">
                  <span className="text-red-600 block text-[9px] uppercase font-bold">Lifeline 24/7</span>
                  13 11 14
                </a>
                <a href="tel:1300659467" className="bg-white border border-red-200 p-2 rounded-xl text-center hover:bg-red-100/50 block transition-colors">
                  <span className="text-red-600 block text-[9px] uppercase font-bold">Suicide Call Back</span>
                  1300 659 467
                </a>
                <a href="tel:1300224636" className="bg-white border border-red-200 p-2 rounded-xl text-center hover:bg-red-100/50 block transition-colors">
                  <span className="text-red-600 block text-[9px] uppercase font-bold">Beyond Blue</span>
                  1300 22 4636
                </a>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/portal"
                className="bg-[#130C76] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#0038A8] transition-colors inline-block"
              >
                Return to Client Portal
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {validationError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            {/* Standard Instruction Banners for Validated Scales */}
            {slug === 'dass-21' && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-[#F96100]" /> Instructions:</p>
                <p>Please read each statement and select a score from 0 to 3 indicating how much the statement applied to you over the past week.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>0: Did not apply to me</span>
                  <span>1: Applied to some degree</span>
                  <span>2: Applied considerably</span>
                  <span>3: Applied very much</span>
                </div>
              </div>
            )}

            {(slug === 'phq-9' || slug === 'gad-7') && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-[#F96100]" /> Instructions:</p>
                <p>Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>0: Not at all</span>
                  <span>1: Several days</span>
                  <span>2: More than half the days</span>
                  <span>3: Nearly every day</span>
                </div>
              </div>
            )}

            {slug === 'k10' && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-[#130C76]" /> Australian GP MHCP Standard (K10):</p>
                <p>The following questions ask about how you have been feeling during the past 4 weeks (30 days).</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>1: None of the time</span>
                  <span>2: A little of the time</span>
                  <span>3: Some of the time</span>
                  <span>4: Most of the time</span>
                  <span>5: All of the time</span>
                </div>
              </div>
            )}

            {slug === 'pcl-5' && (
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 text-xs text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-purple-700" /> PTSD Checklist (DSM-5):</p>
                <p>Keeping a stressful or traumatic life experience in mind, please rate how much you have been bothered by that problem in the past month.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>0: Not at all</span>
                  <span>1: A little bit</span>
                  <span>2: Moderately</span>
                  <span>3: Quite a bit</span>
                  <span>4: Extremely</span>
                </div>
              </div>
            )}

            {slug === 'asrs-v1' && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-[#F96100]" /> Adult ADHD Screener (WHO ASRS v1.1):</p>
                <p>Please rate yourself on each criterion based on your everyday behavior over the past 6 months.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>0: Never</span>
                  <span>1: Rarely</span>
                  <span>2: Sometimes</span>
                  <span>3: Often</span>
                  <span>4: Very Often</span>
                </div>
              </div>
            )}

            {slug === 'brs' && (
              <div className="bg-green-50/70 border border-green-200/80 rounded-2xl p-4 text-xs text-green-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-green-700" /> Resilience Self-Report:</p>
                <p>Please rate your level of agreement with each statement regarding your recovery from stress and setbacks.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>1: Strongly Disagree</span>
                  <span>2: Disagree</span>
                  <span>3: Neutral</span>
                  <span>4: Agree</span>
                  <span>5: Strongly Agree</span>
                </div>
              </div>
            )}

            {slug === 'wsas' && (
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4 text-indigo-700" /> Work & Social Adjustment Instructions:</p>
                <p>Rate the extent to which your condition impairs your ability to carry out each activity on a scale from 0 to 8.</p>
                <div className="flex justify-between pt-2 text-[11px] font-semibold text-gray-700">
                  <span>0: Not at all</span>
                  <span>2: Slightly</span>
                  <span>4: Definitely</span>
                  <span>6: Markedly</span>
                  <span>8: Very severely</span>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#E5DFD5] text-[#130C76] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 leading-snug">{q.text}</p>
                      {q.critical_alert && (
                        <span className="inline-block mt-1 text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                          Confidential Safety Screener Item
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 0 to 3 scale (PHQ-9, GAD-7, DASS-21) */}
                  {q.type === 'scale_0_3' && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {[0, 1, 2, 3].map((val) => {
                        const isChosen = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-[#F96100] text-white border-[#F96100] shadow-xs scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 1 to 5 scale (K10, BRS) */}
                  {q.type === 'scale_1_5' && (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isChosen = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 0 to 4 scale (PCL-5, ASRS v1.1) */}
                  {q.type === 'scale_0_4' && (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {[0, 1, 2, 3, 4].map((val) => {
                        const isChosen = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-[#F96100] text-white border-[#F96100] shadow-xs scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 0 to 8 scale (WSAS) */}
                  {q.type === 'scale_0_8' && (
                    <div className="grid grid-cols-9 gap-1 sm:gap-2 pt-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((val) => {
                        const isChosen = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 1 to 4 scale (AQ-10) */}
                  {q.type === 'scale_1_4' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {[
                        { val: 1, label: 'Definitely Agree' },
                        { val: 2, label: 'Slightly Agree' },
                        { val: 3, label: 'Slightly Disagree' },
                        { val: 4, label: 'Definitely Disagree' },
                      ].map((opt) => {
                        const isChosen = answers[q.id] === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt.val)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              isChosen
                                ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Yes / No Toggle (CRAFFT) */}
                  {q.type === 'yes_no' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                      ].map((opt) => {
                        const isChosen = answers[q.id] === opt.value;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt.value)}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isChosen
                                ? opt.value
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

                  {/* Select radio options (AIS, Somatic Intake) */}
                  {q.type === 'select' && q.options && (
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                            answers[q.id] === opt
                              ? 'border-[#F96100] bg-white font-bold text-[#130C76]'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                            className="text-[#F96100] focus:ring-[#F96100]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Multiselect options */}
                  {q.type === 'multiselect' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                        return (
                          <label
                            key={opt}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                              checked
                                ? 'border-[#F96100] bg-white font-bold text-[#130C76]'
                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleMultiSelectToggle(q.id, opt)}
                              className="text-[#F96100] focus:ring-[#F96100] rounded-xs"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Textarea */}
                  {q.type === 'text' && (
                    <textarea
                      rows={3}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Type your notes or response here..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Encrypted & protected under Australian Privacy Principles
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#F96100] hover:bg-[#d65300] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Duty of Care Crisis Interceptor Modal */}
      {showCrisisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-red-200 space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BA3D00]">
                Immediate Duty of Care Support
              </span>
              <h2 className="text-xl font-black text-[#130C76]">
                We are listening. You don&apos;t have to carry this alone.
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                You indicated experiencing thoughts of self-harm or being better off dead. While Luke will review your responses, this screener is not monitored 24/7. Immediate, compassionate and confidential Australian clinical support is available right now:
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href="tel:000"
                className="flex items-center justify-between p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="block font-black text-sm">Emergency Services: 000</span>
                    <span className="text-[10px] text-red-100 font-normal">Immediate life-threatening risk or medical emergency</span>
                  </div>
                </div>
                <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black">Call 000</span>
              </a>

              <a
                href="tel:131114"
                className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-950 rounded-2xl font-bold text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span className="block font-black">Lifeline: 13 11 14</span>
                    <span className="text-[10px] text-red-700 font-normal">24/7 Crisis support and suicide prevention</span>
                  </div>
                </div>
                <span className="bg-red-200/60 px-2 py-0.5 rounded-lg text-[10px]">Call 24/7</span>
              </a>

              <a
                href="tel:1300659467"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 rounded-2xl font-bold text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-[#130C76] shrink-0" />
                  <div>
                    <span className="block font-black">Suicide Call Back Service: 1300 659 467</span>
                    <span className="text-[10px] text-gray-500 font-normal">Free nationwide professional telephone counselling</span>
                  </div>
                </div>
                <span className="bg-gray-200 px-2 py-0.5 rounded-lg text-[10px]">Call</span>
              </a>

              <a
                href="tel:1300224636"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 rounded-2xl font-bold text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-[#130C76] shrink-0" />
                  <div>
                    <span className="block font-black">Beyond Blue: 1300 22 4636</span>
                    <span className="text-[10px] text-gray-500 font-normal">24/7 Mental health support and advice</span>
                  </div>
                </div>
                <span className="bg-gray-200 px-2 py-0.5 rounded-lg text-[10px]">Call</span>
              </a>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-gray-500">
                Luke Piatti (PACFA #28941)
              </span>
              <button
                type="button"
                onClick={() => {
                  setCrisisAcknowledged(true);
                  setShowCrisisModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                I have noted these numbers, continue screener
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
