import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, TrendingUp, Upload, Camera, Loader2 } from 'lucide-react';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalSymptoms } from '@/hooks/useLocalSymptoms';
import { nutritionService } from '@/services/nutritionService';
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
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
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

  const validateImageFile = (file: File): boolean => {
    // Check file type - be more specific about supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      toast.error('Please select a JPEG, PNG, or WebP image file');
      return false;
    }

    // Check file size (max 4MB for better compatibility)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      toast.error('Image size too large. Please select an image smaller than 4MB.');
      return false;
    }

    // Check minimum file size
    if (file.size < 1024) { // 1KB minimum
      toast.error('Image file appears to be corrupted or too small.');
      return false;
    }

    return true;
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result as string;
          if (!result) {
            reject(new Error('Failed to read file'));
            return;
          }
          // Extract base64 data without the data URL prefix
          const base64Data = result.split(',')[1];
          if (!base64Data) {
            reject(new Error('Failed to extract base64 data'));
            return;
          }
          resolve(base64Data);
        } catch (error) {
          reject(new Error('Error processing file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  };

  const analyzeImageWithGemini = async (file: File): Promise<string> => {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
        throw new Error('Gemini API key not configured. Please add your API key to constants.ts');
      }

      // Validate file before processing
      if (!validateImageFile(file)) {
        throw new Error('Invalid file format');
      }

      const base64Data = await convertImageToBase64(file);

      // Ensure we have valid base64 data
      if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid image data');
      }

      // Use the correct MIME type mapping
      let mimeType = file.type;
      if (mimeType === 'image/jpg') {
        mimeType = 'image/jpeg';
      }

      console.log('Sending request to Gemini API with file type:', mimeType);

      const requestBody = {
        contents: [{
          parts: [
            {
              text: "Analyze this food image and identify the main food items. Provide a simple description suitable for nutrition lookup. For example: 'grilled chicken breast', 'caesar salad', 'chocolate chip cookies'. If multiple items are visible, list them separated by commas. If you cannot identify food items clearly, respond with 'unable to identify food items'."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 100,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Gemini API response status:', response.status);

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('Gemini API error response:', errorData);
          
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        if (response.status === 400) {
          throw new Error('Invalid image or request format. Please try a different image.');
        } else if (response.status === 403) {
          throw new Error('API access denied. Please check your API key configuration.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();
      console.log('Gemini API response data:', data);
      
      // Validate response structure
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('No analysis results received from API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        throw new Error('Invalid response structure from API');
      }

      const textPart = candidate.content.parts[0];
      if (!textPart.text) {
        throw new Error('No text content in API response');
      }

      const detectedFood = textPart.text.trim();
      
      // Check if food was actually detected
      if (!detectedFood || 
          detectedFood.toLowerCase().includes('unable to identify') ||
          detectedFood.toLowerCase().includes('no clear food') ||
          detectedFood.toLowerCase().includes('cannot identify') ||
          detectedFood.toLowerCase().includes('no food') ||
          detectedFood.length < 3) {
        throw new Error('No recognizable food items detected in the image');
      }

      return detectedFood;
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate the file first
    if (!validateImageFile(file)) {
      return;
    }

    setIsImageAnalyzing(true);
    
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
        toast.error('⚠️ Gemini API key not configured. Please add your API key to use image analysis.');
        
        // Fallback: still create entry but without AI analysis
        const imageUrl = URL.createObjectURL(file);
        const fallbackEntry = {
          id: generateId(),
          query: `📷 Image upload - ${file.name}`,
          result: { items: [{
            name: 'Manual identification needed',
            calories: 0,
            serving_size_g: 0,
            fat_total_g: 0,
            fat_saturated_g: 0,
            protein_g: 0,
            sodium_mg: 0,
            potassium_mg: 0,
            cholesterol_mg: 0,
            carbohydrates_total_g: 0,
            fiber_g: 0,
            sugar_g: 0,
          }] },
          timestamp: getTimestamp(),
          isImageBased: true,
          imageUrl: imageUrl,
        };
        
        addEntry(fallbackEntry);
        toast.info('Image uploaded. Please manually identify the food items.');
        return;
      }
      
      // Show initial processing message
      toast.info('📸 Analyzing image...', { duration: 2000 });
      
      // Analyze the image with Gemini
      const detectedFood = await analyzeImageWithGemini(file);
      
      // Show what was detected
      toast.success(`🔍 Detected: ${detectedFood}`, { duration: 3000 });
      
      // Get nutrition data for the detected food
      const result = await nutritionService.searchNutrition(detectedFood);
      
      if (!result || result.length === 0) {
        toast.error('No nutrition data found for the detected food item. Try entering it manually.');
        return;
      }

      // Create image URL for display
      const imageUrl = URL.createObjectURL(file);

      // Create the nutrition entry
      const newEntry = {
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
      
      let errorMessage = 'Unable to analyze image. Please try again or enter food manually.';
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'API configuration error. Please add your Gemini API key to constants.ts';
        } else if (error.message.includes('Invalid image format') || error.message.includes('Invalid file format')) {
          errorMessage = 'Invalid image format. Please try with a clear JPEG or PNG image.';
        } else if (error.message.includes('No recognizable food')) {
          errorMessage = 'No food items detected. Please try with a clearer image of food.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Service temporarily busy. Please wait a moment and try again.';
        } else if (error.message.includes('API access denied')) {
          errorMessage = 'API access denied. Please check your API key configuration.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsImageAnalyzing(false);
      // Clear the file input
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
        {(!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') && (
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> To use AI image analysis, please add your Gemini API key to <code>src/utils/constants.ts</code>
            </p>
          </div>
        )}
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

          {/* Image Upload */}
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={isImageAnalyzing || isLoading}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
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
