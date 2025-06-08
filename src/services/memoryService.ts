
import { STORAGE_KEYS } from '@/utils/constants';

export interface MemoryEntry {
  id: string;
  timestamp: number;
  type: 'chat' | 'youtube_summary' | 'pdf_chat' | 'web_chat' | 'mind_map' | 'bot_interaction';
  title: string;
  content: string;
  metadata?: {
    url?: string;
    pdfName?: string;
    botName?: string;
    videoTitle?: string;
    mindMapTopic?: string;
    [key: string]: any;
  };
}

export interface ConversationThread {
  id: string;
  type: string;
  title: string;
  entries: MemoryEntry[];
  isActive: boolean;
  lastActivity: number;
}

class MemoryService {
  private memories: MemoryEntry[] = [];
  private threads: ConversationThread[] = [];

  constructor() {
    this.loadMemories();
    this.loadThreads();
  }

  private loadMemories(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AI_MEMORY);
      if (stored) {
        this.memories = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  }

  private loadThreads(): void {
    try {
      const stored = localStorage.getItem('conversationThreads');
      if (stored) {
        this.threads = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading conversation threads:', error);
    }
  }

  private saveMemories(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_MEMORY, JSON.stringify(this.memories));
    } catch (error) {
      console.error('Error saving memories:', error);
    }
  }

  private saveThreads(): void {
    try {
      localStorage.setItem('conversationThreads', JSON.stringify(this.threads));
    } catch (error) {
      console.error('Error saving threads:', error);
    }
  }

  addMemory(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): string {
    const memory: MemoryEntry = {
      ...entry,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.memories.unshift(memory);
    this.saveMemories();
    return memory.id;
  }

  createThread(type: string, title: string): string {
    const thread: ConversationThread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      entries: [],
      isActive: false,
      lastActivity: Date.now()
    };

    this.threads.unshift(thread);
    this.saveThreads();
    return thread.id;
  }

  addToThread(threadId: string, entry: Omit<MemoryEntry, 'id' | 'timestamp'>): void {
    const thread = this.threads.find(t => t.id === threadId);
    if (thread) {
      const memory: MemoryEntry = {
        ...entry,
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      thread.entries.push(memory);
      thread.lastActivity = Date.now();
      this.saveThreads();
      this.addMemory(entry);
    }
  }

  activateThread(threadId: string): void {
    this.threads.forEach(thread => {
      thread.isActive = thread.id === threadId;
    });
    this.saveThreads();
  }

  deactivateAllThreads(): void {
    this.threads.forEach(thread => {
      thread.isActive = false;
    });
    this.saveThreads();
  }

  getActiveThread(): ConversationThread | null {
    return this.threads.find(thread => thread.isActive) || null;
  }

  searchMemories(query: string): MemoryEntry[] {
    const searchTerm = query.toLowerCase();
    return this.memories.filter(memory => 
      memory.title.toLowerCase().includes(searchTerm) ||
      memory.content.toLowerCase().includes(searchTerm) ||
      (memory.metadata?.url && memory.metadata.url.toLowerCase().includes(searchTerm)) ||
      (memory.metadata?.pdfName && memory.metadata.pdfName.toLowerCase().includes(searchTerm))
    );
  }

  getRecentMemories(limit: number = 10): MemoryEntry[] {
    return this.memories.slice(0, limit);
  }

  getMemoriesByType(type: string): MemoryEntry[] {
    return this.memories.filter(memory => memory.type === type);
  }

  summarizeConversation(threadId?: string): string {
    let entries: MemoryEntry[];
    
    if (threadId) {
      const thread = this.threads.find(t => t.id === threadId);
      entries = thread ? thread.entries : [];
    } else {
      entries = this.getRecentMemories(20);
    }

    if (entries.length === 0) {
      return "No conversation history found.";
    }

    const summary = entries.map(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      return `${date} - ${entry.title}: ${entry.content.substring(0, 100)}...`;
    }).join('\n');

    return `Conversation Summary:\n${summary}`;
  }

  getAllThreads(): ConversationThread[] {
    return this.threads.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  deleteThread(threadId: string): void {
    this.threads = this.threads.filter(t => t.id !== threadId);
    this.saveThreads();
  }

  clearAllMemories(): void {
    this.memories = [];
    this.threads = [];
    this.saveMemories();
    this.saveThreads();
  }
}

export const memoryService = new MemoryService();
