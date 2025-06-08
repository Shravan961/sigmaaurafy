
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface LiveVoiceToolProps {
  onSendToChat: (message: string) => void;
}

export const LiveVoiceTool: React.FC<LiveVoiceToolProps> = ({ onSendToChat }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          handleVoiceInput(finalTranscript);
        }
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error');
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      toast.success('Microphone permission granted');
    } catch (error) {
      toast.error('Microphone permission denied');
    }
  };

  const handleVoiceInput = async (text: string) => {
    try {
      const aiResponse = await chatService.sendMessage(text);
      setResponse(aiResponse);
      speakResponse(aiResponse);
    } catch (error) {
      toast.error('Failed to get AI response');
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!hasPermission) {
      requestPermission();
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {!hasPermission && (
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Live Voice needs microphone access to work
          </p>
          <Button onClick={requestPermission} className="w-full">
            Grant Microphone Permission
          </Button>
        </div>
      )}

      {hasPermission && (
        <>
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
              {isListening ? 'Listening... Speak naturally' : 'Tap to start conversation'}
            </p>
          </div>

          {isSpeaking && (
            <div className="text-center">
              <Button
                onClick={stopSpeaking}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <VolumeX className="h-4 w-4" />
                <span>Stop Speaking</span>
              </Button>
            </div>
          )}

          {transcript && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">You said:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {response && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">AI Response:</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => speakResponse(response)}
                  disabled={isSpeaking}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">{response}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
