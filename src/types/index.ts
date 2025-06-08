export interface NutritionEntry {
  id: string;
  query: string;
  result: {
    items: Array<{
      name: string;
      calories: number;
      protein_g: number;
      fat_total_g: number;
      carbohydrates_total_g: number;
      fiber_g?: number;
      sugar_g?: number;
      sodium_mg?: number;
    }>;
  };
  timestamp: number;
  isImageBased?: boolean;
  imageUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  timestamp: number;
  note?: string;
}

export interface MoodLog {
  id: string;
  moodScore: number;
  note?: string;
  timestamp: number;
}

export interface SymptomLog {
  id: string;
  symptom: string;
  severity?: number;
  timestamp: number;
  result?: {
    description?: string;
    commonCauses?: string[];
    warningSigns?: string[];
    careTips?: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aurora';
  text: string;
  timestamp: number;
  threadId?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  onboardingCompleted: boolean;
  preferences: {
    darkMode: boolean;
  };
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}
