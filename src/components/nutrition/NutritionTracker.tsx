import React, { useState, useRef } from 'react';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalSymptoms } from '@/hooks/useLocalSymptoms';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Upload, 
  Camera, 
  Loader2, 
  TrendingUp, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle, 
  Heart, 
  Lightbulb
} from 'lucide-react';
import { nutritionService } from '@/services/nutritionService';
import { lookupSymptom } from '@/api/symptomsClient';
import { generateId, getTimestamp, formatDateTime } from '@/utils/helpers';
import { NutritionEntry, NutritionItem, Symptom, SymptomResult } from '@/types/nutrition';

// Define daily targets locally
const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,    // in grams
  carbs: 300,     // in grams
  fat: 70         // in grams
};

// Gemini service implementation - FIXED ERROR HANDLING
const geminiService = {
  analyzeImageForFood: async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          
          // Prepare the payload for Gemini API
          const payload = {
            contents: [{
              parts: [
                { text: "Identify the food item in this image. Respond ONLY with the exact food name in English. Do not include any descriptions, explanations, or additional text." },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Data
                  }
                }
              ]
            }]
          };

          // Hardcoded Gemini API key
          const GEMINI_API_KEY = "AIzaSyD-AQ42z440hcdVuUs5xI6Vn2YswKCszx0";
          
          // Call Gemini API
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || 'Unknown error';
            
            // Handle specific visibility check error
            if (errorMessage.includes('Visibility check was unavailable')) {
              throw new Error('Content safety check failed. Please try a different image.');
            }
            
            throw new Error(`API error: ${errorMessage}`);
          }

          const data = await response.json();
          
          // Add safety check for empty response
          if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No valid response from Gemini API');
          }
          
          const foodName = data.candidates[0].content?.parts?.[0]?.text?.trim();
          
          if (!foodName) {
            throw new Error('Could not identify food from image');
          }
          
          resolve(foodName);
        };
        
        reader.onerror = (error) => {
          reject(new Error('Failed to read image file'));
        };
        
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('Failed to analyze image. Please try again.'));
        }
      }
    });
  }
};

export const NutritionTracker: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const [symptomQuery, setSymptomQuery] = useState('');
  const [isSymptomLoading, setIsSymptomLoading] = useState(false);
  const [currentSymptomResult, setCurrentSymptomResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { entries, addEntry, deleteEntry } = useLocalNutrition();
  const { symptoms, addSymptom } = useLocalSymptoms();

  const handleDeleteEntry = (entryId: string) => {
    deleteEntry(entryId);
    toast.success('Nutrition entry deleted');
  };

  // Daily Summary calculations
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

  const totalCalories = getTotalCalories();
  const totalMacros = getTotalMacros();

  // Food search functionality
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

      const newEntry: NutritionEntry = {
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

  const validateImageFile = (file: File): boolean => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error('File size too large. Please select a file smaller than 20MB.');
      return false;
    }

    if (file.size < 100) {
      toast.error('File appears to be empty or corrupted.');
      return false;
    }

    return true;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      return;
    }

    setIsImageAnalyzing(true);
    
    try {
      toast.info('📸 Analyzing image...', { duration: 2000 });
      
      const detectedFood = await geminiService.analyzeImageForFood(file);
      
      toast.success(`🔍 Detected: ${detectedFood}`, { duration: 3000 });
      
      const result = await nutritionService.searchNutrition(detectedFood);
      
      if (!result || result.length === 0) {
        toast.error('No nutrition data found for the detected food item. Try entering it manually.');
        return;
      }

      const imageUrl = URL.createObjectURL(file);

      const newEntry: NutritionEntry = {
        id: generateId(),
        query: `📷 ${detectedFood}`,
        result: { items: result },
        timestamp: getTimestamp(),
        isImageBased: true,
        imageUrl: imageUrl,
      };

      addEntry(newEntry);
      toast.success('✅ Food image analyzed and logged successfully!');
      
    } catch (error) {
      console.error('Image analysis error:', error);
      
      // Handle specific Gemini API errors with custom messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage.includes('Content safety check failed') 
        ? '⚠️ Content safety check failed. Please try a different image.' 
        : 'Failed to analyze image. Please try again or enter manually.');
    } finally {
      setIsImageAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Symptom tracking functionality
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

        const newSymptom: Symptom = {
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

  // Nutrition Card component
  const NutritionCard: React.FC<{
    entry: NutritionEntry;
    onDelete: (entryId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
  }> = ({ entry, onDelete, isExpanded, onToggleExpand }) => {
    const totalCalories = entry.result.items.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = entry.result.items.reduce((sum, item) => sum + item.protein_g, 0);
    const totalCarbs = entry.result.items.reduce((sum, item) => sum + item.carbohydrates_total_g, 0);
    const totalFat = entry.result.items.reduce((sum, item) => sum + item.fat_total_g, 0);

    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              {entry.isImageBased && <Camera className="h-4 w-4 text-blue-500" />}
              <span>{entry.query}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(entry.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(entry.timestamp)}
          </p>
        </CardHeader>
        <CardContent>
          {entry.imageUrl && (
            <div className="mb-4">
              <img
                src={entry.imageUrl}
                alt="Food item"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="text-lg font-bold text-blue-600">{Math.round(totalCalories)}</div>
              <div className="text-xs text-muted-foreground">Calories</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="text-lg font-bold text-green-600">{Math.round(totalProtein)}g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div className="text-lg font-bold text-orange-600">{Math.round(totalCarbs)}g</div>
              <div className="text-xs text-muted-foreground">Carbs</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div className="text-lg font-bold text-purple-600">{Math.round(totalFat)}g</div>
              <div className="text-xs text-muted-foreground">Fat</div>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-3 border-t pt-3">
              <h4 className="font-medium text-sm">Detailed Nutrition:</h4>
              {entry.result.items.map((item, index) => (
                <div key={index} className="text-sm space-y-1 p-3 bg-muted/50 rounded">
                  <div className="font-medium">{item.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Serving: {item.serving_size_g}g</div>
                    <div>Sodium: {item.sodium_mg}mg</div>
                    <div>Fiber: {item.fiber_g}g</div>
                    <div>Sugar: {item.sugar_g}g</div>
                    <div>Saturated Fat: {item.fat_saturated_g}g</div>
                    <div>Cholesterol: {item.cholesterol_mg}mg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Symptom Card component
  const SymptomCard: React.FC<{ symptomData: SymptomResult }> = ({ symptomData }) => {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Symptom Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">
              {symptomData.description}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Common Causes</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {symptomData.commonCauses.map((cause, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {cause}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-red-600 mb-2 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Warning Signs</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {symptomData.warningSigns.map((sign, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-green-600 mb-2 flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Care Tips</span>
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {symptomData.careTips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

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
            <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
            <div className="text-sm opacity-90">Calories Today</div>
            <div className="text-xs opacity-75">Goal: {DAILY_TARGETS.calories}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(totalMacros.protein)}g</div>
            <div className="text-sm opacity-90">Protein</div>
            <div className="text-xs opacity-75">Goal: {DAILY_TARGETS.protein}g</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(totalMacros.carbs)}g</div>
            <div className="text-sm opacity-90">Carbs</div>
            <div className="text-xs opacity-75">Goal: {DAILY_TARGETS.carbs}g</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(totalMacros.fat)}g</div>
            <div className="text-sm opacity-90">Fat</div>
            <div className="text-xs opacity-75">Goal: {DAILY_TARGETS.fat}g</div>
          </CardContent>
        </Card>
      </div>

      {/* Food Logger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Log Food</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter food item (e.g., apple, chicken breast, rice)"
              disabled={isLoading || isImageAnalyzing}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isImageAnalyzing && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || isLoading || isImageAnalyzing}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,*"
              onChange={handleImageUpload}
              disabled={isImageAnalyzing || isLoading}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,*"
              capture="environment"
              onChange={handleImageUpload}
              disabled={isImageAnalyzing || isLoading}
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImageAnalyzing || isLoading}
              className="flex-1"
            >
              {isImageAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isImageAnalyzing || isLoading}
              className="flex-1"
            >
              {isImageAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            📸 Use AI-powered image recognition to automatically identify and log your food
            {isImageAnalyzing && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
                🔍 Analyzing image with Gemini AI... Please wait.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Food Entry List */}
      {entries.length === 0 ? (
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
      ) : (
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
      <div className="space-y-4">
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
      </div>
    </div>
  );
};