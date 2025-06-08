import { useState, useEffect } from 'react';
import { NutritionEntry } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { isToday } from '@/utils/helpers';

export const useLocalNutrition = () => {
  const [entries, setEntries] = useState<NutritionEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.NUTRITION_ENTRIES);
    if (stored) {
      try {
        const allEntries = JSON.parse(stored);
        // Filter out entries that are not from today
        const todayEntries = allEntries.filter((entry: NutritionEntry) => isToday(entry.timestamp));
        
        // If we filtered out old entries, update localStorage
        if (todayEntries.length !== allEntries.length) {
          localStorage.setItem(STORAGE_KEYS.NUTRITION_ENTRIES, JSON.stringify(todayEntries));
        }
        
        setEntries(todayEntries);
      } catch (error) {
        console.error('Error parsing nutrition entries:', error);
        setEntries([]);
      }
    }
  }, []);

  const saveEntries = (newEntries: NutritionEntry[]) => {
    // Only keep today's entries
    const todayEntries = newEntries.filter(entry => isToday(entry.timestamp));
    setEntries(todayEntries);
    localStorage.setItem(STORAGE_KEYS.NUTRITION_ENTRIES, JSON.stringify(todayEntries));
  };

  const addEntry = (entry: NutritionEntry) => {
    const newEntries = [entry, ...entries];
    saveEntries(newEntries);
  };

  const deleteEntry = (entryId: string) => {
    const newEntries = entries.filter(entry => entry.id !== entryId);
    saveEntries(newEntries);
  };

  const getTodaysCalories = (): number => {
    return entries
      .filter(entry => isToday(entry.timestamp))
      .reduce((total, entry) => {
        return total + entry.result.items.reduce((sum, item) => sum + item.calories, 0);
      }, 0);
  };

  const getTodaysEntries = (): NutritionEntry[] => {
    return entries.filter(entry => isToday(entry.timestamp));
  };

  // Reset entries daily (called when component mounts)
  const resetDailyEntries = () => {
    const todayEntries = entries.filter(entry => isToday(entry.timestamp));
    if (todayEntries.length !== entries.length) {
      setEntries(todayEntries);
      localStorage.setItem(STORAGE_KEYS.NUTRITION_ENTRIES, JSON.stringify(todayEntries));
    }
  };

  return {
    entries,
    addEntry,
    deleteEntry,
    getTodaysCalories,
    getTodaysEntries,
    resetDailyEntries
  };
};
