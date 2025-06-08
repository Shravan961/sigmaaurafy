
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Loader2 } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface RoastMasterToolProps {
  onSendToChat: (message: string) => void;
}

export const RoastMasterTool: React.FC<RoastMasterToolProps> = ({ onSendToChat }) => {
  const [input, setInput] = useState('');
  const [roastStyle, setRoastStyle] = useState('playful');
  const [isProcessing, setIsProcessing] = useState(false);

  const roastStyles = {
    playful: 'Playful and lighthearted',
    witty: 'Clever and witty',
    sarcastic: 'Sarcastic but fun',
    gentle: 'Gentle and friendly teasing',
    creative: 'Creative and unexpected'
  };

  const handleRoast = async () => {
    if (!input.trim()) {
      toast.error('Please enter something to roast');
      return;
    }

    setIsProcessing(true);
    try {
      const prompt = `Create a ${roastStyles[roastStyle as keyof typeof roastStyles].toLowerCase()} roast of the following content. Keep it fun, creative, and never offensive or hurtful. Make it entertaining and good-natured:\n\n"${input}"`;
      
      const roast = await chatService.sendMessage(prompt);
      
      onSendToChat(`🔥 **Roast Master says:**\n\n${roast}\n\n*All in good fun! 😄*`);
      toast.success('Roast delivered! 🔥');
      setInput('');
    } catch (error) {
      console.error('Roast error:', error);
      toast.error('Failed to generate roast. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span>Roast Master</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter anything you want roasted (ideas, messages, concepts)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            rows={3}
          />
          
          <Select value={roastStyle} onValueChange={setRoastStyle} disabled={isProcessing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roastStyles).map(([key, description]) => (
                <SelectItem key={key} value={key}>
                  {description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRoast} 
            disabled={!input.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Roasting...
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 mr-2" />
                Get Roasted! 🔥
              </>
            )}
          </Button>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Get playful, creative roasts - all in good humor!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
