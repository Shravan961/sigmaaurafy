
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Dashboard } from '@/components/dashboard/Dashboard';
import { NutritionTracker } from '@/components/nutrition/NutritionTracker';
import { DailyPlanner } from '@/components/planner/DailyPlanner';
import { WellnessDashboard } from '@/components/wellness/WellnessDashboard';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLocalTasks } from '@/hooks/useLocalTasks';

type ActiveTab = 'dashboard' | 'nutrition' | 'planner' | 'wellness' | 'chatbot';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const { tasks } = useLocalTasks();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSendToChat = (message: string) => {
    // Function to send messages to chat with task context
    setActiveTab('chatbot');
    // The message will be handled by the ChatbotPage component
  };

  const renderActiveComponent = () => {
    const taskContext = { taskData: tasks };
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'nutrition':
        return <NutritionTracker />;
      case 'planner':
        return <DailyPlanner onSendToChat={handleSendToChat} />;
      case 'wellness':
        return <WellnessDashboard />;
      case 'chatbot':
        return <ChatbotPage onNavigateBack={() => setActiveTab('dashboard')} taskContext={taskContext} />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  // Don't show the normal layout for chatbot page
  if (activeTab === 'chatbot') {
    return renderActiveComponent();
  }

  return (
    <div className="app-background transition-colors duration-300">
      <div className="container mx-auto px-4 pb-20">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="mt-6">
          {renderActiveComponent()}
        </main>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
