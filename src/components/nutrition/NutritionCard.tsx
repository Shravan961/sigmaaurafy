
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Image, Trash2 } from 'lucide-react';
import { NutritionEntry } from '@/types';
import { formatDateTime } from '@/utils/helpers';

interface NutritionCardProps {
  entry: NutritionEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ entry, isExpanded, onToggle, onDelete }) => {
  const totalCalories = entry.result.items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              {entry.isImageBased && <Image className="h-4 w-4 text-blue-600" />}
              <h4 className="font-medium text-gray-900 dark:text-white">
                {entry.query}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatDateTime(entry.timestamp)} • {totalCalories} calories
            </p>
          </div>
          <div className="flex space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {entry.imageUrl && (
          <div className="mb-3">
            <img 
              src={entry.imageUrl} 
              alt="Food" 
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}

        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mt-3 space-y-2">
            {entry.result.items.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h5 className="font-medium text-gray-900 dark:text-white capitalize mb-2">
                  {item.name}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="ml-1 font-medium">{item.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                    <span className="ml-1 font-medium">{item.protein_g}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                    <span className="ml-1 font-medium">{item.fat_total_g}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                    <span className="ml-1 font-medium">{item.carbohydrates_total_g}g</span>
                  </div>
                  {item.fiber_g && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fiber:</span>
                      <span className="ml-1 font-medium">{item.fiber_g}g</span>
                    </div>
                  )}
                  {item.sugar_g && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sugar:</span>
                      <span className="ml-1 font-medium">{item.sugar_g}g</span>
                    </div>
                  )}
                  {item.sodium_mg && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sodium:</span>
                      <span className="ml-1 font-medium">{item.sodium_mg}mg</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
