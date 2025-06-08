import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Plus, Trash2, Edit3, Send, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { memoryService } from '@/services/memoryService';

interface BotPersona {
  id: string;
  name: string;
  topic: string;
  systemPrompt: string;
  createdAt: Date;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface BotsToolProps {
  onSendToChat: (message: string) => void;
  onClose?: () => void;
}

export const BotsTool: React.FC<BotsToolProps> = ({ onSendToChat, onClose }) => {
  const [bots, setBots] = useState<BotPersona[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotPersona | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [newBot, setNewBot] = useState({
    name: '',
    topic: '',
    systemPrompt: ''
  });

  useEffect(() => {
    loadBots();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadBots = () => {
    try {
      const stored = localStorage.getItem('botPersonas');
      if (stored) {
        setBots(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    }
  };

  const saveBots = (updatedBots: BotPersona[]) => {
    try {
      localStorage.setItem('botPersonas', JSON.stringify(updatedBots));
      setBots(updatedBots);
    } catch (error) {
      console.error('Error saving bots:', error);
    }
  };

  const createBot = () => {
    if (!newBot.name.trim() || !newBot.topic.trim()) {
      toast({
        title: "Error",
        description: "Please fill in bot name and topic",
        variant: "destructive"
      });
      return;
    }

    const botPersona: BotPersona = {
      id: `bot_${Date.now()}`,
      name: newBot.name.trim(),
      topic: newBot.topic.trim(),
      systemPrompt: newBot.systemPrompt.trim() || `You are an AI assistant specialized in ${newBot.topic}. Provide helpful, accurate, and detailed responses about this topic.`,
      createdAt: new Date(),
      isActive: false
    };

    const updatedBots = [...bots, botPersona];
    saveBots(updatedBots);

    // Save to memory
    memoryService.addMemory({
      type: 'bot_interaction',
      title: `AI Bot Created: ${botPersona.name}`,
      content: `Created new AI bot specialized in ${botPersona.topic}`,
      metadata: { 
        botName: botPersona.name, 
        botTopic: botPersona.topic,
        botCreation: true 
      }
    });

    setNewBot({ name: '', topic: '', systemPrompt: '' });
    setShowCreateForm(false);
    toast({
      title: "Success",
      description: `Bot "${botPersona.name}" created successfully!`
    });
  };

  const deleteBot = (botId: string) => {
    const updatedBots = bots.filter(bot => bot.id !== botId);
    saveBots(updatedBots);
    
    if (selectedBot?.id === botId) {
      setSelectedBot(null);
      setChatMessages([]);
    }
    
    toast({
      title: "Bot Deleted",
      description: "Bot has been removed successfully"
    });
  };

  const selectBot = (bot: BotPersona) => {
    setSelectedBot(bot);
    setChatMessages([]);
    
    // Load chat history for this bot
    try {
      const stored = localStorage.getItem(`bot_chat_${bot.id}`);
      if (stored) {
        setChatMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bot chat history:', error);
    }
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    if (selectedBot) {
      try {
        localStorage.setItem(`bot_chat_${selectedBot.id}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedBot || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: input.trim(),
      sender: 'user',
      timestamp: Date.now()
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    saveChatHistory(newMessages);

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

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
              content: selectedBot.systemPrompt
            },
            ...newMessages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            }))
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get bot response');
      }

      const data = await response.json();
      const botResponse = data.choices[0]?.message?.content || 'I apologize, but I encountered an error.';

      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        text: botResponse,
        sender: 'bot',
        timestamp: Date.now()
      };

      const updatedMessages = [...newMessages, botMessage];
      setChatMessages(updatedMessages);
      saveChatHistory(updatedMessages);

      // Save interaction to memory
      memoryService.addMemory({
        type: 'bot_interaction',
        title: `Chat with ${selectedBot.name}`,
        content: `User: ${messageText}\n\n${selectedBot.name}: ${botResponse}`,
        metadata: { 
          botName: selectedBot.name, 
          botTopic: selectedBot.topic,
          userMessage: messageText,
          botResponse: botResponse
        }
      });

    } catch (error) {
      console.error('Bot response error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from bot",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {selectedBot ? `Chat with ${selectedBot.name}` : 'AI Bots Manager'}
              </h1>
              {selectedBot && (
                <p className="text-sm text-gray-500">Specialized in {selectedBot.topic}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Fullscreen Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Bot List Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Bot
              </Button>

              <div className="space-y-2">
                {bots.map((bot) => (
                  <Card 
                    key={bot.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedBot?.id === bot.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => selectBot(bot)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{bot.name}</h3>
                          <p className="text-xs text-gray-500">{bot.topic}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBot(bot.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedBot ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs">{selectedBot.name} is typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder={`Chat with ${selectedBot.name}...`}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                <div>
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a bot to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Bots Manager
            </CardTitle>
            <CardDescription>
              Create and chat with specialized AI assistants
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Bot
          </Button>
        )}

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Create New Bot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Bot Name (e.g., Study Buddy)"
                value={newBot.name}
                onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
              />
              <Input
                placeholder="Specialization (e.g., Mathematics)"
                value={newBot.topic}
                onChange={(e) => setNewBot({ ...newBot, topic: e.target.value })}
              />
              <Textarea
                placeholder="Custom system prompt (optional)"
                value={newBot.systemPrompt}
                onChange={(e) => setNewBot({ ...newBot, systemPrompt: e.target.value })}
                rows={3}
              />
              <div className="flex space-x-2">
                <Button onClick={createBot} className="flex-1">
                  Create Bot
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {bots.map((bot) => (
              <Card key={bot.id} className="cursor-pointer hover:bg-gray-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => selectBot(bot)}>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-sm">{bot.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {bot.topic}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(bot.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectBot(bot)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBot(bot.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {selectedBot && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Quick Chat with {selectedBot.name}</h4>
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder={`Ask ${selectedBot.name} something...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} size="sm" disabled={!input.trim() || isLoading}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
