
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff } from 'lucide-react';
import { toast } from "sonner";

interface VoiceToolProps {
  onSendToChat: (message: string) => void;
}

export const VoiceTool: React.FC<VoiceToolProps> = ({ onSendToChat }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
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

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isListening ? (
            <MicOff className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isListening ? 'Listening... Speak now' : 'Tap to start recording'}
        </p>
      </div>

      {transcript && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transcribed Text
          </label>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
          />
          <div className="flex space-x-2 mt-2">
            <Button 
              onClick={() => onSendToChat(transcript)} 
              className="flex-1"
            >
              Send to Chat
            </Button>
            <Button 
              onClick={() => setTranscript('')}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
