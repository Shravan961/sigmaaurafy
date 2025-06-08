import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Globe, X } from 'lucide-react';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { memoryService } from '@/services/memoryService';
import { toast } from "sonner";

interface WebChatToolProps {
  onSendToChat: (message: string) => void;
}

export const WebChatTool: React.FC<WebChatToolProps> = ({ onSendToChat }) => {
  const [url, setUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedContent, setLoadedContent] = useState<string>('');
  const [loadedUrl, setLoadedUrl] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [conversationThreadId, setConversationThreadId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  const normalizeUrl = (inputUrl: string): string => {
    let normalizedUrl = inputUrl.trim();
    
    // Add protocol if missing
    if (!normalizedUrl.match(/^https?:\/\//)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    return normalizedUrl;
  };

  const extractWebContent = async (url: string): Promise<string> => {
    try {
      // Normalize the URL
      const normalizedUrl = normalizeUrl(url);
      
      // Try multiple methods for content extraction
      let content = '';
      
      // Method 1: Direct fetch with CORS proxy
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(normalizedUrl)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data.contents) {
          content = await parseHtmlContent(data.contents);
        }
      } catch (error) {
        console.log('Proxy method failed, trying alternative...');
      }
      
      // Method 2: If proxy fails, try alternative proxy
      if (!content) {
        try {
          const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(normalizedUrl)}`;
          const response = await fetch(altProxyUrl);
          const htmlContent = await response.text();
          content = await parseHtmlContent(htmlContent);
        } catch (error) {
          console.log('Alternative proxy failed');
        }
      }
      
      if (!content || content.length < 100) {
        throw new Error('Unable to extract meaningful content from the webpage');
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load webpage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const parseHtmlContent = async (htmlContent: string): Promise<string> => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove scripts, styles, and other non-content elements
    const elementsToRemove = tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar');
    elementsToRemove.forEach(el => el.remove());
    
    // Extract meaningful content with priority order
    let content = '';
    const contentSelectors = [
      'article',
      '[role="main"]', 
      'main',
      '.content',
      '.post-content',
      '.entry-content', 
      '.article-content',
      '.main-content',
      'h1, h2, h3, h4, h5, h6, p, li, blockquote'
    ];
    
    for (const selector of contentSelectors) {
      const elements = tempDiv.querySelectorAll(selector);
      if (elements.length > 0) {
        content = Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 20)
          .join('\n\n')
          .trim();
        
        if (content.length > 500) break;
      }
    }
    
    // Fallback to all text content
    if (!content || content.length < 100) {
      content = tempDiv.textContent || '';
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
      .substring(0, 8000); // Increased limit for better context
    
    return content;
  };

  const handleLoadPage = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    try {
      const content = await extractWebContent(url);
      const normalizedUrl = normalizeUrl(url);
      
      setLoadedContent(content);
      setLoadedUrl(normalizedUrl);
      
      // Create conversation thread
      const threadId = memoryService.createThread('web_chat', `Web Chat: ${normalizedUrl}`);
      setConversationThreadId(threadId);
      memoryService.activateThread(threadId);
      
      // Save initial content to memory
      memoryService.addToThread(threadId, {
        type: 'web_chat',
        title: `Loaded webpage: ${normalizedUrl}`,
        content: content.substring(0, 1000) + '...',
        metadata: { url: normalizedUrl }
      });
      
      setShowConversation(true);
      toast.success('Webpage loaded successfully');
    } catch (error) {
      console.error('Load error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load webpage');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (!loadedContent) {
      toast.error('Please load a webpage first');
      return;
    }

    setIsProcessing(true);
    try {
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
              content: 'You are a helpful AI assistant that answers questions based on webpage content. Provide accurate, detailed responses based only on the provided content. Reference specific parts of the content when relevant.'
            },
            {
              role: 'user',
              content: `Based on the following webpage content, please answer this question: "${question}"\n\nWebpage URL: ${loadedUrl}\n\nContent:\n${loadedContent}\n\nPrevious conversation context:\n${conversationHistory.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n')}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content || 'Could not generate answer';
      
      const newConversation = { question: question.trim(), answer };
      setConversationHistory(prev => [...prev, newConversation]);
      
      // Save to memory and thread
      if (conversationThreadId) {
        memoryService.addToThread(conversationThreadId, {
          type: 'web_chat',
          title: `Q: ${question.trim()}`,
          content: `Q: ${question.trim()}\nA: ${answer}`,
          metadata: { url: loadedUrl }
        });
      }
      
      setQuestion('');
      toast.success('Question answered');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to answer question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseConversation = () => {
    setShowConversation(false);
    setConversationHistory([]);
    if (conversationThreadId) {
      memoryService.deactivateAllThreads();
    }
    setConversationThreadId(null);
    setLoadedContent('');
    setLoadedUrl('');
    setUrl('');
    onSendToChat(`🌐 **Web Chat Session Ended**\n\nConversation history has been saved to memory. You can reference this chat later!`);
  };

  if (showConversation && loadedContent) {
    return (
      <div className="w-96 h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-green-500" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm">Web Chat</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[250px]" title={loadedUrl}>
                {loadedUrl}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCloseConversation} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversationHistory.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">Ready to chat!</p>
              <p>Ask questions about this webpage content.</p>
            </div>
          ) : (
            conversationHistory.map((conv, index) => (
              <div key={index} className="space-y-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {conv.question}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {conv.answer}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin mr-3 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Processing question...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about the webpage..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isProcessing}
              onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleAskQuestion()}
              className="text-sm rounded-xl"
            />
            <Button 
              onClick={handleAskQuestion} 
              disabled={!question.trim() || isProcessing}
              size="sm"
              className="rounded-xl"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This conversation is saved to memory for future reference.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <span>Enhanced Web Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Input
              placeholder="Enter any website URL (e.g., youtube.com, github.com/user/repo)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
              className="rounded-xl"
            />
            <Button 
              onClick={handleLoadPage} 
              disabled={!url.trim() || isProcessing}
              className="w-full rounded-xl"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading Page...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Load & Chat with Webpage
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
            <p className="font-medium mb-2">Enhanced URL Support:</p>
            <ul className="space-y-1 text-xs">
              <li>• Works with any website (no protocol needed)</li>
              <li>• Automatic content extraction and parsing</li>
              <li>• Intelligent conversation with full context</li>
              <li>• Memory integration for future reference</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
