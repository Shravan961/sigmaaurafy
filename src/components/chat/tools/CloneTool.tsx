
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, MessageCircle, Loader2 } from 'lucide-react';
import { supabaseChatService, SupabaseClone } from '@/services/supabaseChat';
import { toast } from "sonner";

interface CloneToolProps {
  onSendToChat: (message: string) => void;
}

export const CloneTool: React.FC<CloneToolProps> = ({ onSendToChat }) => {
  const [clones, setClones] = useState<SupabaseClone[]>([]);
  const [activeClone, setActiveClone] = useState<SupabaseClone | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    role: '',
    style: 'friendly'
  });

  useEffect(() => {
    loadClones();
  }, []);

  const loadClones = async () => {
    try {
      const clonesData = await supabaseChatService.getClones();
      setClones(clonesData);
      
      const active = clonesData.find(clone => clone.is_active);
      if (active) {
        setActiveClone(active);
        localStorage.setItem('activeClone', JSON.stringify(active));
      }
    } catch (error) {
      console.error('Error loading clones:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('aiClones');
      if (stored) {
        setClones(JSON.parse(stored));
      }
      
      const activeStored = localStorage.getItem('activeClone');
      if (activeStored) {
        setActiveClone(JSON.parse(activeStored));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createClone = async () => {
    if (!formData.name || !formData.role) {
      toast.error('Name and role are required');
      return;
    }

    const newClone = {
      name: formData.name,
      role: formData.role,
      personality: formData.personality,
      style: formData.style,
      system_prompt: `You are ${formData.name}, a ${formData.role}. ${formData.personality ? `Your personality: ${formData.personality}.` : ''} Your communication style is ${formData.style}. Always stay in character and be helpful in your role. Remember our conversation history and maintain consistency.`,
      conversation_log: [],
      memory: {},
      is_active: false
    };

    try {
      await supabaseChatService.saveClone(newClone);
      await loadClones();
      setFormData({ name: '', personality: '', role: '', style: 'friendly' });
      setShowCreateForm(false);
      toast.success(`${newClone.name} clone created!`);
    } catch (error) {
      console.error('Error creating clone:', error);
      toast.error('Failed to create clone. Using local storage.');
      
      // Fallback to localStorage
      const localClone = {
        ...newClone,
        id: Date.now().toString(),
        user_id: 'local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const localClones = [...clones, localClone];
      setClones(localClones);
      localStorage.setItem('aiClones', JSON.stringify(localClones));
    }
  };

  const deleteClone = async (clone: SupabaseClone) => {
    try {
      await supabaseChatService.deleteClone(clone.id);
      await loadClones();
      
      if (activeClone?.id === clone.id) {
        setActiveClone(null);
        localStorage.removeItem('activeClone');
      }
      
      toast.success('Clone deleted');
    } catch (error) {
      console.error('Error deleting clone:', error);
      toast.error('Failed to delete clone');
    }
  };

  const activateClone = async (clone: SupabaseClone) => {
    try {
      // Deactivate all clones first
      await supabaseChatService.deactivateAllClones();
      
      // Activate the selected clone
      await supabaseChatService.updateClone(clone.id, { is_active: true });
      
      setActiveClone(clone);
      localStorage.setItem('activeClone', JSON.stringify(clone));
      
      onSendToChat(`Hello! I'm now ${clone.name}, your ${clone.role}. How can I help you today?`);
      toast.success(`Now chatting with ${clone.name}`);
      
      await loadClones();
    } catch (error) {
      console.error('Error activating clone:', error);
      // Fallback to localStorage
      setActiveClone(clone);
      localStorage.setItem('activeClone', JSON.stringify(clone));
      onSendToChat(`Hello! I'm now ${clone.name}, your ${clone.role}. How can I help you today?`);
      toast.success(`Now chatting with ${clone.name}`);
    }
  };

  const deactivateClone = async () => {
    try {
      await supabaseChatService.deactivateAllClones();
      setActiveClone(null);
      localStorage.removeItem('activeClone');
      onSendToChat('I\'ve returned to normal mode. How can I help you?');
      toast.success('Returned to normal mode');
      await loadClones();
    } catch (error) {
      console.error('Error deactivating clone:', error);
      setActiveClone(null);
      localStorage.removeItem('activeClone');
      onSendToChat('I\'ve returned to normal mode. How can I help you?');
      toast.success('Returned to normal mode');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Clones</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Clone
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New AI Clone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Clone name (e.g., StudyBuddy, FitnessCoach)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder="Role (e.g., Fitness Coach, Writing Tutor, Study Partner)"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <Textarea
              placeholder="Personality traits (optional)"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              rows={2}
            />
            <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="motivational">Motivational</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={createClone} className="flex-1">Create</Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeClone && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Currently active: {activeClone.name}
              </span>
              <Button size="sm" variant="outline" onClick={deactivateClone}>
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {clones.map((clone) => (
          <Card key={clone.id} className={`${activeClone?.id === clone.id ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{clone.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{clone.role}</p>
                  <p className="text-xs text-gray-500">{clone.style} style</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => activateClone(clone)}
                    disabled={activeClone?.id === clone.id}
                    className={activeClone?.id === clone.id ? 'bg-blue-500' : ''}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {activeClone?.id === clone.id ? 'Active' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteClone(clone)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {clones.length === 0 && (
          <p className="text-center text-gray-500 py-4">No clones created yet</p>
        )}
      </div>
    </div>
  );
};
