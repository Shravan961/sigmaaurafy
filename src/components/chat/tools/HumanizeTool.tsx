
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface HumanizeToolProps {
  onSendToChat: (message: string) => void;
}

export const HumanizeTool: React.FC<HumanizeToolProps> = ({ onSendToChat }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleHumanize = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const prompt = `Rewrite the following text to sound more natural, friendly, and conversational while keeping the core meaning: "${input}"`;
      const result = await chatService.sendMessage(prompt);
      setOutput(result);
    } catch (error) {
      toast.error('Failed to humanize text');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text to Humanize
        </label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste AI-generated or formal text here..."
          rows={4}
        />
      </div>

      <Button 
        onClick={handleHumanize} 
        disabled={!input.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? 'Humanizing...' : 'Humanize Text'}
      </Button>

      {output && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Humanized Result
          </label>
          <Textarea
            value={output}
            readOnly
            rows={4}
            className="bg-gray-50 dark:bg-gray-700"
          />
          <Button 
            onClick={() => onSendToChat(output)} 
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
