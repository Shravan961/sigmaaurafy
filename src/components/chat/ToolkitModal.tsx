
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Search, FileText, Mic, Volume2, Zap, Calculator, Map, Users, Camera, Shield, Globe2, MessageCircle, Plus, Smile, GraduationCap, Youtube, Globe, Eye, MessageSquare, StickyNote, Palette, RotateCcw, Wand2, Sparkles, Bot, ShoppingCart } from 'lucide-react';

interface ToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: string) => void;
}

export const ToolkitModal: React.FC<ToolkitModalProps> = ({ isOpen, onClose, onToolSelect }) => {
  if (!isOpen) return null;

  const toolCategories = [
    {
      name: "✍️ Writing Tools",
      tools: [
        { id: 'humanize', name: 'Humanize', icon: Sparkles, description: 'Make text more natural' },
        { id: 'make-it-more', name: 'Make It More', icon: Wand2, description: 'Expand & elaborate text' },
        { id: 'craft-artifacts', name: 'Craft Artifacts', icon: Zap, description: 'Generate downloadable content' },
      ]
    },
    {
      name: "📚 Learning & Research",
      tools: [
        { id: 'ai-solver', name: 'AI Solver', icon: Calculator, description: 'Solve math & logic problems' },
        { id: 'ai-search', name: 'AI Search', icon: Search, description: 'Search knowledge base' },
        { id: 'flashcards', name: 'Flashcards', icon: GraduationCap, description: 'Generate study flashcards' },
        { id: 'youtube-summary', name: 'YouTube Summary', icon: Youtube, description: 'Summarize YouTube videos' },
        { id: 'web-summary', name: 'Web Summary', icon: Globe, description: 'Summarize web pages' },
      ]
    },
    {
      name: "🛒 Shopping & Commerce",
      tools: [
        { id: 'easy-shopping', name: 'Easy Shopping', icon: ShoppingCart, description: 'Find products & compare prices' },
      ]
    },
    {
      name: "📝 Productivity",
      tools: [
        { id: 'memo', name: 'Memo', icon: StickyNote, description: 'Create quick notes' },
      ]
    },
    {
      name: "🎨 Creativity",
      tools: [
        { id: 'mind-map', name: 'Mind Map', icon: Map, description: 'Visual idea organization' },
        { id: 'roast-master', name: 'Roast Master', icon: Smile, description: 'Playful comedic roasts' },
      ]
    },
    {
      name: "🧪 Analysis",
      tools: [
        { id: 'ai-detector', name: 'AI Detector', icon: Shield, description: 'Detect AI-generated text' },
      ]
    },
    {
      name: "🤖 AI Agents",
      tools: [
        { id: 'bots', name: 'Bots', icon: Bot, description: 'Create & manage AI personalities' },
        { id: 'clone', name: 'Clone', icon: Users, description: 'Clone conversation style' },
      ]
    },
    {
      name: "📷 Voice & Media",
      tools: [
        { id: 'voice', name: 'Voice', icon: Mic, description: 'Voice to text input' },
        { id: 'live-voice', name: 'Live Voice', icon: Volume2, description: 'Real-time voice chat' },
        { id: 'chat-pdf', name: 'ChatPDF', icon: FileText, description: 'Chat with PDF content' },
        { id: 'pic-this', name: 'PicThis', icon: Camera, description: 'Analyze images with AI' },
      ]
    },
    {
      name: "🌍 Web & Content",
      tools: [
        { id: 'web-chat', name: 'Web Chat', icon: MessageCircle, description: 'Chat about web content' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🧰 Aurafy Toolkit (Enhanced)
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {toolCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {category.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {category.tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Button
                        key={tool.id}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                        onClick={() => onToolSelect(tool.id)}
                      >
                        <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        <div className="text-center">
                          <div className="font-medium text-sm">{tool.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {tool.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>🚀 Enhanced Toolkit:</strong> Now featuring advanced Mind Map generator, Easy Shopping with real product links, PicThis with AI image analysis, and comprehensive productivity tools!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
