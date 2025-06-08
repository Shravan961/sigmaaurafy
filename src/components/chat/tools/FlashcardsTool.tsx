
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Shuffle, Trash2, RotateCcw } from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  created: number;
}

interface FlashcardsToolProps {
  onSendToChat: (message: string) => void;
}

export const FlashcardsTool: React.FC<FlashcardsToolProps> = ({ onSendToChat }) => {
  const [inputText, setInputText] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('aurafy_flashcards');
    if (stored) {
      setFlashcards(JSON.parse(stored));
    }
  }, []);

  const saveFlashcards = (cards: Flashcard[]) => {
    setFlashcards(cards);
    localStorage.setItem('aurafy_flashcards', JSON.stringify(cards));
  };

  const generateFlashcards = () => {
    if (!inputText.trim()) return;

    const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const newCards: Flashcard[] = [];

    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(' ');
      if (words.length > 5) {
        // Create fill-in-the-blank questions
        const keywordIndex = Math.floor(words.length / 2);
        const keyword = words[keywordIndex];
        const question = words.map((word, i) => i === keywordIndex ? '______' : word).join(' ');
        
        newCards.push({
          id: `${Date.now()}-${index}`,
          question: `Fill in the blank: ${question}`,
          answer: keyword,
          created: Date.now()
        });
      }
    });

    // Also create definition-style questions
    const lines = inputText.split('\n').filter(line => line.includes(':') || line.includes('='));
    lines.forEach((line, index) => {
      const parts = line.split(/[:=]/);
      if (parts.length === 2) {
        newCards.push({
          id: `${Date.now()}-def-${index}`,
          question: `What is ${parts[0].trim()}?`,
          answer: parts[1].trim(),
          created: Date.now()
        });
      }
    });

    const allCards = [...flashcards, ...newCards];
    saveFlashcards(allCards);
    setInputText('');
    setStudyMode(true);
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const deleteCard = (id: string) => {
    const updated = flashcards.filter(card => card.id !== id);
    saveFlashcards(updated);
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

  if (studyMode && flashcards.length > 0) {
    const currentCard = flashcards[currentIndex];
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setStudyMode(false)} variant="outline" size="sm">
            Back to Create
          </Button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <Button onClick={shuffleCards} variant="outline" size="sm">
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>

        <Card className="min-h-[200px]">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">
                {showAnswer ? 'Answer:' : 'Question:'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {showAnswer ? currentCard.answer : currentCard.question}
              </p>
            </div>
            
            <Button 
              onClick={() => setShowAnswer(!showAnswer)}
              className="mb-4"
            >
              {showAnswer ? 'Show Question' : 'Show Answer'}
            </Button>

            <div className="flex space-x-2">
              <Button onClick={prevCard} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={nextCard} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => deleteCard(currentCard.id)} 
                variant="outline" 
                size="sm"
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create Flashcards</h3>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your notes, definitions, or study material here..."
          rows={6}
        />
      </div>

      <Button 
        onClick={generateFlashcards}
        disabled={!inputText.trim()}
        className="w-full"
      >
        Generate Flashcards
      </Button>

      {flashcards.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Your Flashcards ({flashcards.length})</h4>
            <Button onClick={() => setStudyMode(true)} size="sm">
              Study Mode
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click "Study Mode" to review your flashcards
          </div>
        </div>
      )}
    </div>
  );
};
