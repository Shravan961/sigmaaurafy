import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';

export interface SupabaseClone {
  id: string;
  name: string;
  role: string;
  style: string;
  system_prompt: string;
  personality?: string;
  is_active?: boolean;
  conversation_log?: any[];
  memory?: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

class SupabaseChatService {
  async getMessages(userId?: string): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('timestamp', { ascending: true });

      // Filter by user if authenticated
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(msg => ({
        id: msg.id,
        sender: msg.sender as 'user' | 'aurora',
        text: msg.content,
        timestamp: msg.timestamp,
      })) || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async saveMessage(message: ChatMessage, cloneId?: string, userId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          sender: message.sender,
          content: message.text,
          timestamp: message.timestamp,
          clone_id: cloneId || null,
          message_type: 'message',
          thread_id: 'default',
          user_id: userId || null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async clearMessages(userId?: string): Promise<void> {
    try {
      let query = supabase.from('chat_messages').delete();

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Delete all messages - use a condition that matches all rows
        query = query.gte('timestamp', 0);
      }

      const { error } = await query;

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  }

  async getClones(): Promise<SupabaseClone[]> {
    try {
      const { data, error } = await supabase
        .from('clones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(clone => ({
        id: clone.id,
        name: clone.name,
        role: clone.role,
        style: clone.style,
        system_prompt: clone.system_prompt,
        personality: clone.personality,
        is_active: clone.is_active,
        conversation_log: Array.isArray(clone.conversation_log) ? clone.conversation_log : [],
        memory: clone.memory,
        user_id: clone.user_id,
        created_at: clone.created_at,
        updated_at: clone.updated_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching clones:', error);
      return [];
    }
  }

  async createClone(clone: Omit<SupabaseClone, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseClone | null> {
    try {
      const { data, error } = await supabase
        .from('clones')
        .insert({
          name: clone.name,
          role: clone.role,
          style: clone.style,
          system_prompt: clone.system_prompt,
          personality: clone.personality,
          is_active: clone.is_active || false,
          conversation_log: clone.conversation_log || [],
          memory: clone.memory || {},
          user_id: clone.user_id
        })
        .select()
        .single();

      if (error) throw error;

      return data ? {
        id: data.id,
        name: data.name,
        role: data.role,
        style: data.style,
        system_prompt: data.system_prompt,
        personality: data.personality,
        is_active: data.is_active,
        conversation_log: Array.isArray(data.conversation_log) ? data.conversation_log : [],
        memory: data.memory,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } : null;
    } catch (error) {
      console.error('Error creating clone:', error);
      return null;
    }
  }

  async saveClone(clone: Omit<SupabaseClone, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseClone | null> {
    return this.createClone(clone);
  }

  async updateClone(cloneId: string, updates: Partial<SupabaseClone>): Promise<void> {
    try {
      const { error } = await supabase
        .from('clones')
        .update(updates)
        .eq('id', cloneId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating clone:', error);
      throw error;
    }
  }

  async deleteClone(cloneId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clones')
        .delete()
        .eq('id', cloneId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting clone:', error);
      throw error;
    }
  }

  async activateClone(cloneId: string): Promise<void> {
    try {
      // First deactivate all clones
      await this.deactivateAllClones();
      
      // Then activate the selected clone
      const { error } = await supabase
        .from('clones')
        .update({ is_active: true })
        .eq('id', cloneId);

      if (error) throw error;
    } catch (error) {
      console.error('Error activating clone:', error);
      throw error;
    }
  }

  async deactivateAllClones(): Promise<void> {
    try {
      const { error } = await supabase
        .from('clones')
        .update({ is_active: false });

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating clones:', error);
      throw error;
    }
  }
}

export const supabaseChatService = new SupabaseChatService();