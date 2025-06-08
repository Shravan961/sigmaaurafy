import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';

export interface ChatMemoryEntry {
  id: string;
  user_id: string;
  sender: 'user' | 'aurora';
  content: string;
  timestamp: number;
  thread_id: string;
  metadata?: any;
  created_at: string;
}

class ChatMemoryService {
  private currentSessionId: string = `session_${Date.now()}`;
  private localMemory: ChatMessage[] = [];

  async saveMessage(message: ChatMessage, userId?: string): Promise<void> {
    // Save to local memory first
    this.localMemory.push(message);
    
    // Try to save to Supabase if user is authenticated
    if (userId) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            id: message.id,
            user_id: userId,
            sender: message.sender,
            content: message.text,
            timestamp: message.timestamp,
            thread_id: this.currentSessionId,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving to Supabase:', error);
        }
      } catch (error) {
        console.error('Supabase not available, using local storage');
      }
    }
    
    // Always save to localStorage as backup
    this.saveToLocalStorage();
  }

  async getMessages(userId?: string, limit?: number): Promise<ChatMessage[]> {
    if (userId) {
      try {
        let query = supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: true });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (!error && data) {
          const messages = data.map(entry => ({
            id: entry.id,
            sender: entry.sender as 'user' | 'aurora',
            text: entry.content,
            timestamp: entry.timestamp
          }));
          
          this.localMemory = messages;
          return messages;
        }
      } catch (error) {
        console.error('Error fetching from Supabase:', error);
      }
    }
    
    // Fallback to localStorage
    this.loadFromLocalStorage();
    return limit ? this.localMemory.slice(-limit) : this.localMemory;
  }

  async searchMessages(query: string, userId?: string): Promise<ChatMessage[]> {
    const searchTerm = query.toLowerCase();
    
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .ilike('content', `%${query}%`)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data.map(entry => ({
            id: entry.id,
            sender: entry.sender as 'user' | 'aurora',
            text: entry.content,
            timestamp: entry.timestamp
          }));
        }
      } catch (error) {
        console.error('Error searching Supabase:', error);
      }
    }
    
    // Fallback to local search
    return this.localMemory.filter(message => 
      message.text.toLowerCase().includes(searchTerm)
    );
  }

  async getConversationContext(userId?: string, contextLength: number = 20): Promise<string> {
    const recentMessages = await this.getMessages(userId, contextLength);
    
    return recentMessages.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
    ).join('\n');
  }

  async clearMessages(userId?: string): Promise<void> {
    if (userId) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', userId);

        if (error) {
          console.error('Error clearing Supabase messages:', error);
        }
      } catch (error) {
        console.error('Supabase not available');
      }
    }
    
    this.localMemory = [];
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('chatMemory', JSON.stringify(this.localMemory));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('chatMemory');
      if (stored) {
        this.localMemory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.localMemory = [];
    }
  }

  startNewSession(): void {
    this.currentSessionId = `session_${Date.now()}`;
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }
}

export const chatMemoryService = new ChatMemoryService();