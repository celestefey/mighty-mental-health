'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Heart, 
  Activity, 
  User, 
  Stethoscope, 
  Sparkles, 
  AlertCircle,
  ShieldAlert,
  FileText,
  Printer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHClientIntake } from '@/lib/types';
import Link from 'next/link';

export default function ClientIntakePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Personal & GP Details
  const [clientName, setClientName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [gpName, setGpName] = useState('');
  const [gpClinic, setGpClinic] = useState('');
  const [gpPhone, setGpPhone] = useState('');
  const [medicareNumber, setMedicareNumber] = useState('');

  // Step 2: Medical & Psychiatric History
  const [medications, setMedications] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [psychiatricHistory, setPsychiatricHistory] = useState('');
  const [previousTherapy, setPreviousTherapy] = useState('');

  // Step 3: Somatic, Nervous System & Movement Profile
  const [movementFrequency, setMovementFrequency] = useState('3-4 days');
  const [tensionAreas, setTensionAreas] = useState<string[]>(['Neck & Shoulders', 'Chest & Shallow Breathing']);
  const [sleepQuality, setSleepQuality] = useState('Waking frequently during the night');
  const [panicSymptoms, setPanicSymptoms] = useState('Occasionally (weekly)');
  const [physicalLimitations, setPhysicalLimitations] = useState('');

  // Step 4: Presenting Concerns, Goals & Safety
  const [presentingConcerns, setPresentingConcerns] = useState('');
  const [therapyGoals, setTherapyGoals] = useState('');
  const [safetyRiskHistory, setSafetyRiskHistory] = useState('None');
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleTensionArea = (area: string) => {
    if (tensionAreas.includes(area)) {
      setTensionAreas(tensionAreas.filter(a => a !== area));
    } else {
      setTensionAreas([...tensionAreas, area]);
    }
  };

  async function handleSubmitIntake(e: React.FormEvent) {
    e.preventDefault();
    if (!consentAgreed) {
      setErrorMessage('Please acknowledge the confidentiality and consent declaration to proceed.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    const intakePayload: MMHClientIntake = {
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      date_of_birth: dateOfBirth,
      address,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      emergency_contact_relationship: emergencyRel,
      gp_name: gpName,
      gp_clinic: gpClinic,
      gp_phone: gpPhone,
      medications,
      medical_history: medicalHistory,
      psychiatric_history: psychiatricHistory,
      somatic_movement_profile: {
        movement_frequency: movementFrequency,
        tension_areas: tensionAreas,
        sleep_quality: sleepQuality,
        panic_fight_flight_symptoms: panicSymptoms,
        physical_injuries_limitations: physicalLimitations,
      },
      presenting_concerns: presentingConcerns,
      therapy_goals: therapyGoals,
      safety_risk_history: safetyRiskHistory,
      is_demo: false,
    };

    try {
      // 1. Insert into mmh_client_intakes
      const { error: intakeError } = await supabase
        .from('mmh_client_intakes')
        .insert(intakePayload);

      if (intakeError) throw intakeError;

      // 2. Also forward to intake alert webhook for Luke
      try {
        await fetch('/api/webhooks/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            gp_name: gpName,
            gp_clinic: gpClinic,
            presenting_concerns: presentingConcerns,
            therapy_goals: therapyGoals,
            somatic_profile: intakePayload.somatic_movement_profile,
            submitted_at: new Date().toISOString(),
          }),
        });
      } catch (err) {
        // Non-blocking webhook logging
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving your intake form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Breadcrumbs */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/portal" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#130C76] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Client Portal
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-[#F96100]">
            <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted Clinical Intake
          </div>
        </div>

        {/* Form Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5DFD5] shadow-lg">
          
          {/* Intake Header */}
          <div className="border-b border-gray-100 pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#F96100] mb-2">
              <Sparkles className="w-4 h-4" /> Mighty Mental Health • Integrated Onboarding
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#130C76]">Comprehensive Clinical Intake</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
              Based on the Psychological Assessments Australia and NovoPsych clinical standards. This confidential questionnaire enables Luke to prepare your treatment plan before your first consultation.
            </p>

            {/* Step Progress Bar */}
            {!isSubmitted && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Step {currentStep} of {totalSteps}: {
                    currentStep === 1 ? 'Personal & GP Details' :
                    currentStep === 2 ? 'Medical & Psychiatric History' :
                    currentStep === 3 ? 'Somatic & Movement Profile' :
                    'Presenting Goals & Consent'
                  }</span>
                  <span className="text-[#130C76] font-mono">{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#130C76] to-[#F96100] h-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submission Feedback */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {isSubmitted ? (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#130C76]">Intake Successfully Submitted</h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Thank you, <strong>{clientName || 'Client'}</strong>. Your comprehensive clinical record has been securely encrypted and delivered to Luke&apos;s EHR for your upcoming consultation.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[#FBF9F5] border border-[#E5DFD5] p-5 rounded-2xl max-w-lg mx-auto text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#130C76] text-xs">Submission Summary:</span>
                  <span className="text-gray-500 font-mono text-[11px]">{new Date().toLocaleDateString('en-AU')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-gray-400">Client:</span> <strong className="text-gray-800">{clientName}</strong></div>
                  <div><span className="text-gray-400">Email:</span> <strong className="text-gray-800">{clientEmail}</strong></div>
                  <div><span className="text-gray-400">Referring GP:</span> <strong className="text-gray-800">{gpName ? `Dr. ${gpName}` : 'Self-Referred'}</strong></div>
                  <div><span className="text-gray-400">Movement Baseline:</span> <strong className="text-gray-800">{movementFrequency}</strong></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-white border border-[#E5DFD5] hover:border-[#130C76] text-[#130C76] px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F96100]" /> Print Summary Receipt
                </button>
                <Link
                  href="/portal"
                  className="bg-[#130C76] hover:bg-[#0038A8] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all inline-block"
                >
                  Go to Client Portal &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitIntake} className="space-y-6">

              {/* ============================================================= */}
              {/* STEP 1: CLIENT & REFERRING GP DETAILS */}
              {/* ============================================================= */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#130C76] uppercase tracking-wider pb-2 border-b border-gray-100">
                    <User className="w-4 h-4 text-[#F96100]" /> Part 1: Personal Demographics & GP
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="intake-client-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Legal Name *</label>
                      <input
                        id="intake-client-name"
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                    <div>
                      <label htmlFor="intake-preferred-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Preferred Name</label>
                      <input
                        id="intake-preferred-name"
                        type="text"
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="intake-dob" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date of Birth *</label>
                      <input
                        id="intake-dob"
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                    <div>
                      <label htmlFor="intake-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address *</label>
                      <input
                        id="intake-email"
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                    <div>
                      <label htmlFor="intake-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mobile Phone *</label>
                      <input
                        id="intake-phone"
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="0412 345 678"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="intake-address" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Residential Address</label>
                    <input
                      id="intake-address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Suburb, Postcode (e.g., Logan, QLD 4114)"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <span className="font-bold text-xs text-[#130C76] uppercase tracking-wider block">
                      Emergency Contact (Next of Kin):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="intake-emergency-name" className="sr-only">Emergency Contact Name</label>
                        <input
                          id="intake-emergency-name"
                          type="text"
                          aria-label="Emergency Contact Name"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          placeholder="Contact Name"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="intake-emergency-phone" className="sr-only">Emergency Contact Phone</label>
                        <input
                          id="intake-emergency-phone"
                          type="tel"
                          aria-label="Emergency Contact Phone"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="Contact Phone"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="intake-emergency-rel" className="sr-only">Emergency Contact Relationship</label>
                        <input
                          id="intake-emergency-rel"
                          type="text"
                          aria-label="Emergency Contact Relationship"
                          value={emergencyRel}
                          onChange={(e) => setEmergencyRel(e.target.value)}
                          placeholder="Relationship (e.g. Partner, Parent)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Referring GP */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <span className="font-bold text-xs text-[#130C76] uppercase tracking-wider block flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-[#130C76]" /> Referring Doctor / General Practitioner (GP):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="intake-gp-name" className="sr-only">GP Name</label>
                        <input
                          id="intake-gp-name"
                          type="text"
                          aria-label="GP Doctor Name"
                          value={gpName}
                          onChange={(e) => setGpName(e.target.value)}
                          placeholder="GP Name (e.g. Dr. John Smith)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="intake-gp-clinic" className="sr-only">Medical Practice Clinic</label>
                        <input
                          id="intake-gp-clinic"
                          type="text"
                          aria-label="Medical Practice Clinic Name"
                          value={gpClinic}
                          onChange={(e) => setGpClinic(e.target.value)}
                          placeholder="Clinic / Medical Centre"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="intake-medicare" className="sr-only">Medicare Number</label>
                        <input
                          id="intake-medicare"
                          type="text"
                          aria-label="Medicare Number (Optional)"
                          value={medicareNumber}
                          onChange={(e) => setMedicareNumber(e.target.value)}
                          placeholder="Medicare Number (Optional)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 2: MEDICAL, PSYCHIATRIC & MEDICATION HISTORY */}
              {/* ============================================================= */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#130C76] uppercase tracking-wider pb-2 border-b border-gray-100">
                    <Stethoscope className="w-4 h-4 text-[#F96100]" /> Part 2: Medical & Psychiatric History
                  </div>

                  <div>
                    <label htmlFor="intake-medications" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Current Medications (Dosage & Reason)
                    </label>
                    <textarea
                      id="intake-medications"
                      rows={2}
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="e.g. Sertraline 50mg daily, Metformin, Asthma inhaler as needed..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                    <span className="text-[11px] text-gray-400 mt-0.5 block">Include psychiatric, somatic, and over-the-counter supplements.</span>
                  </div>

                  <div>
                    <label htmlFor="intake-psychiatric-history" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Past Psychological / Psychiatric Diagnoses
                    </label>
                    <textarea
                      id="intake-psychiatric-history"
                      rows={2}
                      value={psychiatricHistory}
                      onChange={(e) => setPsychiatricHistory(e.target.value)}
                      placeholder="e.g. Diagnosed with Major Depressive Disorder in 2021; ADHD diagnosed in adolescence..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label htmlFor="intake-previous-therapy" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Previous Counselling / Psychotherapy Experience
                    </label>
                    <textarea
                      id="intake-previous-therapy"
                      rows={2}
                      value={previousTherapy}
                      onChange={(e) => setPreviousTherapy(e.target.value)}
                      placeholder="Have you seen a psychologist, counsellor, or coach before? What approaches worked or didn't work for you?"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label htmlFor="intake-medical-history" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      General Medical History & Chronic Conditions
                    </label>
                    <textarea
                      id="intake-medical-history"
                      rows={2}
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="e.g. Chronic back pain, migraines, thyroid condition, cardiovascular issues..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 3: SOMATIC, NERVOUS SYSTEM & MOVEMENT BASELINE */}
              {/* ============================================================= */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#130C76] uppercase tracking-wider pb-2 border-b border-gray-100">
                    <Activity className="w-4 h-4 text-[#F96100]" /> Part 3: Somatics, Nervous System & Physical Movement
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Mighty Mental Health integrates mind and body. Luke tailors evidence-based movement prescriptions (walking cadence, resistance, vagal down-regulation) to your physiological state.
                  </p>

                  {/* Physical Movement Frequency */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      How many days per week do you engage in 20+ minutes of intentional movement (walking, lifting, running, yoga)?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['0 days (Sedentary)', '1-2 days', '3-4 days', '5+ days'].map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setMovementFrequency(freq)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            movementFrequency === freq
                              ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Physical Tension Areas */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Where in your body do you hold physical tension when feeling stressed? (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Neck & Shoulders',
                        'Jaw & Teeth Clenching',
                        'Chest & Shallow Breathing',
                        'Stomach & Gut Issues',
                        'Lower Back & Hips',
                        'Hands & Fists Clenching'
                      ].map((area) => {
                        const checked = tensionAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleTensionArea(area)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between ${
                              checked
                                ? 'bg-orange-50 border-[#F96100] text-[#130C76]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span>{area}</span>
                            {checked && <CheckCircle2 className="w-4 h-4 text-[#F96100]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sleep Quality */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      How would you describe your average sleep quality over the last 30 days?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Restful & refreshing (7-8 hours)',
                        'Difficulty falling asleep (racing mind)',
                        'Waking frequently during the night',
                        'Waking unrefreshed regardless of sleep time'
                      ].map((sleep) => (
                        <button
                          key={sleep}
                          type="button"
                          onClick={() => setSleepQuality(sleep)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                            sleepQuality === sleep
                              ? 'bg-[#130C76] text-white border-[#130C76] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {sleep}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Physical Limitations */}
                  <div>
                    <label htmlFor="intake-physical-limitations" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Any physical injuries, joint issues, or mobility limits Luke should accommodate?
                    </label>
                    <input
                      id="intake-physical-limitations"
                      type="text"
                      value={physicalLimitations}
                      onChange={(e) => setPhysicalLimitations(e.target.value)}
                      placeholder="e.g. Knee injury, shoulder bursitis, lower back herniation..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 4: PRESENTING CONCERNS, GOALS & SAFETY */}
              {/* ============================================================= */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#130C76] uppercase tracking-wider pb-2 border-b border-gray-100">
                    <Heart className="w-4 h-4 text-[#F96100]" /> Part 4: Presenting Goals & Confidential Safety
                  </div>

                  <div>
                    <label htmlFor="intake-presenting-concerns" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      What are the main challenges or symptoms bringing you to Mighty Mental Health? *
                    </label>
                    <textarea
                      id="intake-presenting-concerns"
                      rows={3}
                      required
                      value={presentingConcerns}
                      onChange={(e) => setPresentingConcerns(e.target.value)}
                      placeholder="Describe what has been happening, how long it has been going on, and how it impacts your life..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  <div>
                    <label htmlFor="intake-therapy-goals" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      What are your primary goals for therapy and somatic coaching? *
                    </label>
                    <textarea
                      id="intake-therapy-goals"
                      rows={2}
                      required
                      value={therapyGoals}
                      onChange={(e) => setTherapyGoals(e.target.value)}
                      placeholder="e.g. Overcome chronic panic attacks, build emotional resilience, restore restorative sleep, improve mind-body athletic connection..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
                    />
                  </div>

                  {/* Safety Screener */}
                  <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-red-900">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" /> Confidential Safety & Wellbeing Screening
                    </div>
                    <p className="text-[11px] text-red-800 leading-relaxed">
                      Have you experienced thoughts of hurting yourself, suicide, or severe distress in recent weeks? (This helps Luke ensure adequate safety pacing during consultations).
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        'None (No thoughts)',
                        'Passive (Passing thoughts)',
                        'Active (Significant distress)'
                      ].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSafetyRiskHistory(opt)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            safetyRiskHistory === opt
                              ? 'bg-red-600 text-white border-red-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-2">
                    <label htmlFor="intake-consent-agreed" className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer">
                      <input
                        id="intake-consent-agreed"
                        type="checkbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        className="mt-1 text-[#F96100] focus:ring-[#F96100] rounded-xs"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        I confirm that the information provided is accurate. I understand that my information is encrypted under the Australian Privacy Principles and PACFA Code of Ethics, and will be reviewed confidentially by Luke ahead of my consultations.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1 && (!clientName || !clientEmail || !clientPhone)) {
                        setErrorMessage('Please fill in your Name, Email, and Phone number to continue.');
                        return;
                      }
                      setErrorMessage(null);
                      setCurrentStep(prev => prev + 1);
                    }}
                    className="bg-[#130C76] hover:bg-[#0038A8] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#F96100] hover:bg-[#d65300] text-white px-8 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting Intake...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Comprehensive Intake</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
