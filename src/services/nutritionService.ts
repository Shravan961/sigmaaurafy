import { CALORIE_NINJAS_KEY, GEMINI_API_KEY } from '@/utils/constants';

export interface NutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

export class NutritionService {
  async searchNutrition(query: string): Promise<NutritionItem[]> {
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
        headers: {
          'X-Api-Key': CALORIE_NINJAS_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Nutrition API error:', error);
      // Fallback with mock data for development
      return this.getMockNutritionData(query);
    }
  }

  private getMockNutritionData(query: string): NutritionItem[] {
    // Mock data for common foods when API is not available
    const mockData: { [key: string]: NutritionItem } = {
      'apple': {
        name: 'Apple',
        calories: 95,
        protein_g: 0.5,
        fat_total_g: 0.3,
        carbohydrates_total_g: 25,
        fiber_g: 4,
        sugar_g: 19,
        sodium_mg: 2
      },
      'banana': {
        name: 'Banana',
        calories: 105,
        protein_g: 1.3,
        fat_total_g: 0.4,
        carbohydrates_total_g: 27,
        fiber_g: 3,
        sugar_g: 14,
        sodium_mg: 1
      },
      'chicken breast': {
        name: 'Chicken Breast',
        calories: 231,
        protein_g: 43.5,
        fat_total_g: 5,
        carbohydrates_total_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 104
      },
      'rice': {
        name: 'White Rice',
        calories: 205,
        protein_g: 4.3,
        fat_total_g: 0.4,
        carbohydrates_total_g: 45,
        fiber_g: 0.6,
        sugar_g: 0.1,
        sodium_mg: 2
      }
    };

    const lowerQuery = query.toLowerCase();
    const matchedFood = Object.keys(mockData).find(key => 
      lowerQuery.includes(key) || key.includes(lowerQuery)
    );

    if (matchedFood) {
      return [mockData[matchedFood]];
    }

    // Generic fallback
    return [{
      name: query,
      calories: 100,
      protein_g: 5,
      fat_total_g: 3,
      carbohydrates_total_g: 15,
      fiber_g: 2,
      sugar_g: 5,
      sodium_mg: 50
    }];
  }
}

export const nutritionService = new NutritionService();

export const analyzeFoodImage = async (file: File): Promise<string> => {
  try {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please select an image.');
    }

    const reader = new FileReader();

    const base64: string = await new Promise((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        if (!result) {
          reject(new Error('Failed to read file'));
          return;
        }
        const base64Data = result.split(',')[1];
        if (!base64Data) {
          reject(new Error('Failed to extract base64 data'));
          return;
        }
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
                text: "What type of food is this? Give a short, simple name suitable for nutrition lookup. If you can't identify food in the image, respond with 'unknown food item'."
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      throw new Error("Invalid response structure from Gemini API");
    }

    const guess = data.candidates[0].content.parts[0].text?.trim();

    if (!guess || guess.toLowerCase().includes('unknown') || guess.toLowerCase().includes('cannot') || guess.toLowerCase().includes('unable')) {
      throw new Error("Unable to identify food in image");
    }

    return guess;
  } catch (error) {
    console.error("Gemini image analysis failed:", error);
    throw new Error("Unable to identify food in image. Please try again or enter manually.");
  }
};