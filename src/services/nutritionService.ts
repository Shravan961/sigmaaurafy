import { CALORIE_NINJAS_KEY, GEMINI_API_KEY, GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { memoryService } from './memoryService';

export interface NutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  serving_size?: string;
  confidence?: number;
}

export const analyzeFoodImage = async (imageFile: File): Promise<string> => {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Use Gemini API for food identification
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Identify the food items in this image. Provide the name of each food item, estimated portion size, and any visible details that would help determine nutritional content. Be specific about quantities (e.g., '1 medium apple', '2 slices of bread', '1 cup of rice'). If multiple items are visible, list them all separately."
            },
            {
              inline_data: {
                mime_type: imageFile.type,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Add proper null checks for the response structure
    let identifiedFood: string | null = null;
    
    if (data && 
        Array.isArray(data.candidates) && 
        data.candidates.length > 0 && 
        data.candidates[0] && 
        data.candidates[0].content && 
        Array.isArray(data.candidates[0].content.parts) && 
        data.candidates[0].content.parts.length > 0 && 
        data.candidates[0].content.parts[0] && 
        data.candidates[0].content.parts[0].text) {
      identifiedFood = data.candidates[0].content.parts[0].text;
    }
    
    if (!identifiedFood) {
      console.error('Gemini API response structure:', JSON.stringify(data, null, 2));
      throw new Error('Could not identify food in image - invalid response structure');
    }

    // Use Groq to refine the food identification for nutrition lookup
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert. Convert food descriptions into simple, nutrition-database-friendly queries. Return only the food name and quantity in a format suitable for CalorieNinja API.'
          },
          {
            role: 'user',
            content: `Convert this food identification into a simple query: ${identifiedFood}`
          }
        ],
        temperature: 0.2,
        max_tokens: 100
      })
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqResponse.status);
      // Fall back to using the original identified food if Groq fails
      const refinedQuery = identifiedFood;
      
      // Save the food identification to memory
      memoryService.addMemory({
        type: 'chat',
        title: `Food Identified: ${refinedQuery}`,
        content: `Original Gemini identification: ${identifiedFood}\nRefined query: ${refinedQuery} (Groq refinement failed)`,
        metadata: { 
          foodIdentification: true,
          originalGeminiResult: identifiedFood,
          refinedQuery: refinedQuery
        }
      });

      return refinedQuery;
    }

    const groqData = await groqResponse.json();
    const refinedQuery = (groqData.choices && 
                         Array.isArray(groqData.choices) && 
                         groqData.choices.length > 0 && 
                         groqData.choices[0] && 
                         groqData.choices[0].message && 
                         groqData.choices[0].message.content) 
                         ? groqData.choices[0].message.content 
                         : identifiedFood;

    // Save the food identification to memory
    memoryService.addMemory({
      type: 'chat',
      title: `Food Identified: ${refinedQuery}`,
      content: `Original Gemini identification: ${identifiedFood}\nRefined query: ${refinedQuery}`,
      metadata: { 
        foodIdentification: true,
        originalGeminiResult: identifiedFood,
        refinedQuery: refinedQuery
      }
    });

    return refinedQuery;
  } catch (error) {
    console.error('Food image analysis error:', error);
    throw new Error('Unable to identify food in image. Please try again or enter manually.');
  }
};

export const nutritionService = {
  async searchNutrition(query: string): Promise<NutritionItem[]> {
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
        headers: {
          'X-Api-Key': CALORIE_NINJAS_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`CalorieNinjas API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.items || [];
      
      // Enhance nutrition data with Groq analysis
      if (items.length > 0) {
        try {
          const enhancedResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                {
                  role: 'system',
                  content: 'You are a nutrition expert. Provide additional health insights, serving recommendations, and nutritional context for food items.'
                },
                {
                  role: 'user',
                  content: `Provide brief health insights for: ${query}. Include serving recommendations and any notable nutritional benefits or concerns.`
                }
              ],
              temperature: 0.3,
              max_tokens: 200
            })
          });

          if (enhancedResponse.ok) {
            const enhancedData = await enhancedResponse.json();
            const insights = (enhancedData.choices && 
                             Array.isArray(enhancedData.choices) && 
                             enhancedData.choices.length > 0 && 
                             enhancedData.choices[0] && 
                             enhancedData.choices[0].message && 
                             enhancedData.choices[0].message.content) 
                             ? enhancedData.choices[0].message.content 
                             : null;

            if (insights) {
              // Add insights to memory
              memoryService.addMemory({
                type: 'chat',
                title: `Nutrition Analysis: ${query}`,
                content: `Food items: ${items.map(item => `${item.name} (${item.calories} cal)`).join(', ')}\n\nHealth insights: ${insights}`,
                metadata: { 
                  nutritionQuery: query,
                  totalCalories: items.reduce((sum, item) => sum + item.calories, 0),
                  insights: insights
                }
              });
            }
          }
        } catch (error) {
          console.error('Error getting nutrition insights:', error);
        }
      }

      return items;
    } catch (error) {
      console.error('Nutrition API error:', error);
      throw error;
    }
  }
};