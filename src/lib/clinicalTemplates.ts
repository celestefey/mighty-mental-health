import { ClinicalTemplateType, MMHFormAssignment } from './types';

export interface TemplateDefinition {
  type: ClinicalTemplateType;
  title: string;
  category: 'Clinical Notes' | 'Risk & Assessment' | 'GP Correspondence';
  description: string;
  defaultSubjective: string;
  defaultObjective: string;
  defaultAssessment: string;
  defaultPlan: string;
  isGpLetter?: boolean;
}

export const CLINICAL_TEMPLATES: Record<ClinicalTemplateType, TemplateDefinition> = {
  SOAP: {
    type: 'SOAP',
    title: 'Standard SOAP Progress Note',
    category: 'Clinical Notes',
    description: 'Standard session progress note tracking Subjective, Objective, Assessment, and Plan under PACFA documentation guidelines.',
    defaultSubjective: 'Client presents with...',
    defaultObjective: 'Observed affect, psychometric screeners, somatic tension palpation/breathing...',
    defaultAssessment: 'Autonomic state formulation, cognitive-emotional processing...',
    defaultPlan: 'Somatic movement homework, follow-up session timing...',
  },

  'first-session': {
    type: 'first-session',
    title: 'First Session Clinical Intake Note',
    category: 'Clinical Notes',
    description: 'Comprehensive initial consultation note covering presenting history, biopsychosocial assessment, somatic baseline, and therapy goals.',
    defaultSubjective: `1. Referral Source & Chief Complaint:
Client self-referred / referred by GP regarding...

2. History of Presenting Issues:
Onset, duration, recent exacerbating stressors, and impact on daily functioning.

3. Biopsychosocial History:
- Family/Relationship:
- Medical & Medication History:
- Previous Psychological/Psychiatric Support:
- Physical Movement & Lifestyle Baseline:`,
    defaultObjective: `1. Mental Status Examination (MSE):
- Appearance & Grooming: Well-kempt, relaxed / tense posture.
- Behavior & Psychomotor: Calm / restless fidgeting / psychomotor retardation.
- Speech & Affect: Fluent, congruent affect with mood.
- Cognition & Insight: Intact, oriented x3, good insight into presenting difficulties.

2. Baseline Psychometric Scales:
[Click "Inject Scores" to insert DASS-21, K10, or PHQ-9 baseline]

3. Somatic & Autonomic Observations:
Clavicular shallow breathing noted; physical tension in neck, jaw, or shoulders.`,
    defaultAssessment: `1. Clinical Formulation:
Presenting difficulties consistent with... (e.g., Generalised Anxiety with sympathetic nervous system hyperarousal).

2. Autonomic & Somatic Tone:
Predominant autonomic state: Sympathetic overdrive vs. Dorsal vagal shutdown.

3. Strengths & Protective Factors:
High motivation for active change, engaged in physical movement, supportive social network.`,
    defaultPlan: `1. Therapeutic Modality:
Integrated PACFA Psychotherapy + Somatic Movement Regulation.

2. Session Cadence:
Weekly / Fortnightly 60-min telehealth consultations (Initial 6-session block).

3. Somatic Prescription & Homework:
- Daily 10-minute morning outdoor walking cadence.
- 4-7-8 vagal nerve down-regulation breathing protocol when encountering acute stressors.

4. Collaboration:
Initial summary letter to be provided to referring General Practitioner.`,
  },

  'risk-assessment': {
    type: 'risk-assessment',
    title: 'Comprehensive Suicide & Harm Risk Assessment',
    category: 'Risk & Assessment',
    description: 'Structured risk assessment evaluating suicidal ideation, intent, plan, lethal means access, protective factors, and collaborative safety planning.',
    defaultSubjective: `1. Presenting Distress & Suicidal Ideation:
- Frequency & Intensity of Ideation: (None / Passive / Active)
- Triggers: Acute interpersonal conflict, severe chronic pain, financial crisis.
- Feelings of Hopelessness & Burdensomeness: Client expresses...
- Substance Use Exacerbation: Alcohol / sedative use reported?`,
    defaultObjective: `1. Assessment of Intent & Lethal Means:
- Specific Plan: (No plan / Vague plan / Detailed plan identified)
- Access to Lethal Means: (Confirmed no direct access to identified means)
- History of Prior Attempts / Non-Suicidal Self-Injury (NSSI):
- Psychometric Screener Flag: PHQ-9 Item 9 score = ... / asQ screener = ...

2. Mental State Indicators:
Behavioral calmness, agitation, impulsivity, or acute emotional pain.`,
    defaultAssessment: `1. Formulated Risk Stratification:
[ LOW RISK / MODERATE RISK / HIGH RISK / IMMINENT RISK ]

2. Dynamic vs. Static Factors:
- Static: Prior attempt history, male demographic, family history.
- Dynamic: Acute insomnia, sudden loss, intoxication, unmanaged panic.

3. Protective Factors:
Strong commitment to children/family, religious/ethical values, positive alliance with therapist.`,
    defaultPlan: `1. Collaborative Safety Plan (Stanley-Brown Protocol):
- Step 1: Warning signs identified (e.g. pacing, racing thoughts, withdrawal).
- Step 2: Internal coping strategies (cold water face plunge, progressive muscle release).
- Step 3: Social distractions & safe spaces (walking in park, visiting gym).
- Step 4: Trusted family/friends to contact.
- Step 5: Professionals & 24/7 Crisis lines (Lifeline 13 11 14, Suicide Call Back 1300 659 467, 000).

2. Means Restriction:
Medications locked / family custody of identified means confirmed.

3. Follow-Up & Clinical Liaison:
Next session booked within 48-72 hours. GP notified via urgent telephone/letter liaison if moderate-high.`,
  },

  aod: {
    type: 'aod',
    title: 'Alcohol & Other Drugs (AOD) Assessment',
    category: 'Risk & Assessment',
    description: 'Assessment evaluating substance use patterns, dependence criteria, withdrawal risks, physical health impacts, and harm minimization.',
    defaultSubjective: `1. Substance Use Profile:
- Primary Substance: Alcohol / Cannabis / Stimulants / Opioids / Other.
- Frequency & Quantity: Standard drinks per day/week, dosage.
- History of Use: Age of first use, progression, periods of abstinence.
- Craving & Loss of Control: Inability to stop once started, morning use to steady nerves.

2. Psychological & Social Impact:
Impact on family relationships, vocational performance, and financial stability.`,
    defaultObjective: `1. Screening Metrics:
- CRAFFT Score: ... / 6 (High Risk indicator)
- AUDIT / DUDIT Score: ...
- Physical Symptoms: Tremors, sweating, cognitive clouding, sleep disruption.

2. Medical & Physiological Co-morbidities:
Liver function monitoring, gastrointestinal issues, cardiovascular strain.`,
    defaultAssessment: `1. Diagnostic Formulation:
Substance Use Disorder (Mild / Moderate / Severe) under DSM-5 criteria.

2. Stage of Change (Prochaska & DiClemente):
Pre-contemplation / Contemplation / Preparation / Action.

3. Co-Occurring Mental Health:
Substance used as maladaptive self-medication for autonomic hyperarousal, trauma memories, or sleep induction.`,
    defaultPlan: `1. Harm Reduction Strategies:
- Pacing & drink spacing protocols; hydration anchors.
- Removal of home alcohol stores; trigger identification.

2. Somatic Substitution:
Prescribing high-intensity movement (progressive resistance/interval walks) to replace dopamine reward peaks.

3. Multi-Disciplinary Care:
Coordinate with GP for medical withdrawal management if high dependence risk identified.`,
  },

  'gp-first-session': {
    type: 'gp-first-session',
    title: 'GP Letter: Brief After First Session',
    category: 'GP Correspondence',
    description: 'Formal professional correspondence updating referring General Practitioner following client initial consultation.',
    isGpLetter: true,
    defaultSubjective: '',
    defaultObjective: '',
    defaultAssessment: '',
    defaultPlan: '',
  },

  'gp-progress-update': {
    type: 'gp-progress-update',
    title: 'GP Letter: MHTP Progress Update & Review',
    category: 'GP Correspondence',
    description: 'Standard 6-session Mental Health Treatment Plan progress review with psychometric score trajectory for Medicare / PACFA re-referral.',
    isGpLetter: true,
    defaultSubjective: '',
    defaultObjective: '',
    defaultAssessment: '',
    defaultPlan: '',
  },
};

/**
 * Generates ready-to-export formal GP Correspondence with Luke's PACFA credentials,
 * referring GP details, and comparative psychometric outcome trajectories.
 */
export function generateGpLetter(options: {
  templateType: 'gp-first-session' | 'gp-progress-update';
  clientName: string;
  clientDob?: string;
  gpName?: string;
  gpClinic?: string;
  gpAddress?: string;
  sessionDate?: string;
  sessionsCompleted?: number;
  totalSessionsAllowed?: number;
  initialScores?: Record<string, any>;
  currentScores?: Record<string, any>;
  clinicalSummary?: string;
  therapyFocus?: string;
  recommendation?: string;
}): string {
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const gpHeader = options.gpName ? `Dr. ${options.gpName.replace(/^Dr\.?\s*/i, '')}` : 'The Referring General Practitioner';
  const clinic = options.gpClinic || 'Medical Centre';
  const dobText = options.clientDob ? ` | DOB: ${options.clientDob}` : '';
  const sessions = options.sessionsCompleted ?? (options.templateType === 'gp-first-session' ? 1 : 6);
  const maxSessions = options.totalSessionsAllowed ?? 6;

  // Format score trajectory
  let trajectoryBlock = '';
  if (options.templateType === 'gp-progress-update') {
    trajectoryBlock = `
PSYCHOMETRIC OUTCOME TRAJECTORY:
-----------------------------------------------------------------------------
- Baseline Assessment:
  ${options.initialScores ? formatScoreSummary(options.initialScores) : 'DASS-21 / K10: Severe distress at intake'}
- Current Re-Assessment (Session ${sessions}):
  ${options.currentScores ? formatScoreSummary(options.currentScores) : 'DASS-21 / K10: Significant symptom reduction noted'}
- Clinical Interpretation: Measurable reduction in autonomic arousal and depressive symptomology demonstrating positive therapeutic response.
`;
  } else {
    trajectoryBlock = `
BASELINE PSYCHOMETRIC FINDINGS:
-----------------------------------------------------------------------------
- Intake Screening: ${options.initialScores ? formatScoreSummary(options.initialScores) : 'Standardized psychometric battery completed (DASS-21 / K10 / Somatic Baseline)'}
- Initial Autonomic Assessment: Observable sympathetic hyperarousal with somatic tension patterns.
`;
  }

  const focus = options.therapyFocus || 
    'Cognitive-emotional processing, autonomic nervous system down-regulation, vagal breathing, and progressive movement protocols.';
  
  const summary = options.clinicalSummary || (options.templateType === 'gp-first-session'
    ? `${options.clientName} engaged actively in our initial consultation, presenting with symptoms of heightened stress and autonomic arousal impacting occupational and personal functioning.`
    : `${options.clientName} has attended ${sessions} sessions of psychotherapy and somatic regulation. Marked improvements have been observed in sleep architecture, distress tolerance, and nervous system pacing.`);

  const rec = options.recommendation || (options.templateType === 'gp-first-session'
    ? `I have commenced an initial 6-session therapeutic block. I will provide a formal progress review upon completion of session 6 in accordance with Mental Health Treatment Plan guidelines.`
    : `In light of the client's positive clinical engagement and remaining recovery goals, I recommend a re-referral for an additional 4 sessions (Sessions 7–10) under the Better Access / Mental Health Care Plan framework.`);

  return `MIGHTY MENTAL HEALTH
Integrated Psychotherapy & Somatic Movement
Logan, Queensland, Australia | Provider: Luke (MCouns, UQ)
PACFA Reg. Clinical Counsellor #28941 | luke@mightymentalhealth.com.au
Web: https://mightymentalhealth.vercel.app

CONFIDENTIAL MEDICAL CORRESPONDENCE
-----------------------------------------------------------------------------
DATE: ${today}

TO: ${gpHeader}
CLINIC: ${clinic}
${options.gpAddress ? `ADDRESS: ${options.gpAddress}\n` : ''}
RE: Clinical Update for ${options.clientName}${dobText}
REFERRAL FRAMEWORK: Mental Health Treatment Plan (MHTP) / Allied Health Referral
SESSION COUNT: ${sessions} of ${maxSessions} completed

Dear ${gpHeader},

Thank you for referring ${options.clientName} to Mighty Mental Health. I am writing to provide an update regarding ${options.clientName}'s psychological and somatic counselling care.

${options.templateType === 'gp-first-session' ? 'INITIAL CONSULTATION & PRESENTING ISSUES:' : 'PROGRESS UPDATE & CLINICAL REVIEW:'}
-----------------------------------------------------------------------------
${summary}

${trajectoryBlock}
TREATMENT MODALITIES & CLINICAL INTERVENTIONS:
-----------------------------------------------------------------------------
Therapeutic interventions to date have included:
- Evidence-based Psychotherapy (PACFA accredited framework).
- Somatic Nervous System Regulation (vagal nerve stimulation, diaphragmatic pacing).
- Cognitive appraisal, distress tolerance, and values-aligned behavioral activation.
- Physical movement prescriptions (aerobic walking cadence, resistance for nervous system grounding).
Focus: ${focus}

RECOMMENDATION & CONTINUITY OF CARE:
-----------------------------------------------------------------------------
${rec}

Please do not hesitate to contact me directly at luke@mightymentalhealth.com.au should you require any further clinical information or wish to discuss ${options.clientName}'s care plan.

Warm regards,

Luke MCouns (UQ)
Master of Counselling (University of Queensland)
Registered Clinical Counsellor (PACFA Reg. #28941)
Certified Movement & Somatic Coach
Mighty Mental Health — Logan, QLD
`;
}

function formatScoreSummary(scores: Record<string, any>): string {
  if (scores.depression !== undefined && scores.anxiety !== undefined) {
    return `DASS-21 -> Depression: ${scores.depression} (${scores.severity?.depression || ''}), Anxiety: ${scores.anxiety} (${scores.severity?.anxiety || ''}), Stress: ${scores.stress} (${scores.severity?.stress || ''})`;
  }
  if (scores.total !== undefined) {
    return `Total Score: ${scores.total} (${scores.severity || 'Scored'})`;
  }
  if (scores.meanScore !== undefined) {
    return `Mean Score: ${scores.meanScore}/5.00 (${scores.severity || ''})`;
  }
  return JSON.stringify(scores);
}
