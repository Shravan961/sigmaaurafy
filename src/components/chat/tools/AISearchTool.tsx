
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Clock, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enhancedSearchService } from '@/services/enhancedSearchService';
import { memoryService } from '@/services/memoryService';

interface AISearchToolProps {
  onSendToChat: (message: string) => void;
}

export const AISearchTool: React.FC<AISearchToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Enhanced AI Search for:', query);
      
      // Perform enhanced search
      const searchResult = await enhancedSearchService.performEnhancedSearch(query.trim());
      
      // Save to memory
      memoryService.addMemory({
        type: 'chat',
        title: `AI Search: ${query}`,
        content: searchResult,
        metadata: { searchQuery: query }
      });
      
      // Send to chat with enhanced formatting
      const message = `🔍 **Enhanced AI Search Results for:** "${query}"\n\n${searchResult}\n\n---\n*Powered by real-time web search + AI analysis + comprehensive summarization*`;
      onSendToChat(message);
      
      // Add to search history
      setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
      
      // Clear input on success
      setQuery('');
      
      toast({
        title: "Success",
        description: "Enhanced AI search completed successfully!"
      });
      
    } catch (error) {
      console.error('Enhanced search error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform search",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historicalQuery: string) => {
    setQuery(historicalQuery);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Enhanced AI Search
        </CardTitle>
        <CardDescription>
          Real-time web search with AI-powered analysis, content extraction, and intelligent summarization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="What would you like to research?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
          />
          <Button 
            onClick={handleSearch} 
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {searchHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Recent Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((historyQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleHistoryClick(historyQuery)}
                  className="text-xs"
                  disabled={loading}
                >
                  {historyQuery}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            🔍 Searching web → 📊 Extracting content → 🧠 AI analysis → 📝 Synthesizing results...
          </div>
        )}
        
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>🚀 Enhanced Capabilities:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Real-time web content extraction and analysis</li>
            <li>AI-powered summarization with source attribution</li>
            <li>Intelligent synthesis of multiple sources</li>
            <li>Conversation memory integration</li>
            <li>Search history for quick re-queries</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
