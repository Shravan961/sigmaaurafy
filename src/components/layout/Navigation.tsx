
import React from 'react';
import { Button } from "@/components/ui/button";
import { Home, Apple, Calendar, Heart, MessageSquare } from 'lucide-react';

type ActiveTab = 'dashboard' | 'nutrition' | 'planner' | 'wellness' | 'chatbot';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'nutrition', icon: Apple, label: 'Nutrition' },
    { id: 'planner', icon: Calendar, label: 'Planner' },
    { id: 'wellness', icon: Heart, label: 'Wellness' },
    { id: 'chatbot', icon: MessageSquare, label: 'Aurafy' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id as ActiveTab)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
