import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Save, Eye, Trash2, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { MindMapVisual } from '@/components/MindMapVisual';
import { mindMapStorage, SavedMindMap } from '@/services/mindMapStorage';
import { memoryService } from '@/services/memoryService';
import { toast } from "sonner";
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';

interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  color: string;
}

interface MindMapResponse {
  topic: string;
  nodes: MindMapNode[];
}

interface MindMapToolProps {
  onSendToChat: (message: string) => void;
}

const generateMindMapWithGroq = async (topic: string): Promise<MindMapResponse> => {
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
            content: 'You are an expert mind map generator. Create comprehensive, well-structured mind maps with 4-7 main branches and 2-4 sub-branches each. Return ONLY a JSON object with this exact structure: {"topic": "Main Topic", "nodes": [{"id": "unique_id", "text": "Branch Name", "level": 1, "color": "bg-blue-100 text-blue-800", "children": [{"id": "child_id", "text": "Sub-branch", "level": 2, "color": "bg-blue-100 text-blue-800", "children": []}]}]}. Use varied colors: bg-blue-100 text-blue-800, bg-green-100 text-green-800, bg-purple-100 text-purple-800, bg-orange-100 text-orange-800, bg-pink-100 text-pink-800, bg-yellow-100 text-yellow-800, bg-red-100 text-red-800, bg-indigo-100 text-indigo-800.'
          },
          {
            role: 'user',
            content: `Create a comprehensive mind map for: ${topic}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      try {
        const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        const parsedResult = JSON.parse(cleanContent);
        return parsedResult;
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Failed to parse mind map data');
      }
    }
    
    throw new Error('No content received from API');
  } catch (error) {
    console.error('Error generating mind map:', error);
    throw error;
  }
};

export const MindMapTool: React.FC<MindMapToolProps> = ({ onSendToChat }) => {
  const [topic, setTopic] = useState('');
  const [mindMap, setMindMap] = useState<MindMapResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMindMaps, setSavedMindMaps] = useState<SavedMindMap[]>([]);

  useEffect(() => {
    loadSavedMindMaps();
    
    // Listen for interactive mind map events
    const handleOpenInteractiveMindMap = (event: CustomEvent) => {
      const { topic, nodes } = event.detail;
      openInteractiveMindMap(topic, nodes);
    };

    window.addEventListener('openInteractiveMindMap', handleOpenInteractiveMindMap as EventListener);
    
    return () => {
      window.removeEventListener('openInteractiveMindMap', handleOpenInteractiveMindMap as EventListener);
    };
  }, []);

  const loadSavedMindMaps = () => {
    const maps = mindMapStorage.getAllMindMaps();
    setSavedMindMaps(maps);
  };

  const handleGenerateMindMap = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (!GROQ_API_KEY) {
      toast.error('Groq API key not configured');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMindMapWithGroq(topic);
      setMindMap(result);
      
      // Save to memory
      memoryService.addMemory({
        type: 'mind_map',
        title: `Mind Map Generated: ${topic}`,
        content: `Generated comprehensive mind map with ${result.nodes.length} main topics and ${result.nodes.reduce((sum, node) => sum + node.children.length, 0)} subtopics`,
        metadata: { mindMapTopic: topic }
      });
      
      // Send to chat
      onSendToChat(`🧠 Generated mind map for "${topic}" with ${result.nodes.length} main branches: ${result.nodes.map(n => n.text).join(', ')}`);
      
      toast.success('Mind map generated successfully!');
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error('Failed to generate mind map. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMindMap = () => {
    if (!mindMap) return;
    
    const saved = mindMapStorage.saveMindMap(topic, mindMap.nodes);
    setSavedMindMaps(prev => [saved, ...prev]);
    toast.success('Mind map saved!');
    
    // Send to chat
    onSendToChat(`💾 Saved mind map: "${topic}" with ${mindMap.nodes.length} main branches`);
  };

  const handleViewMindMap = (savedMap: SavedMindMap) => {
    setTopic(savedMap.topic);
    setMindMap({ topic: savedMap.topic, nodes: savedMap.nodes });
    
    // Send to chat
    onSendToChat(`👁️ Opened saved mind map: "${savedMap.topic}"`);
  };

  const handleDeleteMindMap = (id: string, mapTopic: string) => {
    mindMapStorage.deleteMindMap(id);
    setSavedMindMaps(prev => prev.filter(map => map.id !== id));
    toast.success('Mind map deleted');
    
    // Send to chat
    onSendToChat(`🗑️ Deleted mind map: "${mapTopic}"`);
  };

  const openInteractiveMindMap = (mapTopic: string, nodes: MindMapNode[]) => {
    // Save current state to localStorage for the interactive editor
    localStorage.setItem('currentMindMap', JSON.stringify({
      topic: mapTopic,
      nodes: nodes
    }));
    
    // Open in new window/tab for full interactive experience
    const newWindow = window.open('/mindmap', '_blank');
    if (!newWindow) {
      // Fallback: dispatch event to open interactive mind map in current window
      const event = new CustomEvent('navigateToInteractiveMindMap', {
        detail: { topic: mapTopic, nodes }
      });
      window.dispatchEvent(event);
    }
    
    onSendToChat(`🚀 Opened interactive mind map editor for: "${mapTopic}"`);
  };

  const handleExtendMindMap = () => {
    if (!mindMap) return;
    openInteractiveMindMap(topic, mindMap.nodes);
  };

  return (
    <div className="h-full flex flex-col p-4 max-w-full space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AI Mind Map Generator</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Create comprehensive visual mind maps</p>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Generate Mind Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter any topic (e.g., 'Machine Learning', 'Project Management', 'Healthy Lifestyle')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerateMindMap()}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerateMindMap}
              disabled={isGenerating || !topic.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Mind Map */}
      {mindMap && (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{mindMap.topic}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveMindMap}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExtendMindMap}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Interactive Editor
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <MindMapVisual
              topic={mindMap.topic}
              nodes={mindMap.nodes}
              onExtend={handleExtendMindMap}
              onCreateBot={(node) => {
                onSendToChat(`🤖 Creating AI expert bot for: ${node.text}`);
                toast.success(`${node.text} Expert bot concept shared!`);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Saved Mind Maps */}
      {savedMindMaps.length > 0 && !mindMap && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              Saved Mind Maps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedMindMaps.map((savedMap) => (
                <div key={savedMap.id} className="border rounded-lg p-3 space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm">{savedMap.topic}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(savedMap.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {savedMap.nodes.length} branches, {savedMap.nodes.reduce((sum, node) => sum + node.children.length, 0)} subtopics
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewMindMap(savedMap)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openInteractiveMindMap(savedMap.topic, savedMap.nodes)}
                      className="flex-1 text-xs"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteMindMap(savedMap.id, savedMap.topic)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
        <strong>🚀 Enhanced Features:</strong>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>AI-powered mind map generation with Groq</li>
          <li>Interactive editor for full customization</li>
          <li>Save and load mind maps for future access</li>
          <li>Visual, responsive design with state persistence</li>
          <li>Export and share capabilities</li>
        </ul>
      </div>
    </div>
  );
};