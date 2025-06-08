
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2 } from 'lucide-react';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { toast } from "sonner";

interface WebSummaryToolProps {
  onSendToChat: (message: string) => void;
}

export const WebSummaryTool: React.FC<WebSummaryToolProps> = ({ onSendToChat }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const extractWebContent = async (url: string): Promise<string> => {
    try {
      // Using CORS proxy to fetch web content
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.contents;
      
      // Remove scripts and styles
      const scripts = tempDiv.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      // Extract main content (try common content selectors)
      let content = '';
      const contentSelectors = [
        'article', '[role="main"]', 'main', '.content', '.post-content', 
        '.entry-content', '.article-content', 'p'
      ];
      
      for (const selector of contentSelectors) {
        const elements = tempDiv.querySelectorAll(selector);
        if (elements.length > 0) {
          content = Array.from(elements)
            .map(el => el.textContent)
            .join('\n')
            .trim();
          if (content.length > 200) break;
        }
      }
      
      // Fallback to all text content
      if (!content || content.length < 100) {
        content = tempDiv.textContent || '';
      }
      
      // Clean up and limit content
      content = content
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000);
      
      return content || 'Could not extract meaningful content from the webpage.';
    } catch (error) {
      throw new Error('Failed to fetch webpage content');
    }
  };

  const handleSummarize = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL format');
      return;
    }

    setIsProcessing(true);
    try {
      const content = await extractWebContent(url);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that provides concise summaries of webpage content. Focus on key points and main takeaways.'
            },
            {
              role: 'user',
              content: `Please provide a concise summary of this webpage content:\n\nURL: ${url}\n\nContent:\n${content}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'Could not generate summary';
      
      onSendToChat(`🌐 **Web Page Summary:**\n\n${summary}\n\n🔗 [View Source](${url})`);
      toast.success('Web page summarized successfully');
      setUrl('');
    } catch (error) {
      console.error('Web summary error:', error);
      toast.error('Failed to summarize webpage. Please check the URL and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span>Web Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter website URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSummarize} 
              disabled={!url.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Summarizing...
                </>
              ) : (
                'Summarize Page'
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Extract and summarize content from any webpage
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
