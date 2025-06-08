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
      // Analyze the image to detect food
      const detectedFood = await analyzeFoodImage(file);
      
      // Get nutrition data for detected food
      const result = await nutritionService.searchNutrition(detectedFood);
      
      // Create image preview URL
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nutrition Tracker
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Track your meals and monitor your nutrition
        </p>
      </div>

      {/* Search Section */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Log Food</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., 1 apple, 2 slices whole wheat bread"
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <Camera className="h-4 w-4 mr-2" />
              Upload Food Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {entries.length > 0 && (
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm opacity-90">Total Calories</p>
                <p className="text-2xl font-bold">{getTotalCalories()}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Protein</p>
                <p className="text-xl font-semibold">{getTotalMacros().protein.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Fat</p>
                <p className="text-xl font-semibold">{getTotalMacros().fat.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Carbs</p>
                <p className="text-xl font-semibold">{getTotalMacros().carbs.toFixed(1)}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Searches</h3>
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry) => (
              <NutritionCard
                key={entry.id}
                entry={entry}
                isExpanded={expandedCard === entry.id}
                onToggle={() => setExpandedCard(expandedCard === entry.id ? null : entry.id)}
                onDelete={() => handleDeleteEntry(entry.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Symptoms Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Symptoms</h3>
        
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex space-x-2">
              <Input
                value={symptomQuery}
                onChange={(e) => setSymptomQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSymptomSearch()}
                placeholder="Search symptoms..."
                disabled={isSymptomLoading}
                className="flex-1"
              />
              <Button onClick={handleSymptomSearch} disabled={!symptomQuery.trim() || isSymptomLoading}>
                {isSymptomLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {currentSymptomResult && (
              <SymptomCard symptomData={currentSymptomResult} />
            )}
          </CardContent>
        </Card>

        {/* Symptom History */}
        {symptoms.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Your Symptom History</h4>
            {symptoms.slice(0, 5).map((symptom) => (
              <Card key={symptom.id} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{symptom.symptom}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(symptom.timestamp)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSymptomQuery(symptom.symptom);
                        if (symptom.result) {
                          setCurrentSymptomResult({
                            name: symptom.symptom,
                            description: symptom.result.description,
                            commonCauses: symptom.result.commonCauses,
                            warningSigns: symptom.result.warningSigns,
                            careTips: symptom.result.careTips,
                          });
                        }
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
