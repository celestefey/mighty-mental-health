'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MMHFormAssignment, ScreenerQuestion } from '@/lib/types';
import { scoreDass21, scoreGad7 } from '@/lib/scoring';
import { 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ScreenerSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<MMHFormAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    async function fetchAssignment() {
      setLoading(true);
      const { data, error } = await supabase
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
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment || !assignment.form) return;
    setIsSubmitting(true);

    let scoreSummary: any = {};
    let severityFlag = 'Completed';

    if (assignment.form.slug === 'dass-21') {
      const dassResult = scoreDass21(answers);
      scoreSummary = dassResult;
      severityFlag = `D:${dassResult.severity.depression} | A:${dassResult.severity.anxiety} | S:${dassResult.severity.stress}`;
    } else if (assignment.form.slug === 'gad-7') {
      const gadResult = scoreGad7(answers);
      scoreSummary = gadResult;
      severityFlag = gadResult.severity;
    } else {
      scoreSummary = { totalAnswered: Object.keys(answers).length };
      severityFlag = 'Intake Submitted';
    }

    const { error } = await supabase
      .from('mmh_form_assignments')
      .update({
        status: 'completed',
        answers: answers,
        score_summary: scoreSummary,
        clinical_severity: severityFlag,
        completed_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);

    setIsSubmitting(false);
    setIsSubmitted(true);
    setSubmissionResult(scoreSummary);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-[#F96100] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-gray-500">Loading your confidential screener...</p>
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#130C76] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Client Portal
      </Link>

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
              Thank you for completing this assessment. Your responses have been encrypted and delivered to Luke to review before your next consultation.
            </p>

            {submissionResult && submissionResult.severity && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 max-w-md mx-auto text-left text-xs space-y-2 mt-4">
                <span className="font-bold text-gray-700 block uppercase tracking-wider">Clinical Scoring Summary:</span>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
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
              </div>
            )}

            <div className="pt-6">
              <Link
                href="/portal"
                className="bg-[#130C76] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#0038A8] transition-colors"
              >
                Return to Portal
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {form.slug === 'dass-21' && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Instructions:</p>
                <p>Please read each statement and select a score from 0 to 3 indicating how much the statement applied to you over the past week.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-gray-700">
                  <span>0: Did not apply to me</span>
                  <span>1: Applied to some degree</span>
                  <span>2: Applied considerably</span>
                  <span>3: Applied very much</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E5DFD5] space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#E5DFD5] text-[#130C76] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{q.text}</p>
                  </div>

                  {q.type === 'scale_0_3' && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {[0, 1, 2, 3].map((val) => {
                        const isChosen = answers[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
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
                className="bg-[#F96100] hover:bg-[#d65300] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
