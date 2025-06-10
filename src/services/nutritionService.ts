const CALORIE_NINJAS_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual API key

export class NutritionService {
  async searchNutrition(query: string) {
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
      throw error;
    }
  }
}

export const nutritionService = new NutritionService();

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