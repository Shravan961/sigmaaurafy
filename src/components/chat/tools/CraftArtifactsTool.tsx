
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, Save } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface CraftArtifactsToolProps {
  onSendToChat: (message: string) => void;
}

export const CraftArtifactsTool: React.FC<CraftArtifactsToolProps> = ({ onSendToChat }) => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('story');
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState('medium');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a ${contentType} about "${topic}". 
      Tone: ${tone}
      Length: ${length}
      ${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}
      
      Make it engaging and well-structured.`;

      const result = await chatService.sendMessage(prompt);
      setGeneratedContent(result);
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast.success('Content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const saveToMemos = () => {
    const memos = JSON.parse(localStorage.getItem('userMemos') || '[]');
    const newMemo = {
      id: Date.now().toString(),
      title: `Generated ${contentType}: ${topic}`,
      content: generatedContent,
      timestamp: Date.now(),
      tags: ['generated', contentType]
    };
    memos.push(newMemo);
    localStorage.setItem('userMemos', JSON.stringify(memos));
    toast.success('Content saved to memos');
  };

  const downloadAsFile = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${contentType}-${topic.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Content downloaded');
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Craft Artifacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter your topic or idea..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-2">
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="blog-post">Blog Post</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
                <SelectItem value="script">Script</SelectItem>
                <SelectItem value="journal-entry">Journal Entry</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="poem">Poem</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="funny">Funny</SelectItem>
                <SelectItem value="serious">Serious</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="dramatic">Dramatic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={length} onValueChange={setLength}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="very-long">Very Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Additional instructions (optional)..."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            rows={2}
          />

          <Button 
            onClick={generateContent} 
            disabled={!topic.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </Button>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Generated Content
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={saveToMemos}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={downloadAsFile}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={12}
              className="w-full"
            />
            <div className="flex space-x-2 mt-3">
              <Button onClick={() => onSendToChat(generatedContent)} className="flex-1">
                Send to Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
