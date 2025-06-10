
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Apple, 
  Calendar, 
  Heart, 
  Brain
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: 'nutrition' | 'planner' | 'wellness' | 'chatbot') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const features = [
    {
      title: 'AI Chatbot',
      description: 'Chat with Aurora, your personal AI assistant',
      icon: MessageSquare,
      onClick: () => onNavigate('chatbot'),
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: 'Nutrition Tracker',
      description: 'Log your meals and track nutritional intake',
      icon: Apple,
      onClick: () => onNavigate('nutrition'),
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Daily Planner',
      description: 'Organize your tasks and schedule',
      icon: Calendar,
      onClick: () => onNavigate('planner'),
      gradient: 'from-orange-500 to-red-600'
    },
    {
      title: 'Wellness Dashboard',
      description: 'Monitor your mood and symptoms',
      icon: Heart,
      onClick: () => onNavigate('wellness'),
      gradient: 'from-pink-500 to-rose-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Aurafy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Your personal AI-powered wellness companion</p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={feature.onClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Quick Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-indigo-600">AI</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Assistant</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">Nutrition</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tracking</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">Task</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Planning</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-pink-600">Wellness</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monitoring</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
