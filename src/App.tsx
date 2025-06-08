import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { InteractiveMindMapPage } from '@/pages/InteractiveMindMapPage';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatbotPage onNavigateBack={() => window.history.back()} />
            </ProtectedRoute>
          } />
          <Route path="/mindmap" element={
            <ProtectedRoute>
              <InteractiveMindMapPage 
                onNavigateBack={() => window.history.back()}
                initialTopic=""
                initialNodes={[]}
              />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </div>
    </Router>
  );
}

export default App;