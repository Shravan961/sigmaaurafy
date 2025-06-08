
// For MVP, we'll use a mock symptoms database
// In production, integrate with Infermedica or similar API

interface SymptomResult {
  name: string;
  description: string;
  commonCauses: string[];
  warningSigns: string[];
  careTips: string[];
}

const mockSymptomsDatabase: Record<string, SymptomResult> = {
  headache: {
    name: 'Headache',
    description: 'Pain or discomfort in the head or neck area.',
    commonCauses: ['Stress', 'Dehydration', 'Lack of sleep', 'Eye strain', 'Tension'],
    warningSigns: ['Sudden severe headache', 'Fever above 100.4°F', 'Stiff neck', 'Vision changes'],
    careTips: ['Rest in a quiet, dark room', 'Stay hydrated', 'Apply cold or warm compress', 'Take over-the-counter pain relief']
  },
  nausea: {
    name: 'Nausea',
    description: 'Feeling of uneasiness and discomfort in the stomach with urge to vomit.',
    commonCauses: ['Food poisoning', 'Motion sickness', 'Stress', 'Medications', 'Pregnancy'],
    warningSigns: ['Severe dehydration', 'Blood in vomit', 'High fever', 'Severe abdominal pain'],
    careTips: ['Eat small, bland meals', 'Stay hydrated with small sips', 'Rest', 'Avoid strong odors']
  },
  fever: {
    name: 'Fever',
    description: 'Elevated body temperature above normal range (98.6°F/37°C).',
    commonCauses: ['Viral infection', 'Bacterial infection', 'Heat exhaustion', 'Medications'],
    warningSigns: ['Temperature above 103°F', 'Difficulty breathing', 'Severe headache', 'Confusion'],
    careTips: ['Rest and stay hydrated', 'Take fever reducers as directed', 'Use cool compresses', 'Monitor temperature']
  },
  'sore throat': {
    name: 'Sore Throat',
    description: 'Pain, scratchiness or irritation of the throat.',
    commonCauses: ['Viral infection', 'Bacterial infection (strep)', 'Allergies', 'Dry air'],
    warningSigns: ['Difficulty swallowing', 'High fever', 'Swollen lymph nodes', 'Rash'],
    careTips: ['Gargle with warm salt water', 'Stay hydrated', 'Use throat lozenges', 'Rest your voice']
  },
  fatigue: {
    name: 'Fatigue',
    description: 'Extreme tiredness or lack of energy.',
    commonCauses: ['Lack of sleep', 'Stress', 'Poor nutrition', 'Medical conditions', 'Overexertion'],
    warningSigns: ['Persistent fatigue for weeks', 'Chest pain', 'Shortness of breath', 'Severe weakness'],
    careTips: ['Get adequate sleep', 'Eat balanced meals', 'Exercise regularly', 'Manage stress']
  }
};

export const lookupSymptom = async (symptom: string): Promise<SymptomResult | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const normalizedSymptom = symptom.toLowerCase().trim();
  
  // Check for exact matches first
  if (mockSymptomsDatabase[normalizedSymptom]) {
    return mockSymptomsDatabase[normalizedSymptom];
  }
  
  // Check for partial matches
  const partialMatch = Object.keys(mockSymptomsDatabase).find(key => 
    key.includes(normalizedSymptom) || normalizedSymptom.includes(key)
  );
  
  if (partialMatch) {
    return mockSymptomsDatabase[partialMatch];
  }
  
  return null;
};
