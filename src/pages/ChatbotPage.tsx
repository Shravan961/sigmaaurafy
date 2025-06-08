import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Wrench, Mic, MicOff, Trash2, X } from 'lucide-react';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { useLocalMood } from '@/hooks/useLocalMood';
import { useLocalSymptoms } from '@/hooks/useLocalSymptoms';
import { chatService } from '@/services/chatService';
import { chatMemoryService } from '@/services/chatMemoryService';
import { generateId, getTimestamp, formatTime } from '@/utils/helpers';
import { ChatMessage } from '@/types';
import { ToolkitModal } from '@/components/chat/ToolkitModal';
import { ToolInterface } from '@/components/chat/ToolInterface';
import { MessageActions } from '@/components/chat/MessageActions';
import { supabaseChatService, SupabaseClone } from '@/services/supabaseChat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface ChatbotPageProps {
  onNavigateBack: () => void;
}

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ onNavigateBack }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeClone, setActiveClone] = useState<SupabaseClone | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { getTodaysCalories, getTodaysEntries } = useLocalNutrition();
  const { getTodaysTasks, getTodaysCompletedCount, getTodaysTotalCount } = useLocalTasks();
  const { getTodaysMoodScore, getLatestMood, getWeeklyAverage } = useLocalMood();
  const { symptoms } = useLocalSymptoms();

  useEffect(() => {
    loadMessages();
    loadActiveClone();
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognition);
    }
  }, []);

  const loadMessages = async () => {
    try {
      const loadedMessages = await chatMemoryService.getMessages(user?.id);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadActiveClone = async () => {
    try {
      const clones = await supabaseChatService.getClones();
      const active = clones.find(clone => clone.is_active);
      if (active) {
        setActiveClone(active);
      }
    } catch (error) {
      // Fallback to localStorage
      const storedClone = localStorage.getItem('activeClone');
      if (storedClone) {
        setActiveClone(JSON.parse(storedClone));
      }
    }
  };

  const addMessage = async (message: ChatMessage) => {
    try {
      await chatMemoryService.saveMessage(message, user?.id);
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error saving message:', error);
      setMessages(prev => [...prev, message]);
    }
  };

  const clearChat = async () => {
    try {
      await chatMemoryService.clearMessages(user?.id);
      await supabaseChatService.deactivateAllClones();
      
      setMessages([]);
      setActiveClone(null);
      localStorage.removeItem('activeClone');
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const buildContext = (userMessage: string) => {
    const intent = chatService.detectIntent(userMessage);
    const context: any = {};

    // Check for clone deactivation
    if (activeClone && (
      userMessage.toLowerCase().includes('stop') ||
      userMessage.toLowerCase().includes('okay you can stop') ||
      userMessage.toLowerCase().includes('revert to normal') ||
      userMessage.toLowerCase().includes('be normal again')
    )) {
      setActiveClone(null);
      localStorage.removeItem('activeClone');
      supabaseChatService.deactivateAllClones().catch(console.error);
      return { deactivateClone: true };
    }

    // For cross-analysis queries, include all relevant data
    if (intent === 'cross_analysis') {
      context.nutritionData = {
        todaysCalories: getTodaysCalories(),
        todaysEntries: getTodaysEntries(),
        totalEntries: getTodaysEntries().length
      };
      context.taskData = {
        todaysTasks: getTodaysTasks(),
        completedCount: getTodaysCompletedCount(),
        totalCount: getTodaysTotalCount(),
        pendingTasks: getTodaysTasks().filter(task => !task.completed)
      };
      context.moodData = {
        todaysMood: getTodaysMoodScore(),
        latestMood: getLatestMood(),
        weeklyAverage: getWeeklyAverage()
      };
      context.symptomData = {
        recentSymptoms: symptoms.slice(0, 5)
      };
    } else {
      // Include specific context based on intent
      if (intent === 'nutrition_query') {
        context.nutritionData = {
          todaysCalories: getTodaysCalories(),
          todaysEntries: getTodaysEntries(),
          totalEntries: getTodaysEntries().length
        };
      }

      if (intent === 'task_query') {
        context.taskData = {
          todaysTasks: getTodaysTasks(),
          completedCount: getTodaysCompletedCount(),
          totalCount: getTodaysTotalCount(),
          pendingTasks: getTodaysTasks().filter(task => !task.completed)
        };
      }

      if (intent === 'mood_query') {
        context.moodData = {
          todaysMood: getTodaysMoodScore(),
          latestMood: getLatestMood(),
          weeklyAverage: getWeeklyAverage()
        };
      }

      if (intent === 'symptom_query') {
        context.symptomData = {
          recentSymptoms: symptoms.slice(0, 5)
        };
      }
    }

    // Add conversation memory context
    context.conversationHistory = chatMemoryService.getConversationContext(user?.id, 10);

    return context;
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, text: newText } : msg
      );
      setMessages(updatedMessages);
      toast.success('Message updated');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      sender: 'user',
      text: input.trim(),
      timestamp: getTimestamp(),
    };

    await addMessage(userMessage);
    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext(messageText);
      
      if (context.deactivateClone) {
        const auroraMessage: ChatMessage = {
          id: generateId(),
          sender: 'aurora',
          text: 'I\'ve returned to normal mode. How can I help you?',
          timestamp: getTimestamp(),
        };
        await addMessage(auroraMessage);
        setIsLoading(false);
        return;
      }

      // Use clone prompt if active
      let prompt = messageText;
      if (activeClone) {
        prompt = `${activeClone.system_prompt}\n\nUser: ${messageText}`;
      }

      const response = await chatService.sendMessage(prompt, context);
      
      const auroraMessage: ChatMessage = {
        id: generateId(),
        sender: 'aurora',
        text: response,
        timestamp: getTimestamp(),
      };

      await addMessage(auroraMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        sender: 'aurora',
        text: 'I apologize, but I encountered an error. Please try again.',
        timestamp: getTimestamp(),
      };
      await addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        setIsListening(true);
        recognition.start();
      }
    } catch (error) {
      toast.error('Microphone permission denied');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    setShowToolkit(false);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  const handleToolMessage = async (message: string) => {
    const toolMessage: ChatMessage = {
      id: generateId(),
      sender: 'aurora',
      text: message,
      timestamp: getTimestamp(),
    };
    await addMessage(toolMessage);
    // DON'T close the tool - keep it open for persistent viewing
    // setActiveTool(null); // REMOVED - this was causing the panel to disappear
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onNavigateBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                {activeClone ? activeClone.name : 'Aurafy'}
              </h1>
              <p className="text-xs text-gray-500">
                {user ? 'Unlimited Memory' : 'Local'} • Online
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat} 
            className="rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowToolkit(true)} 
            className="rounded-full"
            title="Open toolkit"
          >
            <Wrench className="h-5 w-5" />
          </Button>
          {activeTool && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCloseTool} 
              className="rounded-full"
              title="Close active tool"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <h3 className="text-2xl font-medium mb-2 text-gray-900 dark:text-white">Welcome to Aurafy</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Your AI Life Co-Pilot with unlimited memory is ready to help with nutrition, tasks, mood tracking, and more.
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group max-w-3xl px-6 py-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white ml-16'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white mr-16'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{message.text}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${
                        message.sender === 'user' 
                          ? 'text-blue-100' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      <MessageActions message={message} onEdit={handleEditMessage} />
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white max-w-3xl px-6 py-4 rounded-2xl mr-16">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {activeClone ? activeClone.name : 'Aurafy'} is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              {isListening && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Listening... Speak now</span>
                  </p>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    rows={1}
                    className="resize-none pr-24 rounded-2xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoiceInput}
                      className={`${isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'} p-1 rounded-full`}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToolkit(true)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                  size="sm"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Interface - Persistent Panel */}
        {activeTool && (
          <div className="border-l border-gray-200 dark:border-gray-700">
            <ToolInterface
              activeTool={activeTool}
              onSendToChat={handleToolMessage}
            />
          </div>
        )}
      </div>

      {/* Toolkit Modal */}
      {showToolkit && (
        <ToolkitModal
          isOpen={showToolkit}
          onClose={() => setShowToolkit(false)}
          onToolSelect={handleToolSelect}
        />
      )}
    </div>
  );
};