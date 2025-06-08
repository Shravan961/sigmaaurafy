
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface AISolverToolProps {
  onSendToChat: (message: string) => void;
}

export const AISolverTool: React.FC<AISolverToolProps> = ({ onSendToChat }) => {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const solveProblem = async () => {
    if (!problem.trim()) return;
    
    setIsLoading(true);
    try {
      const prompt = `Solve this math or logic problem step by step: ${problem}`;
      const result = await chatService.sendMessage(prompt);
      setSolution(result);
    } catch (error) {
      toast.error('Failed to solve problem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Problem to Solve
        </label>
        <Textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Enter your math or logic problem..."
          rows={3}
        />
      </div>

      <Button 
        onClick={solveProblem} 
        disabled={!problem.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? 'Solving...' : 'Solve Problem'}
      </Button>

      {solution && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Solution
          </label>
          <Textarea
            value={solution}
            readOnly
            rows={6}
            className="bg-gray-50 dark:bg-gray-700"
          />
          <Button 
            onClick={() => onSendToChat(solution)} 
            className="mt-2 w-full"
            variant="outline"
          >
            Send to Chat
          </Button>
        </div>
      )}
    </div>
  );
};
