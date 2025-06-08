
import { useState, useEffect } from 'react';
import { SymptomLog } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

export const useLocalSymptoms = () => {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SYMPTOM_LOGS);
    if (stored) {
      try {
        setSymptoms(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing symptom logs:', error);
        setSymptoms([]);
      }
    }
  }, []);

  const saveSymptoms = (newSymptoms: SymptomLog[]) => {
    setSymptoms(newSymptoms);
    localStorage.setItem(STORAGE_KEYS.SYMPTOM_LOGS, JSON.stringify(newSymptoms));
  };

  const addSymptom = (symptom: SymptomLog) => {
    const newSymptoms = [symptom, ...symptoms];
    saveSymptoms(newSymptoms);
  };

  return {
    symptoms,
    addSymptom
  };
};
