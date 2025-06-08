
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const getTimestamp = (): number => Date.now();

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const isToday = (timestamp: number): boolean => {
  const today = new Date();
  const date = new Date(timestamp);
  return today.toDateString() === date.toDateString();
};

export const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const getTodayDateString = (): string => {
  return getDateString();
};

export const parseNaturalLanguage = (text: string): string[] => {
  // Simple parsing for food items - can be enhanced with NLP
  return text.split(/,|and|\+/).map(item => item.trim()).filter(item => item.length > 0);
};

export const calculateCalories = (items: any[]): number => {
  return items.reduce((total, item) => total + (item.calories || 0), 0);
};

export const calculateMacros = (items: any[]) => {
  return items.reduce(
    (totals, item) => ({
      protein: totals.protein + (item.protein_g || 0),
      fat: totals.fat + (item.fat_total_g || 0),
      carbs: totals.carbs + (item.carbohydrates_total_g || 0),
    }),
    { protein: 0, fat: 0, carbs: 0 }
  );
};
