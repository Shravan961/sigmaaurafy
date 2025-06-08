
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Volume2, Check, X } from 'lucide-react';
import { ChatMessage } from '@/types';

interface MessageActionsProps {
  message: ChatMessage;
  onEdit: (messageId: string, newText: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ message, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSave = () => {
    onEdit(message.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 mt-2">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="flex-1 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Pencil className="h-3 w-3 text-gray-400" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSpeak}
        className={`h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 ${
          isSpeaking ? 'text-blue-500' : 'text-gray-400'
        }`}
      >
        <Volume2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
