
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface MakeItMoreToolProps {
  onSendToChat: (message: string) => void;
}

export const MakeItMoreTool: React.FC<MakeItMoreToolProps> = ({ onSendToChat }) => {
  const [input, setInput] = useState('');
  const [enhancementType, setEnhancementType] = useState('expand');
  const [isProcessing, setIsProcessing] = useState(false);

  const enhancementTypes = {
    expand: 'Expand with more details and examples',
    creative: 'Add creative alternatives and ideas',
    professional: 'Make it more professional and polished',
    detailed: 'Add depth and comprehensive analysis',
    examples: 'Include relevant examples and use cases',
    structured: 'Organize and structure the content better'
  };

  const handleEnhance = async () => {
    if (!input.trim()) {
      toast.error('Please enter some content to enhance');
      return;
    }

    setIsProcessing(true);
    try {
      const prompt = `Please ${enhancementTypes[enhancementType as keyof typeof enhancementTypes].toLowerCase()} for the following content:\n\n"${input}"\n\nProvide an enhanced version that is more comprehensive and valuable.`;
      
      const enhanced = await chatService.sendMessage(prompt);
      
      onSendToChat(`✨ **Enhanced Content:**\n\n${enhanced}`);
      toast.success('Content enhanced successfully');
      setInput('');
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance content. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span>Make It More</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your content here to enhance it..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            rows={4}
          />
          
          <Select value={enhancementType} onValueChange={setEnhancementType} disabled={isProcessing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(enhancementTypes).map(([key, description]) => (
                <SelectItem key={key} value={key}>
                  {description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleEnhance} 
            disabled={!input.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance Content
              </>
            )}
          </Button>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Transform your ideas into richer, more detailed content
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
