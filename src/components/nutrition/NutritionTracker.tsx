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
import { GEMINI_API_KEY } from '@/utils/constants';
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { entries, addEntry, deleteEntry } = useLocalNutrition();
  const { symptoms, addSymptom } = useLocalSymptoms();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a food item to search');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nutritionService.searchNutrition(query);

      if (result.length === 0) {
        toast.error('No nutrition data found for this item');
        return;
      }

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image size too large. Please select an image smaller than 4MB.');
      return;
    }

    setIsLoading(true);
    try {
      toast.info('Analyzing image...');
      
      const detectedFood = await analyzeFoodImage(file, GEMINI_API_KEY);
      
      if (!detectedFood || detectedFood.toLowerCase().includes('no food') || detectedFood.toLowerCase().includes('unable to identify')) {
        toast.error('Could not identify any food items in the image. Please try again or enter manually.');
        return;
      }
      
      toast.info(`Detected: ${detectedFood}`, { duration: 3000 });
      
      const result = await nutritionService.searchNutrition(detectedFood);
      
      if (!result || result.length === 0) {
        toast.error('No nutrition data found for the detected food item');
        return;
      }

      const imageUrl = URL.createObjectURL(file);

      const newEntry = {
        id: generateId(),
        query: `📷 ${detectedFood}`,
        result: { items: result },
        timestamp: getTimestamp(),
        isImageBased: true,
        imageUrl: imageUrl,
      };

      addEntry(newEntry);
      toast.success('Food image analyzed successfully!');
    } catch (error) {
      console.error('Image analysis error:', error);
      
      let errorMessage = 'Unable to analyze image. Please try again or enter manually.';
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorMessage = 'Invalid image format. Please try with a different image.';
        } else if (error.message.includes('no food') || error.message.includes('not a food item')) {
          errorMessage = 'No recognizable food items detected. Please try with a clearer image.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    deleteEntry(entryId);
    toast.success('Nutrition entry deleted');
  };

  const handleSymptomSearch = async () => {
    if (!symptomQuery.trim()) {
      toast.error('Please enter a symptom to search');
      return;
    }

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

  const totalMacros = getTotalMacros();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Nutrition Tracker
        </h2>
        <p className="text-muted-foreground">
          Track your daily nutrition with AI-powered food recognition
        </p>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{Math.round(getTotalCalories())}</div>
            <div className="text-sm opacity-90">Calories Today</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(totalMacros.protein)}g</div>
            <div className="text-sm opacity-90">Protein</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(totalMacros.carbs)}g</div>
            <div className="text-sm opacity-90">Carbs</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(totalMacros.fat)}g</div>
            <div className="text-sm opacity-90">Fat</div>
          </CardContent>
        </Card>
      </div>

      {/* Food Logging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Log Food</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Search */}
          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter food item (e.g., apple, chicken breast, rice)"
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? 'Searching...' : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Image Upload */}
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
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
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
            
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            📸 Use AI-powered image recognition to automatically identify and log your food
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Entries */}
      {entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">
            Today's Food Log ({entries.length} items)
          </h3>
          {entries.map((entry) => (
            <NutritionCard
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteEntry}
              isExpanded={expandedCard === entry.id}
              onToggleExpand={() => setExpandedCard(
                expandedCard === entry.id ? null : entry.id
              )}
            />
          ))}
        </div>
      )}

      {/* Symptom Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Symptom Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={symptomQuery}
              onChange={(e) => setSymptomQuery(e.target.value)}
              placeholder="Enter symptom (e.g., headache, nausea, fatigue)"
              disabled={isSymptomLoading}
              onKeyPress={(e) => e.key === 'Enter' && !isSymptomLoading && handleSymptomSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSymptomSearch} 
              disabled={!symptomQuery.trim() || isSymptomLoading}
            >
              {isSymptomLoading ? 'Searching...' : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {currentSymptomResult && (
            <SymptomCard symptomData={currentSymptomResult} />
          )}
        </CardContent>
      </Card>

      {/* Recent Symptoms */}
      {symptoms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">
            Recent Symptoms
          </h3>
          {symptoms.slice(0, 3).map((symptom) => (
            <Card key={symptom.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground capitalize">
                    {symptom.symptom}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(symptom.timestamp)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No food logged today</h3>
              <p className="text-sm">
                Start by taking a photo of your food or searching manually
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};