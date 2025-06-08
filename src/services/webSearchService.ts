
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

class WebSearchService {
  private async searchWithProxy(query: string): Promise<SearchResult[]> {
    try {
      // Using DuckDuckGo instant answer API as a simple search proxy
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      const results: SearchResult[] = [];
      
      // Add abstract if available
      if (data.Abstract) {
        results.push({
          title: data.AbstractSource || 'Search Result',
          url: data.AbstractURL || '',
          snippet: data.Abstract
        });
      }
      
      // Add related topics
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL || '',
              snippet: topic.Text
            });
          }
        });
      }
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async search(query: string): Promise<string> {
    try {
      const results = await this.searchWithProxy(query);
      
      if (results.length === 0) {
        return "I couldn't find specific information about that topic. Could you try rephrasing your question?";
      }
      
      // Compile search results for Groq summarization
      const searchContext = results.map(result => 
        `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.snippet}`
      ).join('\n\n');
      
      // Use Groq to summarize and provide intelligent response
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
              content: 'You are a helpful AI assistant that provides accurate, concise summaries based on search results. Provide a clear, informative response based on the search data provided.'
            },
            {
              role: 'user',
              content: `User asked: "${query}"\n\nSearch Results:\n${searchContext}\n\nPlease provide a comprehensive but concise answer based on this information.`
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I found some information but had trouble processing it. Please try rephrasing your question.';
    } catch (error) {
      console.error('Web search error:', error);
      return 'I encountered an error while searching. Please try again or rephrase your question.';
    }
  }
}

export const webSearchService = new WebSearchService();
