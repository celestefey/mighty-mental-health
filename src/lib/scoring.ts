export interface Dass21Score {
  depression: number;
  anxiety: number;
  stress: number;
  total: number;
  severity: {
    depression: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extremely Severe';
    anxiety: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extremely Severe';
    stress: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extremely Severe';
  };
}

export function scoreDass21(answers: Record<string, any>): Dass21Score {
  const scales = {
    depression: ['q3', 'q5', 'q10', 'q13', 'q16', 'q17', 'q21'],
    anxiety: ['q2', 'q4', 'q7', 'q9', 'q15', 'q19', 'q20'],
    stress: ['q1', 'q6', 'q8', 'q11', 'q12', 'q14', 'q18'],
  };

  const sumScale = (keys: string[]) => keys.reduce((acc, k) => acc + (Number(answers[k]) || 0), 0);

  // DASS-21 subscales are multiplied by 2 to compare with DASS-42 normative data
  const rawDepression = sumScale(scales.depression) * 2;
  const rawAnxiety = sumScale(scales.anxiety) * 2;
  const rawStress = sumScale(scales.stress) * 2;

  const getSeverity = (val: number, cutoffs: number[]) => {
    if (val <= cutoffs[0]) return 'Normal';
    if (val <= cutoffs[1]) return 'Mild';
    if (val <= cutoffs[2]) return 'Moderate';
    if (val <= cutoffs[3]) return 'Severe';
    return 'Extremely Severe';
  };

  return {
    depression: rawDepression,
    anxiety: rawAnxiety,
    stress: rawStress,
    total: rawDepression + rawAnxiety + rawStress,
    severity: {
      depression: getSeverity(rawDepression, [9, 13, 20, 27]),
      anxiety: getSeverity(rawAnxiety, [7, 9, 14, 19]),
      stress: getSeverity(rawStress, [14, 18, 25, 33]),
    },
  };
}

export function scoreGad7(answers: Record<string, any>) {
  const sum = Object.keys(answers)
    .filter((k) => k.startsWith('q'))
    .reduce((acc, k) => acc + (Number(answers[k]) || 0), 0);
  
  let severity = 'Minimal Anxiety';
  if (sum >= 15) severity = 'Severe Anxiety';
  else if (sum >= 10) severity = 'Moderate Anxiety';
  else if (sum >= 5) severity = 'Mild Anxiety';

  return { total: sum, severity };
}

// 1. PHQ-9 (Patient Health Questionnaire - 9)
export interface Phq9Score {
  total: number;
  severity: 'None-Minimal' | 'Mild' | 'Moderate' | 'Moderately Severe' | 'Severe';
  hasSelfHarmRisk: boolean;
  item9Score: number;
  recommendation: string;
}

export function scorePhq9(answers: Record<string, any>): Phq9Score {
  let total = 0;
  for (let i = 1; i <= 9; i++) {
    total += Number(answers[`q${i}`]) || 0;
  }

  const item9 = Number(answers['q9']) || 0;
  const hasSelfHarmRisk = item9 > 0;

  let severity: Phq9Score['severity'] = 'None-Minimal';
  let recommendation = 'Supportive counselling, lifestyle psychoeducation & sleep hygiene.';

  if (total >= 20) {
    severity = 'Severe';
    recommendation = 'Immediate comprehensive clinical review, safety plan & multi-disciplinary care.';
  } else if (total >= 15) {
    severity = 'Moderately Severe';
    recommendation = 'Active psychotherapy, somatic emotion regulation & GP coordination.';
  } else if (total >= 10) {
    severity = 'Moderate';
    recommendation = 'Weekly/fortnightly psychotherapy, somatic movement prescription & CBT.';
  } else if (total >= 5) {
    severity = 'Mild';
    recommendation = 'Watchful waiting, somatic movement & stress reduction strategies.';
  }

  return {
    total,
    severity,
    hasSelfHarmRisk,
    item9Score: item9,
    recommendation,
  };
}

// 2. K10 (Kessler Psychological Distress Scale)
export interface K10Score {
  total: number;
  severity: 'Low Distress' | 'Moderate Distress' | 'High Distress' | 'Very High Distress';
  normativePercentile: string;
  clinicalSummary: string;
}

export function scoreK10(answers: Record<string, any>): K10Score {
  let total = 0;
  for (let i = 1; i <= 10; i++) {
    total += Number(answers[`q${i}`]) || 1;
  }

  let severity: K10Score['severity'] = 'Low Distress';
  let normativePercentile = 'Bottom 68% of Australian adult population';
  let clinicalSummary = 'Client is likely to be well with minimal non-specific psychological distress.';

  if (total >= 30) {
    severity = 'Very High Distress';
    normativePercentile = 'Top 2% of Australian adult population';
    clinicalSummary = 'Severe psychological distress; strong indication of anxiety or depressive disorder.';
  } else if (total >= 25) {
    severity = 'High Distress';
    normativePercentile = 'Top 14% of Australian adult population';
    clinicalSummary = 'High psychological distress; active therapeutic support indicated.';
  } else if (total >= 20) {
    severity = 'Moderate Distress';
    normativePercentile = 'Top 31% of Australian adult population';
    clinicalSummary = 'Moderate distress consistent with mild to moderate depression or anxiety.';
  }

  return {
    total,
    severity,
    normativePercentile,
    clinicalSummary,
  };
}

// 3. PCL-5 (PTSD Checklist for DSM-5)
export interface Pcl5Score {
  total: number;
  clusters: {
    B_Intrusions: number;
    C_Avoidance: number;
    D_CognitionAndMood: number;
    E_ArousalAndReactivity: number;
  };
  probablePTSD: boolean;
  severity: 'Subclinical' | 'Mild' | 'Moderate' | 'Probable PTSD / High Distress';
}

export function scorePcl5(answers: Record<string, any>): Pcl5Score {
  let total = 0;
  let b = 0, c = 0, d = 0, e = 0;

  for (let i = 1; i <= 20; i++) {
    const val = Number(answers[`q${i}`]) || 0;
    total += val;
    if (i <= 5) b += val;
    else if (i <= 7) c += val;
    else if (i <= 14) d += val;
    else e += val;
  }

  const probablePTSD = total >= 33;
  let severity: Pcl5Score['severity'] = 'Subclinical';

  if (total >= 33) severity = 'Probable PTSD / High Distress';
  else if (total >= 22) severity = 'Moderate';
  else if (total >= 11) severity = 'Mild';

  return {
    total,
    clusters: {
      B_Intrusions: b,
      C_Avoidance: c,
      D_CognitionAndMood: d,
      E_ArousalAndReactivity: e,
    },
    probablePTSD,
    severity,
  };
}

// 4. ASRS v1.1 (Adult ADHD Self-Report Scale Part A)
export interface AsrsScore {
  shadedCount: number;
  totalQuestions: number;
  meetsAdhdThreshold: boolean;
  severity: 'Consistent with Adult ADHD' | 'Below ADHD Clinical Threshold';
  interpretation: string;
}

export function scoreAsrs(answers: Record<string, any>): AsrsScore {
  // Thresholds for Part A:
  // q1, q2, q3: shaded if score >= 2 (Sometimes=2, Often=3, Very Often=4)
  // q4, q5, q6: shaded if score >= 3 (Often=3, Very Often=4)
  let shadedCount = 0;

  for (let i = 1; i <= 6; i++) {
    const val = Number(answers[`q${i}`]) || 0;
    if (i <= 3 && val >= 2) shadedCount++;
    else if (i >= 4 && val >= 3) shadedCount++;
  }

  const meetsAdhdThreshold = shadedCount >= 4;

  return {
    shadedCount,
    totalQuestions: 6,
    meetsAdhdThreshold,
    severity: meetsAdhdThreshold ? 'Consistent with Adult ADHD' : 'Below ADHD Clinical Threshold',
    interpretation: meetsAdhdThreshold
      ? 'Client reported 4 or more significant symptoms in Part A, highly consistent with Adult ADHD. Diagnostic interview and executive function assessment strongly recommended.'
      : 'Symptom profile is currently below the validated clinical cutoff for Adult ADHD.',
  };
}

// 5. Athens Insomnia Scale (AIS)
export interface AisScore {
  total: number;
  hasInsomnia: boolean;
  severity: 'No Insomnia' | 'Mild Insomnia' | 'Moderate Insomnia' | 'Severe Insomnia';
  somaticGuidance: string;
}

export function scoreAis(answers: Record<string, any>): AisScore {
  let total = 0;

  for (let i = 1; i <= 8; i++) {
    const raw = answers[`q${i}`];
    let val = 0;
    if (typeof raw === 'number') {
      val = raw;
    } else if (typeof raw === 'string') {
      // String format: "0: No problem", "1: Slightly delayed", etc.
      const match = raw.match(/^([0-3])/);
      val = match ? parseInt(match[1], 10) : 0;
    }
    total += val;
  }

  const hasInsomnia = total >= 6;
  let severity: AisScore['severity'] = 'No Insomnia';
  let somaticGuidance = 'Sleep architecture is within normal restorative limits.';

  if (total >= 16) {
    severity = 'Severe Insomnia';
    somaticGuidance = 'Significant sleep deprivation; prioritize evening vagal downregulation, somatic pacing, and circadian anchor walks.';
  } else if (total >= 10) {
    severity = 'Moderate Insomnia';
    somaticGuidance = 'Frequent nocturnal awakenings; integrate NSDR (Non-Sleep Deep Rest) and morning outdoor light exposure.';
  } else if (total >= 6) {
    severity = 'Mild Insomnia';
    somaticGuidance = 'Exceeds diagnostic cutoff (≥6); review caffeine timing, evening screen blue light, and bedroom thermal regulation.';
  }

  return {
    total,
    hasInsomnia,
    severity,
    somaticGuidance,
  };
}

// 6. Brief Resilience Scale (BRS)
export interface BrsScore {
  meanScore: number;
  severity: 'Low Resilience' | 'Normal Resilience' | 'High Resilience';
  interpretation: string;
}

export function scoreBrs(answers: Record<string, any>): BrsScore {
  // Items 2, 4, 6 are reversed (score 1-5 -> reversed is 6 - score)
  let sum = 0;
  for (let i = 1; i <= 6; i++) {
    let val = Number(answers[`q${i}`]) || 3;
    if (i === 2 || i === 4 || i === 6) {
      val = 6 - val;
    }
    sum += val;
  }

  const meanScore = Number((sum / 6).toFixed(2));
  let severity: BrsScore['severity'] = 'Normal Resilience';
  let interpretation = 'Average capacity to recover from physiological and psychological stress.';

  if (meanScore < 3.00) {
    severity = 'Low Resilience';
    interpretation = 'Client experiences prolonged recovery times after acute stressors; focus on micro-restoration and physical resilience routines.';
  } else if (meanScore > 4.30) {
    severity = 'High Resilience';
    interpretation = 'Strong ability to bounce back rapidly and adapt to adversity.';
  }

  return {
    meanScore,
    severity,
    interpretation,
  };
}

// 7. CRAFFT 2.1+N (Substance Use Screener)
export interface CrafftScore {
  score: number;
  highRisk: boolean;
  severity: 'High Substance Risk' | 'Low Substance Risk';
  riskFactors: string[];
}

export function scoreCrafft(answers: Record<string, any>): CrafftScore {
  let score = 0;
  const riskFactors: string[] = [];

  const labels: Record<string, string> = {
    q1: 'Riding with impaired driver (Car)',
    q2: 'Using substances to relax/fit in (Relax)',
    q3: 'Solo substance use (Alone)',
    q4: 'Blackouts or memory loss (Forget)',
    q5: 'Interpersonal friction from substances (Friends)',
    q6: 'Substance-related trouble (Trouble)',
  };

  for (let i = 1; i <= 6; i++) {
    const ans = answers[`q${i}`];
    if (ans === true || ans === 'Yes' || ans === 1 || ans === '1') {
      score++;
      riskFactors.push(labels[`q${i}`]);
    }
  }

  const highRisk = score >= 2;

  return {
    score,
    highRisk,
    severity: highRisk ? 'High Substance Risk' : 'Low Substance Risk',
    riskFactors,
  };
}

// 8. WSAS (Work and Social Adjustment Scale)
export interface WsasScore {
  total: number;
  severity: 'Subclinical / Mild' | 'Significant Impairment' | 'Moderately Severe to Severe Impairment';
  functionalImpact: string;
}

export function scoreWsas(answers: Record<string, any>): WsasScore {
  let total = 0;
  for (let i = 1; i <= 5; i++) {
    total += Number(answers[`q${i}`]) || 0;
  }

  let severity: WsasScore['severity'] = 'Subclinical / Mild';
  let functionalImpact = 'Client experiences negligible functional disruption to daily vocational and social pursuits.';

  if (total > 20) {
    severity = 'Moderately Severe to Severe Impairment';
    functionalImpact = 'Marked impairment across vocational, domestic, social, or relational functioning.';
  } else if (total >= 10) {
    severity = 'Significant Impairment';
    functionalImpact = 'Significant impairment; daily activities are noticeably impacted by the presenting condition.';
  }

  return {
    total,
    severity,
    functionalImpact,
  };
}

// 9. AQ-10 (Autism Spectrum Quotient - 10 Item Adult)
export interface Aq10Score {
  total: number;
  referralIndicated: boolean;
  severity: 'Autistic Traits Indicated (Referral Recommended)' | 'Below Diagnostic Threshold';
  details: string;
}

export function scoreAq10(answers: Record<string, any>): Aq10Score {
  // Items scoring 1 if Agree (1 or 2): q1, q7, q8, q10
  // Items scoring 1 if Disagree (3 or 4): q2, q3, q4, q5, q6, q9
  let total = 0;
  const agreeKeys = ['q1', 'q7', 'q8', 'q10'];

  for (let i = 1; i <= 10; i++) {
    const key = `q${i}`;
    const val = Number(answers[key]) || 0;
    if (agreeKeys.includes(key)) {
      if (val === 1 || val === 2) total++;
    } else {
      if (val === 3 || val === 4) total++;
    }
  }

  const referralIndicated = total >= 6;

  return {
    total,
    referralIndicated,
    severity: referralIndicated
      ? 'Autistic Traits Indicated (Referral Recommended)'
      : 'Below Diagnostic Threshold',
    details: referralIndicated
      ? 'Score is 6 or higher. A comprehensive neurodevelopmental assessment is recommended in accordance with NICE clinical guidelines.'
      : 'Score is below the clinical threshold of 6.',
  };
}
