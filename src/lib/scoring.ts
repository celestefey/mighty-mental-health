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

export function scoreDass21(answers: Record<string, number>): Dass21Score {
  // Questions mapped by scale
  const scales = {
    depression: ['q3', 'q5', 'q10', 'q13', 'q16', 'q17', 'q21'],
    anxiety: ['q2', 'q4', 'q7', 'q9', 'q15', 'q19', 'q20'],
    stress: ['q1', 'q6', 'q8', 'q11', 'q12', 'q14', 'q18'],
  };

  const sumScale = (keys: string[]) => keys.reduce((acc, k) => acc + (answers[k] ?? 0), 0);

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

export function scoreGad7(answers: Record<string, number>) {
  const sum = Object.values(answers).reduce((acc, v) => acc + (Number(v) || 0), 0);
  let severity = 'Minimal Anxiety';
  if (sum >= 15) severity = 'Severe Anxiety';
  else if (sum >= 10) severity = 'Moderate Anxiety';
  else if (sum >= 5) severity = 'Mild Anxiety';

  return { total: sum, severity };
}
