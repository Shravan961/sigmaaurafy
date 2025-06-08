
import Dexie, { Table } from 'dexie';
import { ChatMessage } from '@/types';

export interface StoredChatMessage {
  id?: number;
  timestamp: number;
  sender: string;
  content: string;
  type: 'message' | 'tool' | 'clone';
  threadId?: string;
}

export class ChatDatabase extends Dexie {
  messages!: Table<StoredChatMessage>;

  constructor() {
    super('AurafyChatDB');
    this.version(1).stores({
      messages: '++id, timestamp, sender, content, type, threadId'
    });
  }
}

export const chatDB = new ChatDatabase();

export const chatStorage = {
  async addMessage(message: ChatMessage): Promise<number> {
    const storedMessage: Omit<StoredChatMessage, 'id'> = {
      timestamp: message.timestamp,
      sender: message.sender,
      content: message.text,
      type: 'message',
      threadId: message.threadId || 'default'
    };
    return await chatDB.messages.add(storedMessage);
  },

  async getMessages(threadId: string = 'default'): Promise<ChatMessage[]> {
    const storedMessages = await chatDB.messages
      .where('threadId')
      .equals(threadId)
      .toArray();
    
    // Sort by timestamp
    const sortedMessages = storedMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    return sortedMessages.map(msg => ({
      id: msg.id?.toString() || Date.now().toString(),
      sender: msg.sender as 'user' | 'aurora',
      text: msg.content,
      timestamp: msg.timestamp,
      threadId: msg.threadId
    }));
  },

  async clearMessages(): Promise<void> {
    await chatDB.messages.clear();
  },

  async searchMessages(query: string): Promise<ChatMessage[]> {
    const storedMessages = await chatDB.messages
      .filter(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
      .toArray();
    
    return storedMessages.map(msg => ({
      id: msg.id?.toString() || Date.now().toString(),
      sender: msg.sender as 'user' | 'aurora',
      text: msg.content,
      timestamp: msg.timestamp,
      threadId: msg.threadId
    }));
  }
};
