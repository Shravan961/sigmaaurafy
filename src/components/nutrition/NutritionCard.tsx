import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Camera } from 'lucide-react';
import { formatDateTime } from '@/utils/helpers';
import { NutritionItem } from '@/services/nutritionService';

interface NutritionEntry {
  id: string;
  query: string;
  result: {
    items: NutritionItem[];
  };
  timestamp: number;
  isImageBased?: boolean;
  imageUrl?: string;
}

interface NutritionCardProps {
  entry: NutritionEntry;
  onDelete: (entryId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ 
  entry, 
  onDelete, 
  isExpanded, 
  onToggleExpand 
}) => {
  const totalCalories = entry.result.items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = entry.result.items.reduce((sum, item) => sum + item.protein_g, 0);
  const totalCarbs = entry.result.items.reduce((sum, item) => sum + item.carbohydrates_total_g, 0);
  const totalFat = entry.result.items.reduce((sum, item) => sum + item.fat_total_g, 0);

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            {entry.isImageBased && <Camera className="h-4 w-4 text-blue-500" />}
            <span>{entry.query}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(entry.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500">{formatDateTime(entry.timestamp)}</p>
      </CardHeader>
      
      <CardContent>
        {entry.imageUrl && (
          <div className="mb-4">
            <img 
              src={entry.imageUrl} 
              alt="Food" 
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(totalCalories)}</div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(totalProtein)}g</div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(totalCarbs)}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(totalFat)}g</div>
            <div className="text-sm text-gray-600">Fat</div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleExpand}
          className="w-full mb-3"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>

        {isExpanded && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Detailed Breakdown:</h4>
            {entry.result.items.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">{item.name}</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {item.calories}</div>
                  <div>Protein: {item.protein_g}g</div>
                  <div>Carbs: {item.carbohydrates_total_g}g</div>
                  <div>Fat: {item.fat_total_g}g</div>
                  {item.fiber_g && <div>Fiber: {item.fiber_g}g</div>}
                  {item.sugar_g && <div>Sugar: {item.sugar_g}g</div>}
                  {item.sodium_mg && <div>Sodium: {item.sodium_mg}mg</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};