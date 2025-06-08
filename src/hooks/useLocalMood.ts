
import { useState, useEffect } from 'react';
import { MoodLog } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { isToday } from '@/utils/helpers';

export const useLocalMood = () => {
  const [moods, setMoods] = useState<MoodLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.MOOD_LOGS);
    if (stored) {
      try {
        setMoods(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing mood logs:', error);
        setMoods([]);
      }
    }
  }, []);

  const saveMoods = (newMoods: MoodLog[]) => {
    setMoods(newMoods);
    localStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(newMoods));
  };

  const addMood = (mood: MoodLog) => {
    const newMoods = [mood, ...moods];
    saveMoods(newMoods);
  };

  const getTodaysMoodScore = (): number | null => {
    const todaysMoods = moods.filter(mood => isToday(mood.timestamp));
    if (todaysMoods.length === 0) return null;
    
    const average = todaysMoods.reduce((sum, mood) => sum + mood.moodScore, 0) / todaysMoods.length;
    return Math.round(average * 10) / 10;
  };

  const getLatestMood = (): MoodLog | null => {
    return moods.length > 0 ? moods[0] : null;
  };

  const getWeeklyAverage = (): number | null => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyMoods = moods.filter(mood => mood.timestamp >= weekAgo);
    
    if (weeklyMoods.length === 0) return null;
    
    const average = weeklyMoods.reduce((sum, mood) => sum + mood.moodScore, 0) / weeklyMoods.length;
    return Math.round(average * 10) / 10;
  };

  return {
    moods,
    addMood,
    getTodaysMoodScore,
    getLatestMood,
    getWeeklyAverage
  };
};
