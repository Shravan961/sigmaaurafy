
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { memoryService } from './memoryService';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

class EnhancedSearchService {
  private async determineIfSearchNeeded(query: string): Promise<boolean> {
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
              content: 'You are a search intent classifier. Determine if a query requires real-time web search or if you can answer it with your knowledge. Respond with only "SEARCH_NEEDED" or "NO_SEARCH_NEEDED".'
            },
            {
              role: 'user',
              content: `Query: "${query}"\n\nDoes this require real-time web search for current information like prices, stock values, recent news, specific website content, or current data?`
            }
          ],
          temperature: 0.1,
          max_tokens: 20
        })
      });

      const data = await response.json();
      const decision = data.choices[0]?.message?.content?.trim();
      return decision === 'SEARCH_NEEDED';
    } catch (error) {
      console.error('Error determining search need:', error);
      return true; // Default to search if unsure
    }
  }

  private async fetchWebContent(url: string): Promise<string> {
    try {
      // Use AllOrigins as a CORS proxy
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (!data.contents) {
        throw new Error('No content received');
      }
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.contents;
      
      // Remove scripts, styles, and other unwanted elements
      const unwantedElements = tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .ads, .advertisement, .sidebar, .menu');
      unwantedElements.forEach(el => el.remove());
      
      // Try to find main content
      let content = '';
      const contentSelectors = [
        'article', '[role="main"]', 'main', '.content', '.post-content', 
        '.entry-content', '.article-content', '.article-body', '.main-content', 'p'
      ];
      
      for (const selector of contentSelectors) {
        const elements = tempDiv.querySelectorAll(selector);
        if (elements.length > 0) {
          content = Array.from(elements)
            .map(el => el.textContent)
            .join('\n')
            .trim();
          if (content.length > 500) break;
        }
      }
      
      // Fallback to all text if no specific content found
      if (!content || content.length < 200) {
        content = tempDiv.textContent || '';
      }
      
      return content.replace(/\s+/g, ' ').trim().substring(0, 8000);
    } catch (error) {
      console.error('Error fetching web content:', error);
      return '';
    }
  }

  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      const results: SearchResult[] = [];
      
      // Add abstract if available
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: data.AbstractSource || 'Reference',
          url: data.AbstractURL,
          snippet: data.Abstract
        });
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 6)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        }
      }

      // Try to fetch actual content for each result
      for (const result of results) {
        if (result.url) {
          result.content = await this.fetchWebContent(result.url);
        }
      }

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private async analyzeWebsite(url: string): Promise<string> {
    try {
      const content = await this.fetchWebContent(url);
      
      if (!content) {
        return "I couldn't access the content of this website. It might be blocked or have restrictions.";
      }

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
              content: 'You are a web content analyzer. Summarize the main content, purpose, and key information from the provided website content. Be clear and informative.'
            },
            {
              role: 'user',
              content: `Analyze this website content from ${url}:\n\n${content.substring(0, 6000)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Could not analyze website content';
    } catch (error) {
      console.error('Website analysis error:', error);
      return 'Error analyzing website content';
    }
  }

  private async summarizeWithGroq(content: string, context: string): Promise<string> {
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
              content: 'You are an expert research assistant. Summarize web content into clear, informative bullet points. Focus on key facts, insights, and practical information. Avoid repetition and filler content.'
            },
            {
              role: 'user',
              content: `Context: ${context}\n\nContent to summarize:\n${content}`
            }
          ],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Could not generate summary';
    } catch (error) {
      console.error('Groq summarization error:', error);
      return content.substring(0, 400) + '...';
    }
  }

  async performEnhancedSearch(query: string): Promise<string> {
    try {
      // Check if this is a website analysis request
      const urlPattern = /(https?:\/\/[^\s]+)/gi;
      const urls = query.match(urlPattern);
      
      if (urls && urls.length > 0) {
        const url = urls[0];
        const analysis = await this.analyzeWebsite(url);
        
        // Save to memory
        memoryService.addMemory({
          type: 'web_chat',
          title: `Website Analysis: ${url}`,
          content: analysis,
          metadata: { url: url, websiteAnalysis: true }
        });
        
        return analysis;
      }

      // Check if we need to search or can answer directly
      const needsSearch = await this.determineIfSearchNeeded(query);
      
      if (!needsSearch) {
        // Answer directly with Groq
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
                content: 'You are a knowledgeable AI assistant. Provide accurate, helpful responses based on your knowledge. Be concise but comprehensive.'
              },
              {
                role: 'user',
                content: query
              }
            ],
            temperature: 0.4,
            max_tokens: 800
          })
        });

        const data = await response.json();
        const directAnswer = data.choices[0]?.message?.content;
        
        // Save to memory
        memoryService.addMemory({
          type: 'chat',
          title: `Direct Answer: ${query}`,
          content: directAnswer,
          metadata: { directAnswer: true, searchQuery: query }
        });
        
        return directAnswer;
      }

      // Perform web search
      const searchResults = await this.searchDuckDuckGo(query);
      
      if (searchResults.length === 0) {
        return "I couldn't find specific information about that topic. Could you try rephrasing your search query?";
      }

      // Summarize each result
      const summaries: string[] = [];
      for (const result of searchResults) {
        if (result.content && result.content.length > 100) {
          const summary = await this.summarizeWithGroq(result.content, `Query: ${query}, Source: ${result.title}`);
          summaries.push(`**${result.title}**\n${summary}\n🔗 [Source](${result.url})`);
        } else if (result.snippet) {
          summaries.push(`**${result.title}**\n${result.snippet}\n🔗 [Source](${result.url})`);
        }
      }

      // Combine summaries into final response
      const combinedContent = summaries.join('\n\n---\n\n');
      
      const finalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              content: 'You are an expert research assistant. Create a comprehensive, well-structured summary from the provided sources. Organize information logically, highlight key insights, and maintain source attribution.'
            },
            {
              role: 'user',
              content: `User Query: "${query}"\n\nSource Summaries:\n${combinedContent}\n\nPlease provide a comprehensive answer that synthesizes this information into a clear, actionable response. Include the most important points and maintain source references.`
            }
          ],
          temperature: 0.4,
          max_tokens: 1200
        })
      });

      if (!finalResponse.ok) {
        // Save basic results to memory and return
        memoryService.addMemory({
          type: 'chat',
          title: `Search Results: ${query}`,
          content: combinedContent,
          metadata: { searchQuery: query, resultCount: searchResults.length }
        });
        return combinedContent;
      }

      const finalData = await finalResponse.json();
      const synthesizedResponse = finalData.choices[0]?.message?.content;
      
      // Save to memory
      memoryService.addMemory({
        type: 'chat',
        title: `Enhanced Search: ${query}`,
        content: synthesizedResponse || combinedContent,
        metadata: { 
          searchQuery: query, 
          resultCount: searchResults.length,
          synthesized: !!synthesizedResponse 
        }
      });
      
      return synthesizedResponse || combinedContent;
    } catch (error) {
      console.error('Enhanced search error:', error);
      return 'I encountered an error while searching. Please try again with a different query.';
    }
  }
}

export const enhancedSearchService = new EnhancedSearchService();
