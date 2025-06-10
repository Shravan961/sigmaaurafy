import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, TrendingUp, Upload, Camera } from 'lucide-react';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalSymptoms } from '@/hooks/useLocalSymptoms';
import { nutritionService, analyzeFoodImage } from '@/services/nutritionService';
import { lookupSymptom } from '@/api/symptomsClient';
import { generateId, getTimestamp, formatDateTime } from '@/utils/helpers';
import { toast } from "sonner";
import { NutritionCard } from '@/components/nutrition/NutritionCard';
import { SymptomCard } from '@/components/nutrition/SymptomCard';

export const NutritionTracker: React.FC = () => {
  const [query, setQuery] = useState('');
  const [symptomQuery, setSymptomQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSymptomLoading, setIsSymptomLoading] = useState(false);
  const [currentSymptomResult, setCurrentSymptomResult] = useState<any>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { entries, addEntry, deleteEntry } = useLocalNutrition();
  const { symptoms, addSymptom } = useLocalSymptoms();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await nutritionService.searchNutrition(query);

      const newEntry = {
        id: generateId(),
        query: query.trim(),
        result: { items: result },
        timestamp: getTimestamp(),
      };

      addEntry(newEntry);
      setQuery('');
      toast.success('Nutrition information found!');
    } catch (error) {
      console.error('Nutrition search error:', error);
      toast.error('Failed to fetch nutrition data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const detectedFood = await analyzeFoodImage(file);
      const result = await nutritionService.searchNutrition(detectedFood);
      const imageUrl = URL.createObjectURL(file);

      const newEntry = {
        id: generateId(),
        query: `Photo: ${detectedFood}`,
        result: { items: result },
        timestamp: getTimestamp(),
        isImageBased: true,
        imageUrl: imageUrl,
      };

      addEntry(newEntry);
      toast.success('Food image analyzed successfully!');
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('Unable to analyze image. Please try again or log manually.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    deleteEntry(entryId);
    toast.success('Nutrition entry deleted');
  };

  const handleSymptomSearch = async () => {
    if (!symptomQuery.trim()) return;

    setIsSymptomLoading(true);
    try {
      const result = await lookupSymptom(symptomQuery);

      if (result) {
        setCurrentSymptomResult(result);

        const newSymptom = {
          id: generateId(),
          symptom: symptomQuery.trim(),
          timestamp: getTimestamp(),
          result: {
            description: result.description,
            commonCauses: result.commonCauses,
            warningSigns: result.warningSigns,
            careTips: result.careTips,
          }
        };

        addSymptom(newSymptom);
        setSymptomQuery('');
        toast.success('Symptom information found!');
      } else {
        setCurrentSymptomResult(null);
        toast.error('No information found. Please try a different symptom.');
      }
    } catch (error) {
      console.error('Symptom search error:', error);
      toast.error('Failed to fetch symptom data. Please try again.');
    } finally {
      setIsSymptomLoading(false);
    }
  };

  const getTotalCalories = () => {
    return entries.reduce((total, entry) => 
      total + entry.result.items.reduce((sum, item) => sum + item.calories, 0), 0
    );
  };

  const getTotalMacros = () => {
    return entries.reduce(
      (totals, entry) => {
        const entryTotals = entry.result.items.reduce(
          (sum, item) => ({
            protein: sum.protein + item.protein_g,
            fat: sum.fat + item.fat_total_g,
            carbs: sum.carbs + item.carbohydrates_total_g,
          }),
          { protein: 0, fat: 0, carbs: 0 }
        );
        return {
          protein: totals.protein + entryTotals.protein,
          fat: totals.fat + entryTotals.fat,
          carbs: totals.carbs + entryTotals.carbs,
        };
      },
      { protein: 0, fat: 0, carbs: 0 }
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nutrition Tracker</h2>
      </div>
    </div>
  );
};

export const analyzeFoodImage = async (file: File): Promise<string> => {
  try {
    const reader = new FileReader();

    const base64: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=AIzaSyB1ZBFMSVc9G5kypdkw91im9o4Rd3dBARw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64
                }
              },
              {
                text: "What type of food is this? Give a short, simple name suitable for nutrition lookup."
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    const guess = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!guess) throw new Error("No food detected");

    return guess;
  } catch (error) {
    console.error("Gemini image analysis failed:", error);
    throw new Error("Image analysis failed");
  }
};