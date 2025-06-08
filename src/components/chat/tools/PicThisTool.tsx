
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { GEMINI_API_KEY } from '@/utils/constants';

interface PicThisToolProps {
  onSendToChat: (message: string) => void;
}

export const PicThisTool: React.FC<PicThisToolProps> = ({ onSendToChat }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImageWithGemini = async (base64Image: string): Promise<string> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this image in full detail. Provide a comprehensive description including: 1) What objects/items you see, 2) Colors, shapes, and visual characteristics, 3) The setting/environment, 4) Any text or writing visible, 5) The overall context or purpose, 6) Any notable features or interesting details. Be thorough and descriptive."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!analysis) {
        throw new Error('No analysis received from Gemini');
      }

      return analysis;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size should be less than 10MB');
      return;
    }

    try {
      const base64 = await convertImageToBase64(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      
      // Auto-analyze the image
      await analyzeImage(base64);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const analyzeImage = async (base64Image: string) => {
    if (!GEMINI_API_KEY) {
      toast.error('Gemini API key not configured');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeImageWithGemini(base64Image);
      
      // Send analysis to chat
      onSendToChat(`🖼️ **Image Analysis:**\n\n${analysis}`);
      
      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col p-4 max-w-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Camera className="h-5 w-5" />
            <span>PicThis - AI Image Analysis</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {!selectedImage ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-white" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Analyze Any Image</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Upload or take a photo to get detailed AI analysis
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected for analysis"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isAnalyzing && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Analyzing image with AI...
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={clearImage}
                  variant="outline"
                  className="flex-1"
                >
                  Clear Image
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  New Image
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
