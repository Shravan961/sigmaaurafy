
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Heart, Info } from 'lucide-react';

interface SymptomData {
  name: string;
  description: string;
  commonCauses: string[];
  warningSigns: string[];
  careTips: string[];
}

interface SymptomCardProps {
  symptomData: SymptomData;
}

export const SymptomCard: React.FC<SymptomCardProps> = ({ symptomData }) => {
  return (
    <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-blue-500">
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize mb-2">
            {symptomData.name}
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {symptomData.description}
          </p>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Common Causes</h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {symptomData.commonCauses.map((cause, index) => (
              <li key={index}>{cause}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Warning Signs</h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
            {symptomData.warningSigns.map((sign, index) => (
              <li key={index}>{sign}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Care Tips</h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300">
            {symptomData.careTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Disclaimer:</strong> This information is for educational purposes only. 
            Always consult with a healthcare professional for proper medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
