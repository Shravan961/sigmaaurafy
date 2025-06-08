
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MindMapVisual } from '@/components/MindMapVisual';
import { ArrowLeft, Save, Plus, Download, Upload } from 'lucide-react';
import { mindMapStorage } from '@/services/mindMapStorage';
import { memoryService } from '@/services/memoryService';
import { toast } from "sonner";

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
}

interface InteractiveMindMapPageProps {
  onNavigateBack: () => void;
  initialTopic?: string;
  initialNodes?: MindMapNode[];
}

export const InteractiveMindMapPage: React.FC<InteractiveMindMapPageProps> = ({
  onNavigateBack,
  initialTopic,
  initialNodes
}) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [nodes, setNodes] = useState<MindMapNode[]>(initialNodes || []);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage if no initial data
    if (!initialTopic && !initialNodes) {
      const stored = localStorage.getItem('currentMindMap');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setTopic(data.topic || '');
          setNodes(data.nodes || []);
        } catch (error) {
          console.error('Error loading mind map data:', error);
        }
      }
    }
  }, [initialTopic, initialNodes]);

  const saveMindMap = () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic name');
      return;
    }

    try {
      mindMapStorage.saveMindMap(topic, nodes);
      
      // Save to memory
      memoryService.addMemory({
        type: 'mind_map',
        title: `Mind Map Saved: ${topic}`,
        content: `Interactive mind map with ${nodes.length} main topics and ${nodes.reduce((sum, node) => sum + node.children.length, 0)} subtopics`,
        metadata: { mindMapTopic: topic }
      });

      toast.success('Mind map saved successfully!');
    } catch (error) {
      console.error('Error saving mind map:', error);
      toast.error('Failed to save mind map');
    }
  };

  const addNewNode = () => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800'
    ];

    const newNode: MindMapNode = {
      id: `node_${Date.now()}`,
      text: 'New Topic',
      level: 1,
      color: colors[nodes.length % colors.length],
      children: []
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setIsEditing(true);
    
    toast.success('New node added! Click to edit.');
  };

  const updateNodeText = (nodeId: string, newText: string) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return { ...node, text: newText };
      }
      return {
        ...node,
        children: node.children.map(child => 
          child.id === nodeId ? { ...child, text: newText } : child
        )
      };
    }));
  };

  const addChildNode = (parentNodeId: string) => {
    const parentNode = nodes.find(n => n.id === parentNodeId);
    if (!parentNode) return;

    const newChild: MindMapNode = {
      id: `node_${Date.now()}`,
      text: 'New Subtopic',
      level: 2,
      color: parentNode.color,
      children: []
    };

    setNodes(prev => prev.map(node => 
      node.id === parentNodeId 
        ? { ...node, children: [...node.children, newChild] }
        : node
    ));

    toast.success('Subtopic added!');
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => {
      // Remove main node
      const filtered = prev.filter(node => node.id !== nodeId);
      
      // Remove child nodes
      return filtered.map(node => ({
        ...node,
        children: node.children.filter(child => child.id !== nodeId)
      }));
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setIsEditing(false);
    }

    toast.success('Node deleted');
  };

  const exportMindMap = () => {
    const data = {
      topic,
      nodes,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Mind map exported!');
  };

  const importMindMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.topic && data.nodes) {
          setTopic(data.topic);
          setNodes(data.nodes);
          toast.success('Mind map imported successfully!');
        } else {
          toast.error('Invalid mind map file format');
        }
      } catch (error) {
        toast.error('Failed to import mind map');
      }
    };
    reader.readAsText(file);
  };

  const createBotForNode = (node: MindMapNode) => {
    const botPrompt = `You are an AI expert specialized in "${node.text}". Your role is to provide detailed, practical, and actionable advice about this topic. You have deep knowledge about:

${node.children.map(child => `- ${child.text}`).join('\n')}

When users ask questions, provide comprehensive answers that are:
- Practical and actionable
- Based on current best practices
- Tailored to different skill levels
- Include specific examples when helpful

Your personality is helpful, knowledgeable, and encouraging. You break down complex concepts into understandable steps.`;

    // Save the bot configuration
    const botConfig = {
      id: `bot_${Date.now()}`,
      name: `${node.text} Expert`,
      topic: node.text,
      systemPrompt: botPrompt,
      createdAt: new Date(),
      isActive: false
    };

    const existingBots = JSON.parse(localStorage.getItem('botPersonas') || '[]');
    existingBots.push(botConfig);
    localStorage.setItem('botPersonas', JSON.stringify(existingBots));

    // Save to memory
    memoryService.addMemory({
      type: 'bot_interaction',
      title: `AI Bot Created: ${node.text} Expert`,
      content: `Created specialized bot for ${node.text} with expertise in: ${node.children.map(c => c.text).join(', ')}`,
      metadata: { botName: `${node.text} Expert`, botTopic: node.text }
    });

    toast.success(`${node.text} Expert bot created and saved!`);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onNavigateBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Mind Map Topic"
              className="text-lg font-semibold border-none bg-transparent focus:ring-0 px-0"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={importMindMap}
            className="hidden"
            id="import-mindmap"
          />
          <Button variant="ghost" size="sm" asChild className="rounded-full">
            <label htmlFor="import-mindmap" className="cursor-pointer">
              <Upload className="h-4 w-4" />
            </label>
          </Button>
          <Button variant="ghost" size="sm" onClick={exportMindMap} className="rounded-full">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addNewNode} className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={saveMindMap} className="rounded-full">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        {topic && nodes.length > 0 ? (
          <MindMapVisual
            topic={topic}
            nodes={nodes}
            onCreateBot={createBotForNode}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">M</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Mind Map Editor</h3>
              <p className="mb-4">Create and edit your mind maps with full interactive capabilities</p>
              <Button onClick={addNewNode} className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Add First Node
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Interactive Controls:</strong> Click nodes to select • Double-click to edit • Right-click for options • Drag to rearrange
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Use the toolbar above to add nodes, save your work, or export to JSON format
          </p>
        </div>
      </div>
    </div>
  );
};
